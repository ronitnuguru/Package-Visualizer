import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getPushJobPackageSubscriber from "@salesforce/apex/PushUpgradesCtrl.getPushJobPackageSubscriber";

export default class PackagePushJobDetail extends LightningElement {
  @api pushJobDetails;

  displaySubscriber = true;
  packageSubscriberAccordionClass = `slds-section slds-var-p-top_medium slds-is-open`;

  displaySubscriberData;
  displaySpinner = true;

  installedStatus;
  instanceName;
  metadataPackageId;
  metadataPackageVersionId;
  orgKey;
  orgName;
  orgStatus;
  orgType;
  packageType;

  get pushJobError() {
    let errorTitle, errorMessage;
    if(this.pushJobDetails.PackagePushErrors){
      errorTitle = this.pushJobDetails.PackagePushErrors.records[0].ErrorTitle;
      errorMessage = this.pushJobDetails.PackagePushErrors.records[0].ErrorMessage;
      return `${errorTitle} ${errorMessage}`;
    }
    return undefined;
    
  }

  @wire(getPushJobPackageSubscriber, {
    orgId: "$pushJobDetails.SubscriberOrganizationKey"
  })
  packageSubscriber(result) {
    if (result.data) {
      this.displaySubscriberData = true;
      const subsriberData = result.data;
      this.installedStatus = subsriberData.installedStatus;
      this.instanceName = subsriberData.instanceName;
      this.metadataPackageId = subsriberData.metadataPackageId;
      this.metadataPackageVersionId = subsriberData.metadataPackageVersionId;
      this.orgKey = subsriberData.orgKey;
      this.orgName = subsriberData.orgName;
      this.orgStatus = subsriberData.orgStatus;
      this.orgType = subsriberData.orgType;
      this.packageType = "Managed";
      this.displaySpinner = false;
    } else if (result.error) {
      console.error(result.error);
      this.displaySubscriberData = false;
      this.displaySpinner = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Something went wrong",
          message: result.error,
          variant: "error"
        })
      );
    }
  }

  togglePackageSubscriberAccordion() {
    this.displaySubscriber = !this.displaySubscriber;
    this.packageSubscriberAccordionClass = this.displaySubscriber
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
  }

  get displayLoadingIcon() {
    return this.pushJobDetails.Status === "Created" ||
      this.pushJobDetails.Status === "Pending" ||
      this.pushJobDetails.Status === "InProgress"
      ? true
      : false;
  }

  get displaySuccessIcon() {
    return this.pushJobDetails.Status === "Succeeded" ? true : false;
  }

  get displayWarningIcon() {
    return this.pushJobDetails.Status === "Canceled" ? true : false;
  }

  get displayErrorIcon() {
    return this.pushJobDetails.Status === "Failed" ? true : false;
  }
}