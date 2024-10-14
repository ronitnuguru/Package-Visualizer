import { LightningElement, api, wire } from "lwc";
import { getRecord } from 'lightning/uiRecordApi';
import isSignupRequest from "@salesforce/apex/PackageVisualizerCtrl.isSignupRequest";
import Id from '@salesforce/user/Id';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, subscribe, unsubscribe, MessageContext } from "lightning/messageService";
import createSignupTrial from "@salesforce/apexContinuation/PackageVisualizerCtrl.createSignupTrial";
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import SIGNUPLISTMESSAGECHANNEL from "@salesforce/messageChannel/SignupListMessageChannel__c";
import CREATEORGMESSAGECHANNEL from "@salesforce/messageChannel/CreateOrgMessageChannel__c";
import FirstName from '@salesforce/schema/User.FirstName'; 
import LastName from '@salesforce/schema/User.LastName'; 
import Email from '@salesforce/schema/User.Email'; 

import PLATFORM_ICON from "@salesforce/contentAssetUrl/PlatformIcon";
import INDUSTRIES_ICON from "@salesforce/contentAssetUrl/IndustriesIcon";
import FINANCIAL_SERVICES_CLOUD_ICON from "@salesforce/contentAssetUrl/FinancialServicesIcon";
import HEALTH_CLOUD_ICON from "@salesforce/contentAssetUrl/HealthcareCloudIcon";
import LIFE_SCIENCES_CLOUD_ICON from "@salesforce/contentAssetUrl/LifeSciencesCloudIcon";
import CONSUMER_GOODS_CLOUD_ICON from "@salesforce/contentAssetUrl/ConsumerGoodsIcon";
import ENERGY_AND_UTILITIES_CLOUD_ICON from "@salesforce/contentAssetUrl/EnergyAndUtilitiesCloudIcon";
import AUTOMOTIVE_CLOUD_ICON from "@salesforce/contentAssetUrl/AutomotiveCloudIcon";
import SUSTAINABILITY_CLOUD_ICON from "@salesforce/contentAssetUrl/SustainabilityCloud";
import MANUFACTURING_CLOUD_ICON from "@salesforce/contentAssetUrl/ManufacturingCloudIcon";
import COMMUNICATIONS_CLOUD_ICON from "@salesforce/contentAssetUrl/CommunicationsCloudIcon";
import EDUCATION_CLOUD_ICON from "@salesforce/contentAssetUrl/EducationCloudIcon";
import NONPROFIT_CLOUD_ICON from "@salesforce/contentAssetUrl/NonprofitCloudIcon";
import PUBLICSECTOR_CLOUD_ICON from "@salesforce/contentAssetUrl/PublicSectorCloudIcon";
import MEDIA_CLOUD_ICON from "@salesforce/contentAssetUrl/MediaCloudIcon";

export default class DockedComposer extends NavigationMixin(LightningElement) {

  userId = Id;
  currentUserFirstName;
  currentUserLastName;
  currentUserEmail;
  currentUserAutofillError;

  platformIconUrl = PLATFORM_ICON;
  industriesIconUrl = INDUSTRIES_ICON;
  financialServicesIconUrl = FINANCIAL_SERVICES_CLOUD_ICON;
  healthCloudIconUrl = HEALTH_CLOUD_ICON;
  consumerGoodsCloudIconUrl = CONSUMER_GOODS_CLOUD_ICON;
  energyAndUtilitiesCloudIconUrl = ENERGY_AND_UTILITIES_CLOUD_ICON;
  sustainabilityCloudIconUrl = SUSTAINABILITY_CLOUD_ICON;
  automotiveCloudIconUrl = AUTOMOTIVE_CLOUD_ICON;
  manufacturingCloudIconUrl = MANUFACTURING_CLOUD_ICON;
  lifeSciencesCloudIconUrl = LIFE_SCIENCES_CLOUD_ICON;
  communicationsCloudIconUrl = COMMUNICATIONS_CLOUD_ICON;
  educationCloudIconUrl = EDUCATION_CLOUD_ICON;
  publicSectorCloudIconUrl = PUBLICSECTOR_CLOUD_ICON;
  nonprofitCloudIconUrl = NONPROFIT_CLOUD_ICON;
  mediaCloudIconUrl = MEDIA_CLOUD_ICON;

