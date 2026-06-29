import { LightningElement, wire, api } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { RefreshEvent } from "lightning/refresh";
import get2GPPackageVersionSubscriberList from "@salesforce/apex/PackageVisualizerCtrl.get2GPPackageVersionSubscriberList";
import modifyLicense from "@salesforce/apexContinuation/PackageVisualizerCtrl.modifyLicense";
import checkPackageSubscriberEnabled from "@salesforce/apex/PackageVisualizerCtrl.checkPackageSubscriberEnabled";
import getAppAnalyticsRequests from "@salesforce/apexContinuation/PackageVisualizerCtrl.getAppAnalyticsRequests";

export default class PackageLicenseSubscriberCard extends NavigationMixin(
  LightningElement
) {
  @api recordId;

  recordOrgId;
  subscriber;
  usedLicenses;
  licenseStatus;
  licensedSeats;

  displaySpinner = true;
  displayAppAnalyticsModal;
  displayIllustration;
  displayEditLicense;
  displayEditView;
  displayPackageSubscriberFeatureEnabled;
  displayFeatureIllustration;

  appAnalyticsData;
  displayAppAnalyticsSpinner = false;
  appAnalyticsNotAvailableView = false;
  displayAppAnalyticsViewModal;
  appAnalyticsViewData;
  appAnalyticsLoaded = false;

  // AppAnalytics polling: silently re-fetch while requests are still in-flight
  // and the tab is open, so states like New/Pending flip to a terminal state
  // without the user having to refresh.
  APP_ANALYTICS_POLL_INTERVAL_MS = 15000;
  TERMINAL_STATES = ["Complete", "Expired", "Failed", "NoData"];
  _pollTimeoutId = null;
  _pollInFlight = false;
  _appAnalyticsLoading = false;

  expirationToggle;
  seatsToggle;
  modifyExpirationDate;
  modifySeats;
  modifyStatusValue;

  editorValue;

  subscribers;

  selectedTab = "details";

  @wire(getRecord, {
    recordId: "$recordId",
    fields: [
      "sfLma__License__c.sfLma__Subscriber_Org_ID__c",
      "sfLma__License__c.sfLma__Package_Version__r.sfLma__Version_ID__c",
      "sfLma__License__c.sfLma__License_Status__c",
      "sfLma__License__c.sfLma__Licensed_Seats__c",
      "sfLma__License__c.sfLma__Expiration_Date__c",
      "sfLma__License__c.sfLma__Seats__c",
      "sfLma__License__c.sfLma__Used_Licenses__c",
      "sfLma__License__c.Name"
    ]
  })
  wiredRecord({ error, data }) {
    if (data) {
      this.recordOrgId = getFieldValue(
        data,
        "sfLma__License__c.sfLma__Subscriber_Org_ID__c"
      );
      this.recordPackageVersion = getFieldValue(
        data,
        "sfLma__License__c.sfLma__Package_Version__r.sfLma__Version_ID__c"
      );
      this.usedLicenses = getFieldValue(
        data,
        "sfLma__License__c.sfLma__Used_Licenses__c"
      );
      this.licenseStatus = getFieldValue(
        data,
        "sfLma__License__c.sfLma__License_Status__c"
      );
      this.licensedSeats = getFieldValue(
        data,
        "sfLma__License__c.sfLma__Licensed_Seats__c"
      );
      this.expirationDate = getFieldValue(
        data,
        "sfLma__License__c.sfLma__Expiration_Date__c"
      );
      this.seats = getFieldValue(data, "sfLma__License__c.sfLma__Seats__c");
      this.name = getFieldValue(data, "sfLma__License__c.Name");

      this.getSubscriberData();
    } else if (error) {
      this.displaySpinner = false;
      this.displayIllustration = true;
      console.error("Error loading record", error);
    }
  }

  connectedCallback() {
    this.checkPackageSubscriberEnabledOrNot();
    this.getOriginalValues();
  }

  disconnectedCallback() {
    this.stopAppAnalyticsPolling();
  }

  checkPackageSubscriberEnabledOrNot() {
    (async () => {
      await checkPackageSubscriberEnabled({})
        .then((result) => {
          this.displaySpinner = false;
          this.displayPackageSubscriberFeatureEnabled = result;
          this.displayFeatureIllustration = result;
        })
        .catch((error) => {
          console.error(error);
          this.displayPackageSubscriberFeatureEnabled = false;
          this.displayFeatureIllustration = true;
          this.displaySpinner = false;
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Something went wrong",
              message:
                "It looks like the Package Subscriber Feature is disabled. Please reach out to the Package Owner for further assistance...",
              variant: "error"
            })
          );
        });
    })();
  }

  getSubscriberData() {
    let wrapper = [
      {
        fieldName: "OrgKey",
        value: this.recordOrgId,
        dataType: "STRING"
      },
      {
        fieldName: "MetadataPackageVersionId",
        value: this.recordPackageVersion,
        dataType: "STRING"
      }
    ];
    (async () => {
      await get2GPPackageVersionSubscriberList({
        filterWrapper: wrapper,
        sortedBy: "orgName",
        sortDirection: "asc",
        subscriberLimit: 1,
        subscriberOffset: 0
      })
        .then((result) => {
          this.subscriber = result[0];
          this.subscribers = [
            {
              orgKey: this.subscriber.orgKey,
              orgName: this.subscriber.orgName
            }
          ];
          this.displaySpinner = false;
        })
        .catch((error) => {
          console.error(error);
          this.displaySpinner = false;
          this.subscriber = undefined;
          this.displayIllustration = true;
          // Toast for Failure
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Something went wrong",
              message: "We were unable to retrieve package subscriber data",
              variant: "error"
            })
          );
        });
    })();
  }

  handleTrustInstance() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://status.salesforce.com/instances/${this.subscriber.instanceName}/`
      }
    });
  }

  handleLogIntoSubscriberConsole() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://pkgvisualizerlwc2020--sflma.vf.force.com/partnerbt/lmo/subOrgLogin.apexp?directLoginOrgId=${this.subscriber.orgKey}`
      }
    });
  }

  handleAppAnalyticsSubscribers() {
    this.displayAppAnalyticsModal = true;
  }

  handleAppAnalyticsCloseModal() {
    this.displayAppAnalyticsModal = false;
  }

  // Fired when a request is successfully submitted from the flow modal. Jump to
  // the AppAnalytics tab and refresh so the new (in-flight) request shows up and
  // polling arms for it.
  handleAppAnalyticsSubmitted() {
    this.selectedTab = "app-analytics";
    this.displayEditLicense = false;
    this.handleAppAnalyticsRefresh();
  }

  get isAppAnalyticsTab() {
    return this.selectedTab === "app-analytics";
  }

  getAppAnalytics() {
    // Subscriber must be loaded so we know which package to query and which
    // org to filter on. A blank packageIds would make the Apex return every
    // request for the package, so bail out to the empty state instead.
    if (!this.subscriber || !this.subscriber.metadataPackageId) {
      this.appAnalyticsData = undefined;
      this.appAnalyticsNotAvailableView = true;
      return;
    }
    // Guard against a duplicate foreground load (e.g. submitting from the tab
    // sets selectedTab, which also fires the tab's onactive handler).
    if (this._appAnalyticsLoading) {
      return;
    }
    this._appAnalyticsLoading = true;
    (async () => {
      this.displayAppAnalyticsSpinner = true;
      await getAppAnalyticsRequests({
        packageIds: this.subscriber.metadataPackageId
      })
        .then((result) => {
          const filtered = this.filterRequestsForSubscriber(result);
          this.appAnalyticsData = filtered;
          this.appAnalyticsNotAvailableView =
            !filtered || filtered.length === 0;
          this.appAnalyticsLoaded = true;
          this.displayAppAnalyticsSpinner = false;
          // Arm polling only if something is still in-flight.
          this.startAppAnalyticsPolling();
        })
        .catch((error) => {
          console.error(error);
          this.displayAppAnalyticsSpinner = false;
          this.appAnalyticsData = undefined;
          this.appAnalyticsNotAvailableView = true;
          this.dispatchEvent(
            new ShowToastEvent({
              title: "We were unable to retrieve AppAnalytics requests",
              message: error,
              variant: "error"
            })
          );
        })
        .finally(() => {
          this._appAnalyticsLoading = false;
        });
    })();
  }

  hasInFlightRequests() {
    return (this.appAnalyticsData || []).some(
      (req) => !this.TERMINAL_STATES.includes(req.RequestState)
    );
  }

  startAppAnalyticsPolling() {
    // Only poll while the tab is open and at least one request is in-flight.
    if (
      this._pollTimeoutId ||
      !this.isAppAnalyticsTab ||
      !this.hasInFlightRequests()
    ) {
      return;
    }
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._pollTimeoutId = setTimeout(() => {
      this._pollTimeoutId = null;
      this.pollAppAnalytics();
    }, this.APP_ANALYTICS_POLL_INTERVAL_MS);
  }

  stopAppAnalyticsPolling() {
    if (this._pollTimeoutId) {
      clearTimeout(this._pollTimeoutId);
      this._pollTimeoutId = null;
    }
  }

  // Silent poll tick: never touches the spinner and never toasts. Re-fetches,
  // re-filters to this subscriber, and re-arms only while requests remain
  // in-flight and the tab is still open.
  pollAppAnalytics() {
    if (
      this._pollInFlight ||
      !this.isAppAnalyticsTab ||
      !this.subscriber ||
      !this.subscriber.metadataPackageId
    ) {
      return;
    }
    this._pollInFlight = true;
    (async () => {
      await getAppAnalyticsRequests({
        packageIds: this.subscriber.metadataPackageId
      })
        .then((result) => {
          const filtered = this.filterRequestsForSubscriber(result);
          this.appAnalyticsData = filtered;
          this.appAnalyticsNotAvailableView =
            !filtered || filtered.length === 0;
        })
        .catch((error) => {
          // Silent: a transient poll failure must not surface a toast. The next
          // tick (or a manual refresh) will retry.
          console.error(error);
        })
        .finally(() => {
          this._pollInFlight = false;
          this.startAppAnalyticsPolling();
        });
    })();
  }

  // The Apex returns the 50 most recent requests for the whole package in the
  // last 24h; keep only the ones tied to this subscriber. OrganizationIds can
  // hold up to 16 comma-separated org ids, or be blank (= all installed orgs),
  // so a blank value is treated as a match for this subscriber.
  filterRequestsForSubscriber(result) {
    if (!result) {
      return [];
    }
    const targetKey = this.normalizeOrgId(
      this.subscriber && this.subscriber.orgKey
    );
    if (!targetKey) {
      return result;
    }
    return result.filter((req) => {
      const orgIds = req.OrganizationIds;
      if (!orgIds || orgIds.trim() === "") {
        return true;
      }
      return orgIds
        .split(",")
        .map((id) => this.normalizeOrgId(id))
        .includes(targetKey);
    });
  }

  // Compare on the 15-char id so 15- vs 18-char org ids match, and trim to
  // tolerate the "comma-separated with spaces" OrganizationIds variant.
  normalizeOrgId(id) {
    return id ? id.trim().substring(0, 15) : "";
  }

  handleAppAnalyticsExpand(event) {
    this.displayAppAnalyticsViewModal = true;
    this.appAnalyticsViewData = event.detail;
  }

  handleViewCloseModal() {
    this.displayAppAnalyticsViewModal = false;
  }

  handleAppAnalyticsRefresh() {
    this.stopAppAnalyticsPolling();
    this.appAnalyticsLoaded = false;
    this.getAppAnalytics();
  }

  handleTabActive(event) {
    this.selectedTab = event.target.value;
    switch (this.selectedTab) {
      case "details":
        this.displayEditLicense = false;
        this.stopAppAnalyticsPolling();
        break;
      case "modify-license":
        this.getOriginalValues();
        this.displayEditLicense = true;
        this.stopAppAnalyticsPolling();
        break;
      case "app-analytics":
        this.displayEditLicense = false;
        if (!this.appAnalyticsLoaded) {
          this.getAppAnalytics();
        } else {
          // Returning to an already-loaded tab: resume polling if needed.
          this.startAppAnalyticsPolling();
        }
        break;
      default:
        // Unknown tab; no action needed.
        break;
    }
  }

  get nowDate() {
    return new Date().toISOString();
  }

  get statusOptions() {
    return [
      { label: "Active", value: "Active" },
      { label: "Suspended", value: "Suspended" }
    ];
  }

  get isSiteLicense() {
    return this.licensedSeats === "Site License" ? true : false;
  }

  handleStatusChange(event) {
    this.modifyStatusValue = event.detail.value;
  }

  handleEdit() {
    this.displayEditView = true;
    this.getOriginalValues();
  }

  handleModifyLicenseCancel() {
    this.displayEditView = false;
    this.getOriginalValues();
  }

  getOriginalValues() {
    this.expirationToggle =
      !this.expirationDate || this.expirationDate === "Does not expire"
        ? true
        : false;
    this.seatsToggle = this.licensedSeats === "Site License" ? true : false;
    this.modifySeats = this.seats === -1 ? "" : this.seats;
    this.modifyExpirationDate =
      this.expirationDate === "Does not expire" ? null : this.expirationDate;
  }

  handleExpirationToggle(event) {
    if (this.template.querySelector(".expirationDate").checkValidity()) {
      this.expirationToggle = event.target.checked;
      if (this.expirationToggle) {
        this.modifyExpirationDate = undefined;
        this.template.querySelector(".expirationDate").setCustomValidity("");
        this.template.querySelector(".expirationDate").reportValidity();
      }
    }
  }

  handleSeatsToggle(event) {
    if (this.template.querySelector(".seats").checkValidity()) {
      this.seatsToggle = event.target.checked;
      if (this.seatsToggle) {
        this.modifySeats = "";
        this.template.querySelector(".seats").setCustomValidity("");
        this.template.querySelector(".seats").reportValidity();
      }
    }
  }

  handleSeatsChange(event) {
    this.modifySeats = event.detail.value;
  }

  handleExpirationChange(event) {
    this.modifyExpirationDate = event.detail.value;
  }

  handleModifyLicenseSave() {
    const expirationInput = this.template.querySelector(".expirationDate");
    const seatsInput = this.template.querySelector(".seats");

    if (expirationInput.checkValidity() && seatsInput.checkValidity()) {
      this.displaySpinner = true;
      (async () => {
        await modifyLicense({
          licenseId: this.recordId,
          expirationDate: expirationInput.value,
          seats: seatsInput.value,
          status: this.modifyStatusValue
        })
          .then((result) => {
            this.displaySpinner = false;
            if (result === this.recordId) {
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Success",
                  message: `${this.name} has been successfully modified`,
                  variant: "success"
                })
              );
            }
            this.dispatchEvent(new RefreshEvent());
            this.displayEditView = false;
            this.dispatchEvent(new CustomEvent("refresh"));
          })
          .catch((error) => {
            console.error(error);
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

  handleEditorChange(event) {
    this.editorValue = event.detail.value;
  }

  handleHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.workbook_lma.meta/workbook_lma/lma_edit_license.htm`
      }
    });
  }
}
