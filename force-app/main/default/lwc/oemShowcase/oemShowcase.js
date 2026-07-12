import { LightningElement } from "lwc";
import { NPI_ITEMS } from "./oemShowcaseData.js";

export default class OemShowcase extends LightningElement {
  items = NPI_ITEMS;
  selectedItem = NPI_ITEMS[0].name;

  // Launch the embedded scratch org builder already in the confirmed "Edit Settings" state.
  autoConfirmSettings = true;

  get selectedNpi() {
    return this.items.find((item) => item.name === this.selectedItem);
  }

  /**
   * Single-item list used to render the embedded scratch org builder with a `key` tied to the
   * selected NPI. Changing the selection swaps the key, so LWC remounts the builder and its
   * guarded `renderedCallback` auto-applies the newly selected template (rather than stacking
   * features onto the previous instance).
   */
  get scratchOrgBuilders() {
    return [this.selectedNpi];
  }

  get bodyPlaceholder() {
    return `${this.selectedNpi.label} content goes here`;
  }

  handleSelect(event) {
    this.selectedItem = event.detail.name;
  }

  handleMarketingLinkClick() {
    window.open(this.selectedNpi.marketingUrl, "_blank");
  }

  handleDeveloperCenterClick() {
    window.open(this.selectedNpi.developerCenterUrl, "_blank");
  }
}
