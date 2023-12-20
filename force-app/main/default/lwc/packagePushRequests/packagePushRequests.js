import { LightningElement, api } from "lwc";
import getLatestPackageVersions from "@salesforce/apex/PackageVisualizerCtrl.getLatestPackageVersions";

export default class PackagePushRequests extends LightningElement {
  @api packageId;

  versionLimit = 50;
  displaySpinner;
  packageVersionList;
  displayError;
  displayEmpty;

  connectedCallback() {
    this.retrievePackageVersions(this.versionLimit);
  }

  retrievePackageVersions(limit) {
    this.displaySpinner = true;
    (async () => {
      await getLatestPackageVersions({
        packageId: this.packageId,
        versionLimit: limit
      })
        .then(result => {
          this.displaySpinner = false;
          if(result.length > 0){
            this.packageVersionList = result;
          } else {
            this.packageVersionList = undefined;
            this.displayEmpty = true;
          }
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
          this.packageVersionList = undefined;
          this.displayError = true;
        });
    })();
  }

  handleVersionLimitChange(event){
    this.versionLimit = event.detail;
    this.packageVersionList = undefined;
    this.retrievePackageVersions(event.detail);
  }
}