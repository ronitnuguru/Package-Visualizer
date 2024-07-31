import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import setPackage2Fields from "@salesforce/apexContinuation/PackageVisualizerCtrl.setPackage2Fields";
import getUser from "@salesforce/apex/PackageVisualizerCtrl.getUser";
import getUserName from "@salesforce/apex/PackageVisualizerCtrl.getUserName";
import { subscribe, unsubscribe, MessageContext } from "lightning/messageService";
import Id from '@salesforce/user/Id';
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

  userId = Id;
  displaySpinner = true;
  displayEditErrorPopover;
  popoverBody;
  popoverTitle;
  packageUserId;
  packageUserName;
  hasRendered;

  subscription = null;
  @wire(MessageContext) messageContext;

  get managedPackageView() {
    return this.packageType === "Managed" ? true : false;
  }

  get packageId() {
    return this.id.split("-").shift();
  }

  userFilter = {
    criteria: [
      {
        fieldPath: "IsActive",
        operator: "eq",
        value: true
      }
    ],
    filterLogic: '1',
  };

  userMatchingInfo = {
    primaryField: { fieldPath: 'Name' },
    additionalFields: [{ fieldPath: 'Username' }],
  };

  userDisplayInfo = {
    additionalFields: ['Username'],
  };

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

  renderedCallback(){
    if(!this.hasRendered){
      if(this.packageErrorUsername){
        (async () => {
          await getUser({
            packageErrorUsername: this.packageErrorUsername
          })
            .then(result => {
              this.displaySpinner = false;
              this.packageUserId = result.Id;
              this.packageUserName = result.Username;
            })
            .catch(error => {
              console.error(error);
              this.displaySpinner = false;
            });
        })();
      } else {
        this.packageUserId = undefined;
        this.packageUsername = ' ';
      }
    }
    this.displaySpinner = false;
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
    this.hasRendered = false;
  }

  handlePackageUserChange(event) {
    this.packageUserId = event.detail.recordId;
    this.hasRendered = true;
  }

  savePackage2(wrapper){
    this.displaySpinner = true;
    (async () => {
      await setPackage2Fields({
        filterWrapper: wrapper,
        objectName: "Package2",
        objectId: this.packageId
      })
        .then(result => {
          this.displaySpinner = false;
          this.hasRendered = false;
          if (result === "success") {
            this.editMode = false;
            this.packageErrorUsername = wrapper.find(item => item.fieldName === "PackageErrorUsername")?.value;
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

  handleSave() {
    this.displaySpinner = true;
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
      if (this.packageUserId) {
        (async () => {
          await getUserName({
            packageUserId: this.packageUserId
          })
            .then(result => {
              wrapper.push({
                fieldName: 'PackageErrorUsername',
                value: result.Username,
                dataType: "STRING"
              });
              this.hasRendered = false;
              this.displaySpinner = false;
              this.savePackage2(wrapper);
            })
            .catch(error => {
              console.error(error);
              this.displaySpinner = false;
              // Toast for Failure
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Something went wrong",
                  message: 'Could not save Pacakge Error Username',
                  variant: "warning"
                })
              );
              this.savePackage2(wrapper);
            });
        })();
      } else {
        if (wrapper.length > 0) {
          if(this.packageUserId === null){
            wrapper.push({
              fieldName: 'PackageErrorUsername',
              value: '',
              dataType: "STRING"
            });
          }
          this.packageErrorUsername = null;
          this.savePackage2(wrapper);
        }
      }
    } catch (error) {
      console.error(error);
      this.displaySpinner = false;
      this.editMode = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Something went wrong",
          message: 'Please enter valid values. Try choosing a valid user for Package Error Username...',
          variant: "error"
        })
      );
    }
  }

  inputRegexCheck(inputVal) {
    return inputVal === null || inputVal.match(/^ *$/) !== null;
  }
}