import { LightningElement, wire, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import {
  publish,
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import PACAKGEEDITMESSAGECHANNEL from "@salesforce/messageChannel/PackageEditMessageChannel__c";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import get2GPPackageList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageList";
import get1GPPackageList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get1GPPackageList";
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";

export default class PackageSplitView extends LightningElement {
  containerStyle = `slds-split-view_container slds-is-open slds-show_medium`;
  containerCollapsed = false;
  displaySpinner = true;
  detailsStyle;

  selectedTab = "details";

  packageList;
  packageFilterList;
  filterLabel = `All Packages`;
  packageListSize = 0;

  searchQuery = "";
  sortDirection = "asc";
  sortDirectionDisplay = false;
  relativeDateTime = Date.now();

  currentPackage;
  currentPackageIndex = 0;

  displayPackageTab;
  displayVersionsTab;
  displaySubscribersTab;
  displayPushRequestsTab;

  allPackageCheck = true;
  unlockedPackageCheck = false;
  managedPackageCheck = false;

  displayEditView;
  displayAboutModal = false;
  displayPackageLauncher = false;
  displaySetupAssistant;

  subscription = null;
  @wire(MessageContext) messageContext;

  @api packageTypes;

  get is2GP() {
    return (this.packageTypes === '2GP and Unlocked Packages') ? true : false;
  }  

  connectedCallback() {
    if (this.packageTypes === undefined) {
      this.packageTypes = '2GP and Unlocked Packages';
    }
    if (this.isPackageVisualizerEnabled) {
      this.getPackages(0, "asc");
    } else {
      this.displaySpinner = false;
      this.packageList = undefined;
    }
    
    this.subscription = subscribe(
      this.messageContext,
      PACAKGEEDITMESSAGECHANNEL,
      message => {
          this.displayEditView = true;
          this.template.querySelector("lightning-tabset").activeTabValue =
            "details";
          this.displayPackageTab = true;
          this.displayVersionsTab = false;
          this.displaySubscribersTab = false;
      }
    );
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
    this.displayEditView = false;
  }

  get isPackageVisualizerEnabled() {
    return hasPackageVisualizerCore;
  }

  get isPushUpgradeEnabled() {
    return hasPackageVisualizerPushUpgrade;
  }

  get isManaged(){
    return this.currentPackage.containerOptions === "Managed" ? true : false;
  }

  handleEdit(){
    this.refreshPackages("asc", false, 0);
  }

  getPackages(packageIndex, sortDirection) {
    this.displaySpinner = true;
    if (this.packageTypes === '2GP and Unlocked Packages') {
      (async () => {
        await get2GPPackageList({
          sortDirection: sortDirection
        })
          .then(result => {
            this.displaySpinner = false;
            this.packageList = result;
            if (this.packageList.length === 0) {
              this.packageList = false;
              this.detailsStyle = ``;
            } else {
              this.packageFilterList = this.packageList;
              this.packageListSize = this.packageFilterList.length;
              this.currentPackage = this.packageFilterList[packageIndex];
              this.detailsStyle = `padding-left: 26.5rem;`;
              this.displaySpinner = false;
            }
          })
          .catch(error => {
            console.error(error);
            this.displaySpinner = false;
            this.packageList = undefined;
            // Toast for Failure
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Something went wrong",
                message: error,
                variant: "error"
              })
            );
          });
      })();
    } else if (this.packageTypes === '1GP and Unmanaged Packages') {
      (async () => {
        await get1GPPackageList({
          sortDirection: sortDirection
        })
          .then(result => {
            this.displaySpinner = false;
            this.packageList = result;
            if (this.packageList.length === 0) {
              this.packageList = false;
              this.detailsStyle = ``;
            } else {
              this.packageFilterList = this.packageList;
              this.packageListSize = this.packageFilterList.length;
              this.currentPackage = this.packageFilterList[packageIndex];
              this.detailsStyle = `padding-left: 26.5rem;`;
              this.displaySpinner = false;
            }
          })
          .catch(error => {
            console.error(error);
            this.displaySpinner = false;
            this.packageList = undefined;
            // Toast for Failure
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

  handleRefreshList() {
    this.refreshPackages("asc", false, 0);
  }

  refreshPackages(sortDirection, sortDirectionDisplay, packageIndex){
    this.getPackages(packageIndex, sortDirection);
    this.currentPackageIndex = packageIndex;
    this.relativeDateTime = Date.now();
    this.filterChecks("All Packages");

    this.selectedTab = "details";
    this.displayPackageTab = true;
    this.displayVersionsTab = false;
    this.displaySubscribersTab = false;
    this.displayPushRequestsTab = false;
    this.displayEditView = false;

    this.sortDirection = sortDirection;
    this.sortDirectionDisplay = sortDirectionDisplay;
  }

  packageUpdate(){
    this.refreshPackages(this.sortDirection, this.sortDirectionDisplay, this.currentPackageIndex);
  }

  handleClosedSplitView() {
    this.containerCollapsed = !this.containerCollapsed;
    this.containerStyle = this.containerCollapsed
      ? `slds-split-view_container slds-is-closed pane-height-closed`
      : `slds-split-view_container slds-is-open pane-height-open`;
    this.detailsStyle = this.containerCollapsed
      ? `padding-left: 1.5rem;`
      : `padding-left: 26.5rem;`;
  }

  handleActive(event) {
    this.selectedTab = event.target.value;
    switch (event.target.value) {
      case "details":
        this.displayPackageTab = true;
        this.displayVersionsTab = false;
        this.displaySubscribersTab = false;
        this.displayPushRequestsTab = false;
        break;
      case "versions":
        this.displayPackageTab = false;
        this.displayVersionsTab = true;
        this.displaySubscribersTab = false;
        this.displayPushRequestsTab = false;
        this.displayEditView = false;
        break;
      case "subscribers":
        this.displayPackageTab = false;
        this.displayVersionsTab = false;
        this.displaySubscribersTab = true;
        this.displayPushRequestsTab = false;
        this.displayEditView = false;
        break;
      case "push-requests":
        this.displayPackageTab = false;
        this.displayVersionsTab = false;
        this.displaySubscribersTab = false;
        this.displayPushRequestsTab = true;
        this.displayEditView = false;
        break;
      default:
        this.displayPackageTab = true;
        this.displayVersionsTab = false;
        this.displaySubscribersTab = false;
        this.displayPushRequestsTab = false;
        break;
    }
  }

  handlePackageChange(event) {
    this.currentPackageIndex = event.detail;
    this.currentPackage = this.packageFilterList[event.detail];
    this.packageListSize = this.packageFilterList.length;
    this.selectedTab = "details";
    this.displayVersionsTab = false;

    this.displayPackageTab = true;
    this.displayVersionsTab = false;
    this.displaySubscribersTab = false;
    this.displayEditView = false;
  }

  handleAllPackageFilter() {
    this.packageFilterList = this.packageList;
    this.filterLabel = `All Packages`;
    this.searchQuery = "";
    this.packageListSize = this.packageFilterList.length;
    this.filterChecks(this.filterLabel);
  }

  handleUnlockedPackageFilter() {
    this.packageFilterList = this.packageList.filter(
      packageType => packageType.containerOptions === "Unlocked"
    );
    this.filterLabel = `Unlocked Packages`;
    this.searchQuery = "";
    this.packageListSize = this.packageFilterList.length;
    this.filterChecks(this.filterLabel);
  }

  handleManagedPackageFilter() {
    this.packageFilterList = this.packageList.filter(
      packageType => packageType.containerOptions === "Managed"
    );
    this.filterLabel = `2GP Managed Packages`;
    this.searchQuery = "";
    this.packageListSize = this.packageFilterList.length;
    this.filterChecks(this.filterLabel);
  }

  filterChecks(type) {
    switch (type) {
      case "All Packages":
        this.allPackageCheck = true;
        this.unlockedPackageCheck = false;
        this.managedPackageCheck = false;
        this.filterLabel = type;
        break;
      case "Unlocked Packages":
        this.allPackageCheck = false;
        this.unlockedPackageCheck = true;
        this.managedPackageCheck = false;
        this.filterLabel = type;
        break;
      case "2GP Managed Packages":
        this.allPackageCheck = false;
        this.unlockedPackageCheck = false;
        this.managedPackageCheck = true;
        this.filterLabel = type;
        break;
      default:
        this.allPackageCheck = true;
        this.unlockedPackageCheck = false;
        this.managedPackageCheck = false;
        this.filterLabel = type;
    }
  }

  handleSearchInputChange(event) {
    const searchString = event.target.value;
    this.searchInputChange(searchString);
  }

  handlePackageLauncherSearchChange(event) {
    this.searchInputChange(event.detail);
  }

  searchInputChange(searchString) {
    if (searchString.length >= 3) {
      {
        let regex = new RegExp(searchString, "i");
        let results = this.packageList.filter(
          row =>
            regex.test(row.name) ||
            regex.test(row.namespacePrefix) ||
            regex.test(row.description) ||
            regex.test(row.type) ||
            regex.test(row.id)
        );
        this.packageFilterList = results;
        this.filterLabel = `All Packages`;
      }
    } else {
      this.packageFilterList = this.packageList;
    }
    this.searchQuery = searchString;
    this.packageListSize = this.packageFilterList.length;
  }

  handleSort() {
    this.sortDirectionDisplay = !this.sortDirectionDisplay;
    this.sortDirection = !this.sortDirectionDisplay ? "asc" : "desc";

    let isReverse = this.sortDirection === "asc" ? 1 : -1;

    this.packageFilterList = this.packageFilterList.sort((a, b) => {
      let x = a.name.toUpperCase(),
        y = b.name.toUpperCase();
      return isReverse * ((x > y) - (y > x));
    });
    this.searchQuery = "";
  }

  handleDockedLimitsClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Limits",
      limitsOpen: true
    });
  }

  handleDockedResourcesClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Resources",
      resourcesOpen: true
    });
  }

  handleAppAnalyticsClick() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "AppAnalytics",
      appAnalyticsRequestOpen: true
    });
  }

  handleAnnouncementsClick(){
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "Announcements",
      announcementsOpen: true
    });
  }

  handleCreateOrgs() {
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "CreateOrgs",
      createOrgsOpen: true
    });
  }

  handleSetupAssistantClick(){
    this.displaySetupAssistant = !this.displaySetupAssistant;
  }

  handleAboutModal() {
    this.displayAboutModal = true;
  }

  handleAboutModalCancel() {
    this.displayAboutModal = false;
  }

  handlePackageLauncher() {
    this.displayPackageLauncher = true;
    this.searchQuery = "";
    this.packageFilterList = this.packageList;
    this.packageListSize = this.packageFilterList.length;
  }

  handlePackageLauncherCancel() {
    this.displayPackageLauncher = false;
  }
}