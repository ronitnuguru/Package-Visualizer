---
name: Package Visualizer Improvements
overview: A comprehensive analysis of code quality improvements, architectural modernizations, and unexplored use cases that can be incorporated into the Package Visualizer to align with the modern Salesforce packaging lifecycle.
todos:
  - id: api-version
    content: Standardize API versions across all Apex HTTP callouts to v65.0
    status: pending
  - id: named-creds
    content: Replace Visualforce session pattern with Named Credentials for Tooling API auth
    status: pending
  - id: test-coverage
    content: Add test coverage for LMA methods, GenAI methods, and LimitsController
    status: pending
  - id: hardcoded-values
    content: Extract hard-coded package version IDs to Custom Labels or Custom Metadata
    status: pending
  - id: typos-bugs
    content: Fix typos, inverted logic, CORS issues, and duplicate model entries
    status: pending
  - id: dependency-graph
    content: Build cross-package dependency graph visualization using Package2Version.Dependencies
    status: pending
  - id: deprecation-workflow
    content: Create version deprecation lifecycle planner with subscriber impact analysis
    status: pending
  - id: release-notes
    content: Auto-generate release notes from version metadata deltas via GenAI
    status: pending
  - id: health-score
    content: Implement subscriber health scoring combining version currency, status, push history, and license data
    status: pending
  - id: multi-package-release
    content: Build release bundle system for coordinated multi-package upgrades
    status: pending
  - id: cicd-dashboard
    content: Create build telemetry dashboard tracking coverage trends and build durations
    status: pending
  - id: subscriber-comms
    content: Build subscriber notification center with template-driven pre/post upgrade messaging
    status: pending
  - id: security-posture
    content: Aggregate security review status and coverage trends into a security dashboard
    status: pending
  - id: fma-integration
    content: Deep FMA integration with feature flag analytics and gradual rollout management
    status: pending
  - id: org-templates
    content: Build org provisioning template catalog with saved configurations and success tracking
    status: pending
  - id: data-cloud
    content: Stream package telemetry to Data Cloud for subscriber 360 and churn prediction
    status: pending
  - id: version-compare
    content: Build side-by-side version comparison view with metadata diff highlighting
    status: pending
  - id: agentforce-packaging-agent
    content: Build an Agentforce agent with topics and actions for natural language package management
    status: pending
  - id: agentforce-push-upgrade-agent
    content: Create agentic push upgrade orchestration with autonomous decision-making and rollback
    status: pending
  - id: agentforce-subscriber-insights
    content: Build AI-powered subscriber analysis agent for health scoring and churn prediction
    status: pending
  - id: genai-metadata-packaging
    content: Package GenAiFunction, GenAiPlugin, GenAiPromptTemplate, and BotTemplate metadata into the main package
    status: pending
  - id: agentforce-release-manager
    content: Build a Release Manager agent topic for multi-step release planning and execution
    status: pending
  - id: agentforce-isv-copilot
    content: Create an ISV Copilot agent that answers questions grounded in real-time DevHub data
    status: pending
  - id: activate-stubbed-genai
    content: Activate commented-out GenAI UI in packageLmaView, packageLmaTimeline, and packageSplitView
    status: pending
  - id: prompt-template-library
    content: Build a reusable prompt template library with domain-specific ISV packaging prompts
    status: pending
isProject: false
---

# Package Visualizer: Improvements and Unexplored Use Cases

---

## Part 1: Codebase Improvements

### 1.1 API Version Consistency

The codebase uses mixed API versions across its HTTP callouts:

- `Package2Interface.cls` targets **v61.0** for Tooling API
- `PushUpgradesInterface.cls` targets **v57.0** for REST API
- `sfdx-project.json` declares **v65.0** as the source API version

Standardizing on v65.0 (or the latest GA release) across all callout paths ensures access to the newest Tooling API fields (e.g., `Package2Version.ConvertedFromVersionId`, `Package2.PackageErrorUsername` improvements in recent releases) and avoids subtle behavioral differences between API versions.

