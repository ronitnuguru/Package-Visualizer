import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getActiveEmployeeAgents from "@salesforce/apex/AgentforceConversationConfigController.getActiveEmployeeAgents";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";
import saveAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.saveAgentforceConfiguration";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

const UNAVAILABLE_EXTENSION_STATUS = {
  state: "UNAVAILABLE",
  message:
    "Package Visualizer could not verify the Agentforce extension status. Try again later."
};

export default class AgentforceConversationSetup extends LightningElement {
  agentOptions = [];
  configuration = {
    state: "UNCONFIGURED",
    message: "Loading Agentforce configuration."
  };
  selectedBotId = "";
  isLoading = true;
  isSaving = false;
  isEditing = false;
  extensionStatus;
  isExtensionStatusLoading = true;
  isContentExpanded = false;
  hasInitializedDisclosure = false;

  connectedCallback() {
    this.loadConfiguration();
    this.loadExtensionStatus({ initializeDisclosure: true });
  }

  loadConfiguration() {
    this.isLoading = true;
    return Promise.all([
      getActiveEmployeeAgents(),
      getAgentforceConfiguration()
    ])
      .then(([agents, configuration]) => {
        this.agentOptions = (agents || []).map((agent) => ({
          label: `${agent.label} (${agent.developerName})`,
          value: agent.botId
        }));
        this.configuration = configuration || {
          state: "UNCONFIGURED",
          message: "Select an active Agentforce Employee Agent."
        };
        this.restorePersistedSelection();
        this.notifyConfigurationChange();
      })
      .catch((error) => {
        this.agentOptions = [];
        this.configuration = {
          state: "UNCONFIGURED",
          message: "Agentforce configuration is unavailable."
        };
        this.notifyConfigurationChange();
        this.showToast(
          "Unable to load Agentforce",
          this.reduceError(error),
          "error"
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  loadExtensionStatus({ initializeDisclosure = false } = {}) {
    this.isExtensionStatusLoading = true;
    return getExtensionStatus()
      .then((status) => {
        this.extensionStatus = status || UNAVAILABLE_EXTENSION_STATUS;
        this.initializeDisclosure(this.extensionStatus, initializeDisclosure);
      })
      .catch((error) => {
        this.extensionStatus = UNAVAILABLE_EXTENSION_STATUS;
        this.initializeDisclosure(this.extensionStatus, initializeDisclosure);
        this.showToast(
          "Unable to load Agentforce extension",
          this.reduceError(error),
          "error"
        );
      })
      .finally(() => {
        this.isExtensionStatusLoading = false;
      });
  }

  initializeDisclosure(status, shouldInitialize) {
    if (!shouldInitialize || this.hasInitializedDisclosure) {
      return;
    }
    this.isContentExpanded = status?.state === "NOT_INSTALLED";
    this.hasInitializedDisclosure = true;
  }

  get agentSelectionDisabled() {
    return (
      !this.isEditing ||
      this.isLoading ||
      this.isSaving ||
      this.agentOptions.length === 0
    );
  }

  get saveDisabled() {
    return (
      this.agentSelectionDisabled ||
      !this.selectedBotId ||
      this.selectedBotId === this.configuration.botId
    );
  }

  get clearDisabled() {
    return (
      !this.isEditing ||
      this.isLoading ||
      this.isSaving ||
      !this.configuration.botId
    );
  }

  get editDisabled() {
    return this.isLoading || this.isSaving;
  }

  get showEditAction() {
    return !this.isEditing;
  }

  get hasSelectedBot() {
    return Boolean(this.selectedBotId);
  }

  get hasNoAgents() {
    return !this.isLoading && this.agentOptions.length === 0;
  }

  get disclosureDisabled() {
    return this.isExtensionStatusLoading;
  }

  get disclosureIcon() {
    return this.isContentExpanded
      ? "utility:chevrondown"
      : "utility:chevronright";
  }

  get disclosureAlternativeText() {
    return this.isContentExpanded
      ? "Collapse Agentforce Setup"
      : "Expand Agentforce Setup";
  }

  get disclosureAriaExpanded() {
    return this.isContentExpanded ? "true" : "false";
  }

  handleAgentChange(event) {
    this.selectedBotId = event.detail.value;
  }

  handleEdit() {
    if (this.editDisabled) {
      return;
    }
    this.isEditing = true;
  }

  handleDisclosureToggle() {
    if (this.disclosureDisabled) {
      return;
    }
    this.isContentExpanded = !this.isContentExpanded;
  }

  handleCancel() {
    if (this.isSaving) {
      return;
    }
    this.restorePersistedSelection();
    this.isEditing = false;
  }

  handleSave() {
    if (this.saveDisabled) {
      return;
    }
    this.saveConfiguration(
      this.selectedBotId,
      "Agentforce configuration saved."
    );
  }

  handleClear() {
    if (this.clearDisabled) {
      return;
    }
    this.saveConfiguration(null, "Agentforce configuration cleared.");
  }

  saveConfiguration(botId, successMessage) {
    this.isSaving = true;
    saveAgentforceConfiguration({ botId })
      .then((result) => {
        this.configuration = result;
        this.restorePersistedSelection();
        this.isEditing = false;
        this.notifyConfigurationChange();
        this.showToast("Success", successMessage, "success");
      })
      .catch((error) => {
        this.showToast(
          "Unable to save Agentforce",
          this.reduceError(error),
          "error"
        );
      })
      .finally(() => {
        this.isSaving = false;
      });
  }

  restorePersistedSelection() {
    const configuredOptionExists = this.agentOptions.some(
      (option) => option.value === this.configuration.botId
    );
    this.selectedBotId =
      this.configuration.state === "READY" && configuredOptionExists
        ? this.configuration.botId
        : "";
  }

  notifyConfigurationChange() {
    this.dispatchEvent(
      new CustomEvent("configurationchange", {
        detail: {
          configured:
            this.configuration.state === "READY" &&
            Boolean(this.configuration.botId)
        }
      })
    );
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  reduceError(error) {
    if (error && error.body && error.body.message) {
      return error.body.message;
    }
    if (error && error.message) {
      return error.message;
    }
    return "An unexpected error occurred.";
  }
}
