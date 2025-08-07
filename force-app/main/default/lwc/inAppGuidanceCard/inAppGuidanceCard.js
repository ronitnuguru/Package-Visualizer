import { LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import getWalkthroughSteps from "@salesforce/apex/PackageVisualizerCtrl.getWalkthroughSteps";
import verifyUnlockedPackageInstalled from "@salesforce/apex/PackageVisualizerCtrl.verifyUnlockedPackageInstalled";

export default class InAppGuidanceCard extends NavigationMixin(LightningElement) {
    displaySpinner = true;

    steps;
    stepsData;

    ifUnlockedPackageInstalled;
    installUnlockedPackageIllustration;
    displayWalkthroughs;

    currentPkgVersionId = '04tRh000001FlXWIA0';

    @wire(verifyUnlockedPackageInstalled)
    wiredData({ error, data }) {
        if (data === true) {
            this.retrieveWalkthroughs();
        } 
        else if (data === false){
            this.displaySpinner = false;
            this.installUnlockedPackageIllustration = true;
        }
        else if (error) {
            this.displaySpinner = false;
            console.error(error);
        }
    }

    retrieveWalkthroughs(){
        (async () => {
            await getWalkthroughSteps({})
                .then(result => {
                    this.displaySpinner = false;
                    this.steps = result;
                })
                .catch(error => {
                    console.error(error);
                    this.displaySpinner = false;
                    // Toast for Failure
                    this.dispatchEvent(
                        new ShowToastEvent({
                        title: "We were unable to process your AppAnalytics request",
                        message: error,
                        variant: "error"
                        })
                    );
                });
            })();
    }
    
    navigateUnlockedPackageInstall(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`
            }
        });
    }

    handleHelpDoc(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `https://salesforce.quip.com/f3SWA340YbFH#temp:C:OUN9d9b55faa67f4078a594ba829`
            }
        });
    }
}