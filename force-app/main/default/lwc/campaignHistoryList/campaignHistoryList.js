import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
//import getCampaignHistory from "@salesforce/apex/PackageVisualizerCtrl.getCampaignHistory";

export default class CampaignHistoryList extends NavigationMixin(LightningElement) {

    @api license;

    displaySpinner = true;
    displayViewMoreLink;
    type;

    viewMoreLink;
    campaignData;
    navigateId;

    connectedCallback() {
        if (this.license.leadId) {
            this.leadId = this.extractIdFromUrl(this.license.leadId);
            this.type = 'Lead';
        }
        if (this.license.contactId) {
            this.contactId = this.extractIdFromUrl(this.license.contactId);
            this.type = 'Contact';
        }

        if (this.leadId) {
            this.getCampaigns(this.leadId);
        } else if (this.contactId) {
            this.getCampaigns(this.contactId);
        } else {
            // Exception 
        }
    }

    getCampaigns(leadOrContactId) {
        this.navigateId = leadOrContactId;
        this.displaySpinner = true;
        (async () => {
            await getCampaignHistory({
                leadOrContactId: leadOrContactId
            })
                .then(result => {
                    this.displaySpinner = false;
                    this.campaignData = result;
                    this.viewMoreLink = `/lightning/r/${this.type}/${leadOrContactId}/related/CampaignMembers/view`;
                    this.displayViewMoreLink = this.campaignData.length === 0 ? false : true;
                })
                .catch(error => {
                    console.error(error);
                    this.campaignData = undefined;
                    this.displaySpinner = false;
                    this.displayViewMoreLink = false;
                });
        })();
    }

    extractIdFromUrl(url) {
        const regex = /\/([a-zA-Z0-9]{18})$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    handleHelpDoc() {
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: `https://trailhead.salesforce.com/content/learn/modules/appexchange-partners-publishing/appexchange-listing-builder#grow-your-business`
            }
        });
    }

    handleCampaignMore(){
        this[NavigationMixin.Navigate]({
            type: "standard__recordRelationshipPage",
            attributes: {
              recordId: this.navigateId,
              objectApiName: this.type,
              relationshipApiName: "CampaignMembers",
              actionName: "view",
            },
          });
    }
}