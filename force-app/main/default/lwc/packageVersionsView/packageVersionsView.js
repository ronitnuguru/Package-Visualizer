import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import D3MESSAGECHANNEL from "@salesforce/messageChannel/D3MessageChannel__c";
import Package2VersionData from "./packageVersionsFields";
import get2GPPackageVersionList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageVersionList";
import isLMA from "@salesforce/apex/PackageVisualizerCtrl.isLMA";

const actions = [
  {
    label: "Show Details",
    name: "show_details",
    iconName: "utility:display_text"
  },
  {
    label: "View Subscribers",
    name: "view_subscribers",
    iconName: "utility:people"
  }
];

const gridColumns = [
  {
    type: "text",
    fieldName: "versionNumber",
    label: "Version Number",
    sortable: true,
    iconName: "standard:number_input"
  },
  {
    type: "text",
    fieldName: "name",
    label: "Name",
    sortable: true,
    iconName: "custom:custom18"
  },
  {
    type: "text",
    fieldName: "subscriberPackageVersionId",
    label: "Subscriber Package Version Id",
    sortable: true,
    iconName: "standard:record"
  },
  {
    type: "boolean",
    fieldName: "isReleased",
    label: "Is Released",
    sortable: true,
    iconName: "standard:task2"
  },
  {
    type: "date",
    fieldName: "createdDate",
    label: "Created Date",
    iconName: "standard:date_time",
    sortable: true,
    typeAttributes: {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions, menuAlignment: "auto" }
  }
];

export default class PackageVersionsView extends LightningElement {
  @api packageId;
  @api subscriberPackageId;
  @api packageType;
  @api name;
  @api namespacePrefix;

  @wire(MessageContext) messageContext;

  selectedTab = "version-details";

  displayPackageVersionBreadCrumb = false;
  displayPackageSubscriberDetailBreadCrumb = false;
  displayReviewAncestryBreadCrumb = false;
  displayVersionDetails = false;
  displaySubscribersList = false;
  displaySubscriberDetail = false;

  displaySpinner = true;
  displayDatatableSpinner = false;
  fieldsToDisplayModal = false;
  displayLMA;

  displayVersionDetailsTab;
  displayVersionSubscribersTab;
  displayPushUpgradesTab;
  displayLMATab;

  summaryState = true;
  treeState = false;
  selectedTreeItem;
  isReleasedState = false;

  data = [];
  isReleasedData;
  gridColumns = gridColumns;
  gridData;
  expandedRows = [];
  toggleRows = 0;

  versionId;
  packageId;
  packageBuildNumber;
  packagehasPassedCodeCoverageCheck;
  packageInstallUrl;
  packageIsDeprecated;
  packageIsPasswordProtected;
  packageIsReleased;
  packageName;
  packageVersionNumber;
  packageSubscriberVersionId;
  packageValidationSkipped;
  packageMetadataRemoved;
  packageAncestorId;
  packageBranch;
  packageTag;
  packageDescription;
  packageReleaseVersion;
  packageBuildDurationInSeconds;
  packageLanguage;
  packageCreatedDate;
  packageCreatedBy;
  packageValidatedAsync;

  installedStatus;
  instanceName;
  metadataPackageId;
  metadataPackageVersionId;
  orgKey;
  orgName;
  orgStatus;
  orgType;

