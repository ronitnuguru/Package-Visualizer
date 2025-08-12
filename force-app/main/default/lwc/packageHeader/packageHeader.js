import { LightningElement, api, wire } from "lwc";
import isLMA from "@salesforce/apex/PackageVisualizerCtrl.isLMA";
import isFmaParameter from "@salesforce/apex/PackageVisualizerCtrl.isFmaParameter";
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
  @api appAnalyticsEnabled;

  displayLMA;
  displayFMA;
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

  @wire(isFmaParameter)
  fma({ data, error }) {
    if (data) {
      if (data === true) {
        this.displayFMA = true;
      } else {
        this.displayFMA = false;
      }
    } else if (error) {
      this.displayFMA = undefined;
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

  handleLmaNavigate(id){
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: id,
        actionName: 'view'
      }
    });
  }

  handleFmaNavigate(id){
    this[NavigationMixin.Navigate]({
      type: "standard__recordRelationshipPage",
      attributes: {
        recordId: id,
        objectApiName: "sfLma__Package__c",
        relationshipApiName: "sfFma__Feature_Parameters__r",
        actionName: "view",
      },
    });
  }

  getLmaPackage(navigateType){
    (async () => {
      this.displaySpinner = true;
      await getLmaPackage({
        subscriberPackageId: this.subscriberPackageId
      })
        .then(result => {
          this.displaySpinner = false;
          if(navigateType === 'License Management Package'){
            this.handleLmaNavigate(result.id);
          } else if (navigateType === 'Feature Parameters'){
            this.handleFmaNavigate(result.id);
          }
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
          let toastUrl;
          if(navigateType === 'License Management Package'){
            toastUrl = 'https://developer.salesforce.com/docs/atlas.en-us.workbook_lma.meta/workbook_lma/lma_associate_package.htm';
          } else if (navigateType === 'Feature Parameters'){
            toastUrl = 'https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_fma_create_feature_parameters.htm';
          }

          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error",
              message: `We were unable to navigate to ${this.name}'s ${navigateType}. {0}`,
              messageData: [
                {
                    url: toastUrl,
                    label: 'Learn More'
                },
              ],
              variant: "error"
            })
          );
        });
    })();
  }

  handleLMA() {
    this.getLmaPackage('License Management Package');
  }

  handleFMA(){
    this.getLmaPackage('Feature Parameters');
  }
}