import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getEligibleHigherPackageVersions from "@salesforce/apex/PushUpgradesCtrl.getEligibleHigherPackageVersions";

const columns = [
  { label: "Version Number", fieldName: "VersionNumber", sortable: false },
  { label: "Name", fieldName: "Name", sortable: true },
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
  }
];

export default class PackagePushUpgradesVersionModal extends NavigationMixin(LightningElement) {
  @api packageVersionNumber;
  @api subscriberPackageId;
  @api orgKey;

  packageVersions;
  packageVersionsData;
  origPackageVersionsData;
  displayPackageVersions;
  displayEmptyResults;
  displaySpinner;

  displaySpinner = true;
  disableUpgradeButton = true;
  displayScheduleConfirmationModal;

  columns = columns;
  selectedRows;
  upgradeSubscribers;

  versionName;
  majorNumber;
  minorNumber;
  patchNumber;

  tableLength;
  sortedBy = "SystemModstamp";
  sortedByLabel = "Last Modified Date";
  sortDirection = "desc";
  relativeDateTime = Date.now();

  connectedCallback() {
    this.getHigherPackageVersions();
  }

  prepDataTable() {
    let datatable = [];
    this.packageVersionsData.forEach(version => {
      datatable.push({
        Id: version.Id,
        VersionNumber: `${version.MajorVersion}.${version.MinorVersion}.${version.PatchVersion}-${version.BuildNumber}`,
        Name: version.Name,
        SystemModstamp: version.SystemModstamp
      });
    });
    this.packageVersions = datatable;
    this.tableLength = this.packageVersions.length;
  }

  getSelectedRows(event) {
    this.selectedRows = event.detail.selectedRows[0].Id;
    this.disableUpgradeButton = false;
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  getHigherPackageVersions() {
    this.displaySpinner = true;
    (async () => {
      await getEligibleHigherPackageVersions({
        packageVersionNumber: this.packageVersionNumber,
        subscriberPackageId: this.subscriberPackageId,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection
      })
        .then(result => {
          if (!this.origPackageVersionsData) {
            this.origPackageVersionsData = result;
          }
          this.packageVersionsData = result;
          this.displayEmptyResults =
            this.packageVersionsData.length === 0 ? true : false;
          this.prepDataTable();
          this.displaySpinner = false;
          this.relativeDateTime = Date.now();
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
        });
    })();
  }

  handleReset() {
    this.packageVersionsData = this.origPackageVersionsData;
    this.prepDataTable();
    this.displayEmptyResults =
      this.packageVersionsData.length === 0 ? true : false;
    this.template.querySelector(".majorInput").value = null;
    this.template.querySelector(".minorInput").value = null;
    this.template.querySelector(".patchInput").value = null;
    this.template.querySelector(".nameInput").value = null;
    this.sortedBy = "SystemModstamp";
    this.sortedByLabel = "Last Modified Date";
  }

  handleSort(event) {
    this.sortedByLabel =
      event.detail.fieldName === "SystemModstamp"
        ? "Last Modified Date"
        : event.detail.fieldName;
    this.sortedBy = event.detail.fieldName;
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    this.getHigherPackageVersions();
  }

  handleUpgrade() {
    this.displayScheduleConfirmationModal = true;
    this.upgradeSubscribers = [`${this.orgKey}`];
  }

  handleCancelScheduleConfirmationModal() {
    this.displayScheduleConfirmationModal = false;
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