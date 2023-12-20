import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import PackagePushRequestFields from "./packagePushRequestFields";
import getPackageVersionPushRequests from "@salesforce/apexContinuation/PushUpgradesCtrl.getPackageVersionPushRequests";

const actions = [
  {
    label: "Show Details",
    name: "show_details",
    iconName: "utility:display_text"
  }
];

const columns = [
  {
    type: "text",
    fieldName: "Id",
    label: "Push Request Id",
    sortable: true,
    iconName: "standard:record"
  },
  {
    type: "text",
    fieldName: "PackageVersionId",
    label: "Package Version Id",
    sortable: true,
    iconName: "standard:record"
  },
  {
    type: "date",
    fieldName: "ScheduledStartTime",
    label: "Scheduled Start Time",
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
    type: "text",
    fieldName: "Status",
    label: "Status",
    sortable: true
  },
  {
    type: "number",
    fieldName: "DurationSeconds",
    label: "Duration Seconds",
    sortable: false,
    iconName: "standard:number_input"
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

export default class PackagePushUpgradesHistoryView extends LightningElement {
  @api packageSubscriberVersionId;
  @api packageVersionList;
  @api versionLimit;

  displaySpinner;
  displayDatatableSpinner;
  displayPushHistoryView;
  displayEmptyView;
  displayFilterMeta;

  pushRequestsData;

  pushRequestsLimit = 50;
  pushRequestsOffset = 0;
  pushRequestsLength;
  disableInfiniteLoad = true;

  tableSelectedOptions = [];
  fieldsToDisplayModal;

  sortedBy = "SystemModstamp";
  sortedByLabel = "Last Modified At";
  sortDirection = "desc";
  relativeDateTime = Date.now();

  columns = columns;

  selectedStatusOptions = [];
  selectedStatusOptionsString = undefined;
  versionLimitChange;

  filterState = false;
  chartState = false;
  displayFilterDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  displayChartDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;

  responsivePanelStyle = `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;

  displayAllPushRequests = true;
  displayPackagePushRequests;
  displayPackagePushJobRequests;

  displayPackagePushRequestBreadCrumb;
  displayPackagePushJobBreadCrumb;

  pushId;
  pushDurationSeconds;
  pushEndTime;
  pushPackageVersionId;
  pushScheduledStartTime;
  pushStartTime;
  pushStatus;
  pushSystemModStamp;

  pushJobDetails;

  get tableOptions() {
    return [
      { label: "Push Request Id", value: "Id" },
      { label: "Package Version Id", value: "PackageVersionId" },
      {
        label: "Scheduled Start Time",
        value: "ScheduledStartTime"
      },
      { label: "Status", value: "Status" },
      { label: "Start Time", value: "StartTime" },
      { label: "End Time", value: "EndTime" },
      { label: "Duration Seconds", value: "DurationSeconds" },
      { label: "Last Modified At", value: "SystemModstamp" }
    ];
  }

  connectedCallback() {
    this.loadPackagePushRequests(true, false);
    this.tableSelectedOptions = [
      "Id",
      "PackageVersionId",
      "ScheduledStartTime",
      "Status",
      "DurationSeconds",
      "SystemModstamp"
    ];
  }

  loadPackagePushRequests(applyFilters, isViewMore) {
    if (isViewMore) {
      this.displayDatatableSpinner = true;
    } else {
      this.displaySpinner = true;
    }
    let wrapper;
    if (this.packageSubscriberVersionId) {
      wrapper = [
        {
          fieldName: "PackageVersionId",
          value: this.packageSubscriberVersionId,
          dataType: "STRING"
        }
      ];
    } else if (this.packageVersionList) {
      wrapper = [
        {
          fieldName: "PackageVersionId",
          value: this.packageVersionList.join("~"),
          dataType: "LIST"
        }
      ];
    }

    if (applyFilters) {
      if (
        this.selectedStatusOptionsString !== "" &&
        this.selectedStatusOptionsString !== undefined
      ) {
        wrapper.push({
          fieldName: "Status",
          value: this.selectedStatusOptionsString,
          dataType: "LIST"
        });
      }
    }
    (async () => {
      await getPackageVersionPushRequests({
        filterWrapper: wrapper,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
        pushRequestLimit: this.pushRequestsLimit,
        pushRequestOffset: this.pushRequestsOffset
      })
        .then(result => {
          if (isViewMore) {
            if (result.length === 0) {
              this.disableInfiniteLoad = false;
            } else {
              this.pushRequestsData = this.pushRequestsData.concat(result);
            }
          } else {
            this.pushRequestsData = result;
          }
          this.relativeDateTime = Date.now();
          this.pushRequestsLength = this.pushRequestsData.length;
          this.displayEmptyView = this.pushRequestsLength === 0 ? true : false;

          this.displayPushHistoryView = true;
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
        })
        .catch(error => {
          console.error(error);
          this.pushRequestsData = undefined;
          this.displayPushHistoryView = false;
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
      this.pushRequestsOffset =
        this.pushRequestsOffset + this.pushRequestsLimit;
      this.loadPackagePushRequests(this.displayFilterMeta, true);
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
      const columnData = PackagePushRequestFields.fields[fieldValue];
      accumulator.push({ ...columnData });
      return accumulator;
    }, []);
    this.columns.push({
      type: "action",
      typeAttributes: { rowActions: actions, menuAlignment: "auto" }
    });
  }

  handleRowAction(event) {
    const action = event.detail.action;
    const row = event.detail.row;
    switch (action.name) {
      case "show_details":
        this.handlePushRequestDetailsClick();
        this.getPushDetails(row);
        break;
      default:
        break;
    }
  }

  handlePushRequestDetailsClick() {
    this.displayPackagePushRequestBreadCrumb = true;
    this.displayPackagePushJobBreadCrumb = false;

    this.displayAllPushRequests = false;
    this.displayPackagePushRequests = true;
    this.displayPackagePushJobRequests = false;
  }

  handlePushRequests() {
    this.handlePushRequestDetailsClick();
  }

  handleAllPushRequests() {
    this.displayPackagePushRequestBreadCrumb = true;
    this.displayPackagePushRequestBreadCrumb = false;
    this.displayPackagePushJobBreadCrumb = false;

    this.displayAllPushRequests = true;
    this.displayPackagePushRequests = false;
    this.displayPackagePushJobRequests = false;
  }

  handlePushJobDetail(event) {
    this.displayPackagePushJobBreadCrumb = true;

    this.displayAllPushRequests = false;
    this.displayPackagePushRequests = false;
    this.displayPackagePushJobRequests = true;

    this.pushJobDetails = event.detail;
  }

  getPushDetails(row) {
    this.pushId = row.Id;
    this.pushDurationSeconds = row.DurationSeconds;
    this.pushEndTime = row.EndTime;
    this.pushPackageVersionId = row.PackageVersionId;
    this.pushScheduledStartTime = row.ScheduledStartTime;
    this.pushStartTime = row.StartTime;
    this.pushStatus = row.Status;
    this.pushSystemModStamp = row.SystemModstamp;
  }

  get statusOptions() {
    return [
      { label: "Created", value: "Created" },
      { label: "Pending", value: "Pending" },
      { label: "In Progress", value: "InProgress" },
      { label: "Succeeded", value: "Succeeded" },
      { label: "Canceled", value: "Canceled" },
      { label: "Failed", value: "Failed" }
    ];
  }

  handleSort(event) {
    this.sortedBy = event.detail.fieldName;
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    this.sortedByLabel = PackagePushRequestFields.fields[this.sortedBy].label;
    this.pushRequestsOffset = 0;
    this.loadPackagePushRequests(true, false);
  }

  statusFilterChange(event) {
    this.selectedStatusOptions = event.detail.value;
    this.selectedStatusOptionsString = event.detail.value.join("~");
  }

  handleFilterReset() {
    this.selectedStatusOptions = [];
    this.selectedStatusOptionsString = undefined;
    this.versionLimitChange = undefined;
    this.pushRequestsOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadPackagePushRequests(false, false);
    this.filterState = true;
    this.displayFilterMeta = false;
    this.handleFilterState(this.filterState);
  }

  handleFilterEdit() {
    this.pushRequestsOffset = 0;
    this.loadPackagePushRequests(false, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFilterSubmit() {
    this.displayFilterMeta =
      this.selectedStatusOptions.length !== 0 ? true : false;
    this.filterState = false;
    this.handleFilterState(this.filterState);
    this.responsivePanelStyle = this.filterState
      ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
      : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
    this.pushRequestsOffset = 0;

    if (this.versionLimitChange) {
      this.dispatchEvent(
        new CustomEvent("versionchange", { detail: this.versionLimitChange })
      );
      return;
    }
    this.pushRequestsOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadPackagePushRequests(true, false);
  }

  handleRefresh() {
    this.pushRequestsOffset = 0;
    this.loadPackagePushRequests(true, false);
    this.handleAllPushRequests();
  }

  handleSliderChange(event) {
    this.versionLimitChange = event.target.value;
  }
}