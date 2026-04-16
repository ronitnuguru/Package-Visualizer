---
name: Agentic Package Visualizer Use Cases
overview: Map the Proactive, Ambient, and Autonomous agent patterns from the Agentforce whitepaper to concrete use cases that extend the Package Visualizer application for ISV package management.
todos:
  - id: proactive-push-failure
    content: "Proactive Agent: Push Upgrade Failure Triage Agent -- Platform Event on push job failure, error clustering, root-cause analysis, Slack notification"
    status: pending
  - id: proactive-subscriber-health
    content: "Proactive Agent: Subscriber Org Health Alert Agent -- Periodic subscriber status monitoring, severity classification, tiered notifications"
    status: pending
  - id: proactive-org-limits
    content: "Proactive Agent: Org Limits Threshold Alert Agent -- Limits API polling, threshold detection, trend analysis, contextual recommendations"
    status: pending
  - id: ambient-version-advisor
    content: "Ambient Agent: Package Version Advisor -- UI activity interception via PackageMessageChannel, contextual insights on navigation"
    status: pending
  - id: ambient-push-strategy
    content: "Ambient Agent: Push Upgrade Strategy Advisor -- Real-time risk assessment during push upgrade planning, confidence scoring"
    status: pending
  - id: ambient-appanalytics
    content: "Ambient Agent: AppAnalytics Intelligence -- Background observer on analytics results, automated pattern detection and natural-language summaries"
    status: pending
  - id: autonomous-push-campaign
    content: "Autonomous Agent: Phased Push Upgrade Campaign -- Multi-agent orchestration for goal-driven, wave-based push upgrades"
    status: pending
  - id: autonomous-release-readiness
    content: "Autonomous Agent: Package Release Readiness -- Multi-agent validation, impact analysis, and communication drafting for new releases"
    status: pending
  - id: autonomous-subscriber-lifecycle
    content: "Autonomous Agent: Subscriber Lifecycle Management -- Churn reduction via health scoring, risk assessment, and automated interventions"
    status: pending
isProject: false
---

# Agentic Patterns Applied to Package Visualizer

The Package Visualizer is a mature ISV package management app (namespace `pkgviz`, v8.21) with 80+ LWC components, Tooling API integration, push upgrade orchestration, subscriber tracking, LMA license management, AppAnalytics, and org limits monitoring. Below are concrete use cases for extending it with Proactive, Ambient, and Autonomous agents using the patterns defined in the Agentforce whitepaper.

---

## 1. Proactive Agent Use Cases

Proactive agents act without being asked -- triggered by events, data changes, or predefined conditions. The whitepaper defines two sub-patterns: **External Event Response** (Section 2.2.a) and **Internal Platform Event Response** (Section 2.2.b).

### 1a. Push Upgrade Failure Triage Agent (Internal Event Response Pattern)

**Problem:** When `PackagePushJob` records fail during a push upgrade, ISV admins must manually inspect error details (ErrorTitle, ErrorMessage, ErrorType, ErrorSeverity) across potentially hundreds of subscriber orgs to understand root causes and decide on remediation. This is time-consuming and reactive.

**How it works:**
- **Trigger:** A Platform Event or Change Data Capture event fires when a `PackagePushRequest` status changes to `Failed` or when individual `PackagePushJob` records fail
- **Agent Action:** A headless Agentforce Employee Agent subscribes to this event via a Platform-Event-Triggered Flow
- **Process:**
  1. The agent queries the failed `PackagePushJob` records using the existing `PushUpgradesInterface` patterns (REST API v57.0)
  2. It clusters errors by ErrorType and ErrorSeverity, identifies the most common failure reasons
  3. It cross-references subscriber org data (OrgStatus, OrgType, InstanceName) from `PackageSubscriber` via the Tooling API
  4. It uses a Prompt Template grounded with error data and subscriber context to generate a root-cause analysis and remediation plan
  5. It sends a structured Slack notification to the DevHub admin with: failure summary, affected subscriber count, root-cause hypothesis, and recommended next steps (retry, skip, or escalate)
  6. It creates a Task record assigned to the admin with the full analysis

**Key Agentforce Components:**
- Topic: "Push Upgrade Failure Triage" with instructions to analyze failures and recommend remediation
- Actions: `Get Failed Push Jobs` (Apex invocable using [PushUpgradesCtrl](force-app/main/default/classes/PushUpgradesCtrl.cls)), `Analyze Error Patterns` (Prompt Template), `Notify Admin in Slack`, `Create Remediation Task`
- Guardrails: Never auto-retry push upgrades without admin approval; limit analysis to the specific push request

### 1b. Subscriber Org Health Alert Agent (External Event Response Pattern)

