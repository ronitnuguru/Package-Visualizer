import { LightningElement, api } from "lwc";

export default class WarningModal extends LightningElement {
  @api header;
  @api body;
  @api brandButtonLabel;
  @api neutralButtonLabel;

  handleNeutralClick() {
    this.dispatchEvent(new CustomEvent("neutralclick"));
  }

  handleBrandClick() {
    this.dispatchEvent(new CustomEvent("brandclick"));
  }
}