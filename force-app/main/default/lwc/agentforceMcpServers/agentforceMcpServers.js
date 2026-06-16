import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  buildMcpSubagentBlock,
  buildToolActionBlock
} from "./mcpAgentScript.js";
import getMcpServers from "@salesforce/apexContinuation/PackageVisualizerCtrl.getMcpServers";
import getNamespacePermSetId from "@salesforce/apex/PackageVisualizerCtrl.getNamespacePermSetId";

const MCP_LEARN_MORE_URL =
  "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register.htm&type=5";

const MANAGED_PACKAGE_VERSION_ID = "04tRh000001bSUbIAM";

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
    this.openOrgPage(server.setupUrl);
  }

  navigateToGenAiFunction(event) {
    const genAiFunctionId = event.currentTarget.dataset.genAiFunctionId;
    if (!genAiFunctionId) {
      return;
    }
    this.openOrgPage(
      `/lightning/setup/AgentAssetLibrary/${genAiFunctionId}/editAction`
    );
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

  navigateToMcpRegistrationPermSet() {
    (async () => {
      await getNamespacePermSetId({
        label: "Package_Visualizer_MCP_Registration",
        namespace: "pkgviz"
      })
        .then((result) => {
          this.openOrgPage(
            `/lightning/setup/PermSets/${result}/PermissionSetAssignment/home`
          );
        })
        .catch((error) => {
          console.error(error);
          this.openOrgPage("/lightning/setup/PermSets/home");
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Couldn't open the permission set",
              message:
                (error && error.body && error.body.message) ||
                "Confirm the Package_Visualizer_MCP_Registration permission set is installed, then try again.",
              variant: "error"
            })
          );
        });
    })();
  }

  // Opens an in-org page in a new browser tab. Under Lightning Web Security,
  // window.open only accepts URLs produced by the navigation service; a
  // manually built URL (e.g. window.location.origin + path) is rejected as a
  // "disallowed endpoint". So we resolve the URL via NavigationMixin.GenerateUrl
  // first, then open it in a new tab. External (http) links are already
  // allowlisted and can be opened directly.
  openOrgPage(url) {
    if (url.startsWith("http")) {
      window.open(url, "_blank");
      return;
    }
    this[NavigationMixin.GenerateUrl]({
      type: "standard__webPage",
      attributes: { url }
    })
      .then((generatedUrl) => {
        window.open(generatedUrl, "_blank");
      })
      .catch((error) => {
        console.error(error);
        this[NavigationMixin.Navigate]({
          type: "standard__webPage",
          attributes: { url }
        });
      });
  }

  handleExtensionInstall() {
    window.open(
      `/packaging/installPackage.apexp?p0=${MANAGED_PACKAGE_VERSION_ID}`,
      "_blank"
    );
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
