import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import Package2SubscribersData from "./packageSubscribersFields";
import getEligibleLowerPackageVersions from "@salesforce/apex/PushUpgradesCtrl.getEligibleLowerPackageVersions";
import get2GPPackageVersionSubscriberList from "@salesforce/apex/PackageVisualizerCtrl.get2GPPackageVersionSubscriberList";

const actions = [
  {
    label: "Show Details",
    name: "show_details",
    iconName: "utility:display_text"
  },
  {
    label: "Trust Status",
    name: "trust_status",
    iconName: "utility:salesforce1"
  }
];

const columns = [
  {
    type: "text",
    fieldName: "orgName",
    label: "Organization Name",
    sortable: true,
    iconName: "standard:employee_organization",
    wrapText: true
  },
  {
    type: "text",
    fieldName: "metadataPackageVersionId",
    label: "Package Version Id",
    sortable: true,
    iconName: "standard:record"
  },
  {
    type: "text",
    fieldName: "orgStatus",
    label: "Status",
    sortable: true
  },
  {
    type: "text",
    fieldName: "orgType",
    label: "Type",
    sortable: true
  },
  {
    type: "text",
    fieldName: "instanceName",
    label: "Instance",
    sortable: true,
    iconName: "standard:default"
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions, menuAlignment: "auto" }
  }
];

export default class PackagePushUpgradesView extends NavigationMixin(LightningElement) {
  @api packageVersionNumber;
  @api packageSubscriberVersionId;
  @api subscriberPackageId;
  @api packageIsReleased;

  majorVersion;
  minorVersion;
  patchVersion;

  packageVersions;
  packageVersionsData;

  sortedBy = "orgName";
  sortedByLabel = "Organization Name";
  sortDirection = "asc";
  relativeDateTime = Date.now();

  subscriberLimit = 50;
  subscriberOffset = 0;
  subscribersLength;

  displaySpinner = true;
  displayDatatableSpinner = false;
  displayInstanceSpinner;
  displayEmptyView;
  displayFilterMeta;

  columns = columns;
  versionSubscribersData;
  versionSubscribersList;
  versionSubscribersDetail;
  disableInfiniteLoad = true;

  installedStatus;
  instanceName;
  metadataPackageId;
  metadataPackageVersionId;
  orgKey;
  orgName;
  orgStatus;
  orgType;

  filterState = false;
  chartState = false;
  displayFilterDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  displayChartDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  chartInit;

