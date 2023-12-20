import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import insertAppAnalyticsRequest from "@salesforce/apexContinuation/PackageVisualizerCtrl.insertAppAnalyticsRequest";

export default class AppAnalyticsRequestModal extends LightningElement {
  @api viewData;

  @wire(MessageContext) messageContext;

  packageIdsList;
  organizationIdsList;

  get displayRefresh() {
    return (this.viewData.requestState === 'Expired' || this.viewData.requestState === 'NoData') ? true : false;
  }

  connectedCallback() {
    if (this.viewData.packageIds) {
      this.packageIdsList = this.viewData.packageIds.split(",");
    }
    if (this.viewData.organizationIds) {
      this.organizationIdsList = this.viewData.organizationIds.split(",");
    }
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleDownload() {
    window.open(this.viewData.downloadUrl, "_blank");
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleRefresh() {
    this.displaySpinner = true;
    (async () => {
      await insertAppAnalyticsRequest({
        dataType: this.viewData.appDataType,
        endTime: this.viewData.endTime,
        startTime: this.viewData.startTime,
        packageId: this.viewData.packageIds,
        organizationIds: this.viewData.organizationIds,
        fileType: this.viewData.fileType,
        fileCompression: this.viewData.fileCompression
      })
        .then(result => {
          this.displaySpinner = false;
          this.dispatchEvent(new CustomEvent("cancel"));
          this.dispatchEvent(
            new ShowToastEvent({
              title: "AppAnalytics request has been submitted",
              variant: "success"
            })
          );
          this.dispatchEvent(new CustomEvent("refresh"));
          publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
            dockedBarControls: "AppAnalytics",
            appAnalyticsRequestOpen: true
          });
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
          // Toast for Failure
          this.dispatchEvent(
            new ShowToastEvent({
              title: "We were unable to process your AppAnalytics request",
              message: error,
              variant: "error"
            })
          );
        });
    })();
  }
}