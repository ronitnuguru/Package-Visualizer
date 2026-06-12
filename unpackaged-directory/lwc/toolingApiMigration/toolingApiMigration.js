import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";
import getIntegrationStatus from "@salesforce/apex/PackageVisualizerCtrl.getIntegrationStatus";
import configureNamedCredentialUrl from "@salesforce/apex/PackageVisualizerCtrl.configureNamedCredentialUrl";
import populateClientCredentials from "@salesforce/apex/PackageVisualizerCtrl.populateClientCredentials";
import verifyAndEnableNamedCredential from "@salesforce/apex/PackageVisualizerCtrl.verifyAndEnableNamedCredential";

export default class ToolingApiMigration extends LightningElement {
  integrationStatus;
  toolingClientId = "";
  toolingClientSecret = "";
  credentialsExpanded = false;
  isEditingCredentials = false;
  isSavingCredentials = false;
  isTestingNamedCredential = false;

  connectedCallback() {
    this.loadIntegrationStatus();
  }

  loadIntegrationStatus() {
    (async () => {
      await getIntegrationStatus()
        .then((result) => {
          this.integrationStatus = result;
        })
        .catch((error) => {
          this.showToolingToast(
            "Error",
            this.reduceToolingError(error),
            "error"
          );
        });
    })();
  }

  // ---- Derived UI state (getters over watchers) ----

  get isSetupEnabled() {
    return !hasViewSetup;
  }

  get isNamedCredentialEnabled() {
    return (
      this.integrationStatus &&
      this.integrationStatus.useNamedCredential === true
    );
  }

  get isToolingCredentialConfigured() {
    return (
      this.integrationStatus &&
      this.integrationStatus.externalCredentialStatus === "Configured"
    );
  }

  get saveCredentialsDisabled() {
    return (
      !this.toolingClientId ||
      !this.toolingClientSecret ||
      this.isSavingCredentials
    );
  }

  get testAndEnableDisabled() {
    return !this.isToolingCredentialConfigured || this.isTestingNamedCredential;
  }

  get showCredentialEditFields() {
    return !this.isToolingCredentialConfigured || this.isEditingCredentials;
  }

  get credentialToggleIcon() {
    return this.credentialsExpanded
      ? "utility:chevrondown"
      : "utility:chevronright";
  }

  // ---- Handlers ----

  navigateToExternalClientApps() {
    window.open(
      "/lightning/setup/ManageExternalClientApplication/home",
      "_blank"
    );
  }

  toggleCredentials() {
    this.credentialsExpanded = !this.credentialsExpanded;
  }

  handleToolingClientIdChange(event) {
    this.toolingClientId = event.target.value;
  }

  handleToolingClientSecretChange(event) {
    this.toolingClientSecret = event.target.value;
  }

  editToolingCredentials() {
    this.isEditingCredentials = true;
    this.toolingClientId = "";
    this.toolingClientSecret = "";
  }

  cancelEditToolingCredentials() {
    this.isEditingCredentials = false;
    this.toolingClientId = "";
    this.toolingClientSecret = "";
  }

  saveToolingCredentials() {
    this.isSavingCredentials = true;
    (async () => {
      await populateClientCredentials({
        clientId: this.toolingClientId,
        clientSecret: this.toolingClientSecret
      })
        .then(() => {
          this.toolingClientId = "";
          this.toolingClientSecret = "";
          this.isEditingCredentials = false;
          this.showToolingToast(
            "Success",
            "Client credentials saved. Now run Test & Enable.",
            "success"
          );
          this.loadIntegrationStatus();
        })
        .catch((error) => {
          this.showToolingToast(
            "Error",
            this.reduceToolingError(error),
            "error"
          );
        })
        .finally(() => {
          this.isSavingCredentials = false;
        });
    })();
  }

  testAndEnableNamedCredential() {
    this.isTestingNamedCredential = true;
    (async () => {
      await configureNamedCredentialUrl()
        .then(() => verifyAndEnableNamedCredential())
        .then(() => {
          this.showToolingToast(
            "Success",
            "Test callout succeeded. Package Visualizer now uses the Named Credential.",
            "success"
          );
          this.loadIntegrationStatus();
        })
        .catch((error) => {
          this.showToolingToast(
            "Error",
            this.reduceToolingError(error),
            "error"
          );
        })
        .finally(() => {
          this.isTestingNamedCredential = false;
        });
    })();
  }

  // ---- Helpers ----

  showToolingToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  reduceToolingError(error) {
    if (error && error.body && error.body.message) {
      return error.body.message;
    }
    if (error && error.message) {
      return error.message;
    }
    return "An unexpected error occurred.";
  }
}
