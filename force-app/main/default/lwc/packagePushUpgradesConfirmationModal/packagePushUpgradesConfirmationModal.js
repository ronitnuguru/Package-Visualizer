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
              console.error(error.body.message);
              this.displayInvalidSchedulePopover = true;
              if (error.body.message) {
                this.popoverBody = error.body.message;
              } else {
                this.popoverBody = 'Something went wrong while Push Upgrade...';
              }
              this.displaySpinner = false;
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Something went wrong",
                  message: error,
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
        .then(result => {
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
          console.error(error.body.message);
          this.displayInvalidSchedulePopover = true;
          let errorMessage = JSON.parse(error.body.message);
          if (errorMessage[0]) {
            this.popoverBody = errorMessage[0].message;
          } else {
            this.popoverBody = error.body.message;
          }
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Something went wrong",
              message: error,
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
        .then(result => {
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
          console.error(error.body.message);
          this.displaySpinner = false;
          this.displayInvalidSchedulePopover = true;
          this.popoverBody = error.body.message;
          this.displaySpinner = false;
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Something went wrong",
              message: error,
              variant: "error"
            })
          );
        });
    })();
  }
}