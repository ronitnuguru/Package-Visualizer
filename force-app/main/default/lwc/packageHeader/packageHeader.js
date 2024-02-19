import { LightningElement, api, wire } from "lwc";
import isLMA from "@salesforce/apex/PackageVisualizerCtrl.isLMA";
import getLmaPackage from "@salesforce/apex/PackageVisualizerCtrl.getLmaPackage";
import { publish, MessageContext } from "lightning/messageService";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import PACAKGEEDITMESSAGECHANNEL from "@salesforce/messageChannel/PackageEditMessageChannel__c";

export default class PackageHeader extends NavigationMixin(LightningElement) {
  @api name;
  @api type;
  @api id;
  @api namespacePrefix;
  @api subscriberPackageId;

  displayLMA;
  displayAppAnalyticsModal;
  displayManagedInAppPrompt;
  displayUnlockedInAppPrompt;
  displayAppAnalyticsAppPrompt;

  @wire(MessageContext) messageContext;

  @wire(isLMA)
  lma({ data, error }) {
    if (data) {
      if (data === true) {
        this.displayLMA = true;
      } else {
        this.displayLMA = false;
      }
    } else if (error) {
      this.displayLMA = undefined;
      console.error(error);
    }
  }

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

  handleAppAnalyticsPromptOpen() {
    this.displayAppAnalyticsAppPrompt = true;
  }

  handleAppAnalyticsPromptCancel() {
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

  handleLMA() {

    (async () => {
      this.displaySpinner = true;
      await getLmaPackage({
        subscriberPackageId: this.subscriberPackageId
      })
        .then(result => {
          this.displaySpinner = false;
          this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
              recordId: result.id,
              actionName: 'view'
            }
          });
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
          // Toast for Failure
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error",
              message: "We were unable to navigate to LMA package record",
              variant: "error"
            })
          );
        });
    })();
  }
}