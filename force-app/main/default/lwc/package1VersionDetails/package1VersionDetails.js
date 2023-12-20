import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getSubscriberChartData from "@salesforce/apex/PackageVisualizerCtrl.getSubscriberChartData";

export default class Package1VersionDetails extends LightningElement {
    @api versionId;
    @api packageId;
    @api packageName;
    @api packageVersionNumber;
    @api packageReleaseState;
    @api packageLastModifiedDate;
    @api namespacePrefix;

    sfdxPackageInstall;
    packageInstallUrl;

    subscribersCount;
    subscriberLabel;

    get badgeIcon() {
        return this.packageReleaseState === 'Beta' ? 'utility:package_org_beta' : 'utility:package_org'
    }

    connectedCallback() {
        this.sfdxPackageInstall = `sfdx force:package:install -p ${this.versionId} -w 20`;
        this.packageInstallUrl = `https://login.salesforce.com/packaging/installPackage.apexp?p0=${this.versionId}`;
    }

    handleVersionManager() {
        window.open(`/lightning/setup/Package/${this.versionId}/view`, "_blank");
    }

    handlePackageSubscribers() {
        this.dispatchEvent(new CustomEvent("subscribersclick"));
    }

    handleSubscriberMenuSelect(event) {
        this.handleSubscribersCount(event.detail.value);
    }

    handleAllSubscribers() {
        this.handleSubscribersCount("");
    }

    handleSubscribersCount(orgType) {
        this.displaySpinner = true;
        let wrapper;
        wrapper = [
            {
                fieldName: "MetadataPackageId",
                value: this.packageId,
                dataType: "STRING"
            },
            {
                fieldName: "MetadataPackageVersionId",
                value: this.versionId,
                dataType: "STRING"
            }
        ];
        if (orgType !== "") {
            wrapper.push({
                fieldName: "OrgType",
                value: orgType,
                dataType: "STRING"
            });
        }
        (async () => {
            await getSubscriberChartData({
                filterWrapper: wrapper,
                groupByField: "MetadataPackageVersionId"
            })
                .then(result => {
                    this.displaySpinner = false;
                    if (result.length > 0) {
                        this.subscribersCount = result[0].expr0;
                        this.subscriberLabel =
                            orgType === "" ? `Subscribers` : `${orgType} Subscribers`;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Subscribers Count Calculated",
                                message: `${this.packageVersionNumber} currently has ${this.subscribersCount} ${orgType} Subscribers`,
                                variant: "success"
                            })
                        );
                    } else {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Subscribers Count Calculated",
                                message: `${this.packageVersionNumber} currently has 0 ${orgType} Subscribers`,
                                variant: "warning"
                            })
                        );
                    }
                })
                .catch(error => {
                    console.error(error);
                    this.displaySpinner = false;
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

}