  @wire(getRecord, { recordId: Id, fields: [ FirstName, LastName, Email ] })
    userDetails({ error, data }) {
        if (error) {
            this.currentUserAutofillError = true;
        } else if (data) {
            this.currentUserFirstName = data.fields.FirstName.value;
            this.currentUserLastName = data.fields.LastName.value;
            this.currentUserEmail = data.fields.Email.value;
        }
  }

  @wire(MessageContext) messageContext;
  @api displayOrgs;

  displaySignUpRequest;
  @wire(isSignupRequest)
  signupRequest({ data }) {
    if(data === true){
      this.displaySignUpRequest = true;
    } else {
      this.displaySignUpRequest = false;
    }
  }

  isDockedComposerOpen = true;
  dockedComposerView = `slds-docked-composer slds-grid slds-grid_vertical slds-is-closed`;
  isExpanded = false;

  trialDays = 30;
  preferredLanguage = 'en_US';
  country = 'US';
  isSignupEmailSuppressed = false;
  shouldConnectToEnvHub = true;
  masterSubscriptionAgreement;
  partnerPocketGuideLink;

  displayError;
  errorText;
  displaySpinner;

  purposeValue;
  industryTemplateValue;
  createUsingValue = "standard";
  displayCreateUsingOptions;
  displayIndustryOptions;
  displayStandard = true;

  editionValue;
  displayDevelopmentOptions;
  displayTestDemoOptions;
  displayTsoOptions;
  templateId;

  selectedTab = "sign-up-create";
  displayFooter = true;

  subscription = null;

  handleAutofill(){
    this.template.querySelector('.firstName').value = this.currentUserFirstName;
    this.template.querySelector('.lastName').value = this.currentUserLastName;
    this.template.querySelector('.email').value = this.currentUserEmail;
  }

  get developmentOptions() {
    return [
      { label: 'Partner Developer', value: 'Partner Developer' }
    ];
  }

  get isPackageVisualizerEnabled() {
    return hasPackageVisualizerCore;
  }

  get testDemoOptions() {
    return [
      { label: 'Partner Enterprise', value: 'Partner Enterprise' },
      { label: 'Partner Professional', value: 'Partner Professional' },
      { label: 'Partner Group', value: 'Partner Group' },
      { label: 'Professional', value: 'Professional' },
      { label: 'Sales Enterprise', value: 'Sales Enterprise' },
      { label: 'Service Professional', value: 'Service Professional' }];
  }

  get tsoOptions() {
    return [
      { label: 'Enterprise TSO', value: 'Enterprise TSO' },
      { label: 'Professional TSO', value: 'Professional TSO' }
    ];
  }

  get purposeOptions() {
    return [
        { label: 'Development', value: 'development' },
        { label: 'Test/Demo', value: 'test/demo' },
        { label: 'Industry Development', value: 'industry-templates' }
    ];
  }

  get industryTemplateOptions(){
    return [
        { label: 'Financial Services Cloud' , value: '0TTWs0000009Y2T' },
        { label: 'Health Cloud' , value: '0TTWs0000009Xw1' },
        { label: 'Life Sciences Cloud' , value: '0TTWs000000AVfF' },
        { label: 'Consumer Goods Cloud - Retail Execution', value: '0TTWs0000009Yor'},
        { label: 'Consumer Goods Cloud - Trade Promotion Management', value: '0TTWs0000009YvJ'},
        { label: 'Manufacturing Cloud', value: '0TTWs0000009Y8v'},
        { label: 'Automotive Cloud', value: '0TTWs0000009YJV'},
        { label: 'Energy and Utilities Cloud', value: '0TTWs0000009ZwD'},
        { label: 'Net Zero Cloud', value: '0TTWs0000009YiP'},
        { label: 'Communications Cloud', value: '0TTWs0000009ZeT'},
        { label: 'Education Cloud', value: '0TTWs0000009a8P'},
        { label: 'Media Cloud', value: '0TTWs0000009Zkv'},
        { label: 'Nonprofit Cloud', value: '0TTWs0000009kjZ'},
        { label: 'Public Sector Cloud', value: '0TTWs0000009Ybx'},
    ];
  }

