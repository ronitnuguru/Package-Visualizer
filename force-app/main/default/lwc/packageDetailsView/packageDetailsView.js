import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import setPackage2Fields from "@salesforce/apexContinuation/PackageVisualizerCtrl.setPackage2Fields";
import {
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import PACAKGEEDITMESSAGECHANNEL from "@salesforce/messageChannel/PackageEditMessageChannel__c";

export default class PackageDetailsView extends LightningElement {
  @api id;
  @api name;
  @api subscriberPackageId;
  @api namespacePrefix;
  @api description;
  @api isDeprecated;
  @api isOrgDependent;
  @api wasTransferred;
  @api packageType;
  @api packageErrorUsername;
  @api packageCreatedDate;
  @api packageCreatedBy;
  @api packageLastModifiedDate;
  @api editMode;

  displaySpinner;
  displayEditErrorPopover;
  popoverBody;
  popoverTitle;

  subscription = null;
  @wire(MessageContext) messageContext;

  get managedPackageView() {
    return this.packageType === "Managed" ? true : false;
  }

  get packageId() {
    return this.id.split("-").shift();
  }

  connectedCallback() {
    this.subscription = subscribe(
      this.messageContext,
      PACAKGEEDITMESSAGECHANNEL,
      message => {
        this.editMode = true;
        this.displayEditErrorPopover = false;
      }
    );
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
    this.editMode = false;
  }

  handlePopoverClose() {
    this.displayEditErrorPopover = false;
  }

  handleCancel() {
    this.editMode = false;
  }

  handleSave() {
    try {
      let wrapper = [];
      let editableFields = this.template.querySelectorAll(".edit-field");
      editableFields.forEach(input => {
        if (input.value) {
          wrapper.push({
            fieldName: input.name,
            value: input.value,
            dataType: "STRING"
          });
        }
      });
      if (wrapper.length > 0) {
        this.displaySpinner = true;
        (async () => {
          await setPackage2Fields({
            filterWrapper: wrapper,
            objectName: "Package2",
            objectId: this.packageId
          })
            .then(result => {
              this.displaySpinner = false;
              if (result === "success") {
                this.editMode = false;
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: "Success",
                    message: `${this.name} was successfully updated`,
                    variant: "success"
                  })
                );
                this.dispatchEvent(new CustomEvent("fieldupdate"));
              } else {
                let errorMessage = JSON.parse(result);
                if (errorMessage[0]) {
                  this.popoverBody = errorMessage[0].message;
                  this.popoverTitle = errorMessage[0].errorCode;
                  this.editMode = true;
                  this.displayEditErrorPopover = true;
                } else {
                  this.editMode = false;
                  console.error(errorMessage);
                  this.dispatchEvent(
                    new ShowToastEvent({
                      title: "Something went wrong",
                      message: errorMessage,
                      variant: "error"
                    })
                  );
                }
              }
            })
            .catch(error => {
              console.error(error);
              this.displaySpinner = false;
              this.editMode = false;
              // Toast for Failure
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Something went wrong",
                  message: error,
                  variant: "error"
                })
              );
            });
        })();
      }
    } catch (error) {
      console.error(error);
      this.displaySpinner = false;
      this.editMode = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Something went wrong",
          message: error,
          variant: "error"
        })
      );
    }
  }

  inputRegexCheck(inputVal) {
    return inputVal === null || inputVal.match(/^ *$/) !== null;
  }
}