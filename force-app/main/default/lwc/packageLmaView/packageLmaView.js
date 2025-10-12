import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import PackageLmaFields from "./packageLmaFields";
import getLMAVersion from "@salesforce/apex/PackageVisualizerCtrl.getLMAVersion";
import getPackageVersionLicenses from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackageVersionLicenses";

const actions = [
  {
    label: "Show Details",
    name: "show_details",
    iconName: "utility:display_text"
  },
  {
    label: "Send Email",
    name: "send_email",
    iconName: "utility:sender_email"
  }
];

const columns = [
  {
    type: "url",
    fieldName: "id",
    label: "License Name",
    typeAttributes: {
      label: {
        fieldName: "name",
        target: "_blank"
      }
    },
    sortable: true,
    iconName: "custom:custom45"
  },
  {
    type: "url",
    fieldName: "leadId",
    label: "Lead",
    typeAttributes: {
      label: {
        fieldName: "leadName",
        target: "_blank"
      }
    },
    sortable: false,
    iconName: "standard:lead"
  },
  {
    type: "url",
    fieldName: "accountId",
    label: "Account",
    typeAttributes: {
      label: {
        fieldName: "accountName",
        target: "_blank"
      }
    },
    sortable: false,
    iconName: "standard:account"
  },
  {
    type: "url",
    fieldName: "contactId",
    label: "Contact",
    typeAttributes: {
      label: {
        fieldName: "contactName",
        target: "_blank"
      }
    },
    sortable: false,
    iconName: "standard:contact"
  },
  {
    type: "text",
    fieldName: "leadSource",
    label: "Lead Source",
    sortable: false
  },
  {
    type: "text",
    fieldName: "licenseStatus",
    label: "License Status",
    sortable: false
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions, menuAlignment: "auto" }
  }
];

export default class PackageLmaView extends NavigationMixin(LightningElement) {
  @api packageSubscriberVersionId;

  displaySpinner = true;
  displayDatatableSpinner;
  displayLmaLicensesView;
  displayEmptyView;
  displayFilterMeta;

  lmaLicensesData;

  lmaLicensesLimit = 50;
  lmaLicensesOffset = 0;
  lmaLicensesLength;
  disableInfiniteLoad = true;

  tableSelectedOptions = [];
  fieldsToDisplayModal;

  sortedBy = "id";
  sortedByLabel = "License Name";
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

  responsivePanelStyle = `direction:ltr;width:100%;`;

  lmaData;
  displayEmptyLMA;
  versionIcon;
  versionLink;
  packageLink;
  packageVersionId;

  displayAllLicenses = false;
  allLicensesAccordionClass = `slds-section slds-var-p-top_medium`;

  displayLicenseTimelineState = false;
  chosenLicenseRecord;

  displayLMAInAppPrompt;

  displayGenAiLicenses = false;
  genAiLicensesAccordionClass = `slds-section slds-var-p-top_medium`;

  aiResponse;
  error;

  get tableOptions() {
    return [
      { label: "License Name", value: "id" },
      { label: "Lead", value: "leadName" },
      {
        label: "Account",
        value: "accountName"
      },
      { label: "Contact", value: "contactName" },
      { label: "License Status", value: "licenseStatus" },
      { label: "Lead Source", value: "leadSource" },
      { label: "License Type", value: "licenseType" },
      { label: "Licensed Seats", value: "licensedSeats" },
      { label: "Install Date", value: "installDate" },
      { label: "Last Modified Date", value: "lastModifiedDate" }
    ];
  }

  connectedCallback() {
    this.tableSelectedOptions = [
      "id",
      "leadName",
      "accountName",
      "contactName",
      "leadSource",
      "licenseStatus"
    ];
  }

  @wire(getLMAVersion, {
    subscriberPackageVersionId: "$packageSubscriberVersionId"
  })
  lmaVersion(result) {
    if (result.data) {
      this.lmaData = result.data;
      this.versionIcon =
        this.lmaData.isBeta === false
          ? "utility:package"
          : "utility:package_org_beta";
      this.versionLink = `/lightning/r/sfLma__Package_Version__c/${this.lmaData.id}/view`;
      this.packageLink = `/lightning/r/sfLma__Package__c/${this.lmaData.lmaPackageId}/view`;
      this.packageVersionId = this.lmaData.id;
      this.displaySpinner = false;
    } else if (result.error) {
      console.error(result.error);
      this.displayEmptyLMA = true;
      this.lmaData = undefined;
      this.displaySpinner = false;
    }
  }

  get statusOptions() {
    return [
      { label: "Trial", value: "Trial" },
      { label: "Active", value: "Active" },
      { label: "Suspended", value: "Suspended" },
      { label: "Uninstalled", value: "Uninstalled" }
    ];
  }

  statusFilterChange(event) {
    this.selectedStatusOptions = event.detail.value;
    this.selectedStatusOptionsString = event.detail.value.join("~");
  }

  toggleAllLicensesAccordion() {
    this.displayAllLicenses = !this.displayAllLicenses;
    this.allLicensesAccordionClass = this.displayAllLicenses
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
    this.lmaLicensesOffset = 0;
    if (this.displayAllLicenses) {
      this.loadLicenses(true, false);
    }
  }

  toggleGenAiLicensesAccordion(){
    this.displayGenAiLicenses = !this.displayGenAiLicenses;
    this.genAiLicensesAccordionClass = this.displayGenAiLicenses
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
  }

