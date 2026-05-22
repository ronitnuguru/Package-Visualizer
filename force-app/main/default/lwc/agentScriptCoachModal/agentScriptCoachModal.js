import { api } from "lwc";
import LightningModal from "lightning/modal";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";
import getTargetRecordId from "@salesforce/apex/PackageVisualizerCtrl.getTargetRecordId";

const AGENT_SCRIPT_COACH_SYSTEM_PROMPT = `You are an expert AgentScript Coach for Salesforce ISV partners. You analyze Agent Script DSL code and provide comprehensive coaching feedback using the official Agent Script scoring rubric and best practices.

AGENT SCRIPT LANGUAGE REFERENCE:
Agent Script operates in two phases: Phase 1 (Deterministic Resolution) executes top-to-bottom — evaluating if/else, running actions via "run", setting variables. The LLM is NOT involved yet. Phase 2 (LLM Reasoning) passes the resolved prompt to the LLM with available tools.
Key syntax: "->" means logic/deterministic instructions. "|" means prompt text sent to LLM. "@variables." references variables. "@actions." references actions. "@subagent." references subagents. "@outputs." references action outputs (ephemeral). "@utils." for utilities. "{!expr}" interpolates in prompts.
Block ordering (mandatory): system -> config -> variables -> connection -> knowledge -> language -> start_agent -> subagent blocks.
Required blocks: system, config, start_agent, at least one subagent.
Booleans: True/False (capitalized). Indentation: 4 spaces. Naming: snake_case.
Variable types: string, number, boolean, object, date, id, list[<type>]. Kinds: linked (read-only, external source), mutable (agent working memory), slot-fill (mutable with "..." default for LLM extraction).
Action targets: apex://<class>, flow://<flow_name>, prompt://<template_name>, generatePromptResponse://<template>, standardInvocableAction://<action>, externalService://<api.method>.

SCORING RUBRIC (85 points total):
1. Structure & Syntax (15 pts): Deduct for missing required blocks (system, config, start_agent, subagent), wrong block order, inconsistent indentation, unquoted strings, invalid field names.
2. Deterministic Logic (20 pts): Evaluate after_reasoning patterns for post-action routing, FSM transitions with no dead-end subagents, available when guards for security-sensitive actions, post-action checks at TOP of instructions.
3. Instruction Resolution (20 pts): Clear actionable instructions, procedural mode (->) where conditionals needed, literal mode (|) where static text suffices, variable injection ({!@variables.x}) where dynamic, conditional instructions based on state.
4. FSM Architecture (10 pts): Hub-and-spoke or verification gate pattern used correctly. Every subagent reachable. Every subagent has exit (transition or escalation). No orphan subagents. Start subagent routes correctly.
5. Action Configuration (10 pts): Proper Level 1 definitions with targets and I/O schemas. Correct Level 2 invocations with with/set. Slot-filling (...) for conversational inputs. Output capture into variables. Type mapping correct.
6. Deployment Readiness (10 pts): Valid config block. developer_name present. Linked variables for service agents (EndUserId, RoutableId, ContactId). Language block configured.

ANTI-PATTERNS (flag if found):
1. Actions without guiding instructions — LLM needs instructions about when/how to use actions.
2. Action loops — No "available when" gate means action stays available and LLM may call it repeatedly.
3. Post-action directives on utilities — @utils.transition has no outputs; "set" only works with @actions.
4. Expecting LLM to reason without deterministic context — Empty reasoning blocks with only actions.
5. Gate subagent transitions without defensive instructions — Router processes gate's triggering message in same turn.
6. Bare "transition to" in reasoning.actions — Must use @utils.transition to for LLM-chosen transitions.
7. @utils.transition to in directive blocks — Must use bare "transition to" in before_reasoning/after_reasoning.
8. Lowercase booleans — Must use True/False, not true/false.
9. Mutable variable without default — Runtime needs initial value.
10. Vague post-action instructions — Must name specific output fields, direct text response.

ARCHITECTURE PATTERNS:
- Hub-and-Spoke: Central agent_router routes to specialized spoke subagents. Each spoke has "back to hub" transition. Most common pattern.
- Verification Gate: Users pass through identity verification before accessing protected subagents. Uses available when guards.
- Post-Action Loop: Subagent re-resolves after action completes. Post-action checks at TOP of instructions trigger on re-resolution.
- Single Subagent: Agent serves one focused purpose with no routing needed.

ISV CONTEXT:
This agent is built by a Salesforce ISV partner. Additionally evaluate for:
- Cross-org compatibility (namespace prefixes on action targets)
- Package-friendly action targets (apex:// with namespace)
- Variable visibility appropriateness for external consumers
- Scalability considerations for subscriber orgs
- Custom Lightning Types usage for complex I/O

OUTPUT: Return ONLY a single valid JSON object — no prose, no markdown fences, no preamble. Use this exact schema:
{
  "overview": {
    "summary": "2-3 sentence high-level description of what this agent does",
    "agentType": "Employee | Service",
    "architecturePattern": "Hub-and-Spoke | Verification Gate | Post-Action Loop | Single Subagent",
    "purpose": "agent's business purpose for ISVs"
  },
  "subagents": [{"name": "string", "label": "string", "purpose": "string", "reasoningMode": "Deterministic | Prompt | Mixed", "hasAfterReasoning": true/false, "routingAnalysis": "how it connects to other subagents", "suggestions": ["improvement suggestion"]}],
  "actions": [{"name": "string", "label": "string", "target": "apex:// or flow:// or prompt:// etc", "parentSubagent": "string", "hasAvailableWhen": true/false, "inputQuality": "Good | Needs Improvement | Missing", "outputQuality": "Good | Needs Improvement | Missing", "suggestions": ["improvement suggestion"]}],
  "variables": [{"name": "string", "type": "string", "kind": "linked | mutable | slot-fill", "visibility": "External | Internal", "concern": "string or null"}],
  "improvements": [{"priority": "High | Medium | Low", "category": "Architecture | Instructions | Actions | Variables | Deployment", "title": "short title", "description": "actionable description", "codeSnippet": "optional corrected code or null"}],
  "scores": {
    "structureSyntax": {"score": 0, "max": 15, "notes": "brief explanation"},
    "deterministicLogic": {"score": 0, "max": 20, "notes": "brief explanation"},
    "instructionResolution": {"score": 0, "max": 20, "notes": "brief explanation"},
    "fsmArchitecture": {"score": 0, "max": 10, "notes": "brief explanation"},
    "actionConfiguration": {"score": 0, "max": 10, "notes": "brief explanation"},
    "deploymentReadiness": {"score": 0, "max": 10, "notes": "brief explanation"},
    "overall": 0
  }
}`;

