---
name: AppAnalytics Agentic Analysis
overview: Evaluate and compare on-platform (Agentforce, Tableau Next, Data 360) and off-platform (LangGraph, OpenAI, Claude) approaches for agentic analysis of AppAnalytics CSV data, with recommendations for the Package Visualizer app.
todos:
  - id: option3-quick-win
    content: "Option 3 Implementation: Add 'Analyze with AI' button to appAnalyticsRequestModal, fetch/parse CSV client-side, pre-aggregate stats, send to Einstein Models API via existing invokePromptAndUserModelsGenAi, display in genAiResponseCard"
    status: pending
  - id: option2-tableau-next
    content: "Option 2 Implementation: Build Data 360 Ingestion API pipeline for AppAnalytics CSV, define Semantic Data Model with ISV metrics, configure Tableau Next workspace with Concierge enabled"
    status: pending
  - id: option4-langgraph
    content: "Option 4 Implementation: Build Python LangGraph agent with Salesforce REST connector, Pandas tool node, chart generation node, and deploy as API service callable from Package Visualizer"
    status: pending
isProject: false
---

# Agentic Analysis of AppAnalytics CSV Data

## Current State

The Package Visualizer already has a full AppAnalytics request lifecycle (create request, select data type, submit, view status, download), but **zero CSV parsing or in-app analysis**. The download is simply `window.open(url)` in both [`appAnalyticsRequestModal`](force-app/main/default/lwc/appAnalyticsRequestModal/appAnalyticsRequestModal.js) and [`dockedAppAnalyticsBar`](force-app/main/default/lwc/dockedAppAnalyticsBar/dockedAppAnalyticsBar.js). The CSV contains one of three data types: **PackageUsageSummary**, **PackageUsageLog**, or **SubscriberSnapshot** -- each with different column schemas (org ID, user counts, feature usage, custom object usage, etc.).

The app already has GenAI infrastructure via [`invokeModelsGenAi`](force-app/main/default/classes/PackageVisualizerCtrl.cls) and [`invokeGenAiPromptTemplate`](force-app/main/default/classes/PackageVisualizerCtrl.cls) (lines 291-312), plus LWC components like `genAiResponseCard` and `agentforcePromptGenerator` that support 11+ models.

---

## Option 1: Agentforce with Custom Apex Actions (On-Platform)