### 1.2 Replace Visualforce Session Pattern with Named Credentials

The current architecture relies on a Visualforce page (`SessionCreator.page`) to extract the user's session ID for Tooling API callouts. This is a legacy pattern with known limitations:

- Does not work in Lightning-only orgs where VF is restricted
- Session tokens have a broad scope, violating least-privilege principles
- Breaks if VF page access is revoked or during Lightning Out scenarios

**Recommendation:** Migrate to **Named Credentials** with the "Named Principal" or "Per User" identity type. This is the platform-endorsed approach for org-to-self callouts and eliminates the VF session dependency entirely. For Tooling API specifically, a Named Credential pointing to the org's own domain with OAuth 2.0 (JWT Bearer or Web Server flow) is the modern pattern.

### 1.3 Test Coverage Gaps

Only 2 test classes exist (`PackageInterfaceTest`, `PushUpgradesInterfaceTest`) for 13 production classes. Specific gaps:

- `**LimitsController`** -- no dedicated test class
- `**DemoTrialsController`** -- partially tested via `PackageInterfaceTest` but with `SeeAllData=true` for the CMS test, which is fragile
- `**ObjectWrappers`** -- tested only via property assignment (no behavioral assertions)
- LMA methods in `PackageVisualizerCtrl` (`getLMAVersion`, `getPackageVersionLicenses`, `getLmaTimeline`, `modifyLicense`) are commented out in tests
- GenAI methods (`invokeModelsGenAi`, `invokePromptAndUserModelsGenAi`, `invokeGenAiPromptTemplate`) have no test coverage
- Several test methods use `try/catch` with `System.debug(e)` -- swallowing exceptions instead of asserting expected failures

### 1.4 Hard-Coded Values

Multiple LWC components contain a hard-coded package version ID (`04tRh000001NBdJIAW`) for the GenAI extension install link:

- `agentforcePromptGenerator.js`
- `genAiResponseCard.js`
- `genAiLimitsModal.js`

This should be moved to a Custom Metadata Type record or Custom Label so it can be updated without a new package version.

### 1.5 Typos and Minor Bugs

- `ScratchDefFiileBuildCard` -- class name typo (double `i`)
- `LMAPackageWrapper.packageSubsriberId` -- typo (`Subsriber` vs `Subscriber`)
- `packageVersionDetails.js` references `this.subscriberPackageId` without an `@api` declaration
- `packageDetailsView.js` sets `this.packageUsername = ' '` (space) vs `packageUserName` elsewhere
- `orgExpirationCard.js` uses `fetch()` to Trust API from browser context which may hit CORS restrictions
- `agentforcePromptGenerator.js` has duplicate model entries for GPT-4.1 Mini
- `scratchDefFileBuildCard.js` maps Danish to `zh_TW` (Traditional Chinese) in `preferredLanguageOptions`
- `packagePushJobView.js` sets `disableInfiniteLoad = false` when results are empty (logic is inverted vs. the variable name)
- `packageLmaView.js` uses `"DESC"` in one path and `"desc"` in another -- case inconsistency may cause issues if Apex is case-sensitive in its ORDER BY building

### 1.6 Architecture Patterns to Modernize

- **LMA wrappers use `Object` typing** -- `LMAVersionWrapper`, `LMALicenseWrapper`, etc. cast all fields to `Object`, losing compile-time type safety. Strongly typed wrappers would catch field mismatches at compile time.
- **Duplicate signup logic** -- `PackageVisualizerCtrl.createSignupTrial` and `DemoTrialsController.createSignupTrial` contain near-identical logic. Extract a shared service class.
- **Large country/language lists in JS** -- `scratchDefFileBuildCard.js` embeds ~250 country options in JavaScript. This data could come from Apex (via `SchemaGlobalDescribe` or a custom metadata type) and be cached via `@wire`.
- **Empty handler stubs** -- `handleInAppGuidanceWalkthrough` in `packageSplitView.js` is empty; clean up or implement.