  get createUsingOptions() {
    return [
      { label: 'Standard Edition', value: 'standard' },
      { label: 'Trialforce Template ID', value: 'trialforce' },
    ];
  }

  connectedCallback() {
    this.subscription = subscribe(
      this.messageContext,
      DOCKEDUTILITYBARMESSAGECHANNEL,
      message => {
        if (message) {
          if (message.dockedBarControls === "CreateOrgs") {
            this.isExpanded = true;
            this.isDockedComposerOpen = true;
            this.dockedComposerView = `slds-docked-composer slds-grid slds-grid_vertical slds-is-open`;
          }
        }
      }
    );
    this.subscription = subscribe(
      this.messageContext, 
      CREATEORGMESSAGECHANNEL, 
      message => {
        if(message) {
          this.handleAutofill();

          this.purposeValue = message.orgType.purposeValue;
          this.createUsingValue = message.orgType.createUsingValue;
          this.editionValue = message.orgType.editionValue;
          this.displayDevelopmentOptions = true;
          this.displayTestDemoOptions = false;
          this.displayTsoOptions = false;
          this.displayIndustryOptions = false;
          
        }
      }
    );
  }

  handleExpand() {
    this.isExpanded = !this.isExpanded;
    this.dockedComposerView = this.isExpanded
      ? `slds-docked-composer slds-grid slds-grid_vertical slds-is-open`
      : `slds-docked-composer slds-grid slds-grid_vertical slds-is-closed`;
  }

  handleClose() {
    this.isDockedComposerOpen = false;
    this.dockedComposerView = `slds-docked-composer slds-grid slds-grid_vertical slds-is-closed`;
  }

  handleOpen() {
    this.isDockedComposerOpen = true;
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }

  editionChange(event) {
    this.editionValue = event.detail.value;
  }

  handleSuppressEmailChange(event) {
    this.isSignupEmailSuppressed = event.target.checked;
  }

  handleEnvHubChange(event) {
    this.shouldConnectToEnvHub = event.target.checked;
  }

  handleMasterSubscriptionAgreement(event){
    this.masterSubscriptionAgreement = event.target.checked;
  }

  handleActive(event) {
    this.selectedTab = event.target.value;
    this.displayFooter = this.selectedTab === 'sign-up-create' ? true : false;
  }

  industryTemplateChange(event) {
    this.industryTemplateValue = event.detail.value;
            
    let selectedLabel = event.target.options.find(opt => opt.value === event.detail.value).label;
    
    switch (selectedLabel) {
        case "Financial Services Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/4UUtAVZlDZWB';
            this.industryTypeIcon = this.financialServicesIconUrl;
        break;
        case "Health Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/KndcASmayUg4';
            this.industryTypeIcon = this.healthCloudIconUrl;
        break;
        case "Consumer Goods Cloud - Retail Execution":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/sfz0Atx4JASz';
            this.industryTypeIcon = this.consumerGoodsCloudIconUrl;
        break;
        case "Consumer Goods Cloud - Trade Promotion Management":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/e3D5AxkcisIU';
            this.industryTypeIcon = this.consumerGoodsCloudIconUrl;
        break;
        case "Manufacturing Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/7FvdANrb3HIC';
            this.industryTypeIcon = this.manufacturingCloudIconUrl;
        break;
        case "Automotive Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/3rbkAtiEDqrh';
            this.industryTypeIcon = this.automotiveCloudIconUrl;
        break;
        case "Energy and Utilities Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/gspfAFdJHzzB';
            this.industryTypeIcon = this.energyAndUtilitiesCloudIconUrl;
        break;
        case "Net Zero Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/vW5eAoGFm73Y';
            this.industryTypeIcon = this.sustainabilityCloudIconUrl;
        break;
        case "Life Sciences Cloud":
            this.partnerPocketGuideLink = null;
            this.industryTypeIcon = this.lifeSciencesCloudIconUrl;
        break;
        case "Communications Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/NMljAq78Faau';
            this.industryTypeIcon = this.communicationsCloudIconUrl;
        break;
        case "Education Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/xGX7A4fL0qZ9';
            this.industryTypeIcon = this.educationCloudIconUrl;
        break;
        case "Media Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/LO7xAb6vaFgQ';
            this.industryTypeIcon = this.mediaCloudIconUrl;
        break;
        case "Nonprofit Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/r2jgADR0qSuU';
            this.industryTypeIcon = this.nonprofitCloudIconUrl;
        break;
        case "Public Sector Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/ybE3Aj99fAm0';
            this.industryTypeIcon = this.publicSectorCloudIconUrl;
        break;
        default:
            this.partnerPocketGuideLink = null;
            this.industryTypeIcon = null;
    }
  }

