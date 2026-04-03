import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getPackageSubscribersByParentOrg from "@salesforce/apex/PackageVisualizerCtrl.getPackageSubscribersByParentOrg";

const columns = [
  {
    type: "text",
    fieldName: "orgName",
    label: "Organization Name",
    sortable: false,
    iconName: "standard:customer",
    wrapText: true
  },
  {
    type: "text",
    fieldName: "metadataPackageVersionId",
    label: "Package Version Id",
    sortable: false,
    iconName: "standard:record"
  },
  {
    type: "text",
    fieldName: "orgStatus",
    label: "Status",
    sortable: false
  },
  {
    type: "text",
    fieldName: "instanceName",
    label: "Instance",
    sortable: false,
    iconName: "standard:default"
  },
  {
    type: "date",
    fieldName: "SystemModstamp",
    label: "Last Modified At",
    iconName: "standard:date_time",
    sortable: false,
    wrapText: true,
    typeAttributes: {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  }
];

export default class PackageSubscriberSandboxesView extends LightningElement {
  _orgKey;

  @api
  get orgKey() {
    return this._orgKey;
  }
  set orgKey(value) {
    const prev = this._orgKey;
    if (value === prev) {
      return;
    }
    this._orgKey = value;
    if (!value) {
      this.displaySpinner = false;
      this.displayDatatableSpinner = false;
      this.sandboxesData = [];
      this.displayEmptyView = true;
      this.displaySandboxesList = true;
      return;
    }
    this.breadCrumbLabel = `Sandboxes created from Production Org ${value}`;
    this.loadSandboxes(false);
  }

  breadCrumbLabel;

  displaySpinner = true;
  displayDatatableSpinner = false;
  displayEmptyView = false;
  displaySandboxesList = true;

  columns = columns;
  sandboxesData = [];

  sortedByLabel = "Last Modified At";
  relativeDateTime = Date.now();
  subscribersLength;

  subscriberLimit = 50;
  subscriberOffset = 0;
  disableInfiniteLoad = true;

  responsivePanelStyle = `direction:ltr;width:100%;`;

  loadSandboxes(isViewMore) {
    if (!this._orgKey) {
      this.displaySpinner = false;
      this.displayDatatableSpinner = false;
      this.sandboxesData = [];
      this.displayEmptyView = true;
      return;
    }
    if (isViewMore) {
      this.displayDatatableSpinner = true;
    } else {
      this.displaySpinner = true;
      this.subscriberOffset = 0;
      this.disableInfiniteLoad = true;
    }

    getPackageSubscribersByParentOrg({
      parentOrgKey: this._orgKey,
      subscriberLimit: String(this.subscriberLimit),
      subscriberOffset: String(this.subscriberOffset)
    })
      .then((result) => {
        this.displaySpinner = false;
        this.displayDatatableSpinner = false;
        this.displaySandboxesList = true;
        const rows = result || [];
        if (isViewMore) {
          if (rows.length === 0) {
            this.disableInfiniteLoad = false;
          } else {
            this.sandboxesData = this.sandboxesData.concat(rows);
            if (rows.length < this.subscriberLimit) {
              this.disableInfiniteLoad = false;
            }
          }
        } else {
          this.sandboxesData = rows;
          if (rows.length < this.subscriberLimit) {
            this.disableInfiniteLoad = false;
          }
        }
        this.relativeDateTime = Date.now();
        this.subscribersLength = this.sandboxesData.length;
        this.displayEmptyView = this.sandboxesData.length === 0;
      })
      .catch((error) => {
        console.error(error);
        this.sandboxesData = [];
        this.displaySpinner = false;
        this.displayDatatableSpinner = false;
        this.displayEmptyView = true;
        this.displaySandboxesList = false;
        const msg =
          error.body && error.body.message
            ? error.body.message
            : error.message || "Unknown error";
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Something went wrong",
            message: msg,
            variant: "error"
          })
        );
      });
  }

  loadMoreData() {
    if (this.disableInfiniteLoad) {
      this.subscriberOffset = this.subscriberOffset + this.subscriberLimit;
      this.loadSandboxes(true);
    }
  }
}