---

## Part 2: Unexplored Use Cases for the Modern Packaging Lifecycle

### 2.1 Package Dependency Graph Visualization

**Current state:** The D3 tree shows version ancestry (parent-child via `AncestorId`) for a single package.

**Opportunity:** Salesforce 2GP packages can declare **dependencies** on other packages (via `dependencies` in `sfdx-project.json` or `Package2Version.SubscriberPackageVersionId` references). A cross-package dependency graph would show:

- Which packages depend on which other packages (and at what version)
- Circular dependency detection
- Impact analysis: "If I deprecate package X v2.0, which packages break?"
- Upgrade cascade planning: "Upgrading base package A requires upgrading dependent packages B, C in order"

This is queryable via the Tooling API field `Package2Version.Dependencies` (JSON blob) and would be a natural extension of the existing D3 visualization.

### 2.2 Version Deprecation Workflow and Lifecycle Management

**Current state:** Version details show `IsDeprecated` status but there is no workflow for managing the deprecation lifecycle.

**Opportunity:** Build a deprecation planner that:

- Identifies which versions still have active subscribers before deprecation
- Provides a "deprecation impact report" (count of production orgs, sandbox orgs, by region)
- Offers a multi-step workflow: notify subscribers -> schedule push upgrade window -> deprecate old version
- Tracks deprecation SLAs (e.g., "version must be deprecated within 90 days of successor release")
- Auto-generates subscriber communication drafts via the existing GenAI integration

### 2.3 Automated Release Notes Generation

**Current state:** GenAI prompts exist but are generic. There is no structured changelog or release notes system.

**Opportunity:** Combine multiple data sources to auto-generate release notes:

- Query `Package2Version` metadata changes between two versions (new version fields, code coverage delta, build duration)
- Pull from AppAnalytics to identify feature adoption changes
- Use the Models API (already integrated) to generate human-readable release notes from structured data
- Store generated notes in a Custom Metadata Type or custom object for historical reference
- Offer a "publish" action that formats notes for AppExchange listing updates

### 2.4 Subscriber Health Score and Proactive Monitoring

**Current state:** Subscribers are listed with basic metadata (org type, status, instance, version). No health scoring.

**Opportunity:** Compute a "Subscriber Health Score" by combining:

- **Version currency** -- how far behind the latest released version (major/minor gap)
- **Org status** -- Active vs. Trial vs. Demo (risk of churn)
- **Push upgrade history** -- repeated failures indicate environment issues
- **License status** (if LMA) -- expiring, suspended, or at seat capacity
- **Instance trust status** -- is the instance experiencing incidents?
- **AppAnalytics signals** -- declining usage patterns (if data is available)

Display as a color-coded health indicator on the subscriber list, with the ability to filter by "at risk" subscribers and generate batch actions (push upgrade, license extension, outreach email).

### 2.5 Multi-Package Orchestrated Release Management

**Current state:** Each package is managed independently. No concept of a "release" spanning multiple packages.

**Opportunity:** For ISVs with multiple interdependent packages (common for platform + industry solutions), provide:

- **Release bundles** -- group multiple package versions into a named release (e.g., "Winter '27 Release = Base v5.2 + Analytics v3.1 + FSC Extension v2.0")
- **Dependency-ordered push upgrades** -- automatically sequence push upgrades respecting dependency order
- **Rollback planning** -- if package B push fails, hold package C push
- **Cross-package subscriber matrix** -- show which subscribers have which combination of packages installed
- This is increasingly relevant as Salesforce encourages modular packaging strategies

### 2.6 CI/CD Pipeline Visibility and Build Telemetry

**Current state:** Code coverage and build duration are shown per version but there is no CI/CD integration.

**Opportunity:** Provide a "Build Dashboard" that:

