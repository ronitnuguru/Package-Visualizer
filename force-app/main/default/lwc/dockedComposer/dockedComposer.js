import { LightningElement, api, wire } from "lwc";
import isSignupRequest from "@salesforce/apex/PackageVisualizerCtrl.isSignupRequest";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  publish,
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";

import createSignupTrial from "@salesforce/apexContinuation/PackageVisualizerCtrl.createSignupTrial";
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import SIGNUPLISTMESSAGECHANNEL from "@salesforce/messageChannel/SignupListMessageChannel__c";

export default class DockedComposer extends NavigationMixin(LightningElement) {

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

  displayError;
  errorText;
  displaySpinner;

  purposeValue;
  createUsingValue = "standard";
  displayCreateUsingOptions;
  displayStandard = true;

  editionValue;
  displayDevelopmentOptions;
  displayTestDemoOptions;
  displayTsoOptions;
  templateId;

  selectedTab = "sign-up-create";
  displayFooter = true;

  subscription = null;

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
      { label: 'Test/Demo', value: 'test/demo' }
      //{ label: 'Trialforce Source Organization (TSO)', value: 'tso' },
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

  purposeChange(event) {
    this.purposeValue = event.detail.value;
    if (this.purposeValue === 'development' || this.purposeValue === 'tso') {
      this.displayCreateUsingOptions = false;
      this.createUsingValue = 'standard'
      if (this.purposeValue === 'development') {
        this.displayDevelopmentOptions = true;
        this.displayTestDemoOptions = false;
        this.displayTsoOptions = false;
      } else {
        this.displayTsoOptions = true;
        this.displayTestDemoOptions = false;
        this.displayDevelopmentOptions = false;
      }
    } else if (this.purposeValue === 'test/demo') {
      this.displayCreateUsingOptions = true;
      this.displayTestDemoOptions = true;
      this.displayDevelopmentOptions = false;
      this.displayTsoOptions = false;
    }
    this.displayStandard = this.createUsingValue === 'trialforce' ? false : true;
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
      this.errorText = 'Please update all the fields correctly and try again.'
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
                title: `Can't create trial for ${company}`,
                variant: "error"
              })
            );
          } else {
            this.errorText = `${Object.entries(error.body.fieldErrors)[0][1][0].statusCode}: ${Object.entries(error.body.fieldErrors)[0][1][0].message}`;
            this.dispatchEvent(
              new ShowToastEvent({
                title: `Can't create trial for ${company}`,
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

  handleTrialsHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/trialforce_signup_api_introduction.htm`
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