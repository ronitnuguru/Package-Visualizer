import { LightningElement, api, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import { NavigationMixin } from "lightning/navigation";
import PackageLauncherItems from "./packageLauncherItems";
import PACKAGEMESSAGECHANNEL from "@salesforce/messageChannel/PackageMessageChannel__c";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";

export default class PackageLauncher extends NavigationMixin(LightningElement) {
  @api packageFilterList;
  @api packageTypes;

  displayAllPackages = true;
  displayAllItems = true;
  displayAllDockedItems = true;
  allPackagesAccordionClass = `slds-section slds-is-open`;
  allItemsAccordionClass = `slds-section slds-is-open`;
  allDockedItemsAccordionClass = `slds-section slds-is-open`;

  packageLauncherItems = PackageLauncherItems.items;

  @wire(MessageContext) messageContext;

  get isSetupEnabled() {
    return hasViewSetup;
  }

  get is2GP() {
    return this.packageTypes === '2GP and Unlocked Packages' ? true : false;
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  launchAppx() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
          url: "https://appexchange.salesforce.com/"
      }
    });
  }

  handleDockedLimitsClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Limits",
      limitsOpen: true
    });
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleDockedResourcesClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Resources",
      resourcesOpen: true
    });
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleAppAnalyticsClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "AppAnalytics",
      appAnalyticsRequestOpen: true
    });
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleAnnouncementsClick(){
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Announcements",
      announcementsOpen: true
    });
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleCreateOrgsClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "CreateOrgs",
      announcementsOpen: true
    });
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  toggleAllPackagesAccordion() {
    this.displayAllPackages = !this.displayAllPackages;
    this.allPackagesAccordionClass = this.displayAllPackages
      ? `slds-section slds-is-open`
      : `slds-section`;
  }

  toggleAllItemsAccordion() {
    this.displayAllItems = !this.displayAllItems;
    this.allItemsAccordionClass = this.displayAllItems
      ? `slds-section slds-is-open`
      : `slds-section`;
  }

  toggleAllDockedItemsAccordion() {
    this.displayAllDockedItems = !this.displayAllDockedItems;
    this.allDockedItemsAccordionClass = this.displayAllDockedItems
      ? `slds-section slds-is-open`
      : `slds-section`;
  }

  handlePackageClick(event) {
    this.dispatchEvent(
      new CustomEvent("packagechange", {
        detail: event.currentTarget.dataset.id
      })
    );
    this.dispatchEvent(new CustomEvent("cancel"));

    publish(this.messageContext, PACKAGEMESSAGECHANNEL, {
      currentPackageName: event.currentTarget.dataset.name
    });
  }

  handleSearchInputChange(event) {
    const searchString = event.target.value;
    this.dispatchEvent(new CustomEvent("search", { detail: searchString }));
  }
}