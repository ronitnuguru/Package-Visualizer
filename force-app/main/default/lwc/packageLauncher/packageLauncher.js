import { LightningElement, api, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import { NavigationMixin } from "lightning/navigation";
import PackageLauncherItems from "./packageLauncherItems";
import PACKAGEMESSAGECHANNEL from "@salesforce/messageChannel/PackageMessageChannel__c";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";

export default class PackageLauncher extends NavigationMixin(LightningElement) {
  static SEARCH_MAX_LENGTH = 100;

  @api packageFilterList;
  @api packageTypes;

  activeTypeFilter = null;

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
    return this.packageTypes === "2GP and Unlocked Packages" ? true : false;
  }

  // Carry the ORIGINAL index alongside each package so a tile click still
  // dispatches the correct index into packageFilterList (the parent selects
  // via packageFilterList[event.detail]) even while a type filter hides rows.
  get displayedPackages() {
    const list = this.packageFilterList || [];
    const mapped = list.map((pkg, index) => ({ pkg, index }));
    return this.activeTypeFilter
      ? mapped.filter(
          (row) => row.pkg.containerOptions === this.activeTypeFilter
        )
      : mapped;
  }

  get hasDisplayedPackages() {
    return this.displayedPackages.length > 0;
  }

  get managedCount() {
    return (this.packageFilterList || []).filter(
      (pkg) => pkg.containerOptions === "Managed"
    ).length;
  }

  get unlockedCount() {
    return (this.packageFilterList || []).filter(
      (pkg) => pkg.containerOptions === "Unlocked"
    ).length;
  }

  get isManagedSelected() {
    return this.activeTypeFilter === "Managed";
  }

  get isUnlockedSelected() {
    return this.activeTypeFilter === "Unlocked";
  }

  handleTypeFilter(event) {
    const type = event.currentTarget.dataset.type;
    // Click the same picker again to toggle back to all packages.
    this.activeTypeFilter = this.activeTypeFilter === type ? null : type;
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

  launchAgentx() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: "https://agentexchange.salesforce.com/"
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

  handleAnnouncementsClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Announcements",
      announcementsOpen: true
    });
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleTrailheadClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Trailhead",
      trailheadOpen: true
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
    const searchString = String(event.target.value || "").slice(
      0,
      PackageLauncher.SEARCH_MAX_LENGTH
    );
    this.dispatchEvent(new CustomEvent("search", { detail: searchString }));
  }
}
