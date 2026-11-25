import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";
import AgentScriptCoachModal from "c/agentScriptCoachModal";
import { AGENT_SCRIPTS } from "c/agentScriptCatalog";
import { PACKAGE_VISUALIZER_APEX_TOOLS } from "./headless360ShowcaseAssets";

const HEADLESS_360_HELP_URL =
  "https://developer.salesforce.com/developer-centers/headless-360";
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
  activeClientTab = "slack";
  provisioningBusy = false;
  provisioningSnapshot;
  provisioningLoad;

  handleProvisioningLoad(event) {
    this.provisioningSnapshot = undefined;
    this.provisioningLoad = event.detail;
    this.notifyProvisioningStatus(false);
  }

  handleProvisioningSnapshot(event) {
    this.provisioningSnapshot = event.detail;
    this.provisioningLoad = undefined;
    const { state } = event.detail;
    this.notifyProvisioningStatus(
      Boolean(state?.loaded && state.serverId && !state.issues?.length)
    );
  }

  notifyProvisioningStatus(ready) {
    this.dispatchEvent(
      new CustomEvent("provisioningstatuschange", { detail: { ready } })
    );
  }

  handleProvisioningChange(event) {
    this.dispatchEvent(
      new CustomEvent("provisioningchange", { detail: event.detail })
    );
  }

  handleProvisioningBusyChange(event) {
    this.provisioningBusy = event.detail.busy;
    if (this.provisioningBusy) this.notifyProvisioningStatus(false);
    this.dispatchEvent(
      new CustomEvent("provisioningbusychange", { detail: event.detail })
    );
  }

  get isSlackTab() {
    return this.activeClientTab === "slack";
  }
  get isClaudeTab() {
    return this.activeClientTab === "claude";
  }
  get isChatgptTab() {
    return this.activeClientTab === "chatgpt";
  }
  get isCursorTab() {
    return this.activeClientTab === "cursor";
  }
  get hideSlack() {
    return !this.isSlackTab;
  }
  get hideClaude() {
    return !this.isClaudeTab;
  }
  get hideChatgpt() {
    return !this.isChatgptTab;
  }
  get hideCursor() {
    return !this.isCursorTab;
  }
  get slackTabIndex() {
    return this.isSlackTab ? 0 : -1;
  }
  get claudeTabIndex() {
    return this.isClaudeTab ? 0 : -1;
  }
  get chatgptTabIndex() {
    return this.isChatgptTab ? 0 : -1;
  }
  get cursorTabIndex() {
    return this.isCursorTab ? 0 : -1;
  }
  get slackTabClass() {
    return this.tabClass(this.isSlackTab);
  }
  get claudeTabClass() {
    return this.tabClass(this.isClaudeTab);
  }
  get chatgptTabClass() {
    return this.tabClass(this.isChatgptTab);
  }
  get cursorTabClass() {
    return this.tabClass(this.isCursorTab);
  }

  tabClass(selected) {
    return `slds-tabs_scoped__item c-client-tab-item${
      selected ? " slds-is-active c-client-tab-active" : ""
    }`;
  }

  handleClientTabClick(event) {
    if (this.provisioningBusy) return;
    this.activeClientTab = event.currentTarget.dataset.tab;
  }

  handleClientTabKeydown(event) {
    if (this.provisioningBusy) return;
    const tabs = ["slack", "claude", "chatgpt", "cursor"];
    let index = tabs.indexOf(this.activeClientTab);
    if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      index = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = tabs.length - 1;
    else return;
    event.preventDefault();
    this.activeClientTab = tabs[index];
    this.template.querySelector(`[data-tab="${tabs[index]}"]`).focus();
  }
  agentforceConfiguration;
  agentScript = AGENT_SCRIPTS[0];
  activeAgentScriptSections = [this.agentScript.id];
  apexToolColumns = APEX_TOOL_COLUMNS;
  apexTools = PACKAGE_VISUALIZER_APEX_TOOLS;
  isLoadingAgentforceConfiguration = true;

  // Legacy self-service tab bindings remain below for the archived markup.
  // Agent discovery is no longer loaded for the provisioning experience.

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
    window.open(HEADLESS_360_HELP_URL, "_blank");
  }

  navigateToSlackSetup() {
    this.openOrgPage("/lightning/setup/SlackWorkspaces/home");
  }

  navigateToSlackConnectionHelp() {
    window.open(SLACK_CONNECTION_HELP_URL, "_blank");
  }

  navigateToExternalClientApps() {
    this.openOrgPage("/lightning/setup/ManageExternalClientApplication/home");
  }

  navigateToCustomMcpServersHelp() {
    window.open(CUSTOM_MCP_SERVER_HELP_URL, "_blank");
  }

  navigateToExternalClientAppHelp() {
    window.open(
      "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html",
      "_blank"
    );
  }

  navigateToEcaSecurityHelp() {
    window.open(
      "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html#enhance-security-for-production",
      "_blank"
    );
  }

  navigateToClaudeHelp() {
    window.open(
      "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/claude.html",
      "_blank"
    );
  }

  navigateToChatGPTHelp() {
    window.open(
      "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/chatgpt.html",
      "_blank"
    );
  }

  navigateToCursorHelp() {
    window.open(
      "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/cursor.html",
      "_blank"
    );
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
