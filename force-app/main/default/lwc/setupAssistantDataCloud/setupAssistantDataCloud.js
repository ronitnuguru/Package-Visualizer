import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

export default class SetupAssistantDataCloud extends NavigationMixin(LightningElement) {

    @api orgId;

    navigateScratchOrgBuild(){
        this[NavigationMixin.Navigate]({
            type: "standard__component",
            attributes: {
                componentName: "pkgviz__scratchDefFileBuildCard",
            }
        });
    }

    navigateToDataCloudPackagingCheatSheet(){
        window.open(`https://developer.salesforce.com/docs/data/data-cloud-dev/guide/component-cheatsheet.html`,'_blank');
    }

    navigateToDataCloudWorkflow(){
        window.open(`https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html`,'_blank');
    }
}