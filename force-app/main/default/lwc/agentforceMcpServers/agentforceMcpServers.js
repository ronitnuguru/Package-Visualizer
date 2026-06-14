import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  buildMcpSubagentBlock,
  buildToolActionBlock
} from "./mcpAgentScript.js";
import getMcpServers from "@salesforce/apexContinuation/PackageVisualizerCtrl.getMcpServers";

const MCP_LEARN_MORE_URL =
  "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register.htm&type=5";

export default class AgentforceMcpServers extends NavigationMixin(
  LightningElement
) {
  mcpServers = [];
  mcpLoading = false;
  mcpLoaded = false;
  mcpError = false;

  // The host renders this component lazily inside a lightning-tab, so the
  // continuation callout fires the first time the tab (and thus this component)
  // is shown — keeping it off the parent card's initial render.
  connectedCallback() {
    this.loadMcpServers();
  }

  get hasMcpServers() {
    return this.mcpServers && this.mcpServers.length > 0;
  }

  loadMcpServers() {
    if (this.mcpLoaded || this.mcpLoading) {
      return;
    }
    this.mcpLoading = true;
    this.mcpError = false;
    getMcpServers()
      .then((result) => {
        this.mcpServers = this.decorateMcpServers(result);
        this.mcpLoaded = true;
      })
      .catch((error) => {
        this.mcpError = true;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Couldn't load MCP servers",
            message:
              (error && error.body && error.body.message) ||
              "Confirm the Tooling API integration is configured, then try again.",
            variant: "error"
          })
        );
      })
      .finally(() => {
        this.mcpLoading = false;
      });
  }

  decorateMcpServers(servers) {
    return (servers || []).map((server) => ({
      ...server,
      agentScriptBody: buildMcpSubagentBlock(server),
      tools: (server.tools || []).map((tool) => ({
        ...tool,
        actionBlock: buildToolActionBlock(server, tool)
      }))
    }));
  }

  navigateToMcpSetup(event) {
    const serverId = event.currentTarget.dataset.serverId;
    const server = this.mcpServers.find((s) => s.id === serverId);
    if (!server || !server.setupUrl) {
      return;
    }
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: server.setupUrl
      }
    });
  }

  navigateToGenAiFunction(event) {
    const genAiFunctionId = event.currentTarget.dataset.genAiFunctionId;
    if (!genAiFunctionId) {
      return;
    }
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `/lightning/setup/AgentAssetLibrary/${genAiFunctionId}/editAction`
      }
    });
  }

  handleCopyMcpAgentScript(event) {
    // Copy the full subagent block (all wired tools) for this server.
    const serverId = event.currentTarget.dataset.serverId;
    const server = this.mcpServers.find((s) => s.id === serverId);
    if (!server || !server.agentScriptBody) {
      return;
    }
    this.copyTextToClipboard(server.agentScriptBody);
  }

  handleCopyMcpTool(event) {
    // Copy a single tool's action block.
    const serverId = event.currentTarget.dataset.serverId;
    const toolId = event.currentTarget.dataset.toolId;
    const server = this.mcpServers.find((s) => s.id === serverId);
    const tool = server && server.tools.find((t) => t.developerName === toolId);
    if (!tool || !tool.actionBlock) {
      return;
    }
    this.copyTextToClipboard(tool.actionBlock);
  }

  handleLearnMore() {
    window.open(MCP_LEARN_MORE_URL, "_blank");
  }

  copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Text copied to clipboard",
              variant: "success"
            })
          );
        })
        .catch((err) => {
          console.error("Failed to copy AgentScript:", err);
          this.fallbackCopyToClipboard(text);
        });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Text copied to clipboard",
          variant: "success"
        })
      );
    } catch (err) {
      console.error("Fallback copy to clipboard failed:", err);
    }
    document.body.removeChild(textArea);
  }
}
