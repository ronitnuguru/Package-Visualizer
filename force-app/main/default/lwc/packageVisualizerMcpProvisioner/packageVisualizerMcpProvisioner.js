import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getState from "@salesforce/apex/PackageVisualizerMcpController.getProvisioningState";
import createServer from "@salesforce/apex/PackageVisualizerMcpController.createServer";

export default class PackageVisualizerMcpProvisioner extends LightningElement {
  @api initialSnapshot;
  @api initialLoad;
  state;
  busy = false;
  error;
  connectedCallback() {
    if (this.initialSnapshot) {
      this.state = this.initialSnapshot.state;
      this.error = this.initialSnapshot.error;
    } else if (this.initialLoad) this.loadState(this.initialLoad);
    else this.refresh();
  }
  @api
  async refresh() {
    if (this.busy) return;
    const pending = getState();
    this.dispatchEvent(
      new CustomEvent("provisioningload", { detail: pending })
    );
    await this.loadState(pending);
  }
  async loadState(pending) {
    this.busy = true;
    this.error = undefined;
    try {
      this.state = await pending;
    } catch (error) {
      this.state = undefined;
      this.error = this.message(error);
    } finally {
      this.busy = false;
      this.notifySnapshot();
    }
  }
  get showActions() {
    return !this.busy;
  }
  get showCreate() {
    return this.state?.loaded && !this.hasServer;
  }
  get createDisabled() {
    return !this.state?.canCreate;
  }
  get hasServer() {
    return Boolean(this.state?.serverId);
  }
  get status() {
    return this.state?.active ? "Active" : "Inactive";
  }
  get showTools() {
    return !this.busy && this.state?.loaded && this.hasServer;
  }
  get issues() {
    return this.busy ? [] : [...new Set(this.state?.issues || [])];
  }
  get assetTabs() {
    const groups = [
      {
        value: "MCP_TOOL",
        label: "Tools",
        icon: "standard:apex",
        empty: "No tools are configured for this server."
      },
      {
        value: "MCP_PROMPT",
        label: "Prompts",
        icon: "standard:prompt_builder",
        empty: "No prompts are configured for this server."
      }
    ];
    const assets = (this.state?.assets || []).map((asset) => {
      const annotations = asset.annotations || {};
      const hints = [];
      if (annotations.readOnlyHint === true) hints.push("Read Only");
      if (annotations.readOnlyHint === false) hints.push("Changes Data");
      if (annotations.destructiveHint === true) hints.push("Destructive");
      if (annotations.idempotentHint === true) hints.push("Idempotent");
      return {
        ...asset,
        key: asset.id,
        label: asset.label || asset.name,
        category: asset.kind,
        hints: hints.map((label) => ({
          label,
          className: `slds-var-m-right_x-small slds-var-m-bottom_xx-small ${
            label === "Destructive" ? "slds-theme_error" : "slds-theme_inverse"
          }`
        }))
      };
    });
    return groups.map((group) => {
      const rows = assets.filter((asset) => asset.category === group.value);
      return { ...group, assets: rows, hasAssets: rows.length > 0 };
    });
  }
  get setupUrl() {
    return this.hasServer
      ? `/lightning/setup/McpServer/${this.state.serverId}/view?setup__source=PLATFORM_CUSTOM_MCP_SERVER`
      : undefined;
  }

  handleViewInSetup() {
    if (!this.hasServer || this.busy) return;
    const tab = window.open("", "_blank");
    if (tab) tab.location.href = window.location.origin + this.setupUrl;
  }

  async handleCopyServerUrl() {
    if (!this.state?.serverUrl) return;
    try {
      await navigator.clipboard.writeText(this.state.serverUrl);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Copied",
          message: "Server URL copied to clipboard.",
          variant: "success"
        })
      );
    } catch {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Unable to copy Server URL",
          message: "Select the Server URL and copy it manually.",
          variant: "error"
        })
      );
    }
  }

  async handleCreate() {
    if (this.busy || !this.showCreate || this.createDisabled) return;
    this.busy = true;
    this.error = undefined;
    this.dispatchEvent(
      new CustomEvent("provisioningbusychange", { detail: { busy: true } })
    );
    try {
      this.state = await createServer();
      this.dispatchEvent(
        new CustomEvent("provisioningchange", {
          detail: { serverId: this.state.serverId, active: this.state.active }
        })
      );
    } catch (error) {
      this.error = this.message(error);
      try {
        this.state = await getState();
      } catch (refreshError) {
        this.state = undefined;
        this.error += ` ${this.message(refreshError)}`;
      }
    } finally {
      this.busy = false;
      this.notifySnapshot();
      this.dispatchEvent(
        new CustomEvent("provisioningbusychange", { detail: { busy: false } })
      );
    }
  }
  notifySnapshot() {
    this.dispatchEvent(
      new CustomEvent("provisioningsnapshot", {
        detail: { state: this.state, error: this.error }
      })
    );
  }
  message(error) {
    return (
      error?.body?.message ||
      error?.message ||
      "Unable to confirm server state. Refresh or review the server in Setup."
    );
  }
}
