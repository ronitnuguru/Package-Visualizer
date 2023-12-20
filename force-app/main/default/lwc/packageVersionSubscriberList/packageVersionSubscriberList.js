import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//import hasPackageVisualizerPushUpgrade from '@salesforce/customPermission/Package_Visualizer_Push_Upgrade';
import Package2SubscribersData from "./packageSubscribersFields";
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
    iconName: "standard:employee_organization"
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
    type: "date",
    fieldName: "SystemModstamp",
    label: "Last Modified At",
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

export default class PackageVersionSubscriberList extends LightningElement {
  @api subscriberPackageId;
  @api packageSubscriberVersionId;
  @api packageType;
  @api packageIsReleased;
  @api packageVersionNumber;

  columns = columns;
  versionSubscribersData;
  versionSubscribersList;
  versionSubscribersDetail;

  displaySpinner = true;
  displayInstanceSpinner;
  displayDatatableSpinner = false;
  displayEmptyView;
  displayFilterMeta;

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

  responsivePanelStyle = `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;

  selectedOrgStatusOptions = [];
  selectedOrgTypeOptions = [];
  selectedOrgStatusOptionsString = undefined;
  selectedOrgTypeOptionsString = undefined;
  searchTerm;

  selectedRows;
  displayAppAnalyticsMenuButton = true;
  displayUpgradeMenuButton = true;

  tableSelectedOptions = [];
  fieldsToDisplayModal = false;

  displayAppAnalyticsModal = false;
  displayPushUpgradesModal = false;

  sortedBy = "SystemModstamp";
  sortedByLabel = "Last Modified At";
  sortDirection = "desc";
  relativeDateTime = Date.now();

  subscriberLimit = 50;
  subscriberOffset = 0;
  subscribersLength;
  disableInfiniteLoad = true;

  regionsValues = [];
  instanceList;
  selectedInstancesString = undefined;

  /*
  get isPushUpgradeEnabled() {
    return hasPackageVisualizerPushUpgrade;
  }
  */

  get displayManagedPackageType() {
    return this.packageType === "Managed" ? true : false;
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
      { label: "Type", value: "orgType" },
      { label: "Parent Org", value: "parentOrg" },
      { label: "Last Modified At", value: "SystemModstamp" }
    ];
  }

  connectedCallback() {
    this.loadVersionSubscribersList(true, false);
    this.tableSelectedOptions = [
      "orgName",
      "orgStatus",
      "orgType",
      "instanceName",
      "SystemModstamp"
    ];

    this.loadInstancesFromTrust().then(result => {
      this.instanceList = result;
    });
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

  loadVersionSubscribersList(applyFilters, isViewMore) {
    if (isViewMore) {
      this.displayDatatableSpinner = true;
    } else {
      this.displaySpinner = true;
    }

    let wrapper;
    wrapper = [
      {
        fieldName: "MetadataPackageId",
        value: this.subscriberPackageId,
        dataType: "STRING"
      },
      {
        fieldName: "MetadataPackageVersionId",
        value: this.packageSubscriberVersionId,
        dataType: "STRING"
      }
    ];
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

  loadMoreData() {
    if (this.disableInfiniteLoad) {
      this.subscriberOffset = this.subscriberOffset + this.subscriberLimit;
      this.loadVersionSubscribersList(this.displayFilterMeta, true);
    }
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
    this.loadVersionSubscribersList(true, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
    this.displayAppAnalyticsMenuButton = true;
    this.displayUpgradeMenuButton = true;
    this.regionsValues = [];
  }

  handleFilterEdit() {
    this.subscriberOffset = 0;
    this.loadVersionSubscribersList(false, false);
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
    this.disableInfiniteLoad = true;
    if(this.regionsValues.length !== 0 && this.regionsValues.length !== 5){
      this.getFilteredInstanceList();
    } else {
      this.selectedInstancesString = undefined;
    }
    this.loadVersionSubscribersList(true, false);
    this.displayAppAnalyticsMenuButton = true;
    this.displayUpgradeMenuButton = true;
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
        this.loadVersionSubscribersList(true, false);
      } else if (this.searchTerm === "") {
        this.subscriberOffset = 0;
        this.loadVersionSubscribersList(true, false);
      } else {
        this.dispatchEvent(
          new ShowToastEvent({
            title: `Warning`,
            message: `Your search term must have 3 or more characters`,
            variant: "warning"
          })
        );
      }
      this.displayAppAnalyticsMenuButton = true;
      this.displayUpgradeMenuButton = true;
    }
  }

  getSelectedRows(event) {
    this.selectedRows = event.detail.selectedRows;
    this.displayAppAnalyticsMenuButton =
      this.selectedRows.length <= 16 && this.selectedRows.length !== 0
        ? false
        : true;
    this.displayUpgradeMenuButton =
      this.selectedRows.length <= 200 && this.selectedRows.length !== 0
        ? false
        : true;
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
    this.loadVersionSubscribersList(true, false);
  }

  handleAppAnalyticsSubscribers() {
    this.displayAppAnalyticsModal = true;
  }

  handleAppAnalyticsCloseModal() {
    this.displayAppAnalyticsModal = false;
  }

  handleRegionsChange(event) {
    this.regionsValues = event.detail.value;
  }

  /*
  handleSchedulePushUpgrades(){
    this.displayPushUpgradesModal = true;
  }

  handleSchedulePushUpgradesCloseModal(){
    this.displayPushUpgradesModal = false;
  }
  */
}