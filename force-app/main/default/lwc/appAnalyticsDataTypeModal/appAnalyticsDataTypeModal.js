import { LightningElement } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

export default class AppAnalyticsDataTypeModal extends NavigationMixin(LightningElement) {

    enableNext;
    chosenDataType;

    closeModal() {
        this.dispatchEvent(new CustomEvent("cancel"));
    }

    handleChooseDataType(event) {
        this.enableNext = true;
        this.chosenDataType = event.target.value;
    }

    handleNext() {
        this.dispatchEvent(new CustomEvent("chosentype", { detail: this.chosenDataType }));
    }
    
    handleAppAnalyticsHelpDoc(event) {
        let helpDocUrl;
        if (event.detail.value === 'Package Usage Logs') {
            helpDocUrl = 'https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/app_analytics_managed_package_log_files.htm';
        }
        else if (event.detail.value === 'Package Usage Summary') {
            helpDocUrl = 'https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/app_analytics_managed_package_usage_summaries.htm';
        }
        else if (event.detail.value === 'Subscriber Snapshots') {
            helpDocUrl = 'https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/app_analytics_subscriber_snapshots.htm';
        }
        else if (event.detail.value === 'AppAnalytics Use Cases') {
            helpDocUrl = `https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/app_analytics_use_cases.htm`;
        }
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: helpDocUrl
            }
        });
    }
}