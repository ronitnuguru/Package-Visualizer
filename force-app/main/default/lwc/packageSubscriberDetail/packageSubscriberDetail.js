import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import isLMA from "@salesforce/apex/PackageVisualizerCtrl.isLMA";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import getPackageVersionLicenses from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackageVersionLicenses";
import get2GPPackageVersionList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageVersionList";

export default class PackageSubscriberDetail extends LightningElement {
  @api installedStatus;
  @api instanceName;
  @api metadataPackageId;
  @api metadataPackageVersionId;
  @api orgKey;
  @api orgName;
  @api orgStatus;
  @api orgType;
  @api packageType;

  subscribers;

  displayLMA;
  displaySubLicense = false;
  licenseAccordionClass = `slds-section slds-var-p-top_medium`;

  displayPushUpgradeSection;
  displayPushUpgradeList = false;
  upgradeAccordionClass = `slds-section slds-var-p-top_medium`;

  trustUrl;
  license;
  displayEmptyLMA;
  displaySpinner;
  displayUpgradeSpinner;
  pushUpgradeBreadCrumbLabel;
  packageVersionNumber;
  subscriberPackageId;

  instance;
  displayInstance;
  displayInstanceSpinner;
  displayAppAnalyticsModal = false;

  get managedPackageType() {
    return this.packageType === "Managed" ? true : false;
  }

  connectedCallback() {
    this.trustUrl = `https://status.salesforce.com/instances/${this.instanceName}`;
    if (hasPackageVisualizerPushUpgrade) {
      this.loadInstanceFromTrust()
        .then(result => {
          if (result.message === "Instance not found") {
            this.instance = undefined;
          } else {
            this.instance = result;
          }
        })
        .catch(error => {
          this.instance = undefined;
        });
    }
    this.subscribers = [
      {
        orgKey: this.orgKey,
        orgName: this.orgName
      }
    ]
  }

  async loadInstanceFromTrust() {
    this.displayInstanceSpinner = true;
    let instances;
    let trustEndPoint = `https://api.status.salesforce.com/v1/instances/${this.instanceName}/status/preview?childProducts=false`;
    try {
      const response = await fetch(trustEndPoint);
      instances = await response.json();
      this.displayInstance = true;
      return instances;
    } catch (err) {
      this.displayInstanceSpinner = false;
      this.displayInstance = false;
      console.error(err);
      return undefined;
    }
  }

  get isPushUpgradeEnabled() {
    return hasPackageVisualizerPushUpgrade;
  }

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

  toggleLicenseAccordion() {
    this.displaySubLicense = !this.displaySubLicense;
    this.licenseAccordionClass = this.displaySubLicense
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
    if (this.displaySubLicense) {
      this.loadLicense();
    }
  }

  togglePushUpgradeAccordion() {
    this.displayPushUpgradeList = !this.displayPushUpgradeList;
    this.upgradeAccordionClass = this.displayPushUpgradeList
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
    this.getPackageVersionDetails(this.metadataPackageVersionId);
  }

  getPackageVersionDetails(metadataPackageVersionId) {
    this.displayUpgradeSpinner = true;
    let wrapper = [
      {
        fieldName: "SubscriberPackageVersionId",
        value: metadataPackageVersionId,
        dataType: "STRING"
      }
    ];
    (async () => {
      await get2GPPackageVersionList({
        filterWrapper: wrapper,
        minMajorVersion: null,
        maxMajorVersion: null,
        minMinorVersion: null,
        maxMinorVersion: null,
        sortedBy: null,
        sortDirection: null,
        versionLimit: 1,
        versionOffset: 0
      })
        .then(result => {
          this.displayUpgradeSpinner = false;
          this.displayPushUpgradeSection = true;
          const pkgVersion = result[0];
          this.pushUpgradeBreadCrumbLabel = `Released versions higher than ${pkgVersion.versionNumber}`;
          this.packageVersionNumber = pkgVersion.versionNumber;
          this.subscriberPackageId = pkgVersion.subscriberPackageVersionId;
        })
        .catch(error => {
          console.error(error);
          this.displayUpgradeSpinner = false;
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

  loadLicense() {
    this.displaySpinner = true;
    let wrapper;
    wrapper = [
      {
        fieldName: "sfLma__Subscriber_Org_ID__c",
        value: this.orgKey,
        dataType: "STRING"
      },
      {
        fieldName: "sfLma__Package_Version__r.sfLma__Version_ID__c",
        value: this.metadataPackageVersionId,
        dataType: "STRING"
      }
    ];
    (async () => {
      await getPackageVersionLicenses({
        filterWrapper: wrapper,
        sortedBy: "Name",
        sortDirection: "DESC",
        lmaLicensesLimit: "1",
        lmaLicensesOffset: "0"
      })
        .then(result => {
          this.license = result[0];
          this.displaySpinner = false;
          this.displayEmptyLMA = result.length === 0 ? true : false;
        })
        .catch(error => {
          this.displayEmptyLMA = true;
          console.error(error);
          this.displaySpinner = false;
        });
    })();
  }

  handleTrust() {
    window.open(this.trustUrl, "_blank");
  }

  handleRefresh() {
    this.loadLicense();
  }

  handleAppAnalyticsSubscribers() {
    this.displayAppAnalyticsModal = true;
  }

  handleAppAnalyticsCloseModal() {
    this.displayAppAnalyticsModal = false;
  }
}