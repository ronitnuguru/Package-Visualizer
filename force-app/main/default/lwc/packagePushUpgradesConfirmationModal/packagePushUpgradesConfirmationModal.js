import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import createPackagePushRequest from "@salesforce/apex/PushUpgradesCtrl.createPackagePushRequest";
import createPackagePushJobs from "@salesforce/apex/PushUpgradesCtrl.createPackagePushJobs";
import updatePackagePushRequest from "@salesforce/apex/PushUpgradesCtrl.updatePackagePushRequest";

export default class PackagePushUpgradesConfirmationModal extends LightningElement {
  @api packageSubscriberVersionId;
  @api selectedSubscribers;
  @api progressIndicator;

  displaySpinner;
  displayInvalidSchedulePopover;
  displayAlert = true;

  popoverBody;

  get modalAlertTitle() {
    return `Are you sure you want to upgrade ${this.selectedSubscribers.length} subscriber(s)?`;
  }

  get nowDate() {
    return new Date().toISOString();
  }

  get footerClass() {
    return this.progressIndicator
      ? `slds-modal__footer slds-grid slds-grid_align-spread`
      : `slds-modal__footer`;
  }

  get popOverClass() {
    return this.progressIndicator
      ? `slds-text-align_left slds-popover slds-popover_error slds-nubbin_top-left popover-progress-style slds-is-absolute`
      : `slds-text-align_left slds-popover slds-popover_error slds-nubbin_top-left popover-style slds-is-absolute`;
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handlePrevious() {
    this.dispatchEvent(new CustomEvent("previous"));
  }

  handleCloseAlert() {
    this.displayAlert = false;
  }

  handlePopoverClose() {
    this.displayInvalidSchedulePopover = false;
  }

  getFirstErrorMessage(error) {
    const fallbackMessage = "Something went wrong while Push Upgrade...";
    const rawMessage = error?.body?.message;

    if (!rawMessage || typeof rawMessage !== "string") {
      return fallbackMessage;
    }

    const responseToken = "Response:";
    const responseIndex = rawMessage.indexOf(responseToken);
    const responseBody =
      responseIndex >= 0
        ? rawMessage.slice(responseIndex + responseToken.length).trim()
        : rawMessage.trim();

    try {
      const parsed = JSON.parse(responseBody);
      const firstEntry = Array.isArray(parsed) ? parsed[0] : parsed;
      const nestedErrorMessage = firstEntry?.errors?.[0]?.message;
      const directMessage = firstEntry?.message;

      return nestedErrorMessage || directMessage || rawMessage;
    } catch (parseError) {
      return rawMessage;
    }
  }

  handleSchedule() {
    const scheduleStartInput = this.template.querySelector(
      ".scheduleStartInput"
    );
    if (scheduleStartInput.reportValidity()) {
      const allValid = [
        ...this.template.querySelectorAll("scheduleStartInput")
      ].reduce((validSoFar, inputFields) => {
        inputFields.reportValidity();
        return validSoFar && inputFields.checkValidity();
      }, true);

      if (allValid) {
        this.displaySpinner = true;
        let scheduleStartTime = scheduleStartInput.value;
        if (scheduleStartTime === "") {
          scheduleStartTime = new Date().toISOString();
        }
        (async () => {
          await createPackagePushRequest({
            packageSubscriberVersionId: this.packageSubscriberVersionId,
            scheduledStartTime: scheduleStartTime
          })
            .then(result => {
              this.createPushJobs(result);
            })
            .catch(error => {
              this.displaySpinner = false;
              const firstErrorMessage = this.getFirstErrorMessage(error);
              console.error(firstErrorMessage);
              this.displayInvalidSchedulePopover = true;
              this.popoverBody = firstErrorMessage;
              this.displaySpinner = false;
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Something went wrong",
                  message: firstErrorMessage,
                  variant: "error"
                })
              );
            });
        })();
      } else {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Something went wrong",
            message: "Check your input and try again",
            variant: "error"
          })
        );
      }
    }
  }

  createPushJobs(packagePushRequestId) {
    (async () => {
      await createPackagePushJobs({
        packagePushRequestId: packagePushRequestId,
        subscriberList: this.selectedSubscribers
      })
        .then(() => {
          this.displaySpinner = false;
          this.dispatchEvent(new CustomEvent("cancel"));
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message:
                "Your pushed upgrade request has been successfully queued",
              variant: "success"
            })
            //Create FMA Set Date 
          );
        })
        .catch(error => {
          this.displaySpinner = false;
          const firstErrorMessage = this.getFirstErrorMessage(error);
          console.error(firstErrorMessage);
          this.displayInvalidSchedulePopover = true;
          this.popoverBody = firstErrorMessage;
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Something went wrong",
              message: firstErrorMessage,
              variant: "error"
            })
          );
        });
    })();
  }

  updatePushRequestStatus(packagePushRequestId, status) {
    (async () => {
      await updatePackagePushRequest({
        packagePushRequestId: packagePushRequestId,
        status: status
      })
        .then(() => {
          this.displaySpinner = false;
          this.dispatchEvent(new CustomEvent("cancel"));
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message:
                "Your pushed upgrade request has been successfully queued",
              variant: "success"
            })
          );
        })
        .catch(error => {
          const firstErrorMessage = this.getFirstErrorMessage(error);
          console.error(firstErrorMessage);
          this.displaySpinner = false;
          this.displayInvalidSchedulePopover = true;
          this.popoverBody = firstErrorMessage;
          this.displaySpinner = false;
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Something went wrong",
              message: firstErrorMessage,
              variant: "error"
            })
          );
        });
    })();
  }
}