- Tracks `Package2Version.BuildDurationInSeconds` trends over time (are builds getting slower?)
- Shows `HasPassedCodeCoverageCheck` pass/fail rates across versions
- Monitors `ValidatedAsync` status for async validation jobs
- Correlates build failures with specific version changes
- Optionally integrates with GitHub/GitLab webhooks to show commit-to-package-version lineage
- Displays `Package2Version.Branch` and `Tag` data in a timeline view

This gives release managers visibility into the development pipeline health without leaving the DevHub.

### 2.7 Subscriber Communication and Notification System

**Current state:** LMA timeline shows license changes and has a "send email" action via Global.SendEmail, but there is no structured communication workflow.

**Opportunity:** Build a subscriber notification center:

- Pre-push upgrade notifications: "Version X.Y is being pushed to your org on [date]"
- Post-push upgrade summaries: "Upgrade complete. Here's what changed."
- Maintenance window alerts (leveraging Trust API data already being fetched)
- License expiration reminders with renewal links
- Template-driven messaging using GenAI to personalize per subscriber
- Campaign tracking to associate notifications with LMA campaigns (the `campaignTile` and `campaignHistoryList` components already exist but appear lightly used)

### 2.8 Package Security Posture Dashboard

**Current state:** `IsSecurityReviewed` is checked per version. No broader security tracking.

**Opportunity:** Aggregate security data across the package portfolio:

- Track security review status across all versions and packages (timeline of reviews)
- Monitor which subscribers are on security-reviewed vs. non-reviewed versions
- Flag versions where security review has expired or been revoked
- Integrate with AppExchange Partner Console data (if APIs become available)
- Show code coverage trends as a security proxy (declining coverage = risk)
- Track permission set assignments across the subscriber base

### 2.9 Feature Flag Analytics (FMA Deep Integration)

**Current state:** `featureParametersCard.js` is a stub with a single combobox. `isFmaParameter` is detected but not deeply used.

**Opportunity:** If FMA is installed, provide:

- A visual dashboard of all feature parameters across packages
- Subscriber-level feature flag status (who has Feature X enabled?)
- Gradual rollout management: enable Feature X for 10% of subscribers, then 50%, then 100%
- Feature adoption correlation with AppAnalytics data
- A/B testing insights: compare usage patterns between feature-enabled and feature-disabled subscriber cohorts

### 2.10 Org Provisioning Templates and Catalog

**Current state:** `createSignupOrg` and `scratchDefFileBuildCard` allow creating trials and scratch orgs with manual configuration.

**Opportunity:** Build a template catalog system:

- Save and reuse scratch org definition configurations as named templates
- Create "golden path" org provisioning workflows for different use cases (demo, QA, UAT, partner enablement)
- Pre-configure packages to install post-provisioning (chain SignupRequest with push install)
- Track provisioning success/failure rates per template
- Integrate with Environment Hub to auto-connect provisioned orgs
- Offer a self-service portal pattern for partners to provision their own demo orgs (extending the existing `DemoTrialsController` CMS integration)

### 2.11 Data Cloud Integration for Package Telemetry

**Current state:** `ObjectWrappers.PackageWrapper` has a `dataCloudPackage` boolean field, and the README mentions Data Cloud. But no actual Data Cloud integration exists.

**Opportunity:** Stream package telemetry into Data Cloud for advanced analytics:

- Publish subscriber events (install, upgrade, uninstall) as Platform Events -> Data Cloud ingestion
- Combine with AppAnalytics data for unified subscriber 360 views
- Build calculated insights (churn prediction, upgrade propensity scoring)
- Power Tableau dashboards for executive-level packaging KPIs
- Enable Data Cloud segments for targeted push upgrade campaigns (e.g., "all production orgs in NA region on version < 7.0 with declining usage")

### 2.12 Package Version Comparison and Diff Viewer

**Current state:** Individual version details are viewable but there is no way to compare two versions side by side.

**Opportunity:** Build a version comparison view:

