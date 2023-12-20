import { LightningElement, api, wire } from "lwc";
import {
  publish,
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import PACKAGEMESSAGECHANNEL from "@salesforce/messageChannel/PackageMessageChannel__c";

export default class PackageListView extends LightningElement {
  @api id;
  @api index;
  @api currentIndex;
  @api name;
  @api type;
  @api description;
  @api namespacePrefix;

  badgeStyle;
  iconName;
  currentPackageDisplay;
  initialCheck = true;

  subscription = null;

  @wire(MessageContext) messageContext;

  connectedCallback() {
    switch (this.type) {
      case "Managed":
        this.badgeStyle = `managed-badge`;
        this.iconName = 'utility:light_bulb';
        break;
      case "Unlocked":
        this.badgeStyle = `unlocked-badge`;
        this.iconName = 'utility:key';
        break;
      default:
        this.badgeStyle = `slds-badge`;
    }
    if (!this.initialCheck && this.currentIndex !== 0) {
      this.currentPackageDisplay =
        this.index === this.currentIndex ? true : false;
    }

    this.subscription = subscribe(
      this.messageContext,
      PACKAGEMESSAGECHANNEL,
      message => {
        this.currentPackageDisplay =
          message.currentPackageName === this.name ? true : false;
      }
    );
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }

  handlePackageChange() {
    this.dispatchEvent(
      new CustomEvent("packagechange", { detail: this.index })
    );
    publish(this.messageContext, PACKAGEMESSAGECHANNEL, {
      currentPackageName: this.name
    });
    this.initialCheck = false;
  }
}