import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getCustomMcpServerSetupState from "@salesforce/apex/AgentforceConversationConfigController.getCustomMcpServerSetupState";
import saveCustomMcpServerConfiguration from "@salesforce/apex/AgentforceConversationConfigController.saveCustomMcpServerConfiguration";

const UNCONFIGURED_CONFIGURATION = {
  mcpServerDefinitionId: null,
  developerName: null,
  state: "UNCONFIGURED",
  message: "Select a Custom MCP Server to configure client setup."
};

export default class SetupAssistantCustomMcpServers extends LightningElement {
  serverOptions = [];
  configuration = {
    ...UNCONFIGURED_CONFIGURATION,
    message: "Loading Custom MCP Server Configuration."
  };
  selectedMcpServerDefinitionId = "";
  isLoading = true;
  isSaving = false;
  isEditing = false;
  isContentExpanded = false;
  hasInitializedDisclosure = false;

  connectedCallback() {
    this.loadSetupState();
  }

  loadSetupState() {
    this.isLoading = true;
    return getCustomMcpServerSetupState()
      .then((setupState) => {
        this.serverOptions = (setupState?.options || []).map((option) => ({
          label: option.developerName,
          value: option.id
        }));
        this.configuration =
          setupState?.configuration || UNCONFIGURED_CONFIGURATION;
        this.restorePersistedSelection();
        this.initializeDisclosure();
        this.notifyConfigurationChange();

        if (this.configuration.state === "UNAVAILABLE") {
          this.showToast(
            "Unable to load Custom MCP Servers",
            this.configuration.message,
            "error"
          );
        }
      })
      .catch((error) => {
        this.serverOptions = [];
        this.configuration = {
          ...UNCONFIGURED_CONFIGURATION,
          state: "UNAVAILABLE",
          message: "Custom MCP Server discovery is unavailable."
        };
        this.selectedMcpServerDefinitionId = "";
        this.initializeDisclosure();
        this.notifyConfigurationChange();
        this.showToast(
          "Unable to load Custom MCP Servers",
          this.reduceError(error),
          "error"
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  initializeDisclosure() {
    if (this.hasInitializedDisclosure) {
      return;
    }
    this.isContentExpanded = true;
    this.hasInitializedDisclosure = true;
  }

  get showSpinner() {
    return this.isLoading || this.isSaving;
  }

  get serverSelectionDisabled() {
    return (
      !this.isEditing ||
      this.isLoading ||
      this.isSaving ||
      this.serverOptions.length === 0
    );
  }

  get saveDisabled() {
    return (
      this.serverSelectionDisabled ||
      !this.selectedMcpServerDefinitionId ||
      this.selectedMcpServerDefinitionId ===
        this.configuration.mcpServerDefinitionId
    );
  }

  get clearDisabled() {
    return (
      !this.isEditing ||
      this.isLoading ||
      this.isSaving ||
      !this.configuration.mcpServerDefinitionId
    );
  }

  get viewInSetupDisabled() {
    return (
      this.isLoading ||
      this.isSaving ||
      this.isEditing ||
      this.configuration.state !== "READY" ||
      !this.configuration.mcpServerDefinitionId
    );
  }

  get editDisabled() {
    return (
      this.isLoading ||
      this.isSaving ||
      this.configuration.state === "UNAVAILABLE"
    );
  }

  get showEditAction() {
    return !this.isEditing;
  }

  get hasNoServers() {
    return (
      !this.isLoading &&
      this.serverOptions.length === 0 &&
      this.configuration.state !== "UNAVAILABLE"
    );
  }

  get disclosureDisabled() {
    return (
      this.isLoading ||
      this.isSaving ||
      this.configuration.state === "UNAVAILABLE"
    );
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

  handleServerChange(event) {
    this.selectedMcpServerDefinitionId = event.detail.value;
  }

  handleEdit() {
    if (!this.editDisabled) {
      this.isEditing = true;
    }
  }

  handleDisclosureToggle() {
    if (!this.disclosureDisabled) {
      this.isContentExpanded = !this.isContentExpanded;
    }
  }

  handleCancel() {
    if (this.isSaving) {
      return;
    }
    this.restorePersistedSelection();
    this.isEditing = false;
  }

  handleSave() {
    if (!this.saveDisabled) {
      this.saveConfiguration(
        this.selectedMcpServerDefinitionId,
        "Custom MCP Server configuration saved."
      );
    }
  }

  handleClear() {
    if (!this.clearDisabled) {
      this.saveConfiguration(null, "Custom MCP Server configuration cleared.");
    }
  }

  handleViewInSetup() {
    if (this.viewInSetupDisabled) {
      return;
    }
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.location.href =
        window.location.origin +
        `/lightning/setup/McpServer/${this.configuration.mcpServerDefinitionId}/view?setup__source=PLATFORM_CUSTOM_MCP_SERVER`;
    }
  }

  saveConfiguration(mcpServerDefinitionId, successMessage) {
    this.isSaving = true;
    saveCustomMcpServerConfiguration({ mcpServerDefinitionId })
      .then((configuration) => {
        this.configuration = configuration || UNCONFIGURED_CONFIGURATION;
        this.restorePersistedSelection();
        this.isEditing = false;
        this.isContentExpanded = true;
        this.notifyConfigurationChange();
        this.showToast("Success", successMessage, "success");
      })
      .catch((error) => {
        this.showToast(
          "Unable to save Custom MCP Server",
          this.reduceError(error),
          "error"
        );
      })
      .finally(() => {
        this.isSaving = false;
      });
  }

  restorePersistedSelection() {
    const configuredOptionExists = this.serverOptions.some(
      (option) => option.value === this.configuration.mcpServerDefinitionId
    );
    this.selectedMcpServerDefinitionId =
      this.configuration.state === "READY" && configuredOptionExists
        ? this.configuration.mcpServerDefinitionId
        : "";
  }

  notifyConfigurationChange() {
    this.dispatchEvent(
      new CustomEvent("configurationchange", {
        detail: {
          configured:
            this.configuration.state === "READY" &&
            Boolean(this.configuration.mcpServerDefinitionId)
        }
      })
    );
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  reduceError(error) {
    if (error?.body?.message) {
      return error.body.message;
    }
    if (error?.message) {
      return error.message;
    }
    return "An unexpected error occurred.";
  }
}
