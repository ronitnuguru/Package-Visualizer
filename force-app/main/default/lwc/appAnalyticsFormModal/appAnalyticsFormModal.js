import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import { NavigationMixin } from "lightning/navigation";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import insertAppAnalyticsRequest from "@salesforce/apexContinuation/PackageVisualizerCtrl.insertAppAnalyticsRequest";

export default class AppAnalyticsFormModal extends NavigationMixin(LightningElement) {
  @api appDataType;
  @api subscriberPackageId;
  @api subscribers;

  @wire(MessageContext) messageContext;

  displaySpinner = false;
  popoverBody;
  subscriberPills = [];

  displayProgressIndicatorError;
  progressStepLabel = "Complete Request";

  startTime;
  endTime;

  fileType;
  fileCompression;
  displayFileComperssion;
  displayCSVFileCompression;
  displaySnappyFileCompression;

  connectedCallback() {
    if (this.subscribers) {
      this.subscribers.forEach(org => {
        this.subscriberPills.push({
          label: org.orgName,
          name: org.orgKey
        });
      });
    }
  }

  get fileTypeOptions() {
    return [
      { label: "None", value: "none" },
      { label: "CSV", value: "csv" },
      { label: "Parquet", value: "parquet" }
    ];
  }

  get csvFileCompressionOptions() {
    return [
      { label: "None", value: "none" },
      { label: "gzip", value: "gzip" }
    ];
  }

  get snappyFileCompressionOptions() {
    return [
      { label: "None", value: "none" },
      { label: "gzip", value: "gzip" },
      { label: "Snappy", value: "snappy" }
    ];
  }

  handleFileTypeChange(event) {
    this.fileType = event.detail.value;
    if(this.fileType === 'csv'){
      this.displayFileComperssion = true;
      this.fileCompression = 'none';
      this.displayCSVFileCompression = true;
      this.displaySnappyFileCompression = false;
    } else if(this.fileType === 'parquet'){
      this.displayFileComperssion = true;
      this.fileCompression = 'snappy';
      this.displayCSVFileCompression = false;
      this.displaySnappyFileCompression = true;
    } 
    else {
      this.displayFileComperssion = false;
    }
  }

  handleFileCompressionChange(event){
    this.fileCompression = event.detail.value;
  }

  handleSubscriberRemove(event) {
    const index = event.detail.index;
    this.removeSub(index);
  }

  removeSub(index) {
    this.subscriberPills = [
      ...this.subscriberPills.slice(0, index),
      ...this.subscriberPills.slice(index + 1)
    ];
  }

  handlePrevious() {
    this.dispatchEvent(new CustomEvent("previous"));
  }

  handleStartTimeInputChange(event) {
    this.startTime = event.target.value;
  }

  handleEndTimeInputChange(event) {
    this.endTime = event.target.value;
  }

  handlePopoverClose() {
    this.displayInvalidSubmitPopover = false;
  }

  handleSubmit() {
    const startTimeInput = this.template.querySelector(".startTimeCmp");
    if (startTimeInput.reportValidity()) {
      this.displayProgressIndicatorError = false;
      this.progressStepLabel = "Complete Request";

      let organizationIds = "";
      if (this.subscriberPills.length > 0) {
        organizationIds = this.subscriberPills
          .map(sub => sub.name)
          .join()
          .toString();
      }
      (async () => {
        this.displaySpinner = true;
        await insertAppAnalyticsRequest({
          dataType: this.appDataType,
          endTime: this.endTime,
          startTime: this.startTime,
          packageId: this.subscriberPackageId,
          organizationIds: organizationIds,
          fileType: this.fileType,
          fileCompression: this.fileCompression
        })
          .then(result => {
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
            this.displayProgressIndicatorError = true;
            this.popoverBody = error.body.pageErrors[0].message;
            this.progressStepLabel = this.popoverBody;
            // Toast for Failure
            this.dispatchEvent(
              new ShowToastEvent({
                title: "We were unable to process your AppAnalytics request",
                message: this.popoverBody,
                variant: "error"
              })
            );
          });
      })();
    } else {
      this.displayProgressIndicatorError = true;
      this.progressStepLabel = "Complete all the required fields";
    }
  }
}