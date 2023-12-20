import { LightningElement, api, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getPrompt from "@salesforce/apex/PackageVisualizerCtrl.getPrompt";

export default class InAppPrompt extends NavigationMixin(LightningElement) {
  @api prompt;

  displaySpinner = true;
  displayEmptyContent;
  promptPopoverStyle;
  promptData;

  @wire(getPrompt, { prompt: "$prompt" })
  promptHelp({ error, data }) {
    if (data) {
      this.promptData = data;
      this.promptPopoverStyle = `slds-popover slds-popover_prompt slds-popover_brand slds-is-fixed ${this.promptData.pkgviz__Prompt_Popover_Location__c}`;
      this.displaySpinner = false;
    } else if (error) {
      this.promptData = undefined;
      this.displaySpinner = false;
      this.displayEmptyContent = true;
      console.error(error);
    }
  }

  navigateToPromptBrandButton() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `${this.promptData.pkgviz__Brand_Button_URL__c}`
      }
    });
  }

  handlePromptClose() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }
}