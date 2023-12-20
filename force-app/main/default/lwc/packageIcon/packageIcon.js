import { LightningElement, api } from "lwc";

export default class PackageIcon extends LightningElement {
  @api icon;
  @api namespacePrefix;

  get iconStyle() {
    return this.icon === "Managed" ? "standard:solution" : "custom:custom76";
  }
}