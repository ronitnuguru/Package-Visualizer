import { LightningElement, api } from "lwc";

export default class TrustInstanceDetail extends LightningElement {
  @api instanceKey;
  @api location;
  @api maintenanceWindow;
  @api releaseNumber;
  @api releaseVersion;
  @api status;

  sldsIcon;
  sldsIconVariant;
  statusTitle;
  trustUrl;

  connectedCallback() {
    this.trustUrl = `https://status.salesforce.com/instances/${this.instanceKey}`;
    if (this.status === "OK") {
      this.sldsIcon = "utility:success";
      this.sldsIconVariant = "success";
      this.statusTitle = "Available";
    } else if (
      this.status === "MAJOR_INCIDENT_CORE" ||
      this.status === "MAJOR_INCIDENT_NONCORE"
    ) {
      this.sldsIcon = "utility:error";
      this.sldsIconVariant = "error";
      this.statusTitle = "Service Disruption";
    } else if (
      this.status === "MINOR_INCIDENT_CORE" ||
      this.status === "MINOR_INCIDENT_NONCORE"
    ) {
      this.sldsIcon = "utility:warning";
      this.sldsIconVariant = "warning";
      this.statusTitle = "Performance Degradation";
    } else if (
      this.status === "MAINTENANCE_CORE" ||
      this.status === "MAINTENANCE_NONCORE"
    ) {
      this.sldsIcon = "utility:custom_apps";
      this.sldsIconVariant = "warning";
      this.statusTitle = "Maintenance";
    }
  }

  get region() {
    switch (this.location) {
      case "NA":
        return "Americas";
      case "EMEA":
        return "EMEA";
      case "APAC":
        return "Asia Pacific";
      default:
        return "";
    }
  }
}