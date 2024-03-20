import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getOrgDetails from '@salesforce/apex/PackageVisualizerCtrl.getOrgDetails';

export default class OrgExpirationCard extends NavigationMixin(LightningElement) {

    org;
    error;

    displaySpinner = true;
    numOfDays;

    displayTaskModal;

    @wire(getOrgDetails)
    wiredOrg({ error, data }) {
        if (data) {
            this.org = data;
            if (this.org.TrialExpirationDate) {
                this.numOfDays = new Date(this.org.TrialExpirationDate);
            }
            this.displaySpinner = false;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.org = undefined;
            this.displaySpinner = false;
            console.error(error);
        }
    }

    handleHelpDoc() {
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: `https://help.salesforce.com/s/articleView?id=000387818&type=1`
            }
        });
    }

    handleTrustInstance(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `https://status.salesforce.com/instances/${this.org.InstanceName}/`
            }
        });
    }
}