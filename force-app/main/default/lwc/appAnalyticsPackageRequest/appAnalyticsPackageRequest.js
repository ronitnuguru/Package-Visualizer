import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from "lightning/navigation";
import getAppAnalyticsRequests from "@salesforce/apexContinuation/PackageVisualizerCtrl.getAppAnalyticsRequests";

const FIELDS = [
    'sfLma__Package__c.sfLma__Package_ID__c'
];

export default class AppAnalyticsPackageRequest extends NavigationMixin(LightningElement) {

    @api recordId;

    packageData;
    packageError;

    appAnalyticsData;
    displayAppAnalyticsModal;
    displayAppAnalyticsViewModal;
    appAnalyticsNotAvailableView;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    pacakge({ error, data }) {
        if (data) {
            this.packageData = data;
            this.packageError = undefined;
            if (this.packageData.fields.sfLma__Package_ID__c.value && this.packageData.fields.sfLma__Package_ID__c.value.startsWith("033")) {
                this.getAppAnaltics();
            }
            else {
                this.appAnalyticsNotAvailableView = true;
            }
        } else if (error) {
            this.packageError = error;
            this.packageData = undefined;
        }
    }

    get packageId() {
        return this.packageData.fields.sfLma__Package_ID__c.value;
    }

    handleRequest() {
        this.displayAppAnalyticsModal = true;
    }

    handleAppAnalyticsCloseModal() {
        this.displayAppAnalyticsModal = false;
    }

    handleRefresh() {
        this.appAnalyticsData = false;
        if (this.packageData.fields.sfLma__Package_ID__c.value && this.packageData.fields.sfLma__Package_ID__c.value.startsWith("033")) {
            this.getAppAnaltics();
        }
        else {
            this.appAnalyticsNotAvailableView = true;
        }
    }

    handleAppAnalyticsExpand(event) {
        this.displayAppAnalyticsViewModal = true;
        this.appAnalyticsViewData = event.detail;
    }

    handleViewCloseModal() {
        this.displayAppAnalyticsViewModal = false;
    }

    handleHelpDoc() {
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: `https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/app_analytics_intro.htm`
            }
        });
    }
    
    handleCRMA() {
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: `/analytics/home`
            }
        });
    }

    getAppAnaltics() {
        (async () => {
            this.displaySpinner = true;
            await getAppAnalyticsRequests({
                packageIds: this.packageData.fields.sfLma__Package_ID__c.value
            })
                .then(result => {
                    this.appAnalyticsData = result;
                    this.displaySpinner = false;
                    this.appAnalyticsNotAvailableView =
                        !result || result.length === 0 ? true : false;
                })
                .catch(error => {
                    console.error(error);
                    this.displaySpinner = false;
                    this.appAnalyticsData = undefined;
                    this.appAnalyticsNotAvailableView = true;
                    // Toast for Failure
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "We were unable to retrieve AppAnalytics requests",
                            message: error,
                            variant: "error"
                        })
                    );
                });
        })();
    }
}