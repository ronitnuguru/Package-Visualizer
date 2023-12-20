import { LightningElement, api } from "lwc";
import FORM_FACTOR from "@salesforce/client/formFactor";

export default class PackageVisualizer extends LightningElement {
  @api flexipageRegionWidth;
  @api packageTypes;

  displayFlexiWidth;

  connectedCallback() {
    if (this.packageTypes === undefined) {
      this.packageTypes = '2GP and Unlocked Packages';
    }

    this.displayFlexiWidth =
      ((this.flexipageRegionWidth === "LARGE" ||
        this.flexipageRegionWidth === "MEDIUM") ||
        (FORM_FACTOR === "Large" || FORM_FACTOR === "Medium"))
        ? true
        : false;
  }
}