  purposeChange(event) {
    this.purposeValue = event.detail.value;
    if (this.purposeValue === 'development' || this.purposeValue === 'tso') {
        this.displayCreateUsingOptions = false;
        this.createUsingValue = 'standard';
        if (this.purposeValue === 'development') {
            this.displayDevelopmentOptions = true;
            this.displayTestDemoOptions = false;
            this.displayTsoOptions = false;
            this.displayIndustryOptions = false;
            this.purposeIcon = this.platformIconUrl;
        } else {
            this.displayTsoOptions = true;
            this.displayTestDemoOptions = false;
            this.displayDevelopmentOptions = false;
            this.displayIndustryOptions = false;
        }
    } else if (this.purposeValue === 'test/demo') {
        this.displayCreateUsingOptions = true;
        this.displayTestDemoOptions = true;
        this.displayDevelopmentOptions = false;
        this.displayTsoOptions = false;
        this.displayIndustryOptions = false;
        this.purposeIcon = this.platformIconUrl;
    } else if (this.purposeValue === 'industry-templates'){
        this.displayCreateUsingOptions = false;
        this.displayDevelopmentOptions = false;
        this.displayTestDemoOptions = false;
        this.displayTsoOptions = false;
        this.displayIndustryOptions = true;
        this.purposeIcon = this.industriesIconUrl;
    }
    this.displayStandard = this.createUsingValue === 'trialforce' ? false : true;
  }

  navigateToDemoDevStation(){
    this[NavigationMixin.Navigate]({
        type: "standard__webPage",
        attributes: {
            url: `https://partners.salesforce.com/pdx/s/learn/article/demo-station-for-partners-MCUTYORCVUVNCJTIVCKP6VHUKF3M?language=en_US`
        }
    }); 
  }

  handleCreateUsingChange(event) {
    this.createUsingValue = event.detail.value;
    this.displayStandard = this.createUsingValue === 'trialforce' ? false : true;
  }

  handlePopoverClose() {
    this.displayError = false;
  }

  handleStartTrial(event) {
    this.displaySpinner = true;
    const allValid = [...this.template.querySelectorAll('lightning-input'), ...this.template.querySelectorAll('lightning-combobox'), ...this.template.querySelectorAll('lightning-radio-group')].reduce((validSoFar, inputCmp) => {
      inputCmp.reportValidity();
      return validSoFar && inputCmp.checkValidity();
    }, true);
    if (allValid && this.masterSubscriptionAgreement) {
      this.handlePopoverClose();
      this.createSignupTrial();
    } else {
      this.displayError = true;
      this.errorText = 'Please update all the required fields correctly and try again.'
      this.displaySpinner = false;
    }
  }

