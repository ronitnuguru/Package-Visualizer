import { LightningElement, api } from "lwc";

export default class UiEmbedding extends LightningElement {
  @api src;
  @api sandbox;
}