- Side-by-side metadata comparison between any two versions (fields like code coverage, build duration, dependencies, release version, language)
- Highlight what changed (new dependencies added, coverage delta, ancestor chain differences)
- Show subscriber migration numbers between the two versions over time
- Useful for release managers deciding which version to target for push upgrades

---

## Part 3: Agentforce and Agentic Use Cases

### Current State of Agentforce Integration

The existing GenAI integration is a **thin bridge pattern**: three Apex methods (`invokeModelsGenAi`, `invokePromptAndUserModelsGenAi`, `invokeGenAiPromptTemplate`) in `PackageVisualizerCtrl.cls` use `Type.forName().newInstance()` cast to `Callable` to dynamically dispatch to `AgentGenAiController` and `AgentGenAiPromptTemplateController` -- classes that live in a **separate extension package** (`04tRh000001NBdJIAW`), not in this repository.

Key observations:

- **No GenAiFunction, GenAiPlugin, GenAiPromptTemplate, BotTemplate, or GenAiPlannerBundle metadata** exists in `force-app/`. The `setupAssistantAgentforce` component only links to documentation about these types.
- **Several GenAI UI features are commented out**: the Generative AI accordion in `packageLmaView.html`, the AI Summary nav item in `packageLmaTimeline`, and the "Generative AI" button in `packageSplitView.html` are all dead code.
- **Prompt template names** (`pkgviz__License_Summary`, `pkgviz__ISV_Agent_Org_Limits_Summary`, `pkgviz__ISV_Agent_Generate_Scratch_Org_Definition_File`, `pkgviz__Package_Version_Summary`) are referenced in LWCs but the actual `GenAiPromptTemplate` metadata is expected to live in the extension.
- **Model options are duplicated** across `agentforcePromptGenerator.js` and `agentforcePromptModalGenerator.js` (identical 11-item arrays), and GPT-4.1 appears twice with the same value as GPT-4.1 Mini.

### 3.1 Activate and Complete Stubbed GenAI Features

**Priority: High -- these are already partially built.**

Several GenAI UI paths are commented out but have supporting JS already wired:

- `**packageLmaView.html`** -- Uncomment the `c-gen-ai-response-card` accordion for AI-powered license summaries per subscriber
- `**packageLmaTimeline`** -- Uncomment the "AI Summary" navigation item so `displayGenAiSummary` can be reached, enabling the `pkgviz__License_Summary` prompt template
- `**packageSplitView.html`** -- Uncomment and implement `handlePackageGenAi` to enable the "Generative AI" sparkles button at the package level, feeding package context to the prompt modal

Additionally, extract the duplicated model options array into a shared utility module or Custom Metadata Type so model additions propagate to all GenAI components at once.

### 3.2 Package Management Agentforce Agent (GenAiPlugin + GenAiFunction)

**The highest-impact agentic opportunity.** Build a full Agentforce agent with packageable metadata that ISVs can install alongside Package Visualizer.

**Agent Topic: "Package Management"**

Instructions: "You help ISV partners and DevHub administrators manage their Salesforce packages. You can list packages, show version details, check subscriber status, initiate push upgrades, and analyze adoption trends."

**Agent Actions (GenAiFunction):**

- `**ListPackages`** -- Query `Package2` via Tooling API, return formatted list with name, namespace, type, subscriber count. Inputs: `packageType` (2GP/1GP/Unlocked), `sortBy`, `limit`.
- `**GetPackageVersions`** -- Query `Package2Version` for a given package. Inputs: `packageId`, `releasedOnly` (boolean), `versionRange`.
- `**GetSubscriberDetails`** -- Query `PackageSubscriber` with filters. Inputs: `packageId`, `orgType`, `orgStatus`, `instanceName`, `versionId`.
- `**CheckCodeCoverage`** -- Call existing `calculatePackageVersionCodeCoverage`. Input: `packageVersionId`.
- `**CheckSecurityReview`** -- Call existing `verifySecurityReviewApproved`. Input: `subscriberPackageVersionId`.
- `**GetOrgLimits**` -- Call existing `LimitsController.getLimits`. No inputs.
- `**CreatePushUpgradeRequest**` -- Wrap `PushUpgradesCtrl.createPackagePushRequest`. Inputs: `packageVersionId`, `scheduledStartTime`.
- `**GetPushUpgradeStatus**` -- Query `PackagePushJob` status. Input: `pushRequestId`.