  handleSuccessSignup(email, company) {

    this.displaySpinner = false;

    this.template.querySelector('.firstName').value = null;
    this.template.querySelector('.lastName').value = null;
    this.template.querySelector('.email').value = null;
    this.template.querySelector('.userName').value = null;
    this.template.querySelector('.company').value = null;
    this.template.querySelector('.myDomain').value = null;
    this.purposeValue = null;
    this.trialDays = 30;
    this.shouldConnectToEnvHub = true;
    this.isSignupEmailSuppressed = false;
    this.masterSubscriptionAgreement = false;

    this.partnerPocketGuideLink = null;
    this.industryTypeIcon = null;
    this.purposeIcon = null;

    this.dispatchEvent(
      new ShowToastEvent({
        title: `Trial for ${company} has been queued`,
        message: `Review login instructions in ${email}'s inbox`,
        variant: "success"
      })
    );

  }

  createSignupTrial() {
    let company = this.template.querySelector('.company').value;
    let email = this.template.querySelector('.email').value;

    if (!this.displayStandard) {
      this.templateId = this.template.querySelector('.templateId').value
    } else if(this.purposeValue === 'industry-templates'){
        this.templateId = this.industryTemplateValue;
        this.editionValue = null;
    } else {
        this.templateId = '';
    }

    (async () => {
      await createSignupTrial({
        firstName: this.template.querySelector('.firstName').value,
        lastName: this.template.querySelector('.lastName').value,
        email: email,
        userName: this.template.querySelector('.userName').value,
        company: company,
        myDomain: this.template.querySelector('.myDomain').value,
        country: this.country,
        preferredLanguage: this.preferredLanguage,
        templateId: this.templateId,
        edition: this.editionValue,
        trialDays: this.trialDays,
        isSignupEmailSuppressed: this.isSignupEmailSuppressed,
        shouldConnectToEnvHub: this.shouldConnectToEnvHub,
      })
        .then(result => {
          this.handleSuccessSignup(email, company);
        })
        .catch(error => {
          this.displaySpinner = false;
          this.displayError = true;

          console.error(error);
          if (error.body.message) {
            this.errorText = error.body.message;
            this.dispatchEvent(
              new ShowToastEvent({
                title: `Error`,
                message: `Can't create trial for ${company}`,
                variant: "error"
              })
            );
          } else {
            this.errorText = `${Object.entries(error.body.fieldErrors)[0][1][0].statusCode}: ${Object.entries(error.body.fieldErrors)[0][1][0].message}`;
            this.dispatchEvent(
              new ShowToastEvent({
                title: `Error`,
                message: `Can't create trial for ${company}`,
                variant: "error"
              })
            );
          }
        });
    })();
  }

  handleMinimize() {
    this.dockedComposerView = `slds-docked-composer slds-grid slds-grid_vertical slds-is-closed`;
    this.isExpanded = false;
  }

  handleTrialDaysChange(event) {
    this.trialDays = event.detail.value;
  }