  loadLicenses(applyFilters, isViewMore) {
    this.displaySpinner = true;

    let wrapper;
    wrapper = [
      {
        fieldName: "sfLma__Package_Version__c",
        value: this.packageVersionId,
        dataType: "STRING"
      }
    ];

    if (applyFilters) {
      if (
        this.selectedStatusOptionsString !== "" &&
        this.selectedStatusOptionsString !== undefined
      ) {
        wrapper.push({
          fieldName: "sfLma__License_Status__c",
          value: this.selectedStatusOptionsString,
          dataType: "LIST"
        });
      }
    }

    (async () => {
      await getPackageVersionLicenses({
        filterWrapper: wrapper,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
        lmaLicensesLimit: this.lmaLicensesLimit,
        lmaLicensesOffset: this.lmaLicensesOffset
      })
        .then(result => {
          if (isViewMore) {
            if (result.length === 0) {
              this.disableInfiniteLoad = false;
            } else {
              this.lmaLicensesData = this.lmaLicensesData.concat(result);
            }
          } else {
            this.lmaLicensesData = result;
          }
          this.relativeDateTime = Date.now();
          this.lmaLicensesLength = this.lmaLicensesData.length;
          this.displayEmptyView = this.lmaLicensesLength === 0 ? true : false;

          this.displayLmaLicensesView = true;
          this.displayDatatableSpinner = false;
          this.displaySpinner = false;
        })
        .catch(error => {
          console.error(error);
          this.lmaLicensesData = undefined;
          this.displayLmaLicensesView = false;
          this.displayDatatableSpinner = false;
          this.displaySpinner = false;
        });
    })();
  }

  loadMoreData() {
    if (this.disableInfiniteLoad) {
      this.lmaLicensesOffset = this.lmaLicensesOffset + this.lmaLicensesLimit;
      this.loadLicenses(this.displayFilterMeta, true);
    }
  }

  handleFilterReset() {
    this.selectedStatusOptions = [];
    this.selectedStatusOptionsString = undefined;
    this.lmaLicensesOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadLicenses(false, false);
    this.displayFilterMeta = false;
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFilterEdit() {
    this.lmaLicensesOffset = 0;
    this.loadLicenses(false, false);
    this.filterState = true;
    this.handleFilterState(this.filterState);
  }

  handleFilterSubmit() {
    this.displayFilterMeta =
      this.selectedStatusOptions.length !== 0 ? true : false;
    this.filterState = false;
    this.handleFilterState(this.filterState);
    this.responsivePanelStyle = this.filterState
      ? `direction:ltr; width:calc(100% - 320px);`
      : `direction:ltr;width:100%`;
    this.lmaLicensesOffset = 0;
    this.disableInfiniteLoad = true;
    this.loadLicenses(true, false);
  }

  handleFilterPanel() {
    this.filterState = !this.filterState;
    this.handleFilterState(this.filterState);
    this.chartState = false;
    this.handleChartState(false);
    this.responsivePanelStyle = this.filterState
      ? `direction:ltr; width:calc(100% - 320px);`
      : `direction:ltr;width:100%;`;
  }

  handleChartPanel() {
    this.chartInit = true;
    this.chartState = !this.chartState;
    this.handleChartState(this.chartState);
    this.filterState = false;
    this.handleFilterState(false);
    this.responsivePanelStyle = this.chartState
      ? `direction:ltr; width:calc(100% - 320px);`
      : `direction:ltr;width:100%;`;
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

  handleRowAction(event) {
    const action = event.detail.action;
    const row = event.detail.row;
    switch (action.name) {
      case "show_details":
        this.chosenLicenseRecord = row;
        this.displayLicenseTimelineState = true;
        break;
      case "send_email":
        this.chosenLicenseRecord = row;
        this.handleSendEmailClick();
        break;
      default:
        break;
    }
  }

  handleAllLicensesClick() {
    this.displayLicenseTimelineState = false;
  }

  createColumns(newColumns) {
    this.columns = newColumns.reduce((accumulator, fieldValue) => {
      const columnData = PackageLmaFields.fields[fieldValue];
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
    this.sortedByLabel = PackageLmaFields.fields[this.sortedBy].label;
    this.lmaLicensesOffset = 0;
    this.loadLicenses(false, false);
  }

  handleRefresh() {
    this.sortedBy = "LastModifiedDate";
    this.sortedByLabel = "Last Modified Date";
    this.sortDirection = "DESC";
    this.lmaLicensesOffset = 0;
    this.handleAllLicensesClick();
    this.loadLicenses(false, false);
  }

  handleInAppPrompt() {
    this.displayLMAInAppPrompt = true;
  }

  handleLMAPromptCancel() {
    this.displayLMAInAppPrompt = false;
  }

  handleSendEmailClick() {
    let _licencseId = this.extractIdFromUrl(this.chosenLicenseRecord.id);
    let _sendToId;

    if (this.chosenLicenseRecord.leadId) {
      _sendToId = this.extractIdFromUrl(this.chosenLicenseRecord.leadId);
    } else if (this.chosenLicenseRecord.contactId) {
      _sendToId = this.extractIdFromUrl(this.chosenLicenseRecord.contactId);
    } else {
      _sendToId = null;
    }

    var pageRef = {
      type: "standard__quickAction",
      attributes: {
        apiName: "Global.SendEmail"
      },
      state: {
        recordId: _sendToId,
        defaultFieldValues:
          encodeDefaultFieldValues({
            RelatedToId: _licencseId
          })
      }
    };
    this[NavigationMixin.Navigate](pageRef);
  }

  extractIdFromUrl(url) {
    const regex = /\/([a-zA-Z0-9]{18})$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  navigateToHelpLma(){
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.workbook_lma.meta/workbook_lma/lma_associate_package.htm`
      }
    });
  }
}