import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import getLmaTimeline from "@salesforce/apexContinuation/PackageVisualizerCtrl.getLmaTimeline";
import modifyLicense from "@salesforce/apexContinuation/PackageVisualizerCtrl.modifyLicense";
import isFmaParameter from "@salesforce/apex/PackageVisualizerCtrl.isFmaParameter";

export default class PackageLmaTimeline extends NavigationMixin(LightningElement) {
  @api license;

  licenseId;
  viewMoreLink;

  licenseTimelineData;
  displaySpinner = true;
  selectedItem = `activity_timeline`;
  timelineDisplay;
  modifyLicenseDisplay;
  featureParametersDisplay;
  displayModifyLicenseNav;
  campaignDisplay;
  displayEditView;

  expirationToggle;
  seatsToggle;
  modifyExpirationDate;
  modifySeats;
  modifyStatusValue;

  editorValue;

  @wire(isFmaParameter)
  fma({ data, error }) {
    if (data) {
      if (data === true) {
        this.displayFMA = true;
      } else {
        this.displayFMA = false;
      }
    } else if (error) {
      this.displayFMA = undefined;
      console.error(error);
    }
  }

  connectedCallback() {
    this.licenseId = /[^/]*$/.exec(this.license.id)[0];
    this.displayModifyLicenseNav =
      this.license.licenseStatus === "Uninstalled" ? false : true;
    this.getOriginalValues();
    this.getTimeline();
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
    return this.license.licensedSeats === "Site License" ? true : false;
  }

  handleStatusChange(event) {
    this.modifyStatusValue = event.detail.value;
  }

  handleHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.workbook_lma.meta/workbook_lma/lma_edit_license.htm`
      }
    });
  }

  getTimeline() {
    this.displaySpinner = true;
    (async () => {
      await getLmaTimeline({
        licenseId: this.licenseId
      })
        .then(result => {
          this.displaySpinner = false;
          this.timelineDisplay = true;
          this.licenseTimelineData = result;
          this.viewMoreLink = `/lightning/r/${this.licenseId}/related/Histories/view`;
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
          this.timelineDisplay = false;
          this.licenseTimelineData = undefined;
        });
    })();
  }

  handleActivityTimelineClick() {
    this.selectedItem = `activity_timeline`;
    this.timelineDisplay = true;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = false;
    this.campaignDisplay = false;
    this.getTimeline();
  }

  handleModifyLicenseClick() {
    this.selectedItem = `modify_license`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = true;
    this.featureParametersDisplay = false;
    this.campaignDisplay = false;
  }

  handleFeatureParameters() {
    this.selectedItem = `feature_parameters`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = true;
    this.campaignDisplay = false;
  }

  handleCampaignHistory() {
    this.selectedItem = `campaign_history`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = false;
    this.campaignDisplay = true;
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
    this.expirationToggle = this.license.lmaExpirationDate ? false : true;
    this.seatsToggle =
      this.license.licensedSeats === "Site License" ? true : false;
    this.modifySeats = this.license.seats === -1 ? "" : this.license.seats;
    this.modifyExpirationDate = this.license.lmaExpirationDate;
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
          licenseId: this.licenseId,
          expirationDate: expirationInput.value,
          seats: seatsInput.value,
          status: this.modifyStatusValue
        })
          .then(result => {
            this.displaySpinner = false;
            if (result === this.licenseId) {
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Success",
                  message: `${this.license.name} has been successfully modified`,
                  variant: "success"
                })
              );
            }
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

  handleSendEmailClick() {
    let _licencseId = this.extractIdFromUrl(this.license.id);
    let _sendToId;

    if (this.license.leadId) {
      _sendToId = this.extractIdFromUrl(this.license.leadId);
    } else if (this.license.contactId) {
      _sendToId = this.extractIdFromUrl(this.license.contactId);
    } else {
      _sendToId = null;
    }

    var pageRef = {
      type: "standard__quickAction",
      attributes: {
        apiName: "Global.SendEmail"
      },
      state: {
        recordId: _sendToId,
        defaultFieldValues:
          encodeDefaultFieldValues({
            RelatedToId: _licencseId
          })
      }
    };
    this[NavigationMixin.Navigate](pageRef);
  }

  extractIdFromUrl(url) {
    const regex = /\/([a-zA-Z0-9]{18})$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}