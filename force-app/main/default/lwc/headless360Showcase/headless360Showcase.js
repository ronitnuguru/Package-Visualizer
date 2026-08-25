import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";
import AgentScriptCoachModal from "c/agentScriptCoachModal";
import { AGENT_SCRIPTS } from "c/agentScriptCatalog";
import { PACKAGE_VISUALIZER_APEX_TOOLS } from "./headless360ShowcaseAssets";

const SLACK_CONNECTION_HELP_URL =
  "https://slack.com/help/articles/30754346665747-Connect-Salesforce-and-Slack";
const CUSTOM_MCP_SERVER_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html";
const SLACKBOT_MCP_HELP_URL =
  "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP#add-an-mcp-server";
const PROMPT_TEMPLATE_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/prompt-builder.html";
const FLOW_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/flows.html";
const STANDARD_SERVER_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/servers-reference.html";

const APEX_TOOL_COLUMNS = [
  {
    label: "Apex Action",
    fieldName: "apiName",
    type: "text",
    wrapText: true
  },
  {
    label: "Purpose",
    fieldName: "description",
    type: "text",
    wrapText: true
  }
];

export default class Headless360Showcase extends LightningElement {
  agentforceConfiguration;
  agentScript = AGENT_SCRIPTS[0];
  activeAgentScriptSections = [this.agentScript.id];
  apexToolColumns = APEX_TOOL_COLUMNS;
  apexTools = PACKAGE_VISUALIZER_APEX_TOOLS;
  isLoadingAgentforceConfiguration = true;

  connectedCallback() {
    this.loadAgentforceConfiguration();
  }

  loadAgentforceConfiguration() {
    getAgentforceConfiguration()
      .then((configuration) => {
        this.agentforceConfiguration = configuration;
      })
      .catch(() => {
        this.agentforceConfiguration = {
          state: "UNCONFIGURED",
          message: "Agentforce configuration is unavailable."
        };
      })
      .finally(() => {
        this.isLoadingAgentforceConfiguration = false;
      });
  }

  get hasConfiguredAgent() {
    return (
      this.agentforceConfiguration?.state === "READY" &&
      Boolean(this.agentforceConfiguration.label) &&
      Boolean(this.agentforceConfiguration.developerName)
    );
  }

  openOrgPage(url) {
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.location.href = window.location.origin + url;
    }
  }

  navigateToHeadless360ShowcaseHelp() {
    window.open(CUSTOM_MCP_SERVER_HELP_URL, "_blank");
  }

  navigateToSlackSetup() {
    this.openOrgPage("/lightning/setup/SlackWorkspaces/home");
  }

  navigateToSlackConnectionHelp() {
    window.open(SLACK_CONNECTION_HELP_URL, "_blank");
  }

  navigateToCustomMcpServersSetup() {
    this.openOrgPage("/lightning/setup/McpServer/home");
  }

  navigateToCustomMcpServersHelp() {
    window.open(CUSTOM_MCP_SERVER_HELP_URL, "_blank");
  }

  navigateToSlackbotMcpHelp() {
    window.open(SLACKBOT_MCP_HELP_URL, "_blank");
  }

  navigateToPromptTemplateHelp() {
    window.open(PROMPT_TEMPLATE_HELP_URL, "_blank");
  }

  navigateToFlowHelp() {
    window.open(FLOW_HELP_URL, "_blank");
  }

  navigateToStandardServerHelp() {
    window.open(STANDARD_SERVER_HELP_URL, "_blank");
  }

  navigateToAgentforceStudio() {
    this.openOrgPage("/lightning/n/standard-AgentforceStudio?c__nav=agents");
  }

  handleAgentScriptSectionToggle(event) {
    this.activeAgentScriptSections = event.detail.openSections;
  }

  handleAgentScriptCoach() {
    if (!this.agentScript?.body) {
      return;
    }

    AgentScriptCoachModal.open({
      size: "large",
      scriptBody: this.agentScript.body,
      scriptLabel: this.agentScript.label,
      scriptHeader: `Agentforce Analysis - ${this.agentScript.label}`,
      scriptId: this.agentScript.id,
      scriptHash: this.agentScript.scriptHash,
      scriptManifest: this.agentScript.manifest,
      coachingEvidence: this.agentScript.coachingEvidence,
      publicChatSummary: this.agentScript.publicChatSummary
    });
  }

  handleCopyAgentScript() {
    if (!this.agentScript?.body || !navigator.clipboard?.writeText) {
      return;
    }

    navigator.clipboard
      .writeText(this.agentScript.body)
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "AgentScript copied",
            message: "The AgentScript was copied to the clipboard.",
            variant: "success"
          })
        );
      })
      .catch(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Unable to copy AgentScript",
            message: "Copy the AgentScript directly from the preview.",
            variant: "error"
          })
        );
      });
  }
}
