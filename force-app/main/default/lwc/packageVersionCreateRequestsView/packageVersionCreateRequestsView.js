import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import PackageVersionCreateRequestFields from "./packageVersionCreateRequestFields";
import getPackage2VersionCreateRequestList from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestList";

const actions = [
  {
    label: "Show Details",
    name: "show_details",
    iconName: "utility:display_text"
  }
];

const columns = [
  {
    type: "button",
    fieldName: "Id",
    label: "Create Request Id",
    sortable: true,
    wrapText: true,
    iconName: "standard:record",
    typeAttributes: {
      label: { fieldName: "Id" },
      name: "show_details",
      variant: "base"
    }
  },
  {
    type: "text",
    fieldName: "Status",
    label: "Status",
    sortable: true
  },
  {
    type: "text",
    fieldName: "Package2VersionId",
    label: "Package Version Id (05i)",
    sortable: true,
    iconName: "standard:record"
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
    type: "text",
    fieldName: "CreatedByName",
    label: "Created By",
    sortable: true,
    iconName: "standard:user"
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions, menuAlignment: "auto" }
  }
];

export default class PackageVersionCreateRequestsView extends LightningElement {
  // The selected Package2 id (0Ho). Named packageId to match sibling views
  // (c-package-push-requests, c-package-versions-view); filters the Package2Id field.
  @api packageId;

  displaySpinner;
  displayDatatableSpinner;
  displayRequestsView;
  displayEmptyView;
  displayFilterMeta;

  requestsData;

  requestsLimit = 50;
  requestsOffset = 0;
  requestsLength;
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
  displayFilterDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;

  responsivePanelStyle = `direction:ltr;width:100%;`;

  displayAllRequests = true;
  displayRequestDetail;
  displayRequestDetailBreadCrumb;

  // Scalar props passed to the detail child on drill-in.
  detailId;
  detailStatus;
  detailPackage2VersionId;
  detailBranch;
  detailTag;
  detailLanguage;
  detailDependencyGraphJson;
  detailAsyncValidation;
  detailCalculateCodeCoverage;
  detailCalcTransitiveDependencies;
  detailSkipValidation;
  detailIsDevUsePkgZipRequested;
  detailIsPasswordProtected;
  detailIsConversionRequest;
  detailCreatedByName;
  detailCreatedDate;

  get tableOptions() {
    return [
      { label: "Create Request Id", value: "Id" },
      { label: "Status", value: "Status" },
      { label: "Package Id", value: "Package2Id" },
      { label: "Package Version Id (05i)", value: "Package2VersionId" },
      { label: "Branch", value: "Branch" },
      { label: "Tag", value: "Tag" },
      { label: "Language", value: "Language" },
      { label: "Calculate Code Coverage", value: "CalculateCodeCoverage" },
      { label: "Skip Validation", value: "SkipValidation" },
      {
        label: "Calc Transitive Dependencies",
        value: "CalcTransitiveDependencies"
      },
      { label: "Async Validation", value: "AsyncValidation" },
      { label: "Is Conversion Request", value: "IsConversionRequest" },
      { label: "Is Password Protected", value: "IsPasswordProtected" },
      {
        label: "Is Dev Use Pkg Zip Requested",
        value: "IsDevUsePkgZipRequested"
      },
      { label: "Created By", value: "CreatedByName" },
      { label: "Created Date", value: "CreatedDate" },
      { label: "Last Modified At", value: "SystemModstamp" }
    ];
  }

  get statusOptions() {
    // Values must match the Package2VersionCreateRequest Status picklist
    // verbatim (no spaces) — they build a SOQL `Status IN (...)` filter.
    return [
      { label: "Queued", value: "Queued" },
      { label: "Initializing", value: "Initializing" },
      {
        label: "Verifying Features And Settings",
        value: "VerifyingFeaturesAndSettings"
      },
      {
        label: "Verifying Dependencies",
        value: "VerifyingDependencies"
      },
      { label: "Verifying Metadata", value: "VerifyingMetadata" },
      {
        label: "Finalizing PackageVersion",
        value: "FinalizingPackageVersion"
      },
      {
        label: "Performing Validations",
        value: "PerformingValidations"
      },
      { label: "Error", value: "Error" },
      { label: "Success", value: "Success" }
    ];
  }

  connectedCallback() {
    this.loadRequests(true, false);
    this.tableSelectedOptions = [
      "Id",
      "Status",
      "Package2VersionId",
      "SystemModstamp",
      "CreatedByName"
    ];
  }

