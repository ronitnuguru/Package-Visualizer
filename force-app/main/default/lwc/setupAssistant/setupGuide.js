// Canonical markdown for the "Copy AI Guide" button. An LWC can't read a .md
// file at runtime, so the copyable content lives here as a string.
export const SETUP_GUIDE_MARKDOWN = `# Salesforce Second-Generation Managed Package (2GP) Setup and Lifecycle Guide

> Use this guide as context when asking an AI assistant about Salesforce ISV
> setup, 2GP packaging, Dev Hub configuration, namespace setup, package lifecycle
> commands, and AppExchange readiness.

## Audience and Scope

This guide is for Salesforce ISV teams preparing to use second-generation
managed packaging (2GP). It focuses on org setup, namespace setup, developer
access, DX tooling, package lifecycle commands, security review preparation, and
product extension considerations.

This guide does not cover Package Visualizer internal configuration, Tooling API
credential setup, or app-specific post-install setup.

## What Is 2GP?

Second-Generation Managed Packaging (2GP) is Salesforce's modern way for ISVs
(independent software vendors) to build, version, and distribute apps on
AppExchange. Compared with first-generation packaging (1GP), 2GP lets you:

- Share a single namespace across multiple packages.
- Manage source and packaging from version control and the Salesforce CLI
  (\`sf\`).
- Use Dev Hub, scratch orgs, and a source-driven development lifecycle.

## 1. Partner Business Org (PBO)

The Partner Business Org is the central hub for ISVs to manage packaging, orgs,
customers, and licenses. It covers development, provisioning, sales, orders, and
customer support.

- The PBO is also your Dev Hub for creating and managing 2GP packages.
- If you did not receive a PBO when you joined the Salesforce Partner Community,
  log a case to request one.
- Reference:
  [Join the Salesforce Partner Community](https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/appexchange_partner_join.htm).

## 2. Enable Dev Hub Features

Dev Hub lets you create and manage namespaces, scratch orgs, unlocked packages,
and second-generation managed packages. Enable these feature toggles in Setup:

- [Enable Dev Hub](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_pkg_enable_devhub.htm).
- [Enable Unlocked Packages and Second-Generation Managed Packages](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_setup_enable_secondgen_pkg.htm).
- [Enable Einstein Features](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_setup_enable_einstein.htm).

Reference:
[Enable Dev Hub in Salesforce Setup](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_setup_enable_devhub.htm).

## 3. Create and Register Your Namespace

With 2GP, you can share a single namespace across multiple packages. This makes
sharing and maintenance easier. Use one namespace for all of your 2GP packages.

1. Create a Developer Edition org only for registering your package namespace.
   Org creation can take a little while. Check your email once the org is
   provisioned, then go to Setup > Package Manager in that org to register the
   namespace.
   - Reference:
     [Create a Namespace for Managed 2GP](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_create_namespace.htm).
2. Link your registered namespace by authenticating into the Developer Edition
   org you created. Once linked, you can create 2GPs with that namespace.
   - Reference:
     [Register a Namespace](https://developer.salesforce.com/docs/atlas.en-us.248.0.sfdx_dev.meta/sfdx_dev/sfdx_dev_reg_namespace.htm).

Reference:
[Understand Namespaces](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_unlocked_pkg_plan_namespaces.htm).

## 4. Provision Access to Developers

The Limited Access User profile is designed for users who build customizations or
applications. These licenses restrict access to standard and custom objects but
provide essential access to Dev Hub, development tools, scratch org environments,
and packaging-related functionality.

Reference:
[Limited Access License for Package Developers](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_pkg_slalf_pkg_dev.htm).

Steps:

1. Create new users and select the \`Salesforce Limited Access - Free\` user
   license, then assign the \`Limited Access User\` profile.
   - Reference:
     [Add Free License Users](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_pkg_add_free_license_user.htm).
2. Create a permission set for developers to access the required Dev Hub objects.
   - Reference:
     [Set Up a Permission Set](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_setup_permission_set.htm).
3. Assign system permissions for creating Second-Generation Managed Packages and
   Package Versions.
   - Reference:
     [Package User Permissions](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_pkg_user_permission.htm).

## 5. Develop and Manage Apps with Developer Experience (DX)

Modern Salesforce development uses source control, Salesforce CLI, scratch orgs,
and automation to help teams build, test, and ship faster.

- Salesforce CLI (\`sf\`) simplifies development and build automation. Use it to
  create and manage orgs, synchronize source, create packages, install packages,
  and more.
  - Reference:
    [Salesforce CLI Intro](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).
  - Reference:
    [Install Salesforce CLI](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm).
- Salesforce Extensions for Visual Studio Code accelerate development for
  scratch orgs, Lightning Web Components, Apex, and other metadata.
  - Reference:
    [Salesforce Extensions for VS Code](https://developer.salesforce.com/tools/vscode).
- Skills are reusable AI capabilities that teach coding agents
  Salesforce-specific patterns, best practices, and workflows.
  - Reference:
    [Agentforce Skills Docs](https://labs.agentforce.com/docs/skills).
  - Reference:
    [agentforce-adlc](https://github.com/SalesforceAIResearch/agentforce-adlc).
  - Reference: [sf-skills](https://github.com/forcedotcom/sf-skills).
- Set up your app project structure and edit the \`namespace\` parameter to the
  global namespace you registered.
  - Reference:
    [Salesforce DX Project Structure](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm).
- Create an application by following the basic workflow when you start from
  scratch.
  - Reference:
    [Create a Salesforce DX App](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro_create_new_app.htm).
- Build a scratch org definition file to mimic sandbox, packaging, production,
  or demo org shapes.
- Use Salesforce Code Analyzer to maintain code quality and security.
  - Reference:
    [Salesforce Code Analyzer Guide](https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/guide).

Reference:
[Salesforce DX Developer Center](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm).

## 6. Incorporate Salesforce CLI into Application Lifecycle Management

The \`sf\` CLI provides package commands for repeatable creation, versioning,
promotion, and release workflows.

Reference:
[Salesforce CLI \`sf\` v2 Overview](https://developer.salesforce.com/blogs/2023/07/salesforce-cli-sf-v2-is-here).

Create a package:

\`\`\`bash
sf package create --name "Package Name" --description "Your Package Description" --package-type Managed --path force-app --target-dev-hub "DevHubOrgAlias"
\`\`\`

Reference:
[Create a Package](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_create_pkg_base.htm).

Create a package version:

\`\`\`bash
sf package version create --package "Package Name" --wait 20 --installation-key-bypass --code-coverage --definition-file config/project-scratch-def.json --target-dev-hub "DevHubOrgAlias"
\`\`\`

Reference:
[Create a Package Version](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_create_pkg_ver.htm).

Promote or release a package version:

\`\`\`bash
sf package version promote --package "Package Version Alias"
\`\`\`

Reference:
[Promote a Package Version](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_create_pkg_ver_promote.htm).

Recommend a package version to subscribers:

\`\`\`bash
sf package update --package "0Ho..." --target-dev-hub "DevHubOrgAlias" --recommended-version-id "04t..."
\`\`\`

Reference:
[Recommend a Package Version](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_recommended_version.htm).

Reference:
[All Salesforce CLI Commands](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_unified.htm).

### Components Available in Managed Packages

Each metadata component you include in a managed package has manageability rules
that determine its behavior in a subscriber org. These rules control whether the
ISV or the subscriber can edit or remove components after a package version is
created and installed.

- Reference:
  [Packageable Components](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm).
- Reference:
  [Metadata Coverage Report](https://developer.salesforce.com/docs/success/metadata-coverage-report/references/coverage-report/metadata-coverage-report.html).

### Run a Salesforce Code Analyzer Scan

\`\`\`bash
sf code-analyzer run --rule-selector AppExchange --rule-selector Recommended:Security --output-file CodeAnalyzerReport.html
\`\`\`

Reference:
[Code Analyzer for Security Review](https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/security_review_code_analyzer_scan.htm).

## 7. Security Review

Salesforce reviews products before they are publicly listed on AppExchange, so
customers can trust that AppExchange offerings meet Salesforce security
expectations.

- Reference:
  [Salesforce Security Developer Center](https://developer.salesforce.com/developer-centers/security).
- Reference:
  [Manage Partner Community Users](https://trailhead.salesforce.com/content/learn/modules/sf_partner_community/sf_partner_community_manage).
- Reference:
  [Manage AppExchange Listings](https://trailhead.salesforce.com/content/learn/modules/appexchange-partners-publishing).
- If your Dev Hub org is a trial, log a case through
  [Partner Community](https://partners.salesforce.com/) before it expires to
  request an extension. Before submitting for Security Review, also log a case to
  convert your Partner Business Org from Trial to Active status.
- Reference: [Checklist Builder](https://checklistbuilder.herokuapp.com/).

## 8. Package Adjacent Salesforce Product Metadata

You can extend conversational, generative, and agentic AI with Agentforce, and
you can package supporting metadata where Salesforce supports it.

Reference:
[Packageable Agentforce Metadata](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/dev2gp_packageable_agentforce_md.htm).

### Agentforce Packageable Components

Use this table as a quick reference for Agentforce metadata support across 1GP,
2GP, and Agentforce builders.

Some Agentforce authoring artifacts are useful during development but are not
currently packageable in 2GP.

| Component        | Metadata Type       | 1GP | 2GP | Next Gen Builder | Legacy Builder |
| ---------------- | ------------------- | --- | --- | ---------------- | -------------- |
| AgentScript      | AiAuthoringBundle   | No  | No  | Yes              | No             |
| Agent Actions    | GenAiFunction       | Yes | Yes | Yes              | Yes            |
| Subagents        | GenAiPlugin         | Yes | Yes | No               | Yes            |
| Prompt Templates | GenAiPromptTemplate | Yes | Yes | Yes              | Yes            |
| Agent Templates  | BotTemplate         | Yes | Yes | No               | Yes            |
| Agent Templates  | GenAiPlannerBundle  | Yes | Yes | No               | Yes            |
| Lightning Types  | LightningTypeBundle | Yes | Yes | Yes              | Yes            |

Reference:
[Packageable Components](https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm).

Scratch org setup for Agentforce:

- Feature:
  [Einstein1AIPlatform](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm#so_einsteingenerativeai).
- Setting:
  [einsteinGptSettings](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_einsteingptsettings.htm).
- Developer and demo orgs: Agentforce must be provisioned. Log a case through
  [Partner Community](https://partners.salesforce.com/).

### Data360 (Data Cloud)

- Reference:
  [Data360 Packaging Component Cheat Sheet](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/component-cheatsheet.html).
- Reference:
  [Data360 2GP Workflow](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html).

Scratch org setup for Data360:

- Log a case through [Partner Community](https://partners.salesforce.com/) to
  enable Data 360 in scratch orgs. This is available only through a Partner
  Business Org Dev Hub.
- Features: CustomerDataPlatform, CustomerDataPlatformLite, MarketingUser.
- Setting: customerDataPlatformSettings.
- Developer and demo orgs: Data360 is available for ISV tiers Exploration and
  above.
- Reference:
  [Scratch Org Definition Config Values](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm).

### Slack

- Reference:
  [Slack Developer Program](https://api.slack.com/developer-program).
- Reference:
  [Slack Partner Sandboxes](https://docs.slack.dev/tools/partner-sandboxes/).

## 9. 1GP to 2GP Package Migration (Generally Available)

If you still use first-generation managed packaging (1GP), review the 1GP to 2GP
package migration process. Many ISVs are moving to 2GP to use source-driven
package development and modern lifecycle tooling.

- Reference:
  [Move to Managed 2GP with Package Migrations](https://developer.salesforce.com/blogs/2025/06/move-to-managed-2gp-with-package-migrations).
- Reference:
  [Migration Guide](https://developer.salesforce.com/docs/atlas.en-us.pkg1_dev.meta/pkg1_dev/move_to_second_gen_pkg.htm).
`;
