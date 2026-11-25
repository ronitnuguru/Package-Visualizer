import { LightningElement, api, wire } from "lwc";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";
import getLocalEcaState from "@salesforce/apex/PackageVisualizerEcaController.getState";
import createLocalEca from "@salesforce/apex/PackageVisualizerEcaController.createLocalEca";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import USER_OBJECT from "@salesforce/schema/User";
import USERNAME_FIELD from "@salesforce/schema/User.Username";
import EMAIL_FIELD from "@salesforce/schema/User.Email";

export default class PackageVisualizerEcaProvisioner extends LightningElement {
  localEcaState;
  localEcaError;
  isLoadingLocalEca = false;
  isCreatingLocalEca = false;
  ecaRunAsUsername = "";
  ecaRunAsUserId;
  ecaUserError;
  ecaUserObject = USER_OBJECT.objectApiName;
  ecaUserFilter = {
    criteria: [{ fieldPath: "IsActive", operator: "eq", value: true }]
  };
  ecaUserDisplayInfo = { primaryField: "Name", additionalFields: ["Username"] };
  ecaUserMatchingInfo = {
    primaryField: { fieldPath: "Name" },
    additionalFields: [{ fieldPath: "Username" }]
  };
  ecaContactEmail = "";

  connectedCallback() {
    this.refresh();
  }

  get isSetupEnabled() {
    return !hasViewSetup;
  }

  get showCreateLocalEca() {
    return (
      this.localEcaState &&
      !this.localEcaState.exists &&
      !this.isLoadingLocalEca
    );
  }
  get isLocalEcaConfigured() {
    return this.localEcaState?.configured === true;
  }
  get createLocalEcaDisabled() {
    return (
      this.isSetupEnabled ||
      this.isCreatingLocalEca ||
      !this.ecaRunAsUsername.trim()
    );
  }
  get localEcaBusy() {
    return this.isLoadingLocalEca || this.isCreatingLocalEca;
  }
  handleEcaRunAsChange(event) {
    // Previous text-input handler: this.ecaRunAsUsername = event.target.value;
    this.ecaRunAsUserId = event.detail.recordId || undefined;
    this.ecaRunAsUsername = "";
    this.ecaUserError = undefined;
  }
  @wire(getRecord, {
    recordId: "$ecaRunAsUserId",
    fields: [USERNAME_FIELD],
    optionalFields: [EMAIL_FIELD]
  })
  wiredEcaRunAsUser({ data, error }) {
    if (data && data.id === this.ecaRunAsUserId) {
      this.ecaRunAsUsername = getFieldValue(data, USERNAME_FIELD) || "";
      this.ecaUserError = undefined;
      if (!this.ecaContactEmail.trim())
        this.ecaContactEmail = getFieldValue(data, EMAIL_FIELD) || "";
    } else if (error && this.ecaRunAsUserId) {
      this.handleEcaUserError();
    }
  }
  handleEcaUserError() {
    this.ecaRunAsUsername = "";
    this.ecaUserError =
      "Unable to load user details. Choose the Run As user again.";
  }
  handleEcaContactEmailChange(event) {
    this.ecaContactEmail = event.target.value;
  }
  @api
  async refresh() {
    if (this.localEcaBusy) return;
    this.isLoadingLocalEca = true;
    this.localEcaError = undefined;
    try {
      this.localEcaState = await getLocalEcaState();
    } catch (error) {
      this.localEcaState = undefined;
      this.localEcaError = this.reduceToolingError(error);
    } finally {
      this.isLoadingLocalEca = false;
      this.notifyProvisioningChange();
    }
  }
  async handleCreateLocalEca() {
    if (!this.showCreateLocalEca || this.createLocalEcaDisabled) return;
    const email = this.template.querySelector('[data-id="eca-contact-email"]');
    if (email && !email.reportValidity()) return;
    this.isCreatingLocalEca = true;
    this.localEcaError = undefined;
    try {
      this.localEcaState = await createLocalEca({
        runAsUsername: this.ecaRunAsUsername.trim(),
        contactEmail: this.ecaContactEmail.trim()
      });
    } catch (error) {
      this.localEcaError = this.reduceToolingError(error);
      try {
        this.localEcaState = await getLocalEcaState();
      } catch {
        this.localEcaState = undefined;
      }
    } finally {
      this.isCreatingLocalEca = false;
      this.notifyProvisioningChange();
    }
  }

  notifyProvisioningChange() {
    this.dispatchEvent(
      new CustomEvent("provisioningchange", {
        detail: {
          appId: this.localEcaState?.appId,
          configured: this.localEcaState?.configured === true
        }
      })
    );
  }

  navigateToExternalClientApps() {
    // Previous destination: this.openOrgPage("/lightning/setup/ManageExternalClientApplication/home");
    const appId = this.localEcaState?.appId;
    const url =
      this.localEcaState?.exists && appId
        ? `/lightning/setup/ManageExternalClientApplication/${encodeURIComponent(
            appId.slice(0, 15)
          )}/detail`
        : "/lightning/setup/ManageExternalClientApplication/home";
    const tab = window.open("", "_blank");
    if (tab) tab.location.href = window.location.origin + url;
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
