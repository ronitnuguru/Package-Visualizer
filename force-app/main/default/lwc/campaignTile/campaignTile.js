import { LightningElement, api } from 'lwc';

export default class CampaignTile extends LightningElement {
    @api campaign
    
    campaignLink;

    connectedCallback(){
        this.campaignLink = `/lightning/r/Campaign/${this.campaign.Campaign.Id}/view`;
    }
}