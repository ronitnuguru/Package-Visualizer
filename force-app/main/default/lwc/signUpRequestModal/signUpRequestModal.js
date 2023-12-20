import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getEnvHubMemberId from "@salesforce/apex/PackageVisualizerCtrl.getEnvHubMemberId";

export default class SignUpRequestModal extends NavigationMixin(LightningElement) {
    @api rowData;

    instance;
    displayInstance;
    displayInstanceSpinner;
    errorMessage;
    displaySpinner;

    connectedCallback() {
        this.trustUrl = `https://status.salesforce.com/instances/${this.rowData.createdOrgInstance}`;
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
            });
                
        switch (this.rowData.errorCode) {
            case "C-1007":
                this.errorMessage = `Duplicate username`;
                break;
            case "C-1015":
                this.errorMessage = `Error while establishing the new org’s My Domain (subdomain) settings. Contact Salesforce support for assistance`;
                break;
            case "C-1016":
                this.errorMessage = `Error while configuring the OAuth connected app for Proxy Signup. Verify that your connected app has a valid consumer key, callback URL, and unexpired certificate (if applicable)`;
                break;
            case "C-1018":
                this.errorMessage = `Invalid subdomain value provided during sign-up`;
                break;
            case "C-1019":
                this.errorMessage = `Subdomain in use. Choose a new subdomain value`;
                break;
            case "C-1020":
                this.errorMessage = `Template not found. Either the template doesn’t exist or it was deleted`;
                break;
            case "C-9999":
                this.errorMessage = `Generic fatal error. Contact Salesforce Customer Support for assistance.`;
                break;
            case "S-1006":
                this.errorMessage = `Invalid email address (not in a proper email address format)`;
                break;
            case "S-1014":
                this.errorMessage = `Invalid or missing parameters during the sign-up process. Possible solutions include: Indicate a valid callback URL or if indicated, be sure to provide both a Consumer Key and callback URL`;
                break;
            case "S-1018":
                this.errorMessage = `Invalid My Domain (subdomain) name. Select a name that doesn’t: Contain double hyphens or end in a hyphen or include restricted words or exceed 40 characters (33 for Developer Edition)`;
                break;
            case "S-1019":
                this.errorMessage = `My Domain (subdomain) already in use`;
                break;
            case "S-1026":
                this.errorMessage = `Invalid namespace. A namespace must begin with a letter, can’t contain consecutive underscores, can’t be a restricted or reserved namespace, and must be 15 characters or fewer`;
                break;
            case "T-0001":
                this.errorMessage = `Template ID not valid (not in the format 0TTxxxxxxxxxxxx)`;
                break;
            case "T-0002":
                this.errorMessage = `Template not found. Either the template doesn't exist or it was deleted`;
                break;
            case "T-0003":
                this.errorMessage = `Template not approved for use by Salesforce. Contact Salesforce Customer Support for assistance`;
                break;
            case "T-0004":
                this.errorMessage = `The Trialforce Source Organization (TSO) for the template doesn’t exist or has expired.`;
                break;
            default:
                this.errorMessage = `There was an unknown error while creating an org. Please try again later`;
                break;
        }
    }

    async loadInstanceFromTrust() {
        this.displayInstanceSpinner = true;
        let instances;
        let trustEndPoint = `https://api.status.salesforce.com/v1/instances/${this.rowData.createdOrgInstance}/status/preview?childProducts=false`;
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

    handleCancel() {
        this.dispatchEvent(new CustomEvent("cancel"));
    }

    handleEnvHubMemberNavigate() {
        this.displaySpinner = true;
        (async () => {
            await getEnvHubMemberId({
              orgId: this.rowData.createdOrgId
            })
              .then(result => {
                this.displaySpinner = false;
                  this[NavigationMixin.GenerateUrl]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: result,
                        actionName: 'view'
                    }
                }).then(url => {
                    window.open(url, "_blank");
                });
              })
              .catch(error => {
                console.error(error);
                this.displaySpinner = false;
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