**Problem:** ISV partners need to know immediately when key subscriber orgs go offline, change status (Active to Inactive), or fall behind on critical version updates. Currently this requires manual periodic checks in the Package Visualizer UI.

**How it works:**
- **Trigger:** A scheduled Flow runs periodically (e.g., every 4 hours) and queries `PackageSubscriber` via the Tooling API. Alternatively, an external monitoring system publishes a Platform Event when subscriber org health data changes
- **Agent Action:** The agent compares current subscriber data against a baseline stored in Data 360 DMOs
- **Process:**
  1. Detects status changes (Active to Inactive, new sandboxes, version downgrades)
  2. Enriches the alert with subscriber context: org name, org type, current version, parent org, LMA license status (via `sfLma__License__c`)
  3. Classifies severity (Critical: production org went inactive; Warning: sandbox on deprecated version; Info: new sandbox created)
  4. Sends tiered notifications: Critical alerts go to Slack + email; Warnings go to an in-app notification using the existing `DockedUtilityBarMessageChannel`
  5. Auto-creates follow-up Tasks for high-severity alerts

**Key Agentforce Components:**
- Topic: "Subscriber Health Monitoring" with instructions for severity classification
- Actions: `Query Subscriber Status` (Apex using [Package2Interface](force-app/main/default/classes/Package2Interface.cls)), `Compare Against Baseline`, `Classify Severity` (Prompt Template), `Send Tiered Notification`
- Data 360: DMOs storing subscriber health baselines and historical status data

### 1c. Org Limits Threshold Alert Agent (Internal Event Response Pattern)

**Problem:** The Package Visualizer already displays org limits via [LimitsController](force-app/main/default/classes/LimitsController.cls) and the `dockedLimitsBar` component, but this is purely reactive -- users must open the utility bar to check. ISVs can be caught off-guard when API limits, scratch org limits, or package version create limits are nearly exhausted.

**How it works:**
- **Trigger:** A scheduled Apex job polls the Limits API at regular intervals and publishes a `Limit_Threshold_Breach__e` Platform Event when any limit exceeds a configurable threshold (stored in `Package_Visualizer_Setting__mdt`)
- **Agent Action:** The agent receives the event via a Platform-Event-Triggered Flow
- **Process:**
  1. Identifies which limits are approaching or have exceeded thresholds
  2. Analyzes usage trends (is consumption accelerating?)
  3. Generates recommendations: "You've used 85% of daily API calls. Consider deferring the scheduled push upgrade until tomorrow" or "Only 2 scratch org creates remaining -- prioritize which features to test"
  4. Sends contextual Slack notification with trend data and actionable recommendations

---

## 2. Ambient Agent Use Cases

Ambient agents operate continuously in the background of a user's workflow, augmenting human capabilities while maintaining a low profile. The whitepaper defines two sub-patterns: **Background Stream Observer** (Section 2.3.a) and **User Activity Interception** (Section 2.3.b).

### 2a. Package Version Advisor Agent (User Activity Interception Pattern)

**Problem:** When ISV admins navigate between packages, versions, and subscribers in the split-view UI ([packageSplitView](force-app/main/default/lwc/packageSplitView)), they lack contextual intelligence about what they're viewing. They must manually correlate data across tabs (Versions, Subscribers, Push Requests) to form insights.

**How it works:**
- **Trigger:** The agent attaches as an observer when the user opens the Package Visualizer app. It listens to `PackageMessageChannel` events (which fire on every package/version selection)
- **Agent Action:** As the user navigates, the agent silently analyzes the context and surfaces just-in-time insights
- **Process:**
  1. When the user selects a package: The agent checks version adoption distribution, identifies the most common version among subscribers, flags if the latest version has low adoption, and surfaces this as a subtle in-app card
  2. When the user views a specific version: The agent checks dependency health (using `packageDependenciesView` data), identifies if any dependencies are deprecated or have known issues, and surfaces warnings
  3. When the user views subscribers: The agent identifies clusters of subscribers on outdated versions, calculates "upgrade readiness" scores, and suggests push upgrade candidates
  4. All insights are surfaced through the existing `inAppGuidanceCard` / `inAppPrompt` infrastructure, using the `In_App_Prompt__mdt` custom metadata pattern already established in the app

**Key Agentforce Components:**
- Topic: "Package Intelligence" with instructions to provide contextual analysis based on user navigation
- Actions: `Analyze Version Adoption` (Apex), `Check Dependency Health` (Apex), `Calculate Upgrade Readiness` (Prompt Template), `Surface Insight` (LWC event via `DockedUtilityBarMessageChannel`)
- Ambience Target: The existing docked utility bar and in-app guidance system

### 2b. Push Upgrade Strategy Advisor Agent (User Activity Interception Pattern)