  displayEmptyView;
  filterState = false;
  displayFilterMeta;
  displayFilterDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  responsivePanelStyle = `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
  heightStyle = `table-style table-height slds-p-horizontal_medium slds-p-bottom_medium`;
  checkBoxFilterValues = [];

  isExpanded = false;

  minVersionSlider;
  maxVersionSlider;
  minSlider;
  maxSlider;

  minVersionInput;
  maxVersionInput;

  tableSelectedOptions = [
    "versionNumber",
    "name",
    "subscriberPackageVersionId",
    "isReleased",
    "createdDate"
  ];
  tableRequiredOptions = ["versionNumber"];

  sortedBy = "createdDate";
  sortedByLabel = "Created Date";
  sortDirection = "desc";
  relativeDateTime = Date.now();

  versionLimit = 50;
  versionOffset = 0;
  versionsLength;
  disableInfiniteLoad = true;
  displaySecurityReviewInAppPrompt;
  displayPackageVersioningInAppPrompt;

  @wire(isLMA)
  lma({ data, error }) {
    if (data) {
      if (this.packageType === "Managed" && data === true) {
        this.displayLMA = true;
      } else {
        this.displayLMA = false;
      }
    } else if (error) {
      this.displayLMA = undefined;
      console.error(error);
    }
  }

  get isPushUpgradeEnabled() {
    return hasPackageVisualizerPushUpgrade;
  }

  get displayManagedPackageView() {
    return this.packageType === "Managed" ? true : false;
  }

  get tableOptions() {
    return [
      { label: "Version Number", value: "versionNumber" },
      { label: "Ancestor Id", value: "ancestorId" },
      { label: "Build Number", value: "buildNumber" },
      { label: "Build Duration In Seconds", value: "buildDurationInSeconds" },
      {
        label: "Has Passed Code Coverage Check",
        value: "hasPassedCodeCoverageCheck"
      },
      { label: "Is Password Protected", value: "isPasswordProtected" },
      { label: "Is Released", value: "isReleased" },
      { label: "Major Version", value: "majorVersion" },
      { label: "Minor Version", value: "minorVersion" },
      { label: "Release Version", value: "releaseVersion" },
      { label: "Name", value: "name" },
      { label: "Language", value: "language" },
      { label: "Package2 Id", value: "package2Id" },
      {
        label: "Subscriber Package Version Id",
        value: "subscriberPackageVersionId"
      },
      { label: "Validated Async", value: "validatedAsync" },
      { label: "Validation Skipped", value: "validationSkipped" },
      { label: "Has Metadata Removed", value: "hasMetadataRemoved" },
      { label: "Created Date", value: "createdDate" },
      { label: "Created By", value: "owner" }
    ];
  }

  get tableSelectOptions() {
    return this.tableSelectedOptions;
  }

  connectedCallback() {
    this.loadPackageVersions(this.packageId, false, false);
  }

  handleActive(event) {
    this.selectedTab = event.target.value;
    switch (event.target.value) {
      case "version-details":
        this.displayVersionDetailsTab = true;
        this.displayVersionSubscribersTab = false;
        this.displayPushUpgradesTab = false;
        this.displayLMATab = false;
        break;
      case "version-subscribers":
        this.displayVersionDetailsTab = false;
        this.displayVersionSubscribersTab = true;
        this.displayPushUpgradesTab = false;
        this.displayLMATab = false;
        break;
      case "push-upgrades":
        this.displayVersionDetailsTab = false;
        this.displayVersionSubscribersTab = false;
        this.displayPushUpgradesTab = true;
        this.displayLMATab = false;
        break;
      case "lma":
        this.displayVersionDetailsTab = false;
        this.displayVersionSubscribersTab = false;
        this.displayPushUpgradesTab = false;
        this.displayLMATab = true;
        break;
      default:
        this.displayVersionDetailsTab = true;
        this.displayVersionSubscribersTab = false;
        this.displayPushUpgradesTab = false;
        this.displayLMATab = false;
        break;
    }
  }

  loadPackageVersions(packageID, applyFilters, isViewMore) {
    if (isViewMore) {
      this.displayDatatableSpinner = true;
    } else {
      this.displaySpinner = true;
    }
    let wrapper = [
      {
        fieldName: "Package2Id",
        value: packageID,
        dataType: "STRING"
      }
    ];
    let minMajorVersion;
    let maxMajorVersion;
    let minMinorVersion;
    let maxMinorVersion;

    if (applyFilters === true) {
      if (this.checkBoxFilterValues.length > 0) {
        this.checkBoxFilterValues.forEach(field => {
          wrapper.push({
            fieldName: field,
            value: true,
            dataType: "BOOLEAN"
          });
        });
        this.displayFilterMeta = true;
      }

      const maxMajor = this.template.querySelector(".maxMajorInput");
      const maxMinor = this.template.querySelector(".maxMinorInput");
      const minMajor = this.template.querySelector(".minMajorInput");
      const minMinor = this.template.querySelector(".minMinorInput");

      if (
        maxMajor.value &&
        maxMinor.value &&
        minMajor.value &&
        minMinor.value
      ) {
        minMajorVersion = minMajor.value;
        maxMajorVersion = maxMajor.value;
        minMinorVersion = minMinor.value;
        maxMinorVersion = maxMinor.value;

        this.displayFilterMeta = true;
      }
    }
    (async () => {
      await get2GPPackageVersionList({
        filterWrapper: wrapper,
        minMajorVersion: minMajorVersion,
        maxMajorVersion: maxMajorVersion,
        minMinorVersion: minMinorVersion,
        maxMinorVersion: maxMinorVersion,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
        versionLimit: this.versionLimit,
        versionOffset: this.versionOffset
      })
        .then(result => {
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
          if (isViewMore) {
            if (result.length === 0) {
              this.disableInfiniteLoad = false;
            } else {
              this.data = this.data.concat(result);
            }
          } else {
            this.data = result;
          }
          this.relativeDateTime = Date.now();
          this.versionsLength = this.data.length;
          this.displayEmptyView = this.data.length === 0 ? true : false;
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
          this.data = undefined;
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

  loadIsReleasedPackageVersions(packageID, isAncestry) {
    this.displaySpinner = true;
    let wrapper = [
      {
        fieldName: "Package2Id",
        value: packageID,
        dataType: "STRING"
      },
      {
        fieldName: "isReleased",
        value: true,
        dataType: "BOOLEAN"
      }
    ];
    let versionWrapper;
    (async () => {
      await get2GPPackageVersionList({
        filterWrapper: wrapper,
        filterRange: versionWrapper,
        sortedBy: "createdDate",
        sortDirection: "asc",
        versionLimit: "2000",
        versionOffset: "0"
      })
        .then(result => {
          this.displaySpinner = false;
          this.isReleasedData = result;
          if (isAncestry) {
            this.displayPackageVersionBreadCrumb = true;
            this.displayVersionDetails = false;
            this.displaySubscribersList = false;
            this.displayPackageSubscriberDetailBreadCrumb = false;
            this.displayReviewAncestryBreadCrumb = true;
          } else {
            this.treeState = true;
            this.summaryState = false;
            this.filterState = false;
            this.handleFilterState(this.filterState);
            this.responsivePanelStyle = this.filterState
              ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
              : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
          }
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
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

  loadMoreData() {
    if (this.disableInfiniteLoad) {
      this.versionOffset = this.versionOffset + this.versionLimit;
      this.loadPackageVersions(this.packageId, this.displayFilterMeta, true);
    }
  }

  createTreeGrid() {
    const rootItems = [];
    const lookup = {};

    for (const item of this.data) {
      const itemId = item.subscriberPackageVersionId;
      const parentId = item.ancestorId;

      if (!lookup[itemId]) {
        lookup[itemId] = {
          children: []
        };
      }

      lookup[itemId] = { ...item, children: lookup[itemId].children };
      let TreeItem = lookup[itemId];

      if (!parentId) {
        rootItems.push(TreeItem);
      } else {
        if (!lookup[parentId]) {
          lookup[parentId] = {
            children: []
          };
        }

        lookup[parentId] = Object.assign({ children: [] }, lookup[parentId]);
        lookup[parentId].children.push(TreeItem);
      }
      //this.expandedRows.push(itemId);
    }
    return rootItems;
  }

  handleRowAction(event) {
    const action = event.detail.action;
    const row = event.detail.row;
    switch (action.name) {
      case "show_details":
        this.handlePackageVersionClick();
        this.getPackageVersionDetails(row);
        this.selectedTab = "version-details";
        this.displayVersionDetailsTab = true;
        this.displayVersionSubscribersTab = false;
        this.displayPushUpgradesTab = false;
        break;
      case "view_subscribers":
        this.handlePackageVersionClick();
        this.getPackageVersionDetails(row);
        this.selectedTab = "version-subscribers";
        this.displayVersionDetailsTab = false;
        this.displayVersionSubscribersTab = true;
        this.displayPushUpgradesTab = false;
        break;
      default:
        this.selectedTab = "version-details";
        this.displayVersionDetailsTab = true;
        this.displayVersionSubscribersTab = false;
        this.displayPushUpgradesTab = false;
        break;
    }
  }

  getPackageVersionDetails(row) {
    this.versionId = row.id;
    this.packageId = row.package2Id;
    this.packageBuildNumber = row.buildNumber;
    this.packageHasPassedCodeCoverageCheck = row.hasPassedCodeCoverageCheck;
    this.packageInstallUrl = row.installUrl;
    this.packageIsDeprecated = row.isDeprecated;
    this.packageIsPasswordProtected = row.isPasswordProtected;
    this.packageIsReleased = row.isReleased;
    this.packageName = row.name;
    this.packageVersionNumber = row.versionNumber;
    this.packageSubscriberVersionId = row.subscriberPackageVersionId;
    this.packageValidationSkipped = row.validationSkipped;
    this.packageMetadataRemoved = row.hasMetadataRemoved;
    this.packageAncestorId = row.ancestorId;
    this.packageBranch = row.branch;
    this.packageTag = row.tag;
    this.packageDescription = row.description;
    this.packageBuildDurationInSeconds = row.buildDurationInSeconds;
    this.packageReleaseVersion = row.releaseVersion;
    this.packageLanguage = row.language;
    this.packageCreatedDate = row.createdDate;
    this.packageCreatedBy = row.owner;
    this.packageValidatedAsync = row.validatedAsync;
  }

  handleD3CurrentNode(event) {
    this.handleSummaryView();
    this.handlePackageVersionClick();
    this.getPackageVersionDetails(event.detail);
    this.selectedTab = "version-details";
    this.displayVersionDetailsTab = true;
    this.displayVersionSubscribersTab = false;
    this.displayPushUpgradesTab = false;
  }

  handleAllVersionsClick() {
    this.displayPackageVersionBreadCrumb = false;
    this.displayVersionDetails = false;
    this.displaySubscribersList = false;
    this.displayPackageSubscriberDetailBreadCrumb = false;
    this.displayReviewAncestryBreadCrumb = false;

    this.checkBoxFilterValues = [];
    this.displayFilterMeta = false;
    this.minMinorNumber = undefined;
    this.minMajorNumber = undefined;
    this.maxMinorNumber = undefined;
    this.maxMajorNumber = undefined;
    this.versionOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadPackageVersions(this.packageId, false, false);
  }

  handleSubscribersView() {
    this.displayPackageVersionBreadCrumb = true;
    this.displayVersionDetails = false;
    this.displaySubscribersList = true;
    this.displayPackageSubscriberDetailBreadCrumb = false;
    this.displayReviewAncestryBreadCrumb = false;
  }

  handleReviewAncestry(event) {
    this.packageSubscriberVersionId = event.detail;
    this.loadIsReleasedPackageVersions(this.packageId, true);
  }

  handlePushUpgrades() {
    this.displayPackageVersionBreadCrumb = true;
    this.displayVersionDetails = false;
    this.displaySubscribersList = false;
    this.displayPackageSubscriberDetailBreadCrumb = false;
    this.displayReviewAncestryBreadCrumb = false;
  }

  handlePackageVersionClick() {
    this.displayPackageVersionBreadCrumb = true;
    this.displayVersionDetails = true;
    this.displaySubscribersList = false;
    this.displayPackageSubscriberDetailBreadCrumb = false;
    this.displayReviewAncestryBreadCrumb = false;
  }

  handleSubscriberDetailView(event) {
    this.displayPackageVersionBreadCrumb = true;
    this.displayVersionDetails = false;
    this.displaySubscribersList = false;
    this.displaySubscriberDetail = true;
    this.displayPackageSubscriberDetailBreadCrumb = true;
    this.displayReviewAncestryBreadCrumb = false;
    this.getPackageSubscriberDetails(event.detail);
  }

  getPackageSubscriberDetails(row) {
    this.installedStatus = row.installedStatus;
    this.instanceName = row.instanceName;
    this.metadataPackageId = row.metadataPackageId;
    this.metadataPackageVersionId = row.metadataPackageVersionId;
    this.orgKey = row.orgKey;
    this.orgName = row.orgName;
    this.orgStatus = row.orgStatus;
    this.orgType = row.orgType;
    this.versionSubscribersDetail = true;
  }

  handleTreeView() {
    this.heightStyle = `table-style d3-height slds-p-horizontal_medium slds-p-bottom_medium`;
    if (this.treeState) {
      return;
    }
    this.loadIsReleasedPackageVersions(this.packageId, false);
  }

  handleSummaryView() {
    this.treeState = false;
    this.summaryState = true;
    this.heightStyle = `table-style table-height slds-p-horizontal_medium slds-p-bottom_medium`;
  }

  handleFilterPanel() {
    this.filterState = !this.filterState;
    this.handleFilterState(this.filterState);
    this.responsivePanelStyle = this.filterState
      ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
      : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
  }

  handleFilterState(state) {
    this.displayFilterDockPanel = state
      ? `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-is-open`
      : `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  }

  get checkBoxFilterOptions() {
    return [
      { label: "Is Released", value: "IsReleased" },
      { label: "Is Password Protected", value: "IsPasswordProtected" },
      {
        label: "Has Passed Code Coverage Check",
        value: "HasPassedCodeCoverageCheck"
      },
      { label: "Validation Skipped", value: "ValidationSkipped" }
    ];
  }

  handleCheckboxChange(event) {
    this.checkBoxFilterValues = event.detail.value;
  }

  handleFilterSubmit() {
    const maxMajor = this.template.querySelector(".maxMajorInput");
    const maxMinor = this.template.querySelector(".maxMinorInput");
    const minMajor = this.template.querySelector(".minMajorInput");
    const minMinor = this.template.querySelector(".minMinorInput");

    if (
      maxMajor.reportValidity() &&
      maxMinor.reportValidity() &&
      minMajor.reportValidity() &&
      minMinor.reportValidity()
    ) {
      if (
        maxMajor.value &&
        maxMinor.value &&
        minMajor.value &&
        minMinor.value
      ) {
        this.maxMajorNumber = maxMajor.value;
        this.maxMinorNumber = maxMinor.value;
        this.minMajorNumber = minMajor.value;
        this.minMinorNumber = minMinor.value;
      }
      this.filterState = false;
      this.handleFilterState(this.filterState);
      this.responsivePanelStyle = this.filterState
        ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
        : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
      this.versionOffset = 0;
      this.disableInfiniteLoad = true;
      this.loadPackageVersions(this.packageId, true, false);
    }
  }

  handleFilterReset() {
    this.checkBoxFilterValues = [];
    this.displayFilterMeta = false;
    this.minMinorNumber = undefined;
    this.minMajorNumber = undefined;
    this.maxMinorNumber = undefined;
    this.maxMajorNumber = undefined;
    this.versionOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadPackageVersions(this.packageId, false, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFilterEdit() {
    this.versionOffset = 0;
    this.loadPackageVersions(this.packageId, false, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFieldsToDisplay() {
    this.fieldsToDisplayModal = true;
  }

  handleFieldsToDisplayModalCancel() {
    this.fieldsToDisplayModal = false;
  }

  handleFieldsToDisplayModalSave(event) {
    if (event.detail !== null) {
      this.createColumns(event.detail);
      this.tableSelectedOptions = event.detail;
    }
    this.fieldsToDisplayModal = false;
  }

  createColumns(newColumns) {
    this.gridColumns = newColumns.reduce((accumulator, fieldValue) => {
      const columnData = Package2VersionData.fields[fieldValue];
      accumulator.push({ ...columnData });
      return accumulator;
    }, []);
    this.gridColumns.push({
      type: "action",
      typeAttributes: { rowActions: actions, menuAlignment: "auto" }
    });
  }

  handleMinSliderRefresh() {
    this.minSlider = undefined;
  }

  handleMaxSliderRefresh() {
    this.maxSlider = undefined;
  }

  handleMinSliderChange(event) {
    this.minSlider = event.target.value;
  }

  handleMaxSliderChange(event) {
    this.maxSlider = event.target.value;
  }

  minVersionInputChange(event) {
    this.minVersionInput = event.target.value;
  }

  maxVersionInputChange(event) {
    this.maxVersionInput = event.target.value;
  }

  handleIsExpanded() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.clickToExpandAll();
    } else {
      this.clickToCollapseAll();
    }
  }

  clickToExpandAll() {
    const grid = this.template.querySelector("lightning-tree-grid");
    grid.expandAll();
  }

  clickToCollapseAll() {
    const grid = this.template.querySelector("lightning-tree-grid");
    grid.collapseAll();
  }

  handleRowToggle(event) {
    if (event.detail.isExpanded) {
      this.toggleRows = this.toggleRows + 1;
    } else {
      this.toggleRows = this.toggleRows - 1;
    }
    this.isExpanded = this.toggleRows === 0 ? false : true;
  }

  handleScrollToLeft() {
    this.template.querySelector(".d3-box").scrollLeft = 0;
  }

  handleScrollToRight(event) {
    this.template.querySelector(".d3-box").scrollLeft =
      this.template.querySelector(".d3-box").offsetWidth + event.detail;
  }

  handleSort(event) {
    this.sortedBy = event.detail.fieldName;
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    this.sortedByLabel = Package2VersionData.fields[this.sortedBy].label;
    this.versionOffset = 0;
    this.loadPackageVersions(this.packageId, true, false);
  }

  handleExpandAll() {
    publish(this.messageContext, D3MESSAGECHANNEL, {
      d3ChartControls: `ExpandAll`
    });
  }

  handleCollapseAll() {
    publish(this.messageContext, D3MESSAGECHANNEL, {
      d3ChartControls: `CollapseAll`
    });
  }

  handleEdit() {
    this.sortedBy = 'SystemModstamp';
    this.sortedByLabel = 'Last Modified Date';
    this.sortDirection = 'desc';
    this.checkBoxFilterValues = [];
    this.displayFilterMeta = false;
    this.displayEmptyView = false;
    this.displaySpinner = true;
    this.loadPackageVersions(this.packageId, false, false);
  }

  handlePackageVersionUpdate(event) {
    this.packageName = event.detail.packageName;
    this.packageBranch = event.detail.packageBranch;
    this.packageTag = event.detail.packageTag;
    this.packageDescription = event.detail.packageDescription;
    this.packageIsReleased = event.detail.packageIsReleased;
  }

  handleSecurityReviewPromptCancel() {
    this.displaySecurityReviewInAppPrompt = false;
  }

  handlePackageVersioningCancel(){
    this.displayPackageVersioningInAppPrompt = false;
  }

  handleInAppPrompt(event) {
    if(event.detail.value === 'in-app-guidance-security-review'){
      this.displaySecurityReviewInAppPrompt = true;
    } else if (event.detail.value === 'in-app-guidance-package-versions'){
      this.displayPackageVersioningInAppPrompt = true;
    }
  }
}