This enables natural language interactions like:

- "Show me all production subscribers still on version 7.x of my Analytics package"
- "What's the code coverage for the latest released version?"
- "Create a push upgrade to version 8.5 for all subscribers in NA region"
- "How many push jobs failed in the last campaign?"

The actions reuse existing Apex methods, so the implementation is primarily metadata wiring (GenAiFunction YAML/XML) plus thin Apex `Invocable` wrappers.

### 3.3 Agentic Push Upgrade Orchestration

**Current state:** Push upgrades are manual: select subscribers, pick a version, schedule, monitor. Failures require human intervention.

**Opportunity:** Build an **autonomous push upgrade agent** that:

1. **Plans the upgrade campaign** -- Given a target version and constraints (e.g., "only production orgs", "exclude EMEA instances during business hours"), the agent generates a phased rollout plan
2. **Executes in waves** -- Pushes to 5% of subscribers first, waits for success confirmation, then 25%, then 100%. Uses `ScheduledStartTime` staggering.
3. **Monitors and reacts** -- Polls `PackagePushJob` status. If failure rate exceeds a threshold (e.g., >10%), **automatically pauses** remaining waves and notifies the admin.
4. **Diagnoses failures** -- Feeds `PackagePushErrors` messages into the Models API to generate human-readable root cause analysis and suggested remediation.
5. **Generates post-campaign reports** -- Summarizes success/failure rates, duration, affected regions, and recommended follow-up actions.

Implementation approach:

- **GenAiPlannerBundle** -- Define the multi-step plan (assess eligibility -> create request -> monitor jobs -> evaluate -> proceed or abort)
- **Platform Events** -- Publish `PushUpgradeEvent__e` for real-time status updates to the agent and UI
- **Apex `@InvocableMethod`** wrappers around existing `PushUpgradesInterface` methods for agent action binding

### 3.4 AI-Powered Subscriber Insights Agent

**Current state:** Subscriber data is displayed in tables and charts. Analysis is manual.

**Opportunity:** Create an "ISV Insights" agent topic that answers analytical questions grounded in real-time DevHub data:

- **"Which subscribers are at risk of churning?"** -- Combine version age, org status (Trial/Demo nearing expiration), declining AppAnalytics usage, suspended licenses
- **"What's my version adoption curve for the latest release?"** -- Aggregate `PackageSubscriber` by version, calculate adoption percentage over time
- **"Compare subscriber health between NA and EMEA regions"** -- Cross-reference instance data with Trust API status and version distribution
- **"Summarize this subscriber's history"** -- Pull license timeline, push upgrade history, version changes, and feed to GenAI for a narrative summary

This agent uses **retrieval-augmented generation (RAG)** -- the actions query live Salesforce data, then pass structured results to the LLM for natural language synthesis. The existing `invokePromptAndUserModelsGenAi` pattern (system prompt + user prompt + model) already supports this; extend it with data-grounded system prompts.

### 3.5 Release Manager Agent Topic

Build a dedicated agent topic for release management workflows:

- **"Plan a release for version 8.9"** -- Agent checks: code coverage meets threshold, security review is approved, no blocking dependencies, identifies subscriber count for upgrade
- **"Draft release notes for version 8.8 vs 8.7"** -- Agent queries both versions' metadata, computes deltas, generates formatted release notes via GenAI
- **"What's the upgrade path from 7.2 to 8.8?"** -- Agent walks the ancestor chain, identifies intermediate required versions, flags breaking changes
- **"Schedule a maintenance window for the EMEA push"** -- Agent cross-references Trust API maintenance schedules for EMEA instances to find optimal windows
- **"Deprecate all versions before 7.0"** -- Agent identifies affected subscribers, generates impact report, creates deprecation plan with timeline

