import { api } from "lwc";
import LightningModal from "lightning/modal";

export default class AgentforceExtensionInstallModal extends LightningModal {
  @api status;

  get modalLabel() {
    return this.status?.state === "UPDATE_REQUIRED"
      ? "Update Agentforce extension"
      : "Install Agentforce extension";
  }

  handleClose() {
    this.close();
  }
}
