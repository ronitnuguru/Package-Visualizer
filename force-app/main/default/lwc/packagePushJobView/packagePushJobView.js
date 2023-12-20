import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import PackagePushJobFields from "./packagePushJobFields";
import getPackageVersionPushJobs from "@salesforce/apexContinuation/PushUpgradesCtrl.getPackageVersionPushJobs";
import updatePackagePushRequest from "@salesforce/apex/PushUpgradesCtrl.updatePackagePushRequest";
import getPackagePushJobChartData from "@salesforce/apex/PushUpgradesCtrl.getPackagePushJobChartData";

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
    fieldName: "SubscriberOrganizationKey",
    label: "Subscriber Org",
    sortable: true,
    iconName: "standard:employee_organization"
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

export default class PackagePushJobView extends LightningElement {
  @api pushId;
  @api pushDurationSeconds;
  @api pushEndTime;
  @api pushPackageVersionId;
  @api pushScheduledStartTime;
  @api pushStartTime;
  @api pushStatus;
  @api pushSystemModStamp;

  displayPackagePushJobs = true;
  packagePushJobsAccordionClass = `slds-section slds-var-p-top_medium slds-is-open`;

  displaySpinner;
  displayDatatableSpinner;
  displayPushJobView;
  displayEmptyView;
  displayFilterMeta;

  pushJobsData;

  pushJobsLimit = 50;
  pushJobsOffset = 0;
  pushJobsLength;
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

  filterState = false;
  chartState = false;
  displayFilterDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  displayChartDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
  chartInit;

  responsivePanelStyle = `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;`;

  displayAbortModal;

  displayStatusProgress;
  totalProgress;
  successProgress;
  progressStyle;

  get status() {
    return this.pushStatus === "InProgress" ? "In Progress" : this.pushStatus;
  }

  get abortBody() {
    return `Are you sure you want to abort Push Request "${this.pushId}"`;
  }

  get tableOptions() {
    return [
      { label: "Push Job Id", value: "Id" },
      { label: "Package Push Request Id", value: "PackagePushRequestId" },
      {
        label: "Subscriber Org",
        value: "SubscriberOrganizationKey"
      },
      { label: "Status", value: "Status" },
      { label: "Start Time", value: "StartTime" },
      { label: "End Time", value: "EndTime" },
      { label: "Duration Seconds", value: "DurationSeconds" },
      { label: "Last Modified At", value: "SystemModstamp" }
    ];
  }

  connectedCallback() {
    this.loadPackagePushJobs(true, false);
    this.tableSelectedOptions = [
      "SubscriberOrganizationKey",
      "Status",
      "DurationSeconds",
      "SystemModstamp"
    ];

    if (this.pushStatus === "Succeeded" || this.pushStatus === "Failed") {
      this.getPackagePushJobAggregate();
    }
  }

  getPackagePushJobAggregate() {
    let wrapper = [
      {
        fieldName: "PackagePushRequestId",
        value: this.pushId,
        dataType: "STRING"
      }
    ];
    (async () => {
      await getPackagePushJobChartData({
        filterWrapper: wrapper,
        groupByField: "Status"
      })
        .then(result => {
          this.totalProgress = result.reduce(function(a, b) {
            return a + b.expr0;
          }, 0);
          const success = result.find(jobs => jobs.Status === "Succeeded");
          this.successProgress = success ? success.expr0 : 0;
          const successPercentage = Math.round(
            (this.successProgress / this.totalProgress) * 100
          );
          this.progressStyle = `width:${successPercentage}%`;
          this.displayStatusProgress = true;
        })
        .catch(error => {
          console.error(error);
        });
    })();
  }

