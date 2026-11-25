import { LightningElement } from "lwc";

export default class SetupAssistantCustomMcpServers extends LightningElement {
  provisioningBusy = false;
  isContentExpanded = true;

  handleProvisioningBusyChange(event) {
    this.provisioningBusy = event.detail.busy;
  }

  handleProvisioningStatusChange(event) {
    this.dispatchEvent(
      new CustomEvent("provisioningstatuschange", { detail: event.detail })
    );
  }

  get disclosureDisabled() {
    return this.provisioningBusy;
  }

  get disclosureIcon() {
    return this.isContentExpanded
      ? "utility:chevrondown"
      : "utility:chevronright";
  }

  get disclosureAlternativeText() {
    return this.isContentExpanded
      ? "Collapse MCP Client Setup"
      : "Expand MCP Client Setup";
  }

  get disclosureAriaExpanded() {
    return this.isContentExpanded ? "true" : "false";
  }

  handleDisclosureToggle() {
    if (!this.disclosureDisabled) {
      this.isContentExpanded = !this.isContentExpanded;
    }
  }
}
