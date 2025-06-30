import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getOrgDetails from '@salesforce/apex/PackageVisualizerCtrl.getOrgDetails';

export default class OrgExpirationCard extends NavigationMixin(LightningElement) {

    org;
    error;
    instance;

    displaySpinner = true;
    numOfDays;

    displayTaskModal;

    async loadInstanceFromTrust() {
        this.displayInstanceSpinner = true;
        let instances;
        let trustEndPoint = `https://api.status.salesforce.com/v1/instances/${this.org.InstanceName}/status/preview?childProducts=false`;
        try {
            const response = await fetch(trustEndPoint);
            instances = await response.json();
            this.displayInstance = true;
            return instances;
        } catch (err) {
            this.displayInstanceSpinner = false;
            this.displayInstance = false;
            console.error(err);
            return undefined;
        }
    }

    @wire(getOrgDetails)
    wiredOrg({ error, data }) {
        if (data) {
            this.org = data;
            if (this.org.TrialExpirationDate) {
                this.numOfDays = new Date(this.org.TrialExpirationDate);
            }
            this.loadInstanceFromTrust()
            .then(result => {
                if (result.message === "Instance not found") {
                    this.instance = undefined;
                } else {
                    this.instance = result;
                }
            })
            .catch(error => {
                this.instance = undefined;
                console.error(error);
            });
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

    handleYourAccount(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `/lightning/n/standard-OnlineSalesHome`
            }
        });
    }

    handleSfdcGo(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `/lightning/setup/SalesforceGo/home`
            }
        });
    }
}