import { LightningElement, api } from "lwc";

export default class AppAnalyticsFlowModal extends LightningElement {
  @api subscriberPackageId;
  @api subscribers;
  @api header;

  displayAppAnalyticsDataTypeScreen = true;
  displayAppAnalyticsFormScreen;

  appDataType;

  closeModal() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handlePrevious() {
    this.displayAppAnalyticsDataTypeScreen = true;
    this.displayAppAnalyticsFormScreen = false;
  }

  handleChosenType(event) {
    this.appDataType = event.detail;
    this.displayAppAnalyticsDataTypeScreen = false;
    this.displayAppAnalyticsFormScreen = true;
  }

  handleAppAnalyticsPromptOpen(){
    this.dispatchEvent(new CustomEvent("prompt"));
  }

  handleRefresh() {
    this.dispatchEvent(new CustomEvent("refresh"));
  }
  
}