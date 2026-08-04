import { api, LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

const UNAVAILABLE_STATUS = {
  state: "UNAVAILABLE",
  message:
    "Package Visualizer could not verify the Agentforce extension status. Try again later."
};

export default class AgentforceExtensionInstallPrompt extends NavigationMixin(
  LightningElement
) {
  @api autoLoad = false;
  _status;
  isLoading = true;

  @api
  get status() {
    return this._status;
  }

  set status(value) {
    this._status = value;
    this.isLoading = !value;
  }

  connectedCallback() {
    if (this._status || !this.autoLoad) {
      return;
    }

    getExtensionStatus()
      .then((result) => {
        this._status = result;
      })
      .catch(() => {
        this._status = UNAVAILABLE_STATUS;
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  get isReady() {
    return !this.isLoading && this._status?.state === "READY";
  }

  get showStatusPanel() {
    return !this.isLoading && !this.isReady;
  }

  get isInstallable() {
    return ["NOT_INSTALLED", "UPDATE_REQUIRED"].includes(this._status?.state);
  }

  get extensionLabel() {
    return this._status?.extensionLabel || "Agentforce extension";
  }

  get stateHeading() {
    if (this._status?.state === "NOT_INSTALLED") {
      return this.extensionLabel;
    }
    if (this._status?.state === "UPDATE_REQUIRED") {
      return `${this.extensionLabel} update available`;
    }
    if (this._status?.state === "MISCONFIGURED") {
      return "Agentforce extension setup needs attention";
    }
    return "Agentforce extension status is unavailable";
  }

  get primaryActionLabel() {
    return this._status?.state === "UPDATE_REQUIRED" ? "Upgrade" : "Install";
  }

  handlePrimaryAction() {
    this.navigateTo(this._status?.directInstallUrl);
  }

  navigateTo(url) {
    if (!url) {
      return;
    }

    const resolvedUrl = url.startsWith("http")
      ? url
      : `${window.location.origin}${url}`;
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: { url: resolvedUrl }
    });
  }
}
