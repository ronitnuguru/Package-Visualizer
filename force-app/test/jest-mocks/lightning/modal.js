import { LightningElement, api } from "lwc";

export default class LightningModal extends LightningElement {
  static open = jest.fn();
  @api disableClose;
  @api label;
  @api size;
  @api description;

  close() {}
}