**Problem:** Planning a push upgrade is complex. Admins must consider: which subscribers are eligible, whether they're on compatible versions, historical push success rates, time-of-day impact on subscriber orgs, and dependency chains. This context is scattered across multiple screens and requires significant manual correlation.

**How it works:**
- **Trigger:** The agent activates when the user navigates to the Push Upgrades tab (detected via `packagePushUpgradesView` component mount)
- **Agent Action:** The agent monitors the user's push upgrade configuration in real time
- **Process:**
  1. As the user selects a target version in `packagePushUpgradesVersionModal`, the agent analyzes historical push data for that version's lineage -- success rates, common failure types, average completion time
  2. When the user selects subscriber orgs, the agent checks each org's status, current version, and instance, flagging potential issues: "3 selected orgs are on Instance NA45, which has a maintenance window scheduled"
  3. The agent references Trust API data (already integrated via `trustInstanceDetail`) to correlate with Salesforce infrastructure status
  4. It provides a real-time "confidence score" for the push upgrade and suggests optimal timing
  5. Insights appear as contextual cards alongside the push upgrade confirmation modal (`packagePushUpgradesConfirmationModal`)

**Key Agentforce Components:**
- Topic: "Push Upgrade Planning" with instructions for risk assessment and timing optimization
- Actions: `Analyze Historical Push Data` (Apex using `PushUpgradesCtrl`), `Check Instance Health` (Trust API callout), `Calculate Confidence Score` (Prompt Template), `Surface Recommendation`
- Guardrails: Advisory only -- never auto-initiate a push upgrade; always present recommendations for human decision

### 2c. AppAnalytics Intelligence Agent (Background Stream Observer Pattern)

**Problem:** ISVs submit AppAnalytics requests but often don't know what to look for in the results. The raw data requires expertise to interpret, and patterns like declining usage, feature adoption drop-off, or error spikes go unnoticed until they become critical.

**How it works:**
- **Trigger:** The agent observes when AppAnalytics query results become available (monitors `AppAnalyticsQueryRequest` status changes from Pending to Complete)
- **Agent Action:** The agent automatically downloads and analyzes completed AppAnalytics data
- **Process:**
  1. Parses the analytics results for key patterns: usage trends, feature adoption rates, error frequency, performance metrics
  2. Compares against historical baselines stored in Data 360
  3. Uses a Prompt Template to generate a natural-language summary: "Package X usage declined 15% in the last 30 days, concentrated in Enterprise-edition orgs. Feature Y adoption is at 23%, which is below your target of 40%. Recommend a targeted in-app guidance campaign."
  4. Surfaces the analysis through the existing `dockedAppAnalyticsBar` component and the `genAiResponseCard` component already built for AI responses
  5. Optionally notifies product managers via Slack with key insights

---

## 3. Autonomous Agent Use Cases

Autonomous agents are given a high-level goal and independently plan and execute multi-step tasks. The whitepaper pattern (Section 2.5) emphasizes: goal definition, multi-agent orchestration, autonomous decision-making within guardrails, and monitoring/oversight.

### 3a. Automated Phased Push Upgrade Campaign Agent

**Problem:** Rolling out a new package version to hundreds or thousands of subscriber orgs is a multi-day, multi-step process. Admins currently must manually plan upgrade waves, monitor each wave's results, decide whether to proceed, handle failures, and track overall progress. This can take weeks of human attention.

**How it works:**
- **Goal:** "Upgrade all Production subscribers of Package X from any version older than 8.15 to version 8.21 within 30 days, with less than 2% failure rate"
- **Agent Architecture (Multi-Agent):**
  1. **Orchestrator Agent** (Goal Orchestrator): Receives the goal via Slack command, parses it, creates an execution plan, and coordinates the specialist agents
  2. **Eligibility Agent** (Headless): Queries subscriber data via Tooling API, filters by version range and org status, groups subscribers into upgrade waves (sandbox first, then small production, then large production)
  3. **Execution Agent** (Headless): Creates `PackagePushRequest` records via the existing `PushUpgradesInterface` REST API patterns, monitors job status, tracks completion percentages
  4. **Analysis Agent** (Headless): After each wave completes, analyzes success/failure rates, identifies systemic issues, determines if the campaign should proceed or pause
- **Process:**
  1. Orchestrator breaks the goal into phases: Discovery, Wave 1 (Sandbox), Wave 2 (Small Production), Wave 3 (Large Production), Verification
  2. Eligibility Agent identifies all target subscribers and creates wave assignments
  3. Execution Agent runs Wave 1, waits for completion
  4. Analysis Agent evaluates results -- if failure rate < threshold, signals Orchestrator to proceed; if above, pauses and alerts admin
  5. Process repeats for each wave
  6. Weekly progress reports delivered to Slack with: subscribers upgraded, success rate, remaining timeline, blockers
