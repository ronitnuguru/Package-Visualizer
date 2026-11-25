import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";

export default class WarningModal extends NavigationMixin(LightningElement) {
  @api header;
  @api body;
  @api brandButtonLabel;
  @api brandButtonVariant = "brand";
  @api neutralButtonLabel;
  @api learnMoreButtonLabel;
  @api learnMoreUrl;
  hasFocused = false;

  get brandButtonClass() {
    return this.brandButtonVariant === "destructive"
      ? "slds-button slds-button_destructive"
      : "slds-button slds-button_brand";
  }

  renderedCallback() {
    if (!this.hasFocused) {
      this.hasFocused = true;
      this.template.querySelector('[data-id="cancel"]').focus();
    }
  }

  handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.handleNeutralClick();
    } else if (event.key === "Tab") {
      const buttons = this.template.querySelectorAll("button");
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && event.target === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && event.target === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

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
