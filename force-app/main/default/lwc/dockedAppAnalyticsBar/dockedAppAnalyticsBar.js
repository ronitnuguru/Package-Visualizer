import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import insertAppAnalyticsRequest from "@salesforce/apexContinuation/PackageVisualizerCtrl.insertAppAnalyticsRequest";

export default class DockedAppAnalyticsBar extends LightningElement {
  @api name;
  @api type;
  @api key;
  @api requestState;
  @api appDataType;
  @api downloadSize;
  @api endTime;
  @api startTime;
  @api downloadExpirationTime;
  @api downloadUrl;
  @api errorMessage;
  @api fileType;
  @api fileCompression;
  @api querySubmittedTime
  @api packageIds;
  @api organizationIds;

  @wire(MessageContext) messageContext;

  get displayLoadingIcon(){
    return (this.requestState === 'New' || this.requestState === 'Pending') ? true : false;
  }

  get displaySuccessIcon(){
    return (this.requestState === 'Complete' || this.requestState === 'Delivered') ? true : false;
  }

  get displayWarningIcon(){
    return (this.requestState === 'Expired' || this.requestState === 'NoData') ? true : false;
  }

  get displayErrorIcon() {
    return (this.requestState === 'Error'|| this.requestState === 'Failed') ? true : false;
  }

  handleViewModal(){
    this.dispatchEvent(new CustomEvent("expand",
      {
        detail: {
        name: this.name,
        type: this.type,
        id: this.key,
        requestState: this.requestState,
        appDataType: this.appDataType,
        downloadSize: this.downloadSize,
        endTime: this.endTime,
        startTime: this.startTime,
        downloadExpirationTime: this.downloadExpirationTime,
        downloadUrl: this.downloadUrl,
        errorMessage: this.errorMessage,
        fileType: this.fileType,
        fileCompression: this.fileCompression,
        querySubmittedTime: this.querySubmittedTime,
        packageIds: this.packageIds,
        organizationIds: this.organizationIds
    }}));
  }

  handleDownload(){
    window.open(this.downloadUrl, "_blank");
  }

  handleRefresh() {
    this.displaySpinner = true;
    (async () => {
      await insertAppAnalyticsRequest({
        dataType: this.appDataType,
        endTime: this.endTime,
        startTime: this.startTime,
        packageId: this.packageIds,
        organizationIds: this.organizationIds,
        fileType: this.fileType,
        fileCompression: this.fileCompression
      })
        .then(result => {
          this.displaySpinner = false;
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
    this.dispatchEvent(new CustomEvent("cancel"));
  }
}