  handleTrialsTrailhead() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://trailhead.salesforce.com/content/learn/modules/isv_app_trials`
      }
    });
  }

  handleHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://salesforce.quip.com/f3SWA340YbFH#temp:C:OUN0313da3cd7494be9a6d27e23e`
      }
    });
  }

  handlePartnerPocketGuide(){
    this[NavigationMixin.Navigate]({
        type: "standard__webPage",
        attributes: {
            url: this.partnerPocketGuideLink
        }
    });
  }

  navigateToRightSfdcOrg(){
    this[NavigationMixin.Navigate]({
        type: "standard__webPage",
        attributes: {
            url: 'https://developer.salesforce.com/blogs/2024/05/choose-the-right-salesforce-org-for-the-right-job'
        }
    });
  }

  handleRefresh() {
    publish(this.messageContext, SIGNUPLISTMESSAGECHANNEL, {
      refresh: true
    });
  }

  get preferredLanguageOptions() {
    return [
      { label: 'English', value: 'en_US' },
      { label: 'Chinese (Simplified)', value: 'zh_CN' },
      { label: 'Chinese (Traditional)', value: 'zh_TW' },
      { label: 'Dutch', value: 'nl_NL' },
      { label: 'Danish', value: 'zh_TW' },
      { label: 'Finnish', value: 'fi' },
      { label: 'French', value: 'fr' },
      { label: 'German', value: 'de' },
      { label: 'Italian', value: 'it' },
      { label: 'Japanese', value: 'ja' },
      { label: 'Korean', value: 'ko' },
      { label: 'Norwegian', value: 'no' },
      { label: 'Portuguese (Brazil)', value: 'pt_BR' },
      { label: 'Russian', value: 'ru' },
      { label: 'Spanish', value: 'es' },
      { label: 'Spanish (Mexico)', value: 'es_MX' },
      { label: 'Swedish', value: 'sv' },
      { label: 'Thai', value: 'th' },
    ];
  }

  handlePreferredLanguageChange(event) {
    this.preferredLanguage = event.detail.value;
  }

  handleCountryChange(event) {
    this.country = event.detail.value;
  }

  get countryOptions() {
    return [
      { value: "US", label: "United States" },
      { value: "AF", label: "Afghanistan" },
      { value: "AL", label: "Albania" },
      { value: "DZ", label: "Algeria" },
      { value: "AS", label: "American Samoa" },
      { value: "AD", label: "Andorra" },
      { value: "AI", label: "Anguilla" },
      { value: "AQ", label: "Antarctica" },
      { value: "AG", label: "Antigua And Barbuda" },
      { value: "AR", label: "Argentina" },
      { value: "AM", label: "Armenia" },
      { value: "AW", label: "Aruba" },
      { value: "AU", label: "Australia" },
      { value: "AT", label: "Austria" },
      { value: "AZ", label: "Azerbaijan" },
      { value: "BS", label: "Bahamas, The" },
      { value: "BH", label: "Bahrain" },
      { value: "BD", label: "Bangladesh" },
      { value: "BB", label: "Barbados" },
      { value: "BY", label: "Belarus" },
      { value: "BZ", label: "Belize" },
      { value: "BE", label: "Belgium" },
      { value: "BJ", label: "Benin" },
      { value: "BM", label: "Bermuda" },
      { value: "BT", label: "Bhutan" },
      { value: "BO", label: "Bolivia" },
      { value: "BV", label: "Bouvet Is" },
      { value: "BA", label: "Bosnia and Herzegovina" },
      { value: "BW", label: "Botswana" },
      { value: "BR", label: "Brazil" },
      { value: "IO", label: "British Indian Ocean Territory" },
      { value: "BN", label: "Brunei" },
      { value: "BG", label: "Bulgaria" },
      { value: "BF", label: "Burkina Faso" },
      { value: "BI", label: "Burundi" },
      { value: "KH", label: "Cambodia" },
      { value: "CM", label: "Cameroon" },
      { value: "CA", label: "Canada" },
      { value: "CV", label: "Cape Verde" },
      { value: "KY", label: "Cayman Is" },
      { value: "CF", label: "Central African Republic" },
      { value: "TD", label: "Chad" },
      { value: "CL", label: "Chile" },
      { value: "CN", label: "China" },
      { value: "HK", label: "Hong Kong" },
      { value: "MO", label: "Macau" },
      { value: "CX", label: "Christmas Is" },
      { value: "CC", label: "Cocos (Keeling) Is" },
      { value: "CO", label: "Colombia" },
      { value: "KM", label: "Comoros" },
      { value: "CK", label: "Cook Islands" },
      { value: "CR", label: "Costa Rica" },
      { value: "CI", label: "Cote D'Ivoire (Ivory Coast)" },
      { value: "HR", label: "Croatia (Hrvatska)" },
      { value: "CY", label: "Cyprus" },
      { value: "CZ", label: "Czech Republic" },
      { value: "CD", label: "Democratic Republic of the Congo" },
      { value: "DK", label: "Denmark" },
      { value: "DM", label: "Dominica" },
      { value: "DO", label: "Dominican Republic" },
      { value: "DJ", label: "Djibouti" },
      { value: "EC", label: "Ecuador" },
      { value: "EG", label: "Egypt" },
      { value: "SV", label: "El Salvador" },
      { value: "GQ", label: "Equatorial Guinea" },
      { value: "ER", label: "Eritrea" },
      { value: "EE", label: "Estonia" },
      { value: "ET", label: "Ethiopia" },
      { value: "FK", label: "Falkland Is (Is Malvinas)" },
      { value: "FO", label: "Faroe Islands" },
      { value: "FJ", label: "Fiji Islands" },
      { value: "FI", label: "Finland" },
      { value: "FR", label: "France" },
      { value: "GF", label: "French Guiana" },
      { value: "PF", label: "French Polynesia" },
      { value: "TF", label: "French Southern Territories" },
      { value: "MK", label: "F.Y.R.O. Macedonia" },
      { value: "GA", label: "Gabon" },
      { value: "GM", label: "Gambia, The" },
      { value: "GE", label: "Georgia" },
      { value: "DE", label: "Germany" },
      { value: "GH", label: "Ghana" },
      { value: "GI", label: "Gibraltar" },
      { value: "GR", label: "Greece" },
      { value: "GL", label: "Greenland" },
      { value: "GD", label: "Grenada" },
      { value: "GP", label: "Guadeloupe" },
      { value: "GU", label: "Guam" },
      { value: "GT", label: "Guatemala" },
      { value: "GN", label: "Guinea" },
      { value: "GW", label: "Guinea-Bissau" },
      { value: "GY", label: "Guyana" },
      { value: "HT", label: "Haiti" },
      { value: "HM", label: "Heard and McDonald Is" },
      { value: "HN", label: "Honduras" },
      { value: "HU", label: "Hungary" },
      { value: "IS", label: "Iceland" },
      { value: "IN", label: "India" },
      { value: "ID", label: "Indonesia" },
      { value: "IE", label: "Ireland" },
      { value: "IL", label: "Israel" },
      { value: "IT", label: "Italy" },
      { value: "JM", label: "Jamaica" },
      { value: "JP", label: "Japan" },
      { value: "JO", label: "Jordan" },
      { value: "KZ", label: "Kayakhstan" },
      { value: "KE", label: "Kenya" },
      { value: "KI", label: "Kiribati" },
      { value: "KR", label: "Korea, South" },
      { value: "KW", label: "Kuwait" },
      { value: "KG", label: "Kyrgyzstan" },
      { value: "LA", label: "Laos" },
      { value: "LV", label: "Latvia" },
      { value: "LB", label: "Lebanon" },
      { value: "LS", label: "Lesotho" },
      { value: "LR", label: "Liberia" },
      { value: "LI", label: "Liechtenstein" },
      { value: "LT", label: "Lithuania" },
      { value: "LU", label: "Luxembourg" },
      { value: "MG", label: "Madagascar" },
      { value: "MW", label: "Malawi" },
      { value: "MY", label: "Malaysia" },
      { value: "MV", label: "Maldives" },
      { value: "ML", label: "Mali" },
      { value: "MT", label: "Malta" },
      { value: "MH", label: "Marshall Is" },
      { value: "MR", label: "Mauritania" },
      { value: "MU", label: "Mauritius" },
      { value: "MQ", label: "Martinique" },
      { value: "YT", label: "Mayotte" },
      { value: "MX", label: "Mexico" },
      { value: "FM", label: "Micronesia" },
      { value: "MD", label: "Moldova" },
      { value: "MC", label: "Monaco" },
      { value: "MN", label: "Mongolia" },
      { value: "MS", label: "Montserrat" },
      { value: "MA", label: "Morocco" },
      { value: "MZ", label: "Mozambique" },
      { value: "MM", label: "Myanmar" },
      { value: "NA", label: "Namibia" },
      { value: "NR", label: "Nauru" },
      { value: "NP", label: "Nepal" },
      { value: "NL", label: "Netherlands, The" },
      { value: "AN", label: "Netherlands Antilles" },
      { value: "NC", label: "New Caledonia" },
      { value: "NZ", label: "New Zealand" },
      { value: "NI", label: "Nicaragua" },
      { value: "NE", label: "Niger" },
      { value: "NG", label: "Nigeria" },
      { value: "NU", label: "Niue" },
      { value: "NO", label: "Norway" },
      { value: "NF", label: "Norfolk Island" },
      { value: "MP", label: "Northern Mariana Is" },
      { value: "OM", label: "Oman" },
      { value: "PK", label: "Pakistan" },
      { value: "PW", label: "Palau" },
      { value: "PA", label: "Panama" },
      { value: "PG", label: "Papua new Guinea" },
      { value: "PY", label: "Paraguay" },
      { value: "PE", label: "Peru" },
      { value: "PH", label: "Philippines" },
      { value: "PN", label: "Pitcairn Island" },
      { value: "PL", label: "Poland" },
      { value: "PT", label: "Portugal" },
      { value: "PR", label: "Puerto Rico" },
      { value: "QA", label: "Qatar" },
      { value: "CG", label: "Republic of the Congo" },
      { value: "RE", label: "Reunion" },
      { value: "RO", label: "Romania" },
      { value: "RU", label: "Russia" },
      { value: "RW", label: "Rwanda" },
      { value: "SH", label: "Saint Helena" },
      { value: "KN", label: "Saint Kitts And Nevis" },
      { value: "LC", label: "Saint Lucia" },
      { value: "PM", label: "Saint Pierre and Miquelon" },
      { value: "VC", label: "Saint Vincent And The Grenadines" },
      { value: "WS", label: "Samoa" },
      { value: "SM", label: "San Marino" },
      { value: "ST", label: "Sao Tome and Principe" },
      { value: "SA", label: "Saudi Arabia" },
      { value: "SN", label: "Senegal" },
      { value: "rs", label: "Serbia" },
      { value: "SC", label: "Seychelles" },
      { value: "SL", label: "Sierra Leone" },
      { value: "SG", label: "Singapore" },
      { value: "SK", label: "Slovakia" },
      { value: "SI", label: "Slovenia" },
      { value: "SB", label: "Solomon Islands" },
      { value: "SO", label: "Somalia" },
      { value: "ZA", label: "South Africa" },
      { value: "GS", label: "South Georgia &amp; The S. Sandwich Is" },
      { value: "ES", label: "Spain" },
      { value: "LK", label: "Sri Lanka" },
      { value: "SR", label: "Suriname" },
      { value: "SJ", label: "Svalbard And Jan Mayen Is" },
      { value: "SZ", label: "Swaziland" },
      { value: "SE", label: "Sweden" },
      { value: "CH", label: "Switzerland" },
      { value: "TW", label: "Taiwan" },
      { value: "TJ", label: "Tajikistan" },
      { value: "TZ", label: "Tanzania" },
      { value: "TH", label: "Thailand" },
      { value: "TL", label: "Timor-Leste" },
      { value: "TG", label: "Togo" },
      { value: "TK", label: "Tokelau" },
      { value: "TO", label: "Tonga" },
      { value: "TT", label: "Trinidad And Tobago" },
      { value: "TN", label: "Tunisia" },
      { value: "TR", label: "Turkey" },
      { value: "TC", label: "Turks And Caicos Is" },
      { value: "TM", label: "Turkmenistan" },
      { value: "TV", label: "Tuvalu" },
      { value: "UG", label: "Uganda" },
      { value: "UA", label: "Ukraine" },
      { value: "AE", label: "United Arab Emirates" },
      { value: "GB", label: "United Kingdom" },
      { value: "UM", label: "United States Minor Outlying Is" },
      { value: "UY", label: "Uruguay" },
      { value: "UZ", label: "Uzbekistan" },
      { value: "VU", label: "Vanuatu" },
      { value: "VA", label: "Vatican City State (Holy See)" },
      { value: "VE", label: "Venezuela" },
      { value: "VN", label: "Vietnam" },
      { value: "VG", label: "Virgin Islands (British)" },
      { value: "VI", label: "Virgin Islands (US)" },
      { value: "WF", label: "Wallis And Futuna Islands" },
      { value: "EH", label: "Western Sahara" },
      { value: "YE", label: "Yemen" },
      { value: "ZM", label: "Zambia" },
      { value: "ZW", label: "Zimbabwe" }
    ];
  }
}