### 3.6 Package GenAI Prompt Template Library

**Current state:** Prompt template names are referenced but the actual `GenAiPromptTemplate` metadata lives in the extension package. The templates are limited to: `License_Summary`, `ISV_Agent_Org_Limits_Summary`, `ISV_Agent_Generate_Scratch_Org_Definition_File`, `Package_Version_Summary`.

**Opportunity:** Build a comprehensive prompt template library packaged as `GenAiPromptTemplate` metadata:

- `**ISV_Agent_Push_Upgrade_Analysis`** -- Analyze push job results, identify failure patterns, suggest remediation
- `**ISV_Agent_Subscriber_Health_Report`** -- Generate a health report for a specific subscriber org
- `**ISV_Agent_Release_Notes_Generator`** -- Generate release notes from version metadata diff
- `**ISV_Agent_Deprecation_Impact_Report`** -- Assess impact of deprecating a version
- `**ISV_Agent_AppAnalytics_Summary`** -- Summarize AppAnalytics query results in natural language
- `**ISV_Agent_Security_Review_Prep**` -- Checklist and guidance for AppExchange security review submission
- `**ISV_Agent_Upgrade_Communication**` -- Generate subscriber-facing upgrade notification emails
- `**ISV_Agent_Error_Diagnosis**` -- Diagnose push upgrade errors or API failures from log data

Each template uses **grounding** via `{!$Input:...}` merge fields that inject live Salesforce record data, making responses contextually accurate rather than generic.

### 3.7 Bring GenAI Metadata into the Main Package

**Current state:** All Agentforce metadata (GenAiFunction, GenAiPlugin, GenAiPromptTemplate, BotTemplate, GenAiPlannerBundle) lives in a separate extension package. The main package only has the `Callable` bridge.

**Opportunity:** With `setupAssistantAgentforce.js` already confirming these metadata types are packageable in both 1GP and 2GP, consider:

- **Consolidating the extension into the main package** -- eliminates the two-package install friction and the hard-coded extension package version ID problem
- If keeping the extension separate (for orgs without Einstein licenses), make the extension **optional but discoverable** via a Custom Metadata Type that stores the extension's package version ID dynamically rather than hard-coding `04tRh000001NBdJIAW`
- Package a **BotTemplate** that pre-configures the "ISV Package Manager" agent with topics and actions, so customers get a working agent out of the box

### 3.8 Conversational DevHub Explorer

Build a chat-style interface (extending the existing `agentforcePromptModalGenerator` modal pattern) that provides a persistent conversational experience:

- Multi-turn conversations: "Show me the Analytics package" -> "Now show its subscribers" -> "Filter to only production orgs" -> "Push version 8.5 to all of them"
- Context preservation across turns (pass conversation history via the system prompt)
- Action confirmation before destructive operations (push upgrades, deprecations)
- Inline data visualization: agent returns structured data that the LWC renders as tables or charts within the chat

This transforms the existing modal (which currently supports single-turn or ask-again patterns) into a true **conversational agent interface** embedded in the Package Visualizer.

### 3.9 Agentforce for Subscriber Self-Service

Flip the perspective -- instead of the ISV using an agent, package an agent that **subscribers can install** to manage their relationship with the ISV's package:

- "When is my license expiring?" -- Queries local `sfLma__License__c`
- "What version am I on, and is there an update available?" -- Queries `InstalledSubscriberPackage`
- "What new features are in version 8.8?" -- Retrieves release notes generated by the ISV's agent (3.5)
- "Request a license extension" -- Creates a case or sends a Platform Event to the ISV's DevHub

This is a **packageable agent template** (`BotTemplate` + `GenAiPlannerBundle`) that ISVs distribute to their subscribers, creating a flywheel between the ISV's DevHub agent and the subscriber's self-service agent.

