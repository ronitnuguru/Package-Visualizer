# Package Visualizer

[![Version](https://img.shields.io/badge/version-8.5.0-blue.svg)](https://github.com/yourusername/package-visualizer)
[![AppExchange](https://img.shields.io/badge/AppExchange-Listed-orange.svg)](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3u00000MSnbuEAD)
[![Namespace](https://img.shields.io/badge/namespace-pkgviz-green.svg)]()
[![API Version](https://img.shields.io/badge/API-v65.0-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-Managed%20Package-blue.svg)]()

> A comprehensive DevHub management tool for visualizing, monitoring, and managing Salesforce Second-Generation (2GP), Unlocked, and First-Generation (1GP) packages.

[AppExchange Listing](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3u00000MSnbuEAD) • [Configuration Guide](https://salesforce.quip.com/f3SWA340YbFH)

---

## Table of Contents

- [What is Package Visualizer?](#what-is-package-visualizer)
- [Key Features](#key-features)
- [Who Should Use This?](#who-should-use-this)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Feature Deep Dive](#feature-deep-dive)
- [Integrations](#integrations)
- [Technical Architecture](#technical-architecture)
- [Configuration](#configuration)
- [Security & Permissions](#security--permissions)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [Support](#support)

---

## What is Package Visualizer?

Package Visualizer is a **managed package for Salesforce DevHub organizations** that provides ISV partners, package developers, and DevHub administrators with powerful tools to:

- 📦 **Browse and visualize** all 2GP (Second-Generation), Unlocked, and 1GP (First-Generation) packages
- 🌳 **Visualize version trees** with interactive D3.js-powered dependency graphs
- 👥 **Monitor subscriber organizations** with advanced filtering and analytics
- 🚀 **Orchestrate push upgrades** across your subscriber base
- 📊 **Analyze adoption metrics** with integrated AppAnalytics
- 🔐 **Manage licenses** via License Management App (LMA) integration
- 🤖 **Generate AI prompts** with Agentforce integration
- 🔧 **Create scratch orgs and trials** directly from the interface

### Why Package Visualizer?

Managing packages at scale is complex. Package Visualizer consolidates data from multiple Salesforce APIs (Tooling API, REST API, LMA, AppAnalytics, Trust API) into a unified, intuitive interface that saves hours of manual work.

| **Without Package Visualizer** | **With Package Visualizer** |
|--------------------------------|------------------------------|
| Manually query Tooling API | Visual dashboard with real-time data |
| Export data to spreadsheets | Interactive charts and filters |
| Track subscribers across systems | Centralized subscriber management |
| Coordinate push upgrades via CLI | One-click push upgrades with monitoring |
| No visibility into adoption metrics | Integrated AppAnalytics and trends |

---

## Key Features

### 📦 Package Management
- **Unified Package Browser** - View all 2GP (Managed & Unlocked) and 1GP packages in one place
- **Version Tracking** - Browse package versions with filtering by major/minor/patch version
- **Version Tree Visualization** - D3.js-powered interactive tree showing version ancestry and dependencies
- **Code Coverage Display** - View test coverage percentage for each package version
- **Install URL Generation** - Quick copy for package installation links
- **Security Review Status** - Track AppExchange security review approval status

### 👥 Subscriber Organization Management
- **Subscriber List View** - Comprehensive table of all subscriber organizations
- **Advanced Filtering** - Filter by org type (production, sandbox, scratch), status, instance, version
- **Subscriber Details** - Deep dive into individual org configuration and metadata
- **Org Analytics Charts** - Visual breakdown by org type, region, instance, status
- **Sandbox Tracking** (New in v8.5) - Track sandbox environments per subscriber organization
- **Export Capabilities** - Download subscriber lists for offline analysis

### 🚀 Push Upgrade Orchestration
- **Visual Push Job Management** - Track all PackagePushRequests and PackagePushJobs
- **Eligibility Checking** - Automatically identify orgs eligible for upgrade based on version and status
- **Version Selection** - Choose target version with visual comparison
- **Scheduled Upgrades** - Schedule push upgrades for future execution
- **Job Monitoring** - Real-time status tracking with charts (Pending, In Progress, Succeeded, Failed)
- **Error Analysis** - View detailed error messages for failed push attempts
- **History Timeline** - Complete audit trail of all push activities

### 📊 Analytics & Insights
- **AppAnalytics Integration** - Submit and retrieve AppAnalytics query requests
- **Custom Data Requests** - Query adoption analytics, feature usage, and performance metrics
- **Chart Visualizations** - Interactive charts for subscriber distribution, version adoption
- **Trend Analysis** - Track package adoption and usage patterns over time
- **Download Reports** - Export AppAnalytics data for deeper analysis

### 🔐 License Management (LMA Integration)
- **LMA Package Sync** - Automatic detection of LMA packages in your org
- **License List View** - Browse all licenses with filtering by status, type, expiration
- **License Details** - View associated Account, Contact, Lead, and seat usage
- **License Modification** - Update expiration dates, seats, and status directly
- **License History Timeline** - Track all changes to license records
- **Subscriber-to-License Mapping** - Link PackageSubscriber records to LMA Licenses

### 🛠️ DevHub Utilities
- **Scratch Org Creation** - Build scratch org definition files visually with the interactive builder
- **SignupRequest Management** - Create demo trials and track signup requests
- **Org Limits Dashboard** - Monitor API limits, DML limits, and other org resources
- **Trust Status Integration** - Check instance status via Salesforce Trust API
- **Environment Hub Integration** - Link to Environment Hub for connected orgs

### 🤖 AI-Powered Features (Agentforce)
- **Prompt Template Generator** - Generate prompts using Salesforce Models API
- **Multi-Model Support** - Azure OpenAI (GPT-5), Amazon Bedrock (Claude 4 Sonnet, Nova), Google Vertex AI (Gemini 2.5)
- **Contextual Prompts** - Pre-built templates for common package management scenarios
- **Custom Prompts** - Create and save your own prompt templates

### 🎓 Guided Setup & Resources
- **Setup Assistant** - Step-by-step configuration wizard for first-time setup
- **In-App Guidance** - Contextual walkthroughs for key features
- **Resource Library** - Curated links to documentation, videos, and community resources
- **Announcement Banner** - Stay updated with new features and best practices
- **Welcome Mat** - Onboarding experience for new users

---

## Who Should Use This?

### 🏢 ISV Partners & AppExchange Publishers
**Use Cases:**
- Monitor subscriber health across your install base
- Coordinate push upgrades to deploy patches and new features
- Analyze adoption metrics via AppAnalytics
- Manage LMA licenses and track seat usage
- Identify orgs on outdated versions requiring upgrades

### 👨‍💻 Package Developers
**Use Cases:**
- Visualize package version dependencies and ancestry
- Track code coverage across versions
- Test package installation in scratch orgs
- Verify security review status before AppExchange submission
- Generate install URLs for testing and distribution

### 🔧 DevHub Administrators
**Use Cases:**
- Monitor all 2GP and 1GP packages in your DevHub
- Track scratch org usage and limits
- Create demo trials for sales and partner enablement
- Manage SignupRequests and Environment Hub connections
- Audit package creation and version history

### 📊 Release Managers
**Use Cases:**
- Plan and execute push upgrade campaigns
- Track upgrade success rates and failure patterns
- Coordinate major version rollouts
- Manage subscriber communication during upgrades
- Generate reports for stakeholders

---

## Screenshots

> **Note:** The following are descriptions of key interfaces. Screenshots should be captured during actual usage.

### Package Browser - Split View
*Browse all 2GP and 1GP packages with a split-panel detail view. The left panel shows the package list with filtering options, while the right panel displays detailed information including versions, subscribers, and push upgrade status.*

### Version Tree Visualization
*Interactive D3.js visualization of package version ancestry showing the relationship between versions, their release status (released, beta, deprecated), and branching structure.*

### Subscriber Management
*Filter and analyze subscriber organizations with advanced search, filtering by org type/status/instance, and visual analytics charts showing distribution across regions and versions.*

### Push Upgrade Dashboard
*Track push jobs with real-time status monitoring, error analysis, and charts showing success/failure rates across your subscriber base.*

### AppAnalytics Integration
*Submit AppAnalytics data requests for adoption metrics, configure data types and date ranges, and download results when processing is complete.*

### Agentforce Prompt Generator
*Generate AI prompts with multiple LLM models including GPT-5, Claude 4 Sonnet, and Gemini 2.5. Select from pre-built templates or create custom prompts.*

### Docked Utility Bar
*Quick access panel at the bottom of the screen providing instant visibility into org limits, resources, AppAnalytics requests, and announcements.*

---

## Installation

### Prerequisites

- **Salesforce DevHub Organization** - Developer Edition, Partner Developer Edition, or Production org with DevHub enabled
- **System Administrator Profile** - Or equivalent permissions to install managed packages
- **Tooling API Access** - Enabled by default in most orgs

### Install via AppExchange (Recommended)

1. Visit the [AppExchange Listing](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3u00000MSnbuEAD)
2. Click **"Get It Now"**
3. Choose your DevHub org for installation
4. Select **"Install for Admins Only"** or **"Install for All Users"** based on your needs
5. Grant access to external sites when prompted (required for Tooling API calls)
6. Complete the installation wizard

### Install via Package URL

For direct installation, use these URLs:

**Production/Developer Edition:**
```
https://login.salesforce.com/packaging/installPackage.apexp?p0=04tRh000001S9J7IAK
```

**Sandbox:**
```
https://test.salesforce.com/packaging/installPackage.apexp?p0=04tRh000001S9J7IAK
```

### Post-Installation Steps

1. **Assign Permission Set**
   - Navigate to **Setup → Permission Sets**
   - Assign **"Package_VisualizerPS"** permission set to users who need access

2. **Configure Remote Site Settings**
   - Navigate to **Setup → Remote Site Settings**
   - Verify that the remote site for your instance domain is active

3. **Review Custom Metadata**
   - Navigate to **Setup → Custom Metadata Types**
   - Optionally customize **Package_Visualizer_Resource__mdt** and **Package_Visualizer_Announcement__mdt** records

4. **Run Setup Assistant**
   - Open the **Package Visualizer** app from the App Launcher
   - Complete the guided setup wizard

5. **Enable Optional Integrations**
   - Install LMA (License Management App) if managing licenses
   - Configure AppAnalytics if tracking adoption metrics
   - Enable Environment Hub if provisioning connected orgs

### Verification

After installation, navigate to the **Package Visualizer** app from the App Launcher. You should see:
- List of all 2GP packages in your DevHub
- Package version counts
- Setup Assistant (if first-time setup)

---

## Quick Start

### Your First 5 Minutes with Package Visualizer

#### 1. Browse Your Packages
1. Open the **Package Visualizer** app from App Launcher
2. View the list of all 2GP packages in your DevHub
3. Click any package to see details in the split-view panel
4. Toggle between "2GP and Unlocked Packages" and "First Generation Packages" using the dropdown

#### 2. Visualize Package Versions
1. From the package details panel, click the **"Versions"** tab
2. Browse all versions with filtering options
3. Click **"View Version Tree"** to see the interactive ancestry visualization
4. Hover over nodes to see version details, drag nodes to reposition

#### 3. Check Subscriber Organizations
1. Click the **"Subscribers"** tab in the package details panel
2. View all orgs with your package installed
3. Use filters to segment by org type, version, or status
4. Click the charts icon to see visual analytics

#### 4. Manage Push Upgrades
1. Navigate to the **"Push Upgrades"** tab
2. Click **"Create Push Request"** for eligible subscribers
3. Select target version
4. Schedule for future execution or execute immediately
5. Track progress in the **"Push Jobs"** view

#### 5. Explore Utility Features
1. Click the **utility bar** at the bottom of the screen
2. **Limits** - Check your org's API and resource limits
3. **Resources** - Access curated documentation and videos
4. **AppAnalytics** - Submit data requests (if enabled)

### Common Workflows

<details>
<summary><b>Finding Orgs on Old Versions</b></summary>

1. Click on your package
2. Go to **"Subscribers"** tab
3. Sort by **"Version"** column (ascending)
4. Identify orgs needing upgrades
5. Use bulk push upgrade if many orgs need updating
</details>

<details>
<summary><b>Creating a Push Upgrade Campaign</b></summary>

1. Navigate to **"Push Upgrades"** tab
2. Filter subscribers eligible for upgrade
3. Select target version
4. Review eligibility requirements (active orgs, released version)
5. Schedule push for off-peak hours
6. Monitor job status and errors in real-time
</details>

<details>
<summary><b>Analyzing Package Adoption</b></summary>

1. Click **"Subscribers"** tab
2. Click charts icon to view analytics
3. Review distribution by:
   - Org Type (Production vs Sandbox)
   - Region/Instance
   - Version Adoption
   - Org Status (Active vs Inactive)
4. Export data for deeper analysis in Excel or BI tools
</details>

---

## Feature Deep Dive

### Package Version Management

#### Understanding Version Tree Visualization

The D3.js-powered version tree shows:
- **Nodes** - Each package version represented as a circle
- **Edges** - Ancestry relationships (based on AncestorId field)
- **Colors** - Released (green), Beta (yellow), Deprecated (red)
- **Interactions** - Click to view details, drag to reposition, hover for tooltips

**Use Cases:**
- Visualize branching strategy for parallel development
- Identify version lineage and ancestry chains
- Plan upgrade paths for subscribers
- Document release history visually

#### Version Filtering

Advanced filters available:
- **Version Range** - Major.Minor (minimum and maximum)
- **Release Status** - Released, Beta, Deprecated
- **Date Range** - Filter by CreatedDate
- **Branch** - Filter by branch name
- **Tag** - Filter by version tag

#### Code Coverage Display

Each version shows:
- Overall code coverage percentage
- **HasPassedCodeCoverageCheck** indicator (75% minimum for managed packages)
- Drill-down to class-level coverage (requires additional query)

---

### Subscriber Organization Management

#### Subscriber Detail View

Clicking a subscriber org reveals:
- **Org Information** - Name, OrgKey (15-character ID), Type, Status
- **Installation Details** - Version installed, install date, package metadata
- **Instance Information** - Instance name (e.g., NA173), region
- **Parent Org** - For sandboxes, link to parent production org
- **Actions** - Push upgrade, view history, export details

#### Advanced Filtering

Complex filters include:
- **Org Type** - Production, Sandbox, Scratch, Trial, Demo
- **Org Status** - Active, Inactive, Free, Trial
- **Version** - Specific version or version range
- **Instance** - Specific Salesforce instance (e.g., NA173, CS42)
- **Date Range** - Filter by SystemModstamp

#### Subscriber Sandboxes View (New in v8.5)

Track sandbox environments associated with subscriber orgs:
- Link production orgs to their sandboxes
- Track sandbox refresh dates
- Monitor sandbox-specific version installations

---

### Push Upgrade Orchestration

#### Understanding Push Upgrade Eligibility

Orgs are eligible for push upgrades if:
- Currently on a **lower released version** than target
- Org status is **Active** (not Inactive or Trial)
- No pending push jobs for that org
- Target version is **Released** (not Beta)
- Org type is **Production or Developer Edition** (not scratch org)

#### Creating Push Requests

1. **Single Org Push** - From subscriber detail, click "Push Upgrade"
2. **Bulk Push** - Select multiple orgs, choose "Bulk Push Upgrade"
3. **Version Selection** - Choose target version (must be higher than current)
4. **Scheduling** - Set ScheduledStartTime or execute immediately
5. **Confirmation** - Review org count and version details before submitting

#### Monitoring Push Jobs

Track via **PackagePushJob** records:
- **Status** - Pending, In Progress, Succeeded, Failed, Canceled
- **Progress** - Percentage complete and duration
- **Error Messages** - Detailed failure reasons for troubleshooting
- **Retry Options** - Re-push failed orgs with fixes

#### Push Upgrade Charts

Visualize push campaigns with:
- Success rate pie chart
- Status distribution bar chart
- Timeline of job execution
- Failure analysis by error code

---

### AppAnalytics Integration

#### Submitting Data Requests

1. Navigate to utility bar → **"AppAnalytics Requests"**
2. Click **"New Request"**
3. Configure request:
   - **Data Type** - AiaaMetrics, AiaaRatings, AiaaUsageMetrics, etc.
   - **Date Range** - Start and End DateTime
   - **Package** - Your package ID (auto-populated)
   - **Organization IDs** - Optional filter for specific orgs
   - **File Type** - CSV, JSON, XML
   - **Compression** - GZIP, ZIP, None
4. Submit request and monitor **RequestState** (Queued, Processing, Complete)
5. Download results when RequestState = Complete

#### Supported Data Types

- **AiaaMetrics** - General adoption metrics and usage statistics
- **AiaaRatings** - AppExchange ratings and review data
- **AiaaUsageMetrics** - Feature usage tracking and engagement
- **AiaaLwcPerformance** - LWC component performance metrics
- **AiaaErrorEvents** - Error logging and exception data

---

### License Management (LMA)

#### Prerequisites

- License Management App (LMA) installed in your DevHub
- LMA Package created and linked to your 2GP package

#### Features

1. **License List** - View all `sfLma__License__c` records with filtering
2. **Filtering** - By status (Active, Suspended, Trial), type, expiration date
3. **License Details** - Account/Contact/Lead associations, seats, usage
4. **Modifications** - Update license status, seats, expiration date directly
5. **License History Timeline** - Track all changes via `sfLma__License__History`

#### Linking Subscribers to Licenses

Map PackageSubscriber records to LMA Licenses using:
- **OrgKey** (15-character org ID) matches License lookup field
- Automatic linkage when org IDs match between systems

---

### Agentforce Prompt Generator

#### Supported Models (as of v8.5)

- **Azure OpenAI** - GPT-5, GPT-5 Mini, GPT-4.1, GPT-4.1 Mini
- **Amazon Bedrock** - Claude 4 Sonnet, Claude 3.7 Sonnet, Claude 3 Haiku, Amazon Nova Pro, Amazon Nova Lite
- **Google Vertex AI** - Gemini 2.5 Flash, Gemini 2.5 Flash Lite

#### Using Prompt Templates

1. Select a template from dropdown (or create custom)
2. Choose your preferred AI model
3. Provide input context (e.g., package name, subscriber count, feature details)
4. Click **"Generate Prompt"**
5. Review AI-generated response
6. Copy or refine prompt for your use case

#### Use Cases

- Generate release notes from version changelog
- Create subscriber communication templates for upgrades
- Analyze error patterns from push jobs
- Draft AppExchange listing descriptions
- Create documentation and help text

---

### Scratch Org & Trial Management

#### Creating Scratch Org Definition Files

Visual builder for `project-scratch-def.json`:
1. Select edition (Developer, Enterprise, Unlimited, etc.)
2. Configure features and settings checkboxes
3. Add metadata expressions for custom configuration
4. Preview JSON output in real-time
5. Copy or download file for use with Salesforce CLI

#### SignupRequest Creation

Create demo trials for:
- Sales demonstrations
- Partner enablement
- Training environments
- POC (Proof of Concept) environments

**Requires:** SignupRequest API enabled in Partner Business Org (PBO)

**Configurable Fields:**
- **Edition** - Developer, Enterprise, Unlimited, Performance, etc.
- **Trial Days** - 1-30 days
- **Template** - Optional org template ID
- **User Info** - First name, last name, email, username
- **Subdomain** - MyDomain for the trial org
- **Connect to EnvHub** - Auto-link to Environment Hub

---

## Integrations

Package Visualizer integrates with multiple Salesforce platform services:

### 🔧 Tooling API (v61.0)

**Purpose:** Query package metadata and subscriber information

**Objects Used:**
- `Package2` - 2GP package metadata
- `Package2Version` - 2GP version details
- `MetadataPackage` - 1GP package metadata
- `MetadataPackageVersion` - 1GP version details
- `PackageSubscriber` - Subscriber org information
- `PackagePushJob` - Push upgrade job status
- `PackagePushRequest` - Push upgrade requests
- `SignupRequest` - Trial org creation

**Configuration:** Uses Visualforce page to extract session ID (included in package)

---

### 📊 AppAnalytics

**Purpose:** Retrieve adoption and usage metrics for managed packages

**Objects Used:**
- `AppAnalyticsQueryRequest` - Submit and track data requests

**Prerequisites:**
- Managed package with analytics enabled
- AppAnalyticsEnabled = true on Package2 record

**Data Available:**
- Feature adoption rates and usage patterns
- Error and performance metrics
- Custom event tracking
- User behavior analytics

---

### 🔐 License Management App (LMA)

**Purpose:** Manage licenses for AppExchange managed packages

**Objects Used:**
- `sfLma__License__c` - License records with status, seats, expiration
- `sfLma__Package__c` - LMA package configuration
- `sfLma__Package_Version__c` - LMA version metadata

**Prerequisites:**
- LMA package installed in DevHub
- LMA Package created and linked to 2GP package

**Capabilities:**
- View all licenses with filtering by status, type, expiration
- Update license status, seats, and expiration dates
- Track license history and audit trail
- Link subscribers to licenses via OrgKey matching

---

### ⚙️ Feature Management App (FMA)

**Purpose:** Feature flag management for packages

**Objects Used:**
- `sfFma__FeatureParameter__c` - Feature flags and parameters

**Detection:** Automatically detected if FMA is installed in the org

---

### 🤖 Salesforce Models API (Agentforce)

**Purpose:** AI-powered prompt generation

**Models Supported:**
- **Azure OpenAI** - GPT-5, GPT-4.1 and variants
- **Amazon Bedrock** - Claude 4 Sonnet, Amazon Nova
- **Google Vertex AI** - Gemini 2.5 Flash

**Configuration:**
- Models API must be enabled in org
- Named credentials configured for external models

---

### 🌍 Trust API

**Purpose:** Check Salesforce instance status and availability

**Endpoint:** `https://api.status.salesforce.com/v1/instances/{instance}/status`

**Use Case:** Display trust status for subscriber org instances (e.g., NA173, CS42)

---

### 🔗 Environment Hub

**Purpose:** Centralized management of connected orgs

**Integration:** Link SignupRequest trials to Environment Hub automatically

**Prerequisites:** Environment Hub enabled in Partner Business Org

---

### 📈 Limits API

**Purpose:** Monitor org resource consumption

**Metrics Tracked:**
- API calls remaining (daily and concurrent)
- DML statements
- SOQL queries
- Email invocations
- Data and file storage

**Displayed In:** Docked utility bar "Limits" panel

---

## Technical Architecture

### Component Overview

Package Visualizer is built with **modern Lightning Web Components** and secure **Apex controllers** following Salesforce platform best practices.

#### Statistics
- **103 Lightning Web Components (LWC)**
- **13 Apex Classes**
- **3 Permission Sets**
- **5 Custom Metadata Types**
- **7 Lightning Message Channels**
- **Namespace:** `pkgviz`
- **API Version:** 65.0

---

### Frontend Architecture

#### Key Lightning Web Components by Feature

**Core Package Components:**
- `packageVisualizer` - Main app entry point and container
- `packageSplitView` - Split-panel layout manager with responsive design
- `packageListView` - Package list table with sorting and filtering
- `packageDetailsView` - Package detail panel with inline editing
- `packageHeader` - Package info header with actions
- `packageIcon` - Custom package icon renderer

**Version Management:**
- `packageVersionsView` - Version list table with multi-view support
- `packageVersionDetails` - Version detail panel
- `package1VersionsView` - 1GP version table
- `d3TreeChart` - D3.js version tree visualization with interactive nodes

**Subscriber Management:**
- `packageSubscribersView` - Subscriber list table with advanced filtering
- `packageSubscriberDetail` - Individual subscriber detail view
- `packageVersionSubscriberList` - Subscribers by version
- `subscribersChartsPanel` - Analytics charts for subscribers
- `packageSubscriberSandboxesView` - Sandbox tracking (new in 8.5)

**Push Upgrades:**
- `packagePushUpgradesView` - Push upgrade dashboard
- `packagePushJobView` - Job monitoring table with real-time updates
- `packagePushJobDetail` - Job detail view with error analysis
- `packagePushJobChartsPanel` - Push analytics charts
- `packagePushUpgradesVersionModal` - Version selection modal
- `packagePushUpgradesConfirmationModal` - Confirmation dialog

**LMA Integration:**
- `packageLmaView` - License list table
- `packageLicenseSubscriberCard` - License card component
- `packageLmaTimeline` - License history timeline

**Utilities:**
- `dockedUtilityBar` - Bottom utility bar with quick access features
- `dockedLimitsBar` - Limits display panel
- `createSignupOrg` - SignupRequest form
- `scratchDefFileBuildCard` - Scratch definition builder

**AI/Agentforce:**
- `agentforcePromptGenerator` - Prompt generation interface
- `genAiResponseCard` - AI response display

---

### Backend Architecture

#### Apex Controllers

**PackageVisualizerCtrl.cls** (Main Controller)
- 40+ `@AuraEnabled` methods for LWC data requests
- Handles all package, version, subscriber, and push upgrade queries
- Delegates to interface classes for API calls
- Implements `with sharing` for security compliance

**Key Methods:**
```apex
@AuraEnabled(continuation=true)
public static List<ObjectWrappers.PackageWrapper> get2GPPackageList(String sortDirection)

@AuraEnabled(cacheable=true)
public static List<ObjectWrappers.PackageVersionWrapper> get2GPPackageVersionList(String packageId)

@AuraEnabled(cacheable=true)
public static List<ObjectWrappers.PackageSubscriberWrapper> get2GPPackageVersionSubscriberList(String versionId)

@AuraEnabled(continuation=true)
public static String createSignupTrial(Map<String, String> signupFields)
```

**Package2Interface.cls** (Core Business Logic)
- Fetches package data via **Tooling API v61.0**
- Supports both 2GP (Package2) and 1GP (MetadataPackage)
- Dynamic query building with WHERE clauses and pagination
- Feature detection for optional components

**PushUpgradesInterface.cls** (Push Upgrade Logic)
- Manages PackagePushRequest and PackagePushJob operations
- Uses **REST API** for creating and updating push requests
- Implements batch processing for large subscriber lists (200 limit per batch)
- Uses `@future(callout=true)` for async processing

**LimitsController.cls** (Org Limits)
- Calls **Limits API** to retrieve org resource statistics
- Returns API calls, DML statements, SOQL queries, storage usage

**DemoTrialsController.cls** (Trial Org Creation)
- Creates SignupRequest objects for demo trials
- Uses ConnectApi.ManagedContent for CMS content retrieval

---

### Data Model

#### Standard Salesforce Objects Used

**2GP Objects:**
- `Package2` - Package metadata (Name, Namespace, SubscriberPackageId, IsDeprecated)
- `Package2Version` - Version details (MajorVersion, MinorVersion, PatchVersion, BuildNumber, CodeCoverage, IsReleased)

**1GP Objects:**
- `MetadataPackage` - Package metadata
- `MetadataPackageVersion` - Version details

**Subscriber Objects:**
- `PackageSubscriber` - Subscriber org info (OrgKey, OrgName, OrgType, OrgStatus, InstanceName)

**Push Upgrade Objects:**
- `PackagePushRequest` - Push request metadata (PackageVersionId, ScheduledStartTime, Status)
- `PackagePushJob` - Individual push job (SubscriberOrganizationKey, Status, DurationSeconds, PackagePushErrors)

**Other Objects:**
- `SignupRequest` - Trial org creation
- `AppAnalyticsQueryRequest` - Analytics data requests
- `InstalledSubscriberPackage` - Installed package detection

---

### Security

**Data Access Control:**
- Uses `Security.stripInaccessible(AccessType.READABLE, ...)` for field-level security
- Uses `WITH USER_MODE` and `WITH SECURITY_ENFORCED` in SOQL queries where applicable
- `with sharing` keyword on most classes for org-wide sharing rules compliance
- `without sharing` on DemoTrialsController (requires elevated privileges for signup)

**Input Sanitization:**
- Heavy use of `String.escapeSingleQuotes()` to prevent SOQL injection
- Dynamic query building with parameter escaping
- Validation of user inputs before processing

**API Patterns:**
- **Continuation Pattern** - `@AuraEnabled(continuation=true)` for long-running callouts
- **Caching Strategy** - `@AuraEnabled(cacheable=true)` for frequently accessed metadata
- **Pagination** - LIMIT/OFFSET pattern for all list queries (default limits 50-500 range)

---

## Configuration

### Custom Metadata Types

**Package_Visualizer_Resource__mdt**
- **Purpose:** Configuration for help resources and documentation links
- **Fields:** Label, Icon__c, Link__c, Description__c, Visibility__c
- **Usage:** Displayed in docked utility bar "Resources" panel

**Package_Visualizer_Announcement__mdt**
- **Purpose:** In-app announcement messaging for new features
- **Fields:** Label, Icon__c, Order__c, Link__c, Description__c, Visibility__c
- **Usage:** Displayed in announcement banner

**In_App_Prompt__mdt**
- **Purpose:** Contextual help prompts for features
- **Fields:** Title__c, Prompt_Popover_Location__c, Learn_More_Link__c, Description__c, Brand_Button_URL__c, Brand_Button_Label__c, Visibility__c
- **Usage:** In-app guidance system

**In_App_Guidance_Walkthrough__mdt**
- **Purpose:** Guided walkthroughs for users
- **Fields:** Title__c, Order__c, Description__c, Link__c, Visible__c

**About_Welcome_Mat_Step__mdt**
- **Purpose:** Welcome/onboarding steps for new users
- **Fields:** Label, Icon__c, Order__c, Description__c, Link__c, Visibility__c

### Lightning Message Channels

- `PackageMessageChannel` - Package selection and navigation events
- `PackageEditMessageChannel` - Package editing mode triggers
- `D3MessageChannel` - Tree chart control signals
- `DockedUtilityBarMessageChannel` - Utility bar communications
- `CreateOrgMessageChannel` - Org creation events
- `SignupListMessageChannel` - Signup list events
- `CreateSampleScratchOrgTemplateMessageChannel` - Scratch org template events

---

## Security & Permissions

### Required Permissions

- **System Administrator** profile or equivalent
- **Tooling API** access (enabled by default)
- **Remote Site Settings** access for external APIs

### Custom Permissions

- **Package_Visualizer_Core** - Core access to the package visualizer app
- **Package_Visualizer_Push_Upgrade** - Ability to create and manage push upgrade requests

### Permission Sets

- **Package_VisualizerPS** - Grants access to all Package Visualizer features including custom permissions

### Data Security

- **Field-Level Security** - Uses `Security.stripInaccessible()` for all queries
- **Sharing Rules** - Respects org-wide sharing with `with sharing` keyword
- **SOQL Injection Prevention** - All user inputs are escaped with `String.escapeSingleQuotes()`

---

## Troubleshooting

### Common Issues

#### Session ID Issues
**Problem:** "Unable to retrieve session ID" error
**Solution:**
- Verify that the Visualforce page (SessionCreator) is accessible
- Check user profile has "API Enabled" permission
- Clear browser cache and retry

#### Tooling API Access Errors
**Problem:** "Insufficient access rights" when querying packages
**Solution:**
- Verify user has System Administrator profile or equivalent
- Check that DevHub is enabled in the org (Setup → Dev Hub)
- Verify Tooling API access is enabled

#### Push Upgrade Failures
**Problem:** Push jobs fail with "Invalid version" error
**Solution:**
- Verify target version is Released (not Beta)
- Ensure subscriber org is on a lower version than target
- Check that org status is Active (not Inactive or Trial)

#### AppAnalytics Request Errors
**Problem:** "Invalid package ID" when submitting AppAnalytics request
**Solution:**
- Verify package has AppAnalyticsEnabled = true
- Check that package is a managed package (not unlocked)
- Ensure Package2 record has SubscriberPackageId populated

#### LMA Integration Problems
**Problem:** LMA licenses not showing up
**Solution:**
- Verify LMA package is installed in DevHub
- Check that LMA Package is created and linked to 2GP package
- Ensure user has access to sfLma__License__c object

### Debug Tips

1. **Enable Debug Logs** - Set up debug logs in Setup for detailed error traces
2. **Check Browser Console** - Look for JavaScript errors in browser developer tools
3. **Review Apex Limits** - Monitor governor limits in debug logs
4. **Test in Sandbox** - Always test changes in sandbox before production

---

## FAQ

### General Questions

**Q: What's the difference between 2GP and 1GP?**
A: Second-Generation Packages (2GP) are the modern packaging format supporting unlocked and managed packages with version control integration. First-Generation Packages (1GP) are the legacy format, now called "Unmanaged Packages."

**Q: Can I use Package Visualizer in a production org?**
A: Package Visualizer is designed for **DevHub organizations** only. It queries package metadata that is only available in DevHub orgs, not regular production or sandbox orgs.

**Q: Does Package Visualizer work with unmanaged packages?**
A: Package Visualizer supports 1GP (First-Generation) packages which includes unmanaged packages, but the features are limited compared to 2GP managed packages.

### Feature Questions

**Q: Can I schedule push upgrades for a specific date/time?**
A: Yes, when creating a push request, you can set the ScheduledStartTime field to schedule the upgrade for future execution.

**Q: How many orgs can I push upgrade at once?**
A: Package Visualizer supports bulk push upgrades with batches of up to 200 subscribers per request. For larger campaigns, create multiple push requests.

**Q: Does AppAnalytics work with unlocked packages?**
A: No, AppAnalytics is only available for **managed 2GP packages**. Unlocked packages do not support AppAnalytics at this time.

**Q: Can I customize the version tree visualization?**
A: The D3.js tree is interactive (drag nodes, click for details) but the core visualization is not customizable. You can filter versions to focus on specific branches or releases.

### Technical Questions

**Q: What APIs does Package Visualizer use?**
A: Package Visualizer uses Tooling API (v61.0), REST API (v57.0), Limits API, Trust API, and integrates with LMA, AppAnalytics, and Salesforce Models API (Agentforce).

**Q: Can I extend Package Visualizer with custom features?**
A: Package Visualizer is a managed package, so you cannot modify the packaged components. However, you can create custom LWC components that integrate with Package Visualizer using Lightning Message Service.

**Q: Does Package Visualizer support API-only integrations?**
A: Package Visualizer is primarily a UI-based tool. For API-only package management, use the Salesforce CLI (`sf package`) and Tooling API directly.

---

## Changelog

Package Visualizer has evolved through 170+ versions from v4.24 to v8.5.0. Key milestones:

- **v8.5.0** (Current) - Added sandbox tracking for subscriber orgs
- **v8.0.0** - Major UI refresh and Agentforce integration
- **v7.0.0** - Enhanced push upgrade orchestration
- **v6.0.0** - AppAnalytics integration
- **v5.0.0** - LMA integration and license management
- **v4.24.0** - Initial public release

For detailed version history, see the [Configuration Guide](https://salesforce.quip.com/f3SWA340YbFH).

---

## Contributing

Package Visualizer is a managed package developed and maintained by the core team. If you have feature requests, bug reports, or suggestions:

1. Visit the [AppExchange Listing](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3u00000MSnbuEAD)
2. Submit feedback via the AppExchange review system
3. Contact support via the channels listed below

---

## Support

### Getting Help

- **Configuration Guide** - [Salesforce Quip Guide](https://salesforce.quip.com/f3SWA340YbFH)
- **AppExchange Listing** - [Package Visualizer on AppExchange](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3u00000MSnbuEAD)
- **In-App Resources** - Access curated documentation via the docked utility bar

### Reporting Issues

If you encounter bugs or have feature requests:
1. Document the issue with screenshots and steps to reproduce
2. Submit via the AppExchange support system
3. Include your Package Visualizer version (v8.5.0) and org type

### Community

Join the Salesforce Developer Community to connect with other Package Visualizer users, share best practices, and stay updated on new releases.

---

**Package Visualizer** | Version 8.5.0 | Namespace: pkgviz | API v65.0

Built with ❤️ for the Salesforce DevHub and ISV Community
