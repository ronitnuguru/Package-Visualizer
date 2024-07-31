import { LightningElement, api, wire } from 'lwc';
import getContent from '@salesforce/apex/DemoTrialsController.getContent';
import basePath from '@salesforce/community/basePath';
import createOrgModal from 'c/createOrgModal';
import viewDetailsModal from 'c/viewDetailsModal';
import hasAllowExternalSignups from "@salesforce/customPermission/Allow_External_Signups";

export default class DemoTrialsCard extends LightningElement {

    @api title;
    @api description;
    @api trialDays;
    @api viewDetails;
    @api shouldConnectToEnvHub;
    @api signupSource;

    @api icon;
    @api sldsIconReference;
    @api cmsIconReference;

    @api trialTemplateId;
    @api brandButtonLabel;
    @api neutralButtonLabel;

    cmsUrl;

    get dontAllowExternalSignups() {
        return !hasAllowExternalSignups;
    }

    @wire(getContent, {
        contentId: '$cmsIconReference',
        page: 0,
        pageSize: 1,
        language: 'en_US',
        filterby: ''
    })
    results({ data, error }) {
        if (data) {
            this.cmsUrl = basePath + '/sfsites/c' + data.source.unauthenticatedUrl;
            this.error = undefined;
        }
        if (error) {
            console.error('Error: ' + JSON.stringify(error));
        }
    }

    get trial(){
        return `${this.trialDays} days`;
    }

    get displaySLDS(){
        return (this.icon === 'SLDS' && this.sldsIconReference) ? true : false;
    }

    get displayCMS(){
        return (this.icon === 'CMS' && this.cmsIconReference && this.cmsUrl) ? true : false;
    }

    async handleBrandClick(){
        const result = await createOrgModal.open({
            // `label` is not included here in this example.
            // it is set on lightning-modal-header instead
            label: this.title,
            size: 'medium',
            description: `Create Signup Modal for ${this.title}`,
            content: {
                trialTemplateId: this.trialTemplateId,
                trialDays: this.trialDays,
                shouldConnectToEnvHub: this.shouldConnectToEnvHub,
                signupSource: this.signupSource
            }
        });
    }

    async handleNeutralClick() {
        const result = await viewDetailsModal.open({
            label: this.title,
            size: 'medium',
            description: 'Accessible description of modal\'s purpose',
            content: this.viewDetails,
        });
        if(result === 'Sign Up'){
            this.handleBrandClick();
        }
    }
}