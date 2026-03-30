import { LightningElement, api } from 'lwc';

export default class PackageSubscriberSandboxesView extends LightningElement {
    @api orgKey;
    
    breadCrumbLabel;

    connectedCallback(){
        console.log(this.orgKey);
        this.breadCrumbLabel = `Sandboxes created from production org ${this.orgKey}`;
    }
}