  loadPackagePushJobs(applyFilters, isViewMore) {
    if (isViewMore) {
      this.displayDatatableSpinner = true;
    } else {
      this.displaySpinner = true;
    }
    let wrapper;
    wrapper = [
      {
        fieldName: "PackagePushRequestId",
        value: this.pushId,
        dataType: "STRING"
      }
    ];
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
      await getPackageVersionPushJobs({
        filterWrapper: wrapper,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
        pushJobsLimit: this.pushJobsLimit,
        pushJobsOffset: this.pushJobsOffset
      })
        .then(result => {
          if (isViewMore) {
            if (result.length === 0) {
              this.disableInfiniteLoad = false;
            } else {
              this.pushJobsData = this.pushJobsData.concat(result);
            }
          } else {
            this.pushJobsData = result;
          }
          this.relativeDateTime = Date.now();
          this.pushJobsLength = this.pushJobsData.length;
          this.displayEmptyView = this.pushJobsLength === 0 ? true : false;

          this.displayPushJobView = true;
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
        })
        .catch(error => {
          console.error(error);
          this.pushJobsData = undefined;
          this.displayPushJobView = false;
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
      this.pushJobsOffset = this.pushJobsOffset + this.pushJobsLimit;
      this.loadPackagePushJobs(this.displayFilterMeta, true);
    }
  }

  get displayLoadingIcon() {
    return this.pushStatus === "Created" ||
      this.pushStatus === "Pending" ||
      this.pushStatus === "InProgress"
      ? true
      : false;
  }

  get displayAbort() {
    return this.pushStatus === "Created" || this.pushStatus === "Pending"
      ? true
      : false;
  }

  get displaySuccessIcon() {
    return this.pushStatus === "Succeeded" ? true : false;
  }

  get displayWarningIcon() {
    return this.pushStatus === "Canceled" ? true : false;
  }

  get displayErrorIcon() {
    return this.pushStatus === "Failed" ? true : false;
  }

  togglePackgePushJobsAccordion() {
    this.displayPackagePushJobs = !this.displayPackagePushJobs;
    this.packagePushJobsAccordionClass = this.displayPackagePushJobs
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
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
      const columnData = PackagePushJobFields.fields[fieldValue];
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
        this.dispatchEvent(new CustomEvent("pushjobdetail", { detail: row }));
        break;
      default:
        break;
    }
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

  statusFilterChange(event) {
    this.selectedStatusOptions = event.detail.value;
    this.selectedStatusOptionsString = event.detail.value.join("~");
  }

  handleSort(event) {
    this.sortedBy = event.detail.fieldName;
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    this.sortedByLabel = PackagePushJobFields.fields[this.sortedBy].label;
    this.pushJobsOffset = 0;
    this.loadPackagePushJobs(true, false);
  }

  handleFilterReset() {
    this.selectedStatusOptions = [];
    this.selectedStatusOptionsString = undefined;
    this.pushJobsOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadPackagePushJobs(false, false);
    this.displayFilterMeta = false;
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFilterEdit() {
    this.pushJobsOffset = 0;
    this.loadPackagePushJobs(false, false);
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
    this.pushJobsOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadPackagePushJobs(true, false);
  }

  handleRefresh() {
    this.pushJobsOffset = 0;
    this.loadPackagePushJobs(true, false);
  }

  handleAbort() {
    this.displayAbortModal = true;
  }

  onBrandClick() {
    this.updatePushRequestStatus(this.pushId, "Canceled");
    this.displayAbortModal = false;
  }

  onNeutralClick() {
    this.displayAbortModal = false;
  }

  updatePushRequestStatus(packagePushRequestId, status) {
    this.displaySpinner = true;
    (async () => {
      await updatePackagePushRequest({
        packagePushRequestId: packagePushRequestId,
        status: status
      })
        .then(result => {
          this.displaySpinner = false;
          this.dispatchEvent(new CustomEvent("cancel"));
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message:
                "Your pushed upgrade request has been successfully updated",
              variant: "success"
            })
          );
          this.dispatchEvent(new CustomEvent("refresh"));
        })
        .catch(error => {
          console.error(error.body.message);
          this.displaySpinner = false;
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