  loadRequests(applyFilters, isViewMore) {
    if (isViewMore) {
      this.displayDatatableSpinner = true;
    } else {
      this.displaySpinner = true;
    }
    let wrapper = [
      {
        fieldName: "Package2Id",
        value: this.packageId,
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
      await getPackage2VersionCreateRequestList({
        filterWrapper: wrapper,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
        requestLimit: this.requestsLimit,
        requestOffset: this.requestsOffset
      })
        .then((result) => {
          if (isViewMore) {
            if (result.length === 0) {
              this.disableInfiniteLoad = false;
            } else {
              this.requestsData = this.requestsData.concat(result);
            }
          } else {
            this.requestsData = result;
          }
          this.relativeDateTime = Date.now();
          this.requestsLength = this.requestsData.length;
          this.displayEmptyView = this.requestsLength === 0 ? true : false;

          this.displayRequestsView = true;
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
        })
        .catch((error) => {
          console.error(error);
          this.requestsData = undefined;
          this.displayRequestsView = false;
          this.displaySpinner = false;
          this.displayDatatableSpinner = false;
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
      this.requestsOffset = this.requestsOffset + this.requestsLimit;
      this.loadRequests(this.displayFilterMeta, true);
    }
  }

  handleFilterPanel() {
    this.filterState = !this.filterState;
    this.handleFilterState(this.filterState);
    this.responsivePanelStyle = this.filterState
      ? `direction:ltr; width:calc(100% - 320px);`
      : `direction:ltr;width:100%;`;
  }

  handleFilterState(state) {
    this.displayFilterDockPanel = state
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
      const columnData = PackageVersionCreateRequestFields.fields[fieldValue];
      if (columnData) {
        accumulator.push({ ...columnData });
      }
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
        this.getRequestDetails(row);
        this.handleRequestDetailsClick();
        break;
      default:
        break;
    }
  }

  handleRequestDetailsClick() {
    this.displayRequestDetailBreadCrumb = true;
    this.displayAllRequests = false;
    this.displayRequestDetail = true;
  }

  handleAllRequests() {
    this.displayRequestDetailBreadCrumb = false;
    this.displayAllRequests = true;
    this.displayRequestDetail = false;
  }

  getRequestDetails(row) {
    this.detailId = row.Id;
    this.detailStatus = row.Status;
    this.detailPackage2VersionId = row.Package2VersionId;
    this.detailBranch = row.Branch;
    this.detailTag = row.Tag;
    this.detailLanguage = row.Language;
    this.detailDependencyGraphJson = row.DependencyGraphJson;
    this.detailAsyncValidation = row.AsyncValidation;
    this.detailCalculateCodeCoverage = row.CalculateCodeCoverage;
    this.detailCalcTransitiveDependencies = row.CalcTransitiveDependencies;
    this.detailSkipValidation = row.SkipValidation;
    this.detailIsDevUsePkgZipRequested = row.IsDevUsePkgZipRequested;
    this.detailIsPasswordProtected = row.IsPasswordProtected;
    this.detailIsConversionRequest = row.IsConversionRequest;
    this.detailCreatedByName = row.CreatedByName;
    this.detailCreatedDate = row.CreatedDate;
  }

  handleSort(event) {
    this.sortedBy = event.detail.fieldName;
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    const sortedField = PackageVersionCreateRequestFields.fields[this.sortedBy];
    this.sortedByLabel = sortedField ? sortedField.label : this.sortedBy;
    this.requestsOffset = 0;
    this.loadRequests(true, false);
  }

  statusFilterChange(event) {
    this.selectedStatusOptions = event.detail.value;
    this.selectedStatusOptionsString = event.detail.value.join("~");
  }

  handleFilterReset() {
    this.selectedStatusOptions = [];
    this.selectedStatusOptionsString = undefined;
    this.requestsOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadRequests(false, false);
    this.filterState = true;
    this.displayFilterMeta = false;
    this.handleFilterState(this.filterState);
  }

  handleFilterEdit() {
    this.requestsOffset = 0;
    this.loadRequests(false, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFilterSubmit() {
    this.displayFilterMeta =
      this.selectedStatusOptions.length !== 0 ? true : false;
    this.filterState = false;
    this.handleFilterState(this.filterState);
    this.responsivePanelStyle = `direction:ltr;width:100%;`;
    this.requestsOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadRequests(true, false);
  }

  handleRefresh() {
    this.requestsOffset = 0;
    this.loadRequests(true, false);
    this.handleAllRequests();
  }
}