  responsivePanelStyle = `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
  pushUpgradeBreadCrumbLabel;

  selectedOrgStatusOptions = [];
  selectedOrgTypeOptions = [];
  selectedOrgStatusOptionsString = undefined;
  selectedOrgTypeOptionsString = undefined;
  searchTerm;

  selectedRows;
  upgradeSubscribers;
  displayUpgradeButton = true;

  tableSelectedOptions = [];
  fieldsToDisplayModal = false;

  displayScheduleConfirmationModal;
  displayPushUpgradesInAppPrompt;

  regionsValues = [];
  instanceList;
  selectedInstancesString = undefined;

  filteredSubscriberPackageVersionID;
  filteredRecordPickerSubscriberPackageVersionID;

  /*
  packageVersionFilter = {
    criteria: [
      {
        fieldPath: 'sfLma__Package__r.sfLma__Package_ID__c',
        operator: 'eq',
        value: `${this.subscriberPackageId}`
      }
    ]
  }

 
  

  packageVersionFilter = {
    criteria: [
      {
        fieldPath: 'sfLma__Package__r.sfLma__Package_ID__c',
        operator: 'eq',
        value: `${this.subscriberPackageId}`
      }
    ]
  }
    */

  packageMatchingInfo = {
    primaryField: { fieldPath: 'Name' }
  };

  packageDisplayInfo = {
    primaryField: 'Name',
    additionalFields: ['sfLma__Release_Date__c']
  };

  get displayManagedPackageType() {
    return true;
  }

  get regionsOptions() {
    return [
      { label: "Americas", value: "NA" },
      { label: "EMEA", value: "EMEA" },
      { label: "Asia Pacific", value: "APAC" },
    ];
  }

  get tableOptions() {
    return [
      { label: "Instance Name", value: "instanceName" },
      { label: "Metadata Package Id", value: "metadataPackageId" },
      {
        label: "Metadata Package Version Id",
        value: "metadataPackageVersionId"
      },
      { label: "Organization Id", value: "orgKey" },
      { label: "Organization Name", value: "orgName" },
      { label: "Status", value: "orgStatus" },
      { label: "Type", value: "orgType" }
    ];
  }

  connectedCallback() {
    this.tableSelectedOptions = [
      "orgName",
      "metadataPackageVersionId",
      "orgStatus",
      "orgType",
      "instanceName"
    ];
    this.pushUpgradeBreadCrumbLabel = `Subscribers on version lower than ${this.packageVersionNumber}`;
    this.loadInstancesFromTrust().then(result => {
      this.instanceList = result;
    });

    this.packageVersionFilter = {
      criteria: [
        {
          fieldPath: 'sfLma__Package__r.sfLma__Package_ID__c',
          operator: 'eq',
          value: `${this.subscriberPackageId}`
        },
        {
          fieldPath: 'sfLma__Version_ID__c',
          operator: 'lt',
          value: `${this.packageSubscriberVersionId}`
        }
      ]
    }
  }

  disconnectedCallback() {
    this.versionSubscribersList = true;
    this.versionSubscribersDetail = false;
  }

  async loadInstancesFromTrust() {
    this.displayInstanceSpinner = true;
    let instances;
    let trustEndPoint = "https://api.status.salesforce.com/v1/instances";
    try {
      const response = await fetch(trustEndPoint);
      instances = await response.json();
      this.displayInstanceSpinner = false;
      return instances.map(instance => ({
        key: instance.key,
        location: instance.location
      }));
    } catch (err) {
      this.displayInstanceSpinner = false;
      console.error(err);
      return instances;
    }
  }

  @wire(getEligibleLowerPackageVersions, {
    packageVersionNumber: "$packageVersionNumber",
    subscriberPackageId: "$subscriberPackageId"
  })
  lowerPackageVersions(result) {
    this.packageVersions = result;
    if (result.data) {
      this.packageVersionsData = result.data.map(version => version.Id);
      this.packageVersionsData = this.packageVersionsData
        .toString()
        .replaceAll(",", "~");
      if (result.data.length === 0) {
        this.versionSubscribersData = true;
        this.displayEmptyView = true;
        this.displaySpinner = false;
      } else {
        this.getSubscribersFromVersions(false, false);
      }
    } else if (result.error) {
      this.packageVersionsData = undefined;
      console.error(result.error);
    }
  }

  getSubscribersFromVersions(applyFilters, isViewMore) {
    if (isViewMore) {
      this.displayDatatableSpinner = true;
    } else {
      this.displaySpinner = true;
    }
    let wrapper = [
      {
        fieldName: "MetadataPackageId",
        value: this.subscriberPackageId,
        dataType: "STRING"
      },
      {
        fieldName: "MetadataPackageVersionId",
        value: this.packageVersionsData,
        dataType: "LIST"
      }
    ];
    let editableFields = this.template.querySelectorAll(".edit-field");
    editableFields.forEach(input => {
      if (input.value) {
        wrapper.push({
          fieldName: input.name,
          value: input.value,
          dataType: "STRING"
        });
        this.displayFilterMeta = true;
      }
    });
    if (this.searchTerm !== undefined) {
      if (this.searchTerm.length >= 3) {
        wrapper.push({
          fieldName: "OrgName",
          value: this.searchTerm,
          dataType: "SEARCH"
        });
      }
    }
    if (applyFilters) {
      if (
        this.selectedOrgTypeOptionsString !== "" &&
        this.selectedOrgTypeOptionsString !== undefined
      ) {
        wrapper.push({
          fieldName: "OrgType",
          value: this.selectedOrgTypeOptionsString,
          dataType: "LIST"
        });
      }
      if (
        this.selectedOrgStatusOptionsString !== "" &&
        this.selectedOrgStatusOptionsString !== undefined
      ) {
        wrapper.push({
          fieldName: "OrgStatus",
          value: this.selectedOrgStatusOptionsString,
          dataType: "LIST"
        });
      }
      if (
        this.selectedInstancesString !== "" &&
        this.selectedInstancesString !== undefined
      ) {
        wrapper.push({
          fieldName: "InstanceName",
          value: this.selectedInstancesString,
          dataType: "LIST"
        });
      }
    }
    (async () => {
      await get2GPPackageVersionSubscriberList({
        filterWrapper: wrapper,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
        subscriberLimit: this.subscriberLimit,
        subscriberOffset: this.subscriberOffset
      })
        .then(result => {
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
          this.versionSubscribersList = true;

          if (isViewMore) {
            if (result.length === 0) {
              this.disableInfiniteLoad = false;
            } else {
              this.versionSubscribersData = this.versionSubscribersData.concat(
                result
              );
            }
          } else {
            this.versionSubscribersData = result;
          }
          this.relativeDateTime = Date.now();
          this.subscribersLength = this.versionSubscribersData.length;
          this.displayEmptyView =
            this.versionSubscribersData.length === 0 ? true : false;
        })
        .catch(error => {
          console.error(error);
          this.versionSubscribersData = undefined;
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
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

  handleRowAction(event) {
    const action = event.detail.action;
    const row = event.detail.row;
    const trustUrl = `https://status.salesforce.com/instances/${row.instanceName}`;
    switch (action.name) {
      case "show_details":
        this.dispatchEvent(new CustomEvent("subscribedetail", { detail: row }));
        break;
      case "trust_status":
        window.open(trustUrl, "_blank");
        break;
      default:
        break;
    }
  }

  handleFilterPanel() {
    this.filterState = !this.filterState;
    this.handleFilterState(this.filterState);
    this.chartState = false;
    this.handleChartState(false);
    this.responsivePanelStyle = this.filterState
      ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
      : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
  }

  handleChartPanel() {
    this.chartInit = true;
    this.chartState = !this.chartState;
    this.handleChartState(this.chartState);
    this.filterState = false;
    this.handleFilterState(false);
    this.responsivePanelStyle = this.chartState
      ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
      : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
  }

  handleFilterState(state) {
    this.displayFilterDockPanel = state
      ? `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-is-open`
      : `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  }

  handleChartState(state) {
    this.displayChartDockPanel = state
      ? `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-is-open`
      : `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  }

  get orgStatusOptions() {
    return [
      { label: "Active", value: "Active" },
      { label: "Demo", value: "Demo" },
      { label: "Free", value: "Free" },
      { label: "Inactive", value: "Inactive" },
      { label: "Trial", value: "Trial" }
    ];
  }

  get orgTypeOptions() {
    return [
      { label: "Production", value: "Production" },
      { label: "Sandbox", value: "Sandbox" }
    ];
  }

  orgStatusFilterChange(event) {
    this.selectedOrgStatusOptions = event.detail.value;
    this.selectedOrgStatusOptionsString = event.detail.value.join("~");
  }

  orgTypeFilterChange(event) {
    this.selectedOrgTypeOptions = event.detail.value;
    this.selectedOrgTypeOptionsString = event.detail.value.join("~");
  }

  getSelectedRows(event) {
    this.selectedRows = event.detail.selectedRows;
    this.upgradeSubscribers = event.detail.selectedRows.map(row => row.orgKey);

    this.displayUpgradeButton =
      this.upgradeSubscribers.length <= 10000 &&
        this.upgradeSubscribers.length !== 0
        ? false
        : true;
  }

  handleFilteredSubscriberPackageVersionIDChange(event) {
    this.filteredSubscriberPackageVersionID = event.detail.value;
  }

  
  handleFilteredRecordPickerSubscriberPackageVersionIDChange(event){
    this.filteredRecordPickerSubscriberPackageVersionID = event.detail.recordId;
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
    this.columns = newColumns.reduce((accumulator, fieldValue) => {
      const columnData = Package2SubscribersData.fields[fieldValue];
      accumulator.push({ ...columnData });
      return accumulator;
    }, []);
    this.columns.push({
      type: "action",
      typeAttributes: { rowActions: actions, menuAlignment: "auto" }
    });
  }

  handleSort(event) {
    this.sortedBy = event.detail.fieldName;
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    this.sortedByLabel = Package2SubscribersData.fields[this.sortedBy].label;
    this.subscriberOffset = 0;
    this.getSubscribersFromVersions(this.displayFilterMeta, false);
  }

  loadMoreData() {
    if (this.disableInfiniteLoad && this.subscriberOffset <= 1950) {
      this.subscriberOffset = this.subscriberOffset + this.subscriberLimit;
      this.getSubscribersFromVersions(this.displayFilterMeta, true);
    } else if (this.subscriberOffset === 2000){
        this.dispatchEvent(
          new ShowToastEvent({
            title: `Push Upgrades Limit`,
            message: `You can only choose up to 2050 subscribers for push upgrade requests`,
            variant: "info"
          })
        );
    }
  }

  handleFilterReset() {
    this.selectedOrgStatusOptions = [];
    this.selectedOrgTypeOptions = [];
    this.searchTerm = undefined;
    this.selectedOrgStatusOptionsString = undefined;
    this.selectedOrgTypeOptionsString = undefined;
    this.selectedInstancesString = undefined;
    this.displayFilterMeta = false;
    this.subscriberOffset = 0;
    this.disableInfiniteLoad = true;
    this.filteredSubscriberPackageVersionID = undefined;
    this.filteredRecordPickerSubscriberPackageVersionID = undefined;
    this.getSubscribersFromVersions(true, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
    this.displayUpgradeButton = true;
    this.regionsValues = [];
  }

  handleFilterEdit() {
    this.subscriberOffset = 0;
    this.getSubscribersFromVersions(false, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFilterSubmit() {
    this.displayFilterMeta =
      this.selectedOrgStatusOptions.length !== 0 ||
        this.selectedOrgTypeOptions.length !== 0 ||
        this.regionsValues.length !== 0
        ? true
        : false;
    this.filterState = false;
    this.handleFilterState(this.filterState);
    this.responsivePanelStyle = this.filterState
      ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
      : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
    this.subscriberOffset = 0;
    if (this.regionsValues.length !== 0 && this.regionsValues.length !== 5) {
      this.getFilteredInstanceList();
    } else {
      this.selectedInstancesString = undefined;
    }
    this.disableInfiniteLoad = true;
    this.getSubscribersFromVersions(true, false);
    this.displayUpgradeButton = true;
  }

  getFilteredInstanceList() {
    const instances = this.instanceList.filter(instance =>
      this.regionsValues.includes(instance.location)
    );
    this.selectedInstancesString = instances
      .map(instance => {
        return instance.key;
      })
      .join("~");
  }

  handleSearchTermChange(event) {
    const isEnterKey = event.keyCode === 13;
    if (isEnterKey) {
      this.searchTerm = event.target.value;
      if (this.searchTerm.length >= 3) {
        this.subscriberOffset = 0;
        this.getSubscribersFromVersions(true, false);
      } else if (this.searchTerm === "") {
        this.subscriberOffset = 0;
        this.getSubscribersFromVersions(true, false);
      } else {
        this.dispatchEvent(
          new ShowToastEvent({
            title: `Warning`,
            message: `Your search term must have 3 or more characters`,
            variant: "warning"
          })
        );
      }
      this.displayUpgradeButton = true;
    }
  }

  handleUpgrade() {
    this.displayScheduleConfirmationModal = true;
  }

  handleCancelScheduleConfirmationModal() {
    this.displayScheduleConfirmationModal = false;
  }

  handlePushUpgradesPromptCancel() {
    this.displayPushUpgradesInAppPrompt = false;
  }

  handleInAppPrompt() {
    this.displayPushUpgradesInAppPrompt = true;
  }

  handleRegionsChange(event) {
    this.regionsValues = event.detail.value;
  }

  handleHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/push_upgrade_intro.htm`
      }
    });
  }
}