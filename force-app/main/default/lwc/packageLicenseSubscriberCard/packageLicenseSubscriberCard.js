import { LightningElement, wire, api } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { RefreshEvent } from "lightning/refresh";
import get2GPPackageVersionSubscriberList from "@salesforce/apex/PackageVisualizerCtrl.get2GPPackageVersionSubscriberList";
import modifyLicense from "@salesforce/apexContinuation/PackageVisualizerCtrl.modifyLicense";
import checkPackageSubscriberEnabled from "@salesforce/apex/PackageVisualizerCtrl.checkPackageSubscriberEnabled";

export default class PackageLicenseSubscriberCard extends NavigationMixin(LightningElement) {
    @api recordId;
    
    recordOrgId;
    subscriber;
    usedLicenses;
    licenseStatus;
    licensedSeats;

    displaySpinner = true;
    displayAppAnalyticsModal;
    displayIllustration;
    displayEditLicense;
    displayEditView;
    displayPackageSubscriberFeatureEnabled;
    displayFeatureIllustration;

    expirationToggle;
    seatsToggle;
    modifyExpirationDate;
    modifySeats;
    modifyStatusValue;

    editorValue;

    subscribers;

    selectedTab = "details";


    @wire(getRecord, { recordId: '$recordId', fields: [
      'sfLma__License__c.sfLma__Subscriber_Org_ID__c', 
      'sfLma__License__c.sfLma__Package_Version__r.sfLma__Version_ID__c' ,
      'sfLma__License__c.sfLma__License_Status__c',
      'sfLma__License__c.sfLma__Licensed_Seats__c',
      'sfLma__License__c.sfLma__Expiration_Date__c',
      'sfLma__License__c.sfLma__Seats__c',
      'sfLma__License__c.sfLma__Used_Licenses__c',
      'sfLma__License__c.Name'

    ] })
    wiredRecord({ error, data }) {
        if (data) {
            this.recordOrgId = getFieldValue(data, 'sfLma__License__c.sfLma__Subscriber_Org_ID__c');
            this.recordPackageVersion = getFieldValue(data, 'sfLma__License__c.sfLma__Package_Version__r.sfLma__Version_ID__c');
            this.usedLicenses = getFieldValue(data, 'sfLma__License__c.sfLma__Used_Licenses__c');
            this.licenseStatus =  getFieldValue(data, 'sfLma__License__c.sfLma__License_Status__c');
            this.licensedSeats = getFieldValue(data, 'sfLma__License__c.sfLma__Licensed_Seats__c');
            this.expirationDate = getFieldValue(data, 'sfLma__License__c.sfLma__Expiration_Date__c');
            this.seats = getFieldValue(data, 'sfLma__License__c.sfLma__Seats__c');
            this.name = getFieldValue(data, 'sfLma__License__c.Name');

            this.getSubscriberData();
        } else if (error) {
            this.displaySpinner = false;
            this.displayIllustration = true;
            console.error('Error loading record', error);
        }
    }

    connectedCallback(){
      this.checkPackageSubscriberEnabledOrNot();
      this.getOriginalValues();
    }

