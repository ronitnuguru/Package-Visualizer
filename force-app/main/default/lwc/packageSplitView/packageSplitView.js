import { LightningElement, wire, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import agentforcePromptModalGenerator from 'c/agentforcePromptModalGenerator';
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import { publish, subscribe, unsubscribe, MessageContext } from "lightning/messageService";
import PACAKGEEDITMESSAGECHANNEL from "@salesforce/messageChannel/PackageEditMessageChannel__c";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import get2GPPackageList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageList";
import get1GPPackageList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get1GPPackageList";
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

export default class PackageSplitView extends NavigationMixin(LightningElement) {
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

    // Initialize debounced search with 300ms delay
    this.debouncedSearch = debounce(this.searchInputChange.bind(this), 300);

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

  async getPackages(packageIndex, sortDirection) {
    this.displaySpinner = true;

    try {
      const result = this.packageTypes === '2GP and Unlocked Packages'
        ? await get2GPPackageList({ sortDirection })
        : await get1GPPackageList({ sortDirection });

      // Pre-compute searchable text for optimized filtering
      this.packageList = result.map(pkg => ({
        ...pkg,
        _searchText: `${pkg.name || ''}|${pkg.namespacePrefix || ''}|${pkg.description || ''}|${pkg.containerOptions || ''}|${pkg.id || ''}`.toLowerCase()
      }));

      if (this.packageList.length === 0) {
        this.packageList = false;
        this.detailsStyle = ``;
      } else {
        this.packageFilterList = this.packageList;
        this.packageListSize = this.packageFilterList.length;
        this.currentPackage = this.packageFilterList[packageIndex];
        this.detailsStyle = `padding-left: 26.5rem;`;
      }
    } catch (error) {
      console.error('Package fetch failed:', error);
      this.packageList = undefined;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Failed to load packages",
          message: error?.body?.message || error?.message || 'An error occurred',
          variant: "error"
        })
      );
    } finally {
      this.displaySpinner = false;
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
    this.filterLabel = `Managed Packages`;
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
      case "Managed Packages":
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
    this.debouncedSearch(searchString);
  }

  handlePackageLauncherSearchChange(event) {
    this.searchInputChange(event.detail);
  }

  searchInputChange(searchString) {
    if (searchString.length >= 3) {
      const searchLower = searchString.toLowerCase();
      this.packageFilterList = this.packageList.filter(row =>
        row._searchText && row._searchText.includes(searchLower)
      );
      this.filterLabel = `All Packages`;
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

  handlePlatformTools(){
    this[NavigationMixin.Navigate]({
      type: "standard__navItemPage",
      attributes: {
        apiName: "pkgviz__Platform_Tools",
      },
    });
  }

  navigateScratchOrgBuild(){
    this[NavigationMixin.Navigate]({
      type: "standard__component",
      attributes: {
        componentName: "pkgviz__scratchDefFileBuildCard",
      }
    });
  }

  openAskAgentforce(event){
    switch (event.target.value) {
      case "packagesOverview":
        this.openModal({
          headerLabel: "Ask Agentforce",
          userPrompt: `How to develop and use Second-Generation Packaging (2GP) in Salesforce?`,
          systemPrompt: `You are an AI assistant that generates responses in a well-structured, readable rich text format suitable for rendering in HTML. Your output should follow these guidelines: 1. **Use HTML Formatting:** - Format key points using <strong> for emphasis and <ul> or <ol> for lists. - Use <p> for paragraphs to ensure readability. - Include <code> for inline code snippets and <pre><code> for blocks of code when needed. 2. **Ensure Readability & Structure:** - Break content into **logical sections** with headings and spacing. - Use **bullet points and numbered lists** for better clarity. - Avoid long, dense paragraphs—use line breaks where necessary. 3. **Enhance User Experience:** - Include relevant hyperlinks (<a href="URL">Link Text</a>) when mentioning external resources. - When listing examples, format them clearly in <blockquote> or <code> where applicable. - Maintain **consistent indentation** and spacing for readability. Do not include unnecessary white spaces. Do not include heading tags and stay consistent with paragraph tags`
        })
        break;
      default:
        break;
    }
  }
  async openModal(details){
    const result = await agentforcePromptModalGenerator.open({
      label: details.headerLabel,
      size: 'medium',
      content: {
          userPrompt: details.userPrompt,
          systemPrompt: details.systemPrompt
      }
    });   
  }

  handleInAppGuidanceWalkthrough(){

  }
}