import { LightningElement, api } from "lwc";
import { execute, open } from "lightning/accApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";
import { isSalesforceId } from "c/agentforceConversationUtils";
import AgentforceExtensionInstallModal from "c/agentforceExtensionInstallModal";

const SETUP_TEST_UTTERANCE =
  "Describe the package portfolio, failed package build, push-request, failed push-job, subscriber-support, and package-version readiness tasks you can perform, including the identifier each task requires.";

export default class AgentforceConversationActions extends LightningElement {
  @api displayMode;
  @api botId;
  @api utterance;
  @api disabled = false;
  @api showModelsGenerate = false;
  @api alternativeText = "Chat with Agentforce";
  @api variant = "border-filled";

  configuration;
  extensionStatus;
  isLoadingConfiguration = true;
  isLoadingExtensionStatus = true;
  isExecuting = false;

  connectedCallback() {
    if (this.showSetupTest) {
      this.isLoadingConfiguration = false;
      this.isLoadingExtensionStatus = false;
      return;
    }

    this.loadExtensionStatus();
    if (this.botId) {
      this.isLoadingConfiguration = false;
    } else {
      this.loadConfiguration();
    }
  }

  loadExtensionStatus() {
    this.isLoadingExtensionStatus = true;
    getExtensionStatus()
      .then((result) => {
        this.extensionStatus = result;
      })
      .catch(() => {
        this.extensionStatus = {
          state: "UNAVAILABLE",
          message:
            "Package Visualizer could not verify the Agentforce extension status. Try again later."
        };
      })
      .finally(() => {
        this.isLoadingExtensionStatus = false;
      });
  }

  loadConfiguration() {
    this.isLoadingConfiguration = true;
    getAgentforceConfiguration()
      .then((result) => {
        this.configuration = result;
      })
      .catch(() => {
        this.configuration = {
          state: "STALE",
          message:
            "Agentforce configuration is unavailable. Review it in Setup Assistant."
        };
      })
      .finally(() => {
        this.isLoadingConfiguration = false;
      });
  }

  get showSetupTest() {
    return this.displayMode === "setupTest";
  }

  get showContextAction() {
    return this.displayMode === "contextAction";
  }

  get resolvedBotId() {
    if (this.botId) {
      return this.botId;
    }
    return this.configuration?.state === "READY"
      ? this.configuration.botId
      : null;
  }

  get contextActionDisabled() {
    if (
      this.disabled ||
      this.isLoadingConfiguration ||
      this.isLoadingExtensionStatus ||
      this.isExecuting ||
      !this.utterance
    ) {
      return true;
    }

    if (this.showExtensionInstallAction) {
      return false;
    }

    return (
      !this.isExtensionUsable || !isSalesforceId(this.resolvedBotId, "0Xx")
    );
  }

  get isExtensionUsable() {
    return ["READY", "UPDATE_REQUIRED"].includes(this.extensionStatus?.state);
  }

  get showExtensionInstallAction() {
    return this.extensionStatus?.state === "NOT_INSTALLED";
  }

  get contextActionTooltip() {
    if (this.isLoadingExtensionStatus) {
      return "Checking the Agentforce extension status.";
    }
    if (
      ["MISCONFIGURED", "UNAVAILABLE"].includes(this.extensionStatus?.state)
    ) {
      return this.extensionStatus.message;
    }
    if (
      this.isExtensionUsable &&
      this.configuration?.state !== "READY" &&
      !this.botId
    ) {
      return (
        this.configuration?.message ||
        "Configure Agentforce in Setup Assistant."
      );
    }
    return this.alternativeText;
  }

  get testPanelDisabled() {
    return this.isExecuting || !isSalesforceId(this.resolvedBotId, "0Xx");
  }

  handleContextAction() {
    if (this.contextActionDisabled) {
      return;
    }

    if (this.showExtensionInstallAction) {
      this.openExtensionInstallModal();
      return;
    }

    this.runConversation(this.utterance);
  }

  openExtensionInstallModal() {
    if (this.isExecuting) {
      return;
    }

    this.isExecuting = true;
    AgentforceExtensionInstallModal.open({
      size: "small",
      status: this.extensionStatus
    }).finally(() => {
      this.isExecuting = false;
    });
  }

  handleTestPanel() {
    if (this.testPanelDisabled) {
      return;
    }
    this.runConversation(SETUP_TEST_UTTERANCE);
  }

  handleModelsGenerate() {
    this.dispatchEvent(new CustomEvent("modelsgenerate"));
  }

  runConversation(utterance) {
    if (this.isExecuting) {
      return;
    }

    this.isExecuting = true;
    const selectedBotId = this.resolvedBotId;
    open(selectedBotId)
      .then(() => {
        this.dispatchEvent(new CustomEvent("conversationopen"));
        return execute(utterance, selectedBotId);
      })
      .catch(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Unable to use Agentforce",
            message:
              "Confirm you have access to the configured Agentforce Employee Agent, then try again.",
            variant: "error"
          })
        );
      })
      .finally(() => {
        this.isExecuting = false;
      });
  }
}