### 3.10 AI-Assisted Scratch Org Configuration

**Current state:** `scratchDefFileBuildCard` has visual checkboxes/dropdowns for building scratch definitions. `scratchBuildModal` already calls `invokeGenAiPromptTemplate` with `pkgviz__ISV_Agent_Generate_Scratch_Org_Definition_File`.

**Opportunity:** Extend this to a fully agentic flow:

- **Natural language input:** "Create a scratch org with Service Cloud, Knowledge, Agentforce, and OmniStudio features for testing our FSC package"
- Agent resolves feature names to the correct scratch def feature strings (e.g., "Knowledge" -> `"Knowledge"`, "Agentforce" -> `"EinsteinGptPlatform"`)
- Agent includes required settings based on feature dependencies (e.g., enabling `chatSettings` when `liveChatAgentEnabled` is needed)
- Agent validates the generated JSON against known constraints before presenting it
- One-click "Create Org" from the agent's output, feeding directly into the existing `SignupRequest` or `sf org create scratch` flow

---

## Part 4: Quick Wins (Low Effort, High Value)

### Packaging and Code Quality


| Improvement                                                             | Effort | Impact                                                          |
| ----------------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| Fix API version inconsistency (v57/v61 -> v65)                          | Low    | Avoids subtle bugs, unlocks new API fields                      |
| Extract hard-coded package version ID to Custom Label                   | Low    | Eliminates need for code changes on GenAI extension updates     |
| Fix typos (class names, variable names, language mappings)              | Low    | Code quality, prevents user-facing bugs                         |
| Add test coverage for LMA and GenAI methods                             | Medium | Required for managed package security review compliance         |
| Move Trust API calls server-side (fix CORS risk in `orgExpirationCard`) | Medium | Prevents runtime failures in restricted environments            |
| Implement version deprecation impact report                             | Medium | High demand from ISVs managing large subscriber bases           |
| Add subscriber health score column                                      | Medium | Immediately actionable insights for push upgrade prioritization |


### Agentforce Quick Wins


| Improvement                                                                                           | Effort | Impact                                                                  |
| ----------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Uncomment and activate stubbed GenAI UI in `packageLmaView`, `packageLmaTimeline`, `packageSplitView` | Low    | Enables already-wired AI features for license and package summaries     |
| Extract duplicate model options array into shared module                                              | Low    | Single source of truth for supported models across all GenAI components |
| Fix duplicate GPT-4.1 / GPT-4.1 Mini entry (same value `sfdc_ai__DefaultGPT41Mini`)                   | Low    | Prevents user confusion in model picker                                 |
| Create `ListPackages` and `GetSubscriberDetails` GenAiFunction metadata                               | Medium | Enables basic Agentforce natural language queries                       |
| Build `ISV_Agent_Push_Upgrade_Analysis` prompt template                                               | Medium | Instant value for diagnosing push job failures via AI                   |
| Package a `BotTemplate` with pre-configured ISV agent topics                                          | Medium | Out-of-the-box Agentforce experience for Package Visualizer customers   |



| Improvement                                                             | Effort | Impact                                                          |
| ----------------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| Fix API version inconsistency (v57/v61 -> v65)                          | Low    | Avoids subtle bugs, unlocks new API fields                      |
| Extract hard-coded package version ID to Custom Label                   | Low    | Eliminates need for code changes on GenAI extension updates     |
| Fix typos (class names, variable names, language mappings)              | Low    | Code quality, prevents user-facing bugs                         |
| Add test coverage for LMA and GenAI methods                             | Medium | Required for managed package security review compliance         |
| Move Trust API calls server-side (fix CORS risk in `orgExpirationCard`) | Medium | Prevents runtime failures in restricted environments            |
| Implement version deprecation impact report                             | Medium | High demand from ISVs managing large subscriber bases           |
| Add subscriber health score column                                      | Medium | Immediately actionable insights for push upgrade prioritization |


