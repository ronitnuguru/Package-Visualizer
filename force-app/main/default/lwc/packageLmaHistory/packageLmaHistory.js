import { LightningElement, api } from "lwc";

export default class PackageLmaHistory extends LightningElement {
  @api field;
  @api createdDate;
  @api newValue;
  @api oldValue;

  get activityIcon() {
    if (this.field === "created") {
      return "standard:solution";
    } else if (this.field === "sfLma__Package_Version__c") {
      return "standard:drafts";
    } else if (this.field === "sfLma__Expiration__c") {
      return "custom:custom95";
    } else if (this.field === "sfLma__Seats__c") {
      return "standard:partner_fund_request"
    }
    return "standard:activations";
  }

  get activityTitle() {
    if (this.field === "created") {
      return `Package License was Created`;
    } else if (this.field === "sfLma__Package_Version__c") {
      return `Package Version was Upgraded`;
    } else if (this.field === "sfLma__Expiration__c"){
      return `Package Expiration Date was Updated`;
    } else if (this.field === "sfLma__Seats__c"){
      return `Package Licensed Seats was Updated`;
    }
    return `Package Status was Updated`;
  }

  get activityDescription() {
    if (this.field === "sfLma__Package_Version__c" || this.field === "sfLma__Status__c") {
      return `${this.oldValue} to ${this.newValue}`;
    } else if (this.field === "sfLma__Expiration__c"){
      const origValue = !this.oldValue ? `Does not Expire` : this.oldValue;
      const latestValue = !this.newValue ? `Does not Expire` : this.newValue;
      return `${origValue} to ${latestValue}`;
    } else if (this.field === "sfLma__Seats__c"){
      const origValue = this.oldValue === -1 ? `Unlimited` : this.oldValue;
      const latestValue = this.newValue === -1 ? `Unlimited` : this.newValue;
      return `${origValue} to ${latestValue}`;
    }
    return null;
  }
}