**How it works:** Build an Agentforce Employee Agent with a custom Topic ("AppAnalytics Intelligence") and Apex `@InvocableMethod` actions that:
1. Fetch the CSV from the `DownloadUrl` via an HTTP callout in Apex
2. Parse the CSV rows into structured data (Apex has no native CSV parser -- you'd write one or use a library)
3. Store parsed data in a custom object or Data 360 DMO for grounding
4. Use a Prompt Template grounded on the parsed data to generate natural-language insights (trend detection, churn risk, feature adoption)

**Strengths:**
- Fully native to Salesforce; no external dependencies
- Leverages the existing `genAiResponseCard` pattern in Package Visualizer
- Einstein Trust Layer governs all LLM calls
- Can be triggered automatically when `RequestState` changes to `Complete`

**Limitations:**
- Apex CSV parsing is fragile and limited by governor limits (heap size: 12MB synchronous / 24MB async). Large AppAnalytics files may exceed this.
- LLM context windows have token limits -- you can't pass an entire large CSV into a prompt. You'd need to pre-aggregate in Apex before sending to the model.
- No code execution capability -- the LLM cannot write and run analytical code (unlike Code Interpreter). Analysis is limited to what you pre-compute in Apex.

**Verdict:** Good for lightweight, pre-defined analyses (e.g., "top 10 orgs by usage", "month-over-month trend"). Not suited for open-ended exploratory analysis.

---

## Option 2: Tableau Next + Data 360 (On-Platform -- Recommended Native Path)

**How it works:** This is the most capable native Salesforce option:

1. **Ingest:** Upload the AppAnalytics CSV directly into Data 360 (formerly Data Cloud) -- Tableau Next supports CSV/Excel file uploads into workspaces ("Connect to New Data" > "Upload Files"). Alternatively, use the Data 360 Bulk Ingestion API (up to 150MB per CSV, 100 files per job) for automation.
2. **Model:** Build a Semantic Data Model (SDM) on top of the ingested data -- define metrics like "Monthly Active Users", "Feature Adoption Rate", "Usage Trend by Org Type"
3. **Analyze with Concierge:** Tableau Next's Concierge (GA as of Feb 2026) enables natural-language agentic analytics:
   - Ask questions like: *"Which orgs had the steepest usage decline this quarter?"*
   - Concierge auto-generates visualizations, performs time-series comparisons, and calculates percentage changes
   - Multi-SDM querying means it can cross-reference AppAnalytics data with subscriber data or LMA license data if those are also in Data 360
4. **Agentforce Integration:** Concierge is built on the Agentforce platform -- it uses the same Atlas Reasoning Engine. You could surface Concierge insights inside the Package Visualizer via embedded Tableau dashboards or Agentforce actions.

**Strengths:**
- True agentic analytics -- users ask open-ended questions in natural language
- Handles large datasets natively (Data 360 is built for scale)
- Visualizations are auto-generated, not just text responses
- Semantic models provide governed, reusable definitions of business metrics
- Can automate the CSV-to-Data-360 pipeline using the Ingestion API

**Limitations:**
- Requires Tableau Next and Data 360 licenses (significant cost)
- Setup overhead: SDM definition, workspace configuration, enabling Analytics Agent Readiness
- The CSV upload to Data 360 pipeline needs to be built (manual or automated)

**Verdict:** The strongest native option for open-ended, agentic data exploration. This is where Salesforce is investing heavily.

---

## Option 3: Agentforce + Einstein Models API In-App (On-Platform -- Lightweight)

**How it works:** Extend the existing Package Visualizer GenAI infrastructure:

1. In the `appAnalyticsRequestModal` LWC, instead of (or in addition to) the download button, add an "Analyze with AI" button
2. Fetch the CSV client-side via `fetch()` against the `DownloadUrl`
3. Parse the CSV in JavaScript (using a library like PapaParse)
4. Pre-compute summary statistics in JS (row counts, top N orgs, averages, trends)
5. Send the summary + a sample of raw rows to the existing `invokePromptAndUserModelsGenAi` Apex method with a system prompt instructing the model to analyze AppAnalytics data
6. Display the AI response in the existing `genAiResponseCard` component

**Strengths:**
- Minimal new infrastructure -- extends what already exists in Package Visualizer
- Fast to implement
- User stays in the Package Visualizer UI
- Can leverage all 11 models already configured in `agentforcePromptGenerator`

**Limitations:**
- Not truly "agentic" -- it's a single-shot prompt, not an iterative analysis loop
- Limited by LLM context window (you can't send very large CSVs)
- No code execution -- the model generates text insights, not charts or computed results
- JS-side parsing may struggle with very large files

**Verdict:** Best quick-win for adding AI analysis to the existing app. Could be a stepping stone to Option 2.

---

## Option 4: Off-Platform -- LangGraph + Pandas Agent (Python)

**How it works:** Build a Python-based agentic analysis pipeline:

1. Use the Salesforce REST API to query `AppAnalyticsQueryRequest` and get the `DownloadUrl`
2. Download the CSV
3. Load into a Pandas DataFrame
4. Use LangGraph 2.0's graph-based agent architecture with a Pandas tool agent
5. The agent autonomously decides which analyses to run: describe(), groupby(), time-series decomposition, correlation, etc.
6. Generate visualizations (matplotlib/plotly) and markdown reports

**Implementation:** LangGraph 2.0 (released Feb 2026) supports directed cyclic graphs -- the agent can loop, branch, and retry. A Pandas agent node can execute arbitrary Python against the DataFrame based on natural-language questions.

**Strengths:**
- Unlimited analytical power -- the agent can write and execute any Python/Pandas code
- True agentic loop: observe, think, act, self-correct
- Can handle very large CSVs (limited only by machine memory)
- Rich visualization output
- Can be deployed as an API service that Package Visualizer calls

**Verdict:** Most powerful analytical option. Best for teams with Python expertise who need deep, exploratory analysis.

---

## Option 5: Off-Platform -- OpenAI Code Interpreter / ChatGPT

**How it works:** Upload the AppAnalytics CSV directly to ChatGPT or use the Assistants API with Code Interpreter:

- ChatGPT: Upload CSV (up to 512MB), ask questions in natural language, get charts and analysis
- Assistants API: Programmatically upload the file, create a thread, and let the Code Interpreter tool analyze it

**Strengths:**
- Zero setup for manual use -- just drag-and-drop the CSV into ChatGPT
- Code Interpreter writes and executes real Python in a sandbox (1-4GB memory)
- Iterative: it self-corrects code errors and refines analysis
- Supports interactive charts (bar, pie, scatter, line)

**Limitations:**
- Manual process unless you build an API integration
- Data leaves Salesforce (compliance concern for ISVs handling subscriber data)
- 10 files per conversation, 1000 file limit in API

**Verdict:** Easiest manual option for ad-hoc analysis. Good for quick exploration, not for production workflows.

---

## Option 6: Off-Platform -- Claude API with Tool Use

**How it works:** Build an autonomous data analysis agent using Claude's API:

1. Define tools for CSV ingestion, Pandas operations, chart generation, and report output
2. Claude uses an "Observe > Think > Act" loop to autonomously decide which tools to execute
3. Self-healing error recovery loops ensure robustness

**Strengths:**
- Strong reasoning capabilities for complex analytical questions
- Autonomous tool selection and execution
- Can be embedded into a web app with Artifacts-style live rendering

**Limitations:**
- Requires custom development
- Data leaves Salesforce

---

## Comparison Matrix

- **Ease of setup:** Option 5 (ChatGPT) > Option 3 (In-App GenAI) > Option 1 (Agentforce Apex) > Option 2 (Tableau Next) > Option 4 (LangGraph) > Option 6 (Claude API)
- **Analytical depth:** Option 4 (LangGraph) > Option 6 (Claude API) > Option 5 (ChatGPT) > Option 2 (Tableau Next) > Option 3 (In-App GenAI) > Option 1 (Agentforce Apex)
- **Agentic capability:** Option 4 > Option 2 > Option 6 > Option 5 > Option 1 > Option 3
- **Data governance:** Option 1 = Option 2 = Option 3 (on-platform, Trust Layer) > Option 4 = Option 5 = Option 6 (data leaves Salesforce)
- **Integration with Package Visualizer:** Option 3 > Option 1 > Option 2 > Option 4 > Option 5 > Option 6

---

## Recommendation

The approach depends on the goal:

- **"I want this inside Package Visualizer fast"** -- Go with **Option 3** (extend existing GenAI components with CSV parsing + Einstein Models API). This can be built in a few days.
- **"I want the best native Salesforce experience"** -- Go with **Option 2** (Tableau Next + Data 360). This is the platform's strategic direction for agentic analytics, and Concierge is purpose-built for this.
- **"I want the deepest analytical power"** -- Go with **Option 4** (LangGraph + Pandas) or **Option 5** (ChatGPT Code Interpreter) for unlimited Python-based analysis.
- **"I want a quick one-off analysis right now"** -- Go with **Option 5** (just upload the CSV to ChatGPT).
