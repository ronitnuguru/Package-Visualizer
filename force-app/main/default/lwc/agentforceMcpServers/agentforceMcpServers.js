import { LightningElement } from "lwc";
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

export default class AgentforceMcpServers extends LightningElement {
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
    // Open the tab now, while the click gesture is live; the Apex lookup that
    // follows is async and would otherwise leave window.open popup-blocked.
    const tab = window.open("", "_blank");
    (async () => {
      await getNamespacePermSetId({
        label: "Package_Visualizer_MCP_Registration",
        namespace: "pkgviz"
      })
        .then((result) => {
          this.openOrgPage(
            `/lightning/setup/PermSets/${result}/PermissionSetAssignment/home`,
            tab
          );
        })
        .catch((error) => {
          console.error(error);
          this.openOrgPage("/lightning/setup/PermSets/home", tab);
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

  // Opens an in-org page in a new browser tab. The new tab must be opened
  // synchronously inside the originating click handler so it inherits the
  // browser's user-activation gesture. If we waited for an Apex call to resolve
  // before calling window.open, the gesture would be gone and the popup blocker
  // would force the page to load in the current window instead of a new tab.
  // Callers that do async work before navigating open the blank tab themselves
  // and pass it in (a Window exposes a boolean `closed`; a click Event does not).
  openOrgPage(url, existingTab) {
    const reuseTab = existingTab && typeof existingTab.closed === "boolean";
    const newTab = reuseTab ? existingTab : window.open("", "_blank");
    if (!newTab) {
      return;
    }
    // Internal Setup paths are relative to this org's Lightning domain; loading
    // the absolute same-origin URL in the tab triggers a normal Lightning route
    // (same as bookmarking the page). We deliberately do NOT route internal
    // links through NavigationMixin's standard__webPage type — for a relative
    // path it generates a /lightning/webpage/<encoded> "External Web Page"
    // wrapper that renders blank instead of the real Setup page.
    newTab.location.href = url.startsWith("http")
      ? url
      : window.location.origin + url;
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