export default class AgentScriptCoachModal extends LightningModal {
  @api scriptBody;
  @api scriptLabel;
  @api scriptHeader;

  response;
  displayResult = false;
  displaySpinner = true;
  displayExtensionIllustration = false;
  displayModels = false;
  displayEditPrompt = false;

  userPrompt;
  systemPrompt;

  modelsValue = "sfdc_ai__DefaultBedrockAnthropicClaude45Opus";
  providerValue = "Anthropic";

  get modelProviderOptions() {
    return [
      { label: "OpenAI", value: "OpenAI" },
      { label: "Anthropic", value: "Anthropic" },
      { label: "Google", value: "Google" },
      { label: "Amazon", value: "Amazon" },
      { label: "NVIDIA", value: "NVIDIA" }
    ];
  }

  get allModelsTypeOptions() {
    return [
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 5.5 (Beta)",
        value: "sfdc_ai__DefaultGPT55"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 5.4 Mini (Beta)",
        value: "sfdc_ai__DefaultGPT54Mini"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 5.4",
        value: "sfdc_ai__DefaultGPT54"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 5.2",
        value: "sfdc_ai__DefaultGPT52"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 5.1",
        value: "sfdc_ai__DefaultGPT51"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 5",
        value: "sfdc_ai__DefaultGPT5"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 5 Mini",
        value: "sfdc_ai__DefaultGPT5Mini"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 4.1",
        value: "sfdc_ai__DefaultGPT41"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 4.1 Mini",
        value: "sfdc_ai__DefaultGPT41Mini"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 4 Omni (GPT-4o)",
        value: "sfdc_ai__DefaultGPT4Omni"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI GPT 4 Omni Mini (GPT-4o mini)",
        value: "sfdc_ai__DefaultGPT4OmniMini"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI O4 Mini",
        value: "sfdc_ai__DefaultO4Mini"
      },
      {
        provider: "OpenAI",
        label: "OpenAI / Azure OpenAI O3",
        value: "sfdc_ai__DefaultO3"
      },
      {
        provider: "Anthropic",
        label: "Anthropic Claude Opus 4.7 on Amazon Bedrock (Beta)",
        value: "sfdc_ai__DefaultBedrockAnthropicClaude47Opus"
      },
      {
        provider: "Anthropic",
        label: "Anthropic Claude Opus 4.6 on Amazon Bedrock (Beta)",
        value: "sfdc_ai__DefaultBedrockAnthropicClaude46Opus"
      },
      {
        provider: "Anthropic",
        label: "Anthropic Claude Opus 4.5 on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockAnthropicClaude45Opus"
      },
      {
        provider: "Anthropic",
        label: "Anthropic Claude Sonnet 4.6 on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockAnthropicClaude46Sonnet"
      },
      {
        provider: "Anthropic",
        label: "Anthropic Claude Sonnet 4.5 on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockAnthropicClaude45Sonnet"
      },
      {
        provider: "Anthropic",
        label: "Anthropic Claude Sonnet 4 on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockAnthropicClaude4Sonnet"
      },
      {
        provider: "Anthropic",
        label: "Anthropic Claude Haiku 4.5 on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockAnthropicClaude45Haiku"
      },
      {
        provider: "Google",
        label: "Vertex AI (Google) Gemini 3.1 Pro (Beta)",
        value: "sfdc_ai__DefaultVertexAIGeminiPro31"
      },
      {
        provider: "Google",
        label: "Vertex AI (Google) Gemini 3.1 Flash Lite (Beta)",
        value: "sfdc_ai__DefaultVertexAIGemini31FlashLite"
      },
      {
        provider: "Google",
        label: "Vertex AI (Google) Gemini 3 Flash",
        value: "sfdc_ai__DefaultVertexAIGemini30Flash"
      },
      {
        provider: "Google",
        label: "Vertex AI (Google) Gemini 2.5 Pro",
        value: "sfdc_ai__DefaultVertexAIGeminiPro25"
      },
      {
        provider: "Google",
        label: "Vertex AI (Google) Gemini 2.5 Flash",
        value: "sfdc_ai__DefaultVertexAIGemini25Flash001"
      },
      {
        provider: "Google",
        label: "Vertex AI (Google) Gemini 2.5 Flash Lite",
        value: "sfdc_ai__DefaultVertexAIGemini25FlashLite001"
      },
      {
        provider: "Amazon",
        label: "Amazon Nova Pro on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockAmazonNovaPro"
      },
      {
        provider: "Amazon",
        label: "Amazon Nova Lite on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockAmazonNovaLite"
      },
      {
        provider: "NVIDIA",
        label: "NVIDIA Nemotron 3 Nano 30B (Beta) on Amazon Bedrock",
        value: "sfdc_ai__DefaultBedrockNvidiaNemotronNano330b"
      }
    ];
  }

  get modelsTypeOptions() {
    return this.allModelsTypeOptions
      .filter((model) => model.provider === this.providerValue)
      .map(({ label, value }) => ({ label, value }));
  }

  connectedCallback() {
    this.userPrompt = this.scriptBody;
    this.systemPrompt = AGENT_SCRIPT_COACH_SYSTEM_PROMPT;
    this.handleGenerate();
  }

  async handleGenerate() {
    this.displaySpinner = true;
    this.displayResult = false;
    this.displayExtensionIllustration = false;
    try {
      this.response = await invokePromptAndUserModelsGenAi({
        className: "AgentGenAiController",
        methodName: "createChatGeneration",
        modelName: this.modelsValue,
        userPrompt: this.userPrompt,
        systemPrompt: this.systemPrompt
      });
      this.displayResult = true;
    } catch (error) {
      console.error("AgentScript Coach generation failed:", error);
      this.displayExtensionIllustration = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: error.statusText || "AgentScript Coach Failed",
          message:
            error.body?.message || "Unable to generate coaching analysis",
          variant: "error"
        })
      );
    } finally {
      this.displaySpinner = false;
    }
  }

  get parsedResponse() {
    if (!this.response) return null;
    try {
      const cleaned = this.response.replace(/```json\s*|\s*```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      parsed.overallScoreClass = this.getScoreClass(parsed.scores?.overall);
      parsed.overallScoreLabel = this.getScoreLabel(parsed.scores?.overall);
      parsed.overallProgressBarClass = this.getProgressBarClass(
        parsed.scores?.overall
      );
      if (parsed.scores) {
        const scoreKeys = [
          "structureSyntax",
          "deterministicLogic",
          "instructionResolution",
          "fsmArchitecture",
          "actionConfiguration",
          "deploymentReadiness"
        ];
        scoreKeys.forEach((key) => {
          if (parsed.scores[key]) {
            parsed.scores[key].percentage = Math.round(
              (parsed.scores[key].score / parsed.scores[key].max) * 100
            );
            parsed.scores[
              key
            ].barStyle = `width: ${parsed.scores[key].percentage}%`;
            parsed.scores[key].progressBarClass = this.getProgressBarClass(
              parsed.scores[key].percentage
            );
          }
        });
      }
      if (parsed.improvements) {
        parsed.improvements = parsed.improvements.map((item) => ({
          ...item,
          priorityClass: this.getPriorityClass(item.priority),
          key: `${item.category}-${item.title}`
        }));
      }
      if (parsed.subagents) {
        parsed.subagents = parsed.subagents.map((item, idx) => ({
          ...item,
          key: `subagent-${idx}`,
          hasSuggestions: item.suggestions && item.suggestions.length > 0
        }));
      }
      if (parsed.actions) {
        parsed.actions = parsed.actions.map((item, idx) => {
          const nav = this._parseActionTarget(item.target);
          return {
            ...item,
            key: `action-${idx}`,
            hasSuggestions: item.suggestions && item.suggestions.length > 0,
            iconName: this._resolveActionIcon(item.target),
            inputQualityClass: this.getQualityClass(item.inputQuality),
            outputQualityClass: this.getQualityClass(item.outputQuality),
            isNavigable: nav.isNavigable,
            parsedTargetType: nav.targetType,
            parsedNamespace: nav.namespace,
            parsedName: nav.name
          };
        });
      }
      if (parsed.variables) {
        parsed.variables = parsed.variables.map((item, idx) => ({
          ...item,
          key: `var-${idx}`,
          hasConcern: !!item.concern
        }));
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse AgentScript Coach response:", e);
      return { rawResponse: this.response };
    }
  }

  get overallProgressStyle() {
    const score = this.parsedResponse?.scores?.overall ?? 0;
    return `width: ${score}%`;
  }

  get hasSubagents() {
    return this.parsedResponse?.subagents?.length > 0;
  }

  get hasActions() {
    return this.parsedResponse?.actions?.length > 0;
  }

  get hasVariables() {
    return this.parsedResponse?.variables?.length > 0;
  }

  get hasImprovements() {
    return this.parsedResponse?.improvements?.length > 0;
  }

  get hasScores() {
    return !!this.parsedResponse?.scores;
  }

  get scoreBreakdown() {
    const scores = this.parsedResponse?.scores;
    if (!scores) return [];
    return [
      {
        key: "structureSyntax",
        label: "Structure & Syntax",
        ...scores.structureSyntax
      },
      {
        key: "deterministicLogic",
        label: "Deterministic Logic",
        ...scores.deterministicLogic
      },
      {
        key: "instructionResolution",
        label: "Instruction Resolution",
        ...scores.instructionResolution
      },
      {
        key: "fsmArchitecture",
        label: "FSM Architecture",
        ...scores.fsmArchitecture
      },
      {
        key: "actionConfiguration",
        label: "Action Configuration",
        ...scores.actionConfiguration
      },
      {
        key: "deploymentReadiness",
        label: "Deployment Readiness",
        ...scores.deploymentReadiness
      }
    ];
  }

  get isRawFallback() {
    return (
      this.parsedResponse &&
      this.parsedResponse.rawResponse &&
      !this.parsedResponse.overview
    );
  }

  get canCopyMarkdown() {
    return (
      !this.displaySpinner &&
      !!this.parsedResponse &&
      !this.isRawFallback &&
      !!this.parsedResponse.overview
    );
  }

  async handleCopyMarkdown() {
    try {
      const md = this.buildMarkdown();
      await navigator.clipboard.writeText(md);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Markdown Copied",
          message:
            "Coaching report copied to clipboard. Paste into your AI assistant to iterate the AgentScript.",
          variant: "success"
        })
      );
    } catch (error) {
      console.error("Copy markdown failed:", error);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Copy failed",
          message: error.message || "Unable to copy markdown to clipboard",
          variant: "error"
        })
      );
    }
  }

  buildMarkdown() {
    const p = this.parsedResponse;
    const lines = [];

    lines.push(
      `# AgentScript Coach Report — ${this.scriptLabel || "Untitled"}`
    );
    lines.push("");

    lines.push("## Iteration goal for the AI assistant");
    lines.push("");
    lines.push(
      "You are an expert AgentScript developer. Below is an AgentScript and a structured coaching analysis from the Agent Script scoring rubric. Rewrite the script to address all High-priority improvements first, then Medium, then Low. Preserve block ordering (system → config → variables → connection → knowledge → language → start_agent → subagents), 4-space indentation, snake_case, and capitalized booleans (True/False). Return only the improved AgentScript inside a single code block."
    );
    lines.push("");

    lines.push("## Original AgentScript");
    lines.push("");
    lines.push("```agentscript");
    lines.push(this.scriptBody || "");
    lines.push("```");
    lines.push("");

    if (p.overview) {
      lines.push("## Overview");
      lines.push("");
      lines.push(`- **Agent type:** ${p.overview.agentType || "—"}`);
      lines.push(
        `- **Architecture pattern:** ${p.overview.architecturePattern || "—"}`
      );
      lines.push(`- **Summary:** ${p.overview.summary || "—"}`);
      lines.push(`- **Purpose:** ${p.overview.purpose || "—"}`);
      lines.push("");
    }

    if (p.scores) {
      const overall = p.scores.overall ?? 0;
      const label = p.overallScoreLabel ? ` — ${p.overallScoreLabel}` : "";
      lines.push(`## Overall score: ${overall}/100${label}`);
      lines.push("");
      lines.push("### Score breakdown");
      lines.push("");
      const categories = [
        { key: "structureSyntax", label: "Structure & Syntax" },
        { key: "deterministicLogic", label: "Deterministic Logic" },
        { key: "instructionResolution", label: "Instruction Resolution" },
        { key: "fsmArchitecture", label: "FSM Architecture" },
        { key: "actionConfiguration", label: "Action Configuration" },
        { key: "deploymentReadiness", label: "Deployment Readiness" }
      ];
      categories.forEach((cat) => {
        const c = p.scores[cat.key];
        if (c) {
          const notes = c.notes ? ` — ${c.notes}` : "";
          lines.push(`- **${cat.label}:** ${c.score}/${c.max}${notes}`);
        }
      });
      lines.push("");
    }

    if (p.subagents && p.subagents.length) {
      lines.push("## Subagents");
      lines.push("");
      p.subagents.forEach((s) => {
        const heading = s.label || s.name || "Subagent";
        const nameSuffix = s.name ? ` (\`${s.name}\`)` : "";
        lines.push(`### ${heading}${nameSuffix}`);
        lines.push("");
        lines.push(`- **Purpose:** ${s.purpose || "—"}`);
        lines.push(`- **Reasoning mode:** ${s.reasoningMode || "—"}`);
        lines.push(`- **Routing:** ${s.routingAnalysis || "—"}`);
        if (s.suggestions && s.suggestions.length) {
          lines.push("- **Suggestions:**");
          s.suggestions.forEach((sug) => lines.push(`  - ${sug}`));
        }
        lines.push("");
      });
    }

    if (p.actions && p.actions.length) {
      lines.push("## Actions");
      lines.push("");
      p.actions.forEach((a) => {
        const heading = a.label || a.name || "Action";
        const nameSuffix = a.name ? ` (\`${a.name}\`)` : "";
        lines.push(`### ${heading}${nameSuffix}`);
        lines.push("");
        lines.push(`- **Target:** \`${a.target || "—"}\``);
        lines.push(`- **Parent subagent:** ${a.parentSubagent || "—"}`);
        lines.push(
          `- **Gated (\`available when\`):** ${
            a.hasAvailableWhen ? "Yes" : "No"
          }`
        );
        lines.push(`- **Input quality:** ${a.inputQuality || "—"}`);
        lines.push(`- **Output quality:** ${a.outputQuality || "—"}`);
        if (a.suggestions && a.suggestions.length) {
          lines.push("- **Suggestions:**");
          a.suggestions.forEach((sug) => lines.push(`  - ${sug}`));
        }
        lines.push("");
      });
    }

    if (p.variables && p.variables.length) {
      lines.push("## Variables");
      lines.push("");
      lines.push("| Name | Type | Kind | Visibility | Concern |");
      lines.push("|---|---|---|---|---|");
      p.variables.forEach((v) => {
        const concern = v.concern ? v.concern : "—";
        lines.push(
          `| \`${v.name || "—"}\` | ${v.type || "—"} | ${v.kind || "—"} | ${
            v.visibility || "—"
          } | ${concern} |`
        );
      });
      lines.push("");
    }

    if (p.improvements && p.improvements.length) {
      lines.push("## Improvements (priority-ordered)");
      lines.push("");
      const rank = { high: 0, medium: 1, low: 2 };
      const sorted = [...p.improvements].sort((a, b) => {
        const ar = rank[(a.priority || "").toLowerCase()] ?? 3;
        const br = rank[(b.priority || "").toLowerCase()] ?? 3;
        return ar - br;
      });
      sorted.forEach((imp) => {
        const pri = (imp.priority || "UNSPECIFIED").toUpperCase();
        const cat = imp.category || "General";
        lines.push(`### [${pri}] [${cat}] ${imp.title || ""}`.trimEnd());
        lines.push("");
        if (imp.description) {
          lines.push(imp.description);
          lines.push("");
        }
        if (imp.codeSnippet) {
          lines.push("```agentscript");
          lines.push(imp.codeSnippet);
          lines.push("```");
          lines.push("");
        }
      });
    }

    return (
      lines
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trimEnd() + "\n"
    );
  }

  getScoreClass(score) {
    if (score >= 90) return "score-green";
    if (score >= 75) return "score-yellow";
    if (score >= 60) return "score-orange";
    return "score-red";
  }

  getScoreLabel(score) {
    if (score >= 90) return "Production-Ready";
    if (score >= 75) return "Good with Minor Issues";
    if (score >= 60) return "Needs Work";
    return "Major Rework Required";
  }

  getProgressThemeClass(score) {
    if (score >= 75) return "slds-theme_success";
    if (score >= 60) return "slds-theme_warning";
    return "slds-theme_error";
  }

  getProgressBarClass(score) {
    return `slds-progress-bar__value ${this.getProgressThemeClass(score)}`;
  }

  getPriorityClass(priority) {
    switch ((priority || "").toLowerCase()) {
      case "high":
        return "slds-theme_error";
      case "medium":
        return "slds-theme_warning";
      case "low":
        return "slds-theme_success";
      default:
        return "";
    }
  }

  getQualityClass(quality) {
    switch ((quality || "").toLowerCase()) {
      case "good":
        return "slds-theme_success";
      case "needs improvement":
        return "slds-theme_warning";
      case "missing":
        return "slds-theme_error";
      default:
        return "";
    }
  }

  handleProviderTypeChange(event) {
    this.providerValue = event.detail.value;
    const selectedProviderModels = this.modelsTypeOptions;
    this.modelsValue = selectedProviderModels.length
      ? selectedProviderModels[0].value
      : null;
  }

  handleModelsTypeChange(event) {
    this.modelsValue = event.detail.value;
  }

  handleReanalyze() {
    this.displayEditPrompt = false;
    this.displayModels = false;
    this.handleGenerate();
  }

  handleShowModels() {
    this.displayModels = !this.displayModels;
  }

  handleShowEditPrompt() {
    this.displayEditPrompt = !this.displayEditPrompt;
  }

  handleUserPromptChange(event) {
    this.userPrompt = event.target.value;
  }

  handleSystemPromptChange(event) {
    this.systemPrompt = event.target.value;
  }

  handleBack() {
    this.displayModels = false;
    this.displayEditPrompt = false;
  }

  async handleNavigateToTarget(event) {
    const targetType = event.currentTarget.dataset.targetType;
    const name = event.currentTarget.dataset.name;
    const namespace = event.currentTarget.dataset.namespace || null;
    try {
      const recordId = await getTargetRecordId({ targetType, name, namespace });
      let url;
      if (targetType === "apex") {
        url = `/lightning/setup/ApexClasses/page?address=%2F${recordId}`;
      } else if (targetType === "flow") {
        url = `/builder_platform_interaction/flowBuilder.app?flowId=${recordId}`;
      }
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Navigation Error",
          message:
            error.body?.message || `Unable to navigate to ${targetType} target`,
          variant: "error"
        })
      );
    }
  }

  handleCancel() {
    this.close();
  }

  _parseActionTarget(target) {
    if (!target)
      return {
        isNavigable: false,
        targetType: null,
        namespace: null,
        name: null
      };
    let targetType = null;
    let remainder = null;
    if (target.startsWith("apex://")) {
      targetType = "apex";
      remainder = target.slice("apex://".length);
    } else if (target.startsWith("flow://")) {
      targetType = "flow";
      remainder = target.slice("flow://".length);
    }
    if (!targetType || !remainder) {
      return {
        isNavigable: false,
        targetType: null,
        namespace: null,
        name: null
      };
    }
    const separatorIndex = remainder.indexOf("__");
    let namespace = null;
    let name = remainder;
    if (separatorIndex > 0) {
      namespace = remainder.substring(0, separatorIndex);
      name = remainder.substring(separatorIndex + 2);
    }
    return { isNavigable: true, targetType, namespace, name };
  }

  _resolveActionIcon(target) {
    if (!target) return "standard:invocable_action";
    if (target.startsWith("apex")) return "standard:apex";
    if (target.startsWith("flow")) return "standard:flow";
    if (target.startsWith("generatePromptResponse"))
      return "standard:prompt_builder";
    return "standard:invocable_action";
  }
}
