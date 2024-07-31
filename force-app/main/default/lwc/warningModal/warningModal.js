import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";

export default class WarningModal extends NavigationMixin(LightningElement) {
  @api header;
  @api body;
  @api brandButtonLabel;
  @api neutralButtonLabel;
  @api learnMoreButtonLabel;
  @api learnMoreUrl;

  handleNeutralClick() {
    this.dispatchEvent(new CustomEvent("neutralclick"));
  }

  handleBrandClick() {
    this.dispatchEvent(new CustomEvent("brandclick"));
  }

  handleLearnMore(){
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
          url: this.learnMoreUrl
      }
    });
  }
}