- **Human Oversight:** Admin can intercept at any wave boundary; dashboard shows real-time progress; all decisions are logged

**Key Agentforce Components:**
- Goal Definition: Process playbook defining wave strategies, success criteria (< 2% failure rate), fallback rules (pause on > 5% failure)
- Orchestrator Agent Topic: "Manage Push Upgrade Campaign" with instructions for phased rollout planning
- Monitoring: Agentforce Analytics dashboard tracking campaign progress, agent decisions, and outcomes

### 3b. Package Release Readiness Agent

**Problem:** Preparing a new package version for release involves multiple sequential tasks: verifying code coverage thresholds, checking dependency compatibility across all dependent packages, validating security review status, preparing release notes, identifying subscriber impact, and planning the communication strategy. This manual checklist takes days and is error-prone.

**How it works:**
- **Goal:** "Prepare Package Visualizer version 8.22 for release and report readiness status"
- **Agent Architecture (Multi-Agent):**
  1. **Orchestrator Agent**: Manages the release readiness checklist and coordinates specialist agents
  2. **Quality Agent** (Headless): Validates code coverage (via `Package2Version.CodeCoverage` from Tooling API), checks for unresolved dependencies, verifies the version ancestry chain
  3. **Impact Agent** (Headless): Analyzes subscriber base to determine upgrade impact -- how many orgs, which versions they're on, estimated upgrade compatibility
  4. **Communication Agent** (Headless): Drafts release notes based on version changes, prepares subscriber notification templates, generates in-app announcement content (for `Package_Visualizer_Announcement__mdt`)
- **Process:**
  1. Orchestrator creates a release checklist with all validation steps
  2. Quality Agent runs all technical validations in parallel
  3. Impact Agent generates a subscriber impact report
  4. Communication Agent drafts release communications
  5. Orchestrator compiles a "Release Readiness Report" with go/no-go recommendation
  6. Report is delivered to the ISV admin via Slack and available in-app

### 3c. Subscriber Lifecycle Management Agent

**Problem:** ISV partners need to proactively manage the full subscriber lifecycle: onboarding new subscribers, ensuring they adopt key features, identifying at-risk subscribers showing declining usage, and planning retention interventions. This currently requires manual analysis across LMA licenses, AppAnalytics, and subscriber data.

**How it works:**
- **Goal:** "Reduce subscriber churn by 20% over the next quarter by identifying at-risk subscribers and executing retention interventions"
- **Agent Architecture (Multi-Agent):**
  1. **Orchestrator Agent**: Owns the churn-reduction goal, plans the strategy, and coordinates specialist agents
  2. **Analytics Agent** (Headless): Continuously monitors AppAnalytics data to build subscriber health scores based on usage frequency, feature adoption breadth, error rates, and version currency
  3. **Risk Assessment Agent** (Headless): Correlates subscriber health scores with LMA license data (expiration dates, license type, account tier) to identify at-risk subscribers
  4. **Intervention Agent** (Headless): For each at-risk subscriber, determines the appropriate intervention: schedule a check-in call (creates Task), send a feature adoption guide (triggers email), offer a version upgrade (recommends push upgrade), or escalate to account manager
- **Process:**
  1. Analytics Agent builds weekly health score snapshots for all subscribers, stored in Data 360
  2. Risk Assessment Agent identifies subscribers whose health scores have declined for 2+ consecutive weeks
  3. Intervention Agent executes personalized retention actions based on the subscriber's risk profile
  4. Orchestrator tracks outcomes: did the intervention reverse the decline? Adjusts strategy accordingly
  5. Monthly report to ISV leadership with: churn risk dashboard, interventions executed, outcomes achieved, progress toward 20% reduction goal

---

## Implementation Architecture Summary

All three agent types leverage the existing Package Visualizer infrastructure:

- **Data Layer:** Tooling API callouts via [Package2Interface](force-app/main/default/classes/Package2Interface.cls) and [PushUpgradesInterface](force-app/main/default/classes/PushUpgradesInterface.cls), with the dual-auth pattern (VF Session / Named Credentials) via [CalloutService](unpackaged-directory/main/default/classes/CalloutService.cls)
- **UI Layer:** Existing `DockedUtilityBarMessageChannel`, `PackageMessageChannel`, and the in-app guidance system (`In_App_Prompt__mdt`, `inAppGuidanceCard`) for ambient agent surfaces
- **AI Layer:** The existing `agentforcePromptGenerator` component and its multi-model support (11 models) can be extended for agent-generated insights
- **Event Layer:** New Platform Events for agent triggers, with Platform-Event-Triggered Flows invoking headless Agentforce agents
- **Notification Layer:** Slack integration for proactive and autonomous agent notifications; in-app cards for ambient insights