    checkPackageSubscriberEnabledOrNot(){
      (async () => {
        await checkPackageSubscriberEnabled({})
          .then(result => {
            this.displaySpinner = false;
            this.displayPackageSubscriberFeatureEnabled = result;
            this.displayFeatureIllustration = result;
          })
          .catch(error => {
            console.error(error);
            this.displayPackageSubscriberFeatureEnabled = false;
            this.displayFeatureIllustration = true;
            this.displaySpinner = false;
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Something went wrong",
                message: "It looks like the Package Subscriber Feature is disabled. Please reach out to the Package Owner for further assistance...",
                variant: "error"
              })
            );
          });
      })();
    }

    getSubscriberData(){
        let wrapper = [
            {
              fieldName: "OrgKey",
              value: this.recordOrgId,
              dataType: "STRING"
            },
            {
              fieldName: "MetadataPackageVersionId",
              value: this.recordPackageVersion,
              dataType: "STRING"
            }
          ];
          (async () => {
            await get2GPPackageVersionSubscriberList({
              filterWrapper: wrapper,
              sortedBy: "orgName",
              sortDirection: "asc",
              subscriberLimit: 1,
              subscriberOffset: 0
            })
              .then(result => {
                this.subscriber = result[0];
                this.subscribers = [
                  {
                    orgKey: this.subscriber.orgKey,
                    orgName: this.subscriber.orgName
                  }
                ]
                this.displaySpinner = false;
              })
              .catch(error => {
                console.error(error);
                this.displaySpinner = false;
                this.subscriber = undefined;
                this.displayIllustration = true;
                // Toast for Failure
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: "Something went wrong",
                    message: "We were unable to retrieve package subscriber data",
                    variant: "error"
                  })
                );
              });
          })();
    }

    handleTrustInstance(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `https://status.salesforce.com/instances/${this.subscriber.instanceName}/`
            }
        });
    }

    handleLogIntoSubscriberConsole(){
        this[NavigationMixin.Navigate]({
          type: "standard__webPage",
          attributes: {
            url: `https://pkgvisualizerlwc2020--sflma.vf.force.com/partnerbt/lmo/subOrgLogin.apexp?directLoginOrgId=${this.subscriber.orgKey}`
          }
        });
    }

    handleAppAnalyticsSubscribers() {
      this.displayAppAnalyticsModal = true;
    }
  
    handleAppAnalyticsCloseModal() {
      this.displayAppAnalyticsModal = false;
    }

    handleTabActive(event){
      this.selectedTab = event.target.value;
      switch (this.selectedTab) {
        case "details":
          this.displayEditLicense = false;
          break;
        case "modify-license":
          this.getOriginalValues();
          this.displayEditLicense = true;
          break;
      }
    }

    get nowDate() {
      return new Date().toISOString();
    }
  
    get statusOptions() {
      return [
        { label: "Active", value: "Active" },
        { label: "Suspended", value: "Suspended" }
      ];
    }
  
    get isSiteLicense() {
      return this.licensedSeats === "Site License" ? true : false;
    }
  
    handleStatusChange(event) {
      this.modifyStatusValue = event.detail.value;
    }

    handleEdit() {
      this.displayEditView = true;
      this.getOriginalValues();
    }
  
    handleModifyLicenseCancel() {
      this.displayEditView = false;
      this.getOriginalValues();
    }
  
    getOriginalValues() {
      this.expirationToggle = (!this.expirationDate || this.expirationDate === "Does not expire") ? true : false;
      this.seatsToggle =
        this.licensedSeats === "Site License" ? true : false;
      this.modifySeats = this.seats === -1 ? "" : this.seats;
      this.modifyExpirationDate = this.expirationDate === "Does not expire" ? null : this.expirationDate;
    }
  
    handleExpirationToggle(event) {
      if (this.template.querySelector(".expirationDate").checkValidity()) {
        this.expirationToggle = event.target.checked;
        if (this.expirationToggle) {
          this.modifyExpirationDate = undefined;
          this.template.querySelector(".expirationDate").setCustomValidity("");
          this.template.querySelector(".expirationDate").reportValidity();
        }
      }
    }
  
    handleSeatsToggle(event) {
      if (this.template.querySelector(".seats").checkValidity()) {
        this.seatsToggle = event.target.checked;
        if (this.seatsToggle) {
          this.modifySeats = "";
          this.template.querySelector(".seats").setCustomValidity("");
          this.template.querySelector(".seats").reportValidity();
        }
      }
    }
  
    handleSeatsChange(event) {
      this.modifySeats = event.detail.value;
    }
  
    handleExpirationChange(event) {
      this.modifyExpirationDate = event.detail.value;
    }
  
    handleModifyLicenseSave() {
      const expirationInput = this.template.querySelector(".expirationDate");
      const seatsInput = this.template.querySelector(".seats");
  
      if (expirationInput.checkValidity() && seatsInput.checkValidity()) {
        this.displaySpinner = true;
        (async () => {
          await modifyLicense({
            licenseId: this.recordId,
            expirationDate: expirationInput.value,
            seats: seatsInput.value,
            status: this.modifyStatusValue
          })
            .then(result => {
              this.displaySpinner = false;
              if (result === this.recordId) {
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: "Success",
                    message: `${this.name} has been successfully modified`,
                    variant: "success"
                  })
                );
              }
              this.dispatchEvent(new RefreshEvent());
              this.displayEditView = false;
              this.dispatchEvent(new CustomEvent("refresh"));
            })
            .catch(error => {
              console.error(error);
              this.displaySpinner = false;
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
    }
    
    handleEditorChange(event) {
      this.editorValue = event.detail.value;
    }

    handleHelpDoc() {
      this[NavigationMixin.Navigate]({
        type: "standard__webPage",
        attributes: {
          url: `https://developer.salesforce.com/docs/atlas.en-us.workbook_lma.meta/workbook_lma/lma_edit_license.htm`
        }
      });
    }
}