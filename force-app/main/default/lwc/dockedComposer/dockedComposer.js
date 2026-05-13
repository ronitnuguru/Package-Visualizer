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
import { COUNTRY_OPTIONS } from 'c/scratchOrgConfig';

export default class DockedComposer extends NavigationMixin(LightningElement) {

  userId = Id;
  currentUserFirstName;
  currentUserLastName;
  currentUserEmail;
  currentUserAutofillError;

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
        { label: 'Financial Services Cloud' , value: '0TTWs000001fVLp' },
        { label: 'Financial Services Cloud - Digital Insurance' , value: '0TTWs000001fo9x' },
        { label: 'Health Cloud' , value: '0TTWs000001fVFN' },
        { label: 'Life Sciences Cloud' , value: '0TTWs000001fWsz' },
        { label: 'Consumer Goods Cloud (Retail Execution)', value: '0TTWs000001fWUn'},
        { label: 'Consumer Goods Cloud (Trade Promotion Management)', value: '0TTWs000001fWHt'},
        { label: 'Manufacturing Cloud', value: '0TTWs000001fVYj'},
        { label: 'Automotive Cloud', value: '0TTWs000001fWJV'},
        { label: `Energy & Utilities Cloud`, value: '0TTWs000001gQQX'},
        { label: 'Net Zero Cloud', value: '0TTWs000001fWBR'},
        { label: 'Communications Cloud', value: '0TTWs000001gQWz'},
        { label: 'Education Cloud', value: '0TTWs000001fWbF'},
        { label: 'Media Cloud', value: '0TTWs000001fVth'},
        { label: 'Nonprofit Cloud', value: '0TTWs000001fWzR'},
        { label: 'Public Sector Cloud', value: '0TTWs000001gW7l'},
        { label: 'Revenue Cloud', value: '0TTWs000001fbpR'},
        { label: 'Loyalty Cloud', value: '0TTWs000001gPiz'}
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
        break;
        case "Health Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/KndcASmayUg4';
        break;
        case "Consumer Goods Cloud - Retail Execution":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/sfz0Atx4JASz';
        break;
        case "Consumer Goods Cloud - Trade Promotion Management":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/e3D5AxkcisIU';
        break;
        case "Manufacturing Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/7FvdANrb3HIC';
        break;
        case "Automotive Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/3rbkAtiEDqrh';
        break;
        case "Energy and Utilities Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/gspfAFdJHzzB';
        break;
        case "Net Zero Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/vW5eAoGFm73Y';
        break;
        case "Life Sciences Cloud":
            this.partnerPocketGuideLink = null;
        break;
        case "Communications Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/NMljAq78Faau';
        break;
        case "Education Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/xGX7A4fL0qZ9';
        break;
        case "Media Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/LO7xAb6vaFgQ';
        break;
        case "Nonprofit Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/r2jgADR0qSuU';
        break;
        case "Public Sector Cloud":
            this.partnerPocketGuideLink = 'https://salesforce.quip.com/ybE3Aj99fAm0';
        break;
        default:
            this.partnerPocketGuideLink = null;
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
    } else if (this.purposeValue === 'industry-templates'){
        this.displayCreateUsingOptions = false;
        this.displayDevelopmentOptions = false;
        this.displayTestDemoOptions = false;
        this.displayTsoOptions = false;
        this.displayIndustryOptions = true;
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
      { label: 'Danish', value: 'da_DK' },
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
    return COUNTRY_OPTIONS;
  }
}