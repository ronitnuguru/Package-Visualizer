import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { RefreshEvent } from 'lightning/refresh';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import ScratchBuildModal from 'c/scratchBuildModal';
import isActiveScratchOrg from "@salesforce/apex/Package2Interface.isActiveScratchOrg";
import getOrgCountryCode from '@salesforce/apex/PackageVisualizerCtrl.getOrgCountryCode';
import CREATESAMPLESCRATCHORGTEMPLATEMESSAGECHANNEL from "@salesforce/messageChannel/CreateSampleScratchOrgTemplateMessageChannel__c";
import { publish, MessageContext } from 'lightning/messageService';


export default class ScratchDefFiileBuildCard extends NavigationMixin(LightningElement) {

    editionValue = 'Developer';
    releaseValue = 'current';
    createUsingValue = 'edition';
    orgValue;
    orgDescription;
    hasSampleData;
    sourceOrgId;
    
    errorText;
    displayError;

    jsonScratchBuild;
    metaSettings;
    displayScratchOrgActions;

    metaConfirmSelected;
    displayEdition = true;

    featuresList = [
        {
            type: 'icon',
            label: `EnableSetPasswordInApi`,
            name: `EnableSetPasswordInApi`,
            iconName: 'standard:settings',
            alternativeText: 'Feature',
            href: `https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm#so_enablesetpasswordinapi`
        }
    ];
    featureValue = '';
    preferredLanguage = 'en_US';
    country;

    @wire(MessageContext) messageContext;

    @wire(getOrgCountryCode)
    wiredCountryCode({ error, data }) {
        if (data) {
            this.country = data;
        } else if (error) {
            console.error(error);
            this.country = 'US';
        }
    }

    @wire(isActiveScratchOrg)
    lma({ data, error }) {
      if (data) {
        if (data === true) {
          this.displayScratchOrgActions = true;
        } else {
          this.displayScratchOrgActions = false;
        }
      } else if (error) {
        this.displayScratchOrgActions = undefined;
        console.error(error);
      }
    }    

    get editionOptions() {
        return [
            { label: 'Developer', value: 'Developer' },
            { label: 'Enterprise', value: 'Enterprise' },
            { label: 'Group', value: 'Group' },
            { label: 'Professional', value: 'Professional' },
            { label: 'Partner Developer', value: 'Partner Developer' },
            { label: 'Partner Enterprise', value: 'Partner Enterprise' },
            { label: 'Partner Group', value: 'Partner Group' },
            { label: 'Partner Professional', value: 'Partner Professional' }
        ];
    }

    get releaseOptions() {
        return [
            { label: 'Current', value: 'current' },
            { label: 'Preview', value: 'preview' },
            { label: 'Previous', value: 'previous' }
        ];
    }

    get createUsingOptions() {
        return [
            { label: 'Edition', value: 'edition' },
            { label: 'Org Shape', value: 'orgShape' },
        ];
    }

    handleAddFeature(){
        let newFeature = {
            type: 'icon',
            label: `${this.featureValue}`,
            name: `${this.featureValue}`,
            iconName: 'standard:settings',
            alternativeText: 'Feature',
            href: `https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm#so_${this.featureValue.toLowerCase().split(':')[0]}`
        };

        if (this.featureValue.trim() !== '' && !this.featuresList.some(feature => feature.name === this.featureValue)){
            this.featuresList = [...this.featuresList, newFeature].map(pill => ({ ...pill }));
            this.featureValue = null;
        } else {
            this.featureValue = null;
        }
    }

    scratchFeatureToast(type){
        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success",
                message: `Sample Scratch Org Features and Settings for ${type} have been added`,
                variant: "success"
            })
        );
    }

    agentforceTemplate(event){
        this.editionValue = 'Partner Developer';
        let features = ['Einstein1AIPlatform', 'Chatbot'];

        features.forEach((feature) => {
           this.featureValue = feature;
           this.handleAddFeature();
        });

        publish(this.messageContext, CREATESAMPLESCRATCHORGTEMPLATEMESSAGECHANNEL, {
            "einsteinGptSettings" : {
                "enableEinsteinGptPlatform" : true
            }
        });
        publish(this.messageContext, CREATESAMPLESCRATCHORGTEMPLATEMESSAGECHANNEL, {
            "botSettings": {
                "enableBots": true
            }
        });
        this.scratchFeatureToast(event.currentTarget.value);
    }

    dataCloudTemplate(event){
        this.editionValue = 'Partner Developer';
        let features = ['CustomerDataPlatform', 'CustomerDataPlatformLite', 'MarketingUser'];

        features.forEach((feature) => {
           this.featureValue = feature;
           this.handleAddFeature();
        });

        publish(this.messageContext, CREATESAMPLESCRATCHORGTEMPLATEMESSAGECHANNEL, {
            "customerDataPlatformSettings": {
                "enableCustomerDataPlatform": true
              }
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    marketingCloudTemplate(event){
        this.editionValue = 'Partner Developer';
        let features = ['MarketingCloud', 'MarketingUser', 'AIAttribution'];

        features.forEach((feature) => {
           this.featureValue = feature;
           this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    revCloudTemplate(event){
        this.editionValue = 'Partner Developer';
        let features = ['BillingAdvanced', 'InvoiceManagement', 'CoreCpq'];

        publish(this.messageContext, CREATESAMPLESCRATCHORGTEMPLATEMESSAGECHANNEL, {
            "revenueManagementSettings": {
                "enableCoreCPQ": true
              }
        });

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success",
                message: `Sample Scratch Org Features and Settings for ${event.currentTarget.value} have been added`,
                variant: "success"
            })
        );
    }

    crmAnalyticsTemplate(event){
        this.editionValue = 'Partner Developer';
        let features = ['DevelopmentWave', 'AnalyticsAdminPerms', 'AnalyticsAppEmbedded', 'EAOutputConnectors', 'EinsteinAnalyticsPlus', 'InsightsPlatform'];

        publish(this.messageContext, CREATESAMPLESCRATCHORGTEMPLATEMESSAGECHANNEL, {
            "analyticsSettings": {
                "enable​Insights": true
              }
        });

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    fscTemplate(event){
        let features = ['FinancialServicesCommunityUser:5', 'FinancialServicesInsuranceUser', 'FinancialServicesUser:5', 'FSCAlertFramework', 'FSCServiceProcess', 'IndustriesBranchManagement', 'PersonAccounts', 'ContactsToMultipleAccounts', 'AssociationEngine'];

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    hlsTemplate(event){
        let features = ['HealthCloudAddOn', 'HealthCloudForCmty', 'HealthCloudMedicationReconciliation', 'HealthCloudPNMAddOn', 'HealthCloudUser', 'HLSAnalytics', 'PersonAccounts', 'ContactsToMultipleAccounts'];

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    cgTemplate(event){
        let features = ['EinsteinVisits', 'CGAnalytics'];

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    eduTemplate(event){
        let features = ['EducationCloud:3'];

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    euTemplate(event){
        let features = ['EnergyAndUtilitiesCloud', 'EAndUDigitalSales'];

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    netZeroTemplate(event){
        let features = ['SustainabilityApp', 'SustainabilityCloud', 'TCRMforSustainability', 'DisclosureFramework'];

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    pubSecTemplate(event){
        let features = ['PublicSectorAccess', 'PublicSectorApplicationUsageCreditsAddOn', 'PublicSectorSiteTemplate'];

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    devOpsCenterTemplate(event){
        this.editionValue = 'Partner Developer';
        let features = ['DevOpsCenter'];

        publish(this.messageContext, CREATESAMPLESCRATCHORGTEMPLATEMESSAGECHANNEL, {
            "devHubSettings": {
                "enableDevOpsCenterGA": true
              }
        });

        features.forEach((feature) => {
            this.featureValue = feature;
            this.handleAddFeature();
        });

        this.scratchFeatureToast(event.currentTarget.value);
    }

    handleCreateUsingChange(event) {
        this.createUsingValue = event.detail.value;
        this.displayEdition = this.createUsingValue === 'edition' ? true : false;
    }

    handeFeatureValueChangeOnKeyDown(event){
        if (event.key === 'Enter') {
            this.featureValue = event.target.value;
            this.handleAddFeature();
        }
    }

    handleConfirmSelected(event){
        this.metaConfirmSelected = event.detail;
    }

    handleFeatureRemove(event){
        const feature = event.detail.item.name;
        this.featuresList = this.featuresList.filter(pill => pill.name !== feature);
    }

    handleFeatureValueChange(event){
        this.featureValue = event.target.value;
    }

    handleEditionChange(event){
        this.editionValue = event.detail.value;
    }

    handleReleaseChange(event){
        this.releaseValue = event.detail.value;
    }

    handleHasSampleDataChange(event){
        this.hasSampleData = event.target.checked;
    }

    handleOrgNameChange(event){
        this.orgValue = event.target.value;
    }

    handleSourceOrgChange(event){
        this.sourceOrgId = event.target.value;
    }

    handleDescriptionChange(event){
        this.orgDescription = event.target.value;
    }

    navigateToScratchOrgInfo(){
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'ScratchOrgInfo',
                actionName: 'list'
            }
        });
    }

    navigateToActiveScratchOrgs(){
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'ActiveScratchOrg',
                actionName: 'list'
            }
        });
    }

    handleMetadataSettings(event){
        this.metaSettings = event.detail;
    }

    async handleScratchOrgBuildFile(){
        try{
            this.jsonScratchBuild = {
                "orgName": this.orgValue,
                "edition": this.editionValue,
                "sourceOrg": this.sourceOrgId,
                "hasSampleData": this.hasSampleData,
                "description": this.orgDescription,
                "release": this.releaseValue,
                "country": this.country,
                "language": this.preferredLanguage,
                "features": this.featuresList.map(feature => feature.label),
                "settings": JSON.parse(this.metaSettings)
            }

            if(this.displayEdition){
                delete this.jsonScratchBuild.sourceOrg;
            } else {
                delete this.jsonScratchBuild.edition;
            }

            const allValid = [...this.template.querySelectorAll('lightning-input'), ...this.template.querySelectorAll('lightning-combobox'), ...this.template.querySelectorAll('lightning-radio-group')].reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);

            if(!allValid || !this.metaConfirmSelected){
                this.displayError = true;
                this.errorText = 'Please try again after completing all the required fields and confirming the metadata settings.';
                return;
            } else {
                const result = await ScratchBuildModal.open({
                    size: 'large',
                    label: 'Sample Scratch Org Definition File',
                    content: JSON.stringify(this.jsonScratchBuild, null, 2)
                });

                this.displayError = false;
                this.errorText = '';
            }
        } catch(error){
            this.displayError = true;
            console.error(error);
            this.errorText = 'Please try again after completing all the required fields and confirming the metadata settings.';
        }
    }

    handleClearScratchOrgBuildFile(){
        this.dispatchEvent(new RefreshEvent());
    }

    handlePopoverClose() {
        this.displayError = false;
    }

    navigateToScratchOrgRelease(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: 'https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_version_selection.htm'
            }
        });
    }

    navigateToScratchHelpDefFile(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: 'https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm'
            }
        });
    }

    navigateToOrgShape(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: 'https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_shape_intro.htm'
            }
        });
    }

    navigateToSupportedScratchEditions(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: 'https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_editions_and_allocations.htm'
            }
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