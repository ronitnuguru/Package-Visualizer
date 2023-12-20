import { LightningElement, api, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import PACAKGEEDITMESSAGECHANNEL from "@salesforce/messageChannel/PackageEditMessageChannel__c";

export default class PackageHeader extends LightningElement {
  @api name;
  @api type;
  @api id;
  @api namespacePrefix;
  @api subscriberPackageId;

  displayAppAnalyticsModal;
  displayManagedInAppPrompt;
  displayUnlockedInAppPrompt;
  displayAppAnalyticsAppPrompt;

  @wire(MessageContext) messageContext;

  get displayAppAnalyticsButton() {
    return this.type === "Managed" ? true : false;
  }

  get iconStyle() {
    return this.type === "Managed" ? "standard:solution" : "custom:custom76";
  }

  get iconStyle1GP() {
    return this.namespacePrefix ? "managed-style" : "unmanaged-style";
  }

  handlePackageManager() {
    window.open(`/lightning/setup/Package/${this.id.split("-").shift()}/view`, "_blank");
  }

  handleEdit() {
    publish(this.messageContext, PACAKGEEDITMESSAGECHANNEL, {
      editMode: true
    });
  }

  handleAppAnalytics() {
    this.displayAppAnalyticsModal = true;
  }

  handleAppAnalyticsCloseModal() {
    this.displayAppAnalyticsModal = false;
  }

  handleUnlockedPromptCancel() {
    this.displayUnlockedInAppPrompt = false;
  }

  handle2GPPromptCancel() {
    this.displayManagedInAppPrompt = false;
  }

  handleAppAnalyticsPromptOpen(){
    this.displayAppAnalyticsAppPrompt = true;
  }

  handleAppAnalyticsPromptCancel(){
    this.displayAppAnalyticsAppPrompt = false;
  }

  handleInAppPrompt() {
    switch (this.type) {
      case "Managed":
        this.displayManagedInAppPrompt = true;
        this.displayUnlockedInAppPrompt = false;
        break;
      case "Unlocked":
        this.displayUnlockedInAppPrompt = true;
        this.displayManagedInAppPrompt = false;
        break;
      default:
        this.displayManagedInAppPrompt = false;
        this.displayUnlockedInAppPrompt = false;
    }
  }
}