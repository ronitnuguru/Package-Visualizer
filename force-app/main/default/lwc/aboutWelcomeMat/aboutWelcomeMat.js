import { LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getWelcomeMatAboutSteps from "@salesforce/apex/PackageVisualizerCtrl.getWelcomeMatAboutSteps";


export default class AboutWelcomeMat extends LightningElement {
  displaySpinner = true;

  steps;
  stepsData;

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  @wire(getWelcomeMatAboutSteps, {})
  welcomeMatAboutSteps(result) {
    this.steps = result;
    if (result.data) {
      this.displaySpinner = false;
      this.stepsData = result.data;
    } else if (result.error) {
      this.displaySpinner = false;
      this.stepsData = result.undefined;
      console.error(result.error);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Unable to retrieve the Welcome Mat Steps",
          message: result.error,
          variant: "error"
        })
      );
    }
  }
}