import { LightningElement } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

export default class ScratchSettingsExpression extends NavigationMixin(LightningElement) {

    /*
    expressionClass = 'slds-expression__group';
    confirmSelected = true;
    */
    expressionClass = '';
    confirmSelected = false;
    
    count;
    metadataSettings = [
        {
            autoNumber: 0,
            setting: 'lightningExperienceSettings'
        },
        {
            autoNumber: 1,
            setting: 'mobileSettings'
        }
    ];

    confirmedMetadaSettings;

    connectedCallback(){
        this.count = this.metadataSettings.length;
        //this.confirmSettings();
    }
    
    handleMetadataSettingsChange(event){
        let index = event.target.dataset.index;
        this.metadataSettings[index].setting = event.detail.value; 
        this.metadataSettings = [...this.metadataSettings];
    }

    instantiateMetadataSettingExpression(){
       this.count++;
       this.metadataSettings = [...this.metadataSettings, {autoNumber: this.count, setting: ''}];
    }

    onRemoveSetting(event){
        let index = event.target.dataset.index;
        this.metadataSettings.splice(index, 1);
        this.metadataSettings = [...this.metadataSettings];
    }

    navigateMetaHelpDoc(event){
        let index = event.target.dataset.index;
        let navSetting = this.metadataSettings[index].setting;
        let url;
        if(navSetting){
            url =  `https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_${navSetting.toLowerCase()}.htm`
        } else {
            url = `https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_settings.htm`;
        }
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: url
            }
        });
    }

    confirmSettings(){
        this.confirmSelected = !this.confirmSelected;
        if(this.confirmSelected){
            this.expressionClass = 'slds-expression__group';
        } else {
            this.expressionClass = '';
        }

        if(this.confirmSelected){
            let metaRowExpressions = this.template.querySelectorAll('c-scratch-row-meta-expression');
            let settingsString = '';

            metaRowExpressions.forEach(metaRow => {
                settingsString = `${settingsString}${metaRow.getMetaRows()}, `;
            });

            settingsString = `{${settingsString.replace(/,\s*$/, "")}}`;

            this.dispatchEvent(new CustomEvent("return", {
                detail: settingsString
            }));
            
        } 
        this.dispatchEvent(new CustomEvent("confirm", {
            detail: this.confirmSelected
        }));
    }

    get settingOptions() {
        return [
            { label: 'Account Settings', value: 'accountSettings' },
            { label: 'Account Insights Settings', value: 'accountInsightsSettings' },
            { label: 'Account Intelligence Settings', value: 'accountIntelligenceSettings' },
            { label: 'Accounting Settings', value: 'accountingSettings' },
            { label: 'Actions Settings', value: 'actionsSettings' },
            { label: 'Activities Settings', value: 'activitiesSettings' },
            { label: 'Address Settings', value: 'addressSettings' },
            { label: 'AI Reply Recommendations Settings', value: 'aIReplyRecommendationsSettings' },
            { label: 'Apex Settings', value: 'apexSettings' },
            { label: 'AppAnalytics Settings', value: 'appAnalyticsSettings' },
            { label: 'AppExperience Settings', value: 'appExperienceSettings' },
            { label: 'Automated Contacts Settings', value: 'automatedContactsSettings' },
            { label: 'Bot Settings', value: 'botSettings' },
            { label: 'Branch Management Settings', value: 'branchManagementSettings' },
            { label: 'Business Hours Settings', value: 'businessHoursSettings' },
            { label: 'Campaign Settings', value: 'campaignSettings' },
            { label: 'Case Settings', value: 'caseSettings' },
            { label: 'Chatter Answers Settings', value: 'chatterAnswersSettings' },
            { label: 'Chatter Emails MD Settings', value: 'chatterEmailsMDSettings' },
            { label: 'Chatter Settings', value: 'chatterSettings' },
            { label: 'Code Builder Settings', value: 'codeBuilderSettings' },
            { label: 'Collections Dashboard Settings', value: 'collectionsDashboardSettings' },
            { label: 'Communities Settings', value: 'communitiesSettings' },
            { label: 'Company Settings', value: 'companySettings' },
            { label: 'ConnectedApp Settings', value: 'connectedAppSettings' },
            { label: 'Content Settings', value: 'contentSettings' },
            { label: 'Contract Settings', value: 'contractSettings' },
            { label: 'Conversational Intelligence Settings', value: 'conversationalIntelligenceSettings' },
            { label: 'Conversation Channel Definition', value: 'conversationChannelDefinition' },
            { label: 'Currency Settings', value: 'currencySettings' },
            { label: 'Custom Address Field Settings', value: 'customAddressFieldSettings' },
            { label: 'Data Dot Com Settings', value: 'dataDotComSettings' },
            { label: 'Data Import Management Settings', value: 'dataImportManagementSettings' },
            { label: 'Deployment Settings', value: 'deploymentSettings' },
            { label: 'DevHub Settings', value: 'devHubSettings' },
            { label: 'Document Generation Setting', value: 'documentGenerationSetting' },
            { label: 'Dynamic Forms Settings', value: 'dynamicFormsSettings' },
            { label: 'EAC Settings', value: 'eacSettings' },
            { label: 'Email Administration Settings', value: 'emailAdministrationSettings' },
            { label: 'Email Integration Settings', value: 'emailIntegrationSettings' },
            { label: 'Email Template Settings', value: 'emailTemplateSettings' },
            { label: 'Enhanced Notes Settings', value: 'enhancedNotesSettings' },
            { label: 'Email Template Settings', value: 'emailTemplateSettings' },
            { label: 'Encryption Key Settings', value: 'encryptionKeySettings' },
            { label: 'Entitlement Settings', value: 'entitlementSettings' },
            { label: 'Event Settings', value: 'eventSettings' },
            { label: 'Experience Bundle Settings', value: 'experienceBundleSettings' },
            { label: 'External Client App Settings', value: 'externalClientAppSettings' },
            { label: 'External Services Settings', value: 'externalServicesSettings' },
            { label: 'Field Service Settings', value: 'fieldServiceSettings' },
            { label: 'Files Connect Settings', value: 'filesConnectSettings' },
            { label: 'File Upload And Download Security Settings', value: 'fileUploadAndDownloadSecuritySettings' },
            { label: 'Flow Settings', value: 'flowSettings' },
            { label: 'Files Connect Settings', value: 'filesConnectSettings' },
            { label: 'Forecasting Object List Settings', value: 'forecastingObjectListSettings' },
            { label: 'High Velocity Sales Settings', value: 'highVelocitySalesSettings' },
            { label: 'Ideas Settings', value: 'ideasSettings' },
            { label: 'Files Connect Settings', value: 'filesConnectSettings' },
            { label: 'Identity Provider Settings', value: 'identityProviderSettings' },
            { label: 'Iframe WhiteList Url Settings', value: 'iframeWhiteListUrlSettings' },
            { label: 'Incident Mgmt Settings', value: 'incidentMgmtSettings' },
            { label: 'Industries Einstein Feature Settings', value: 'industriesEinsteinFeatureSettings' },
            { label: 'Industries Loyalty Settings', value: 'industriesLoyaltySettings' },
            { label: 'Industries Settings', value: 'industriesSettings' },
            { label: 'Interest Tagging Settings', value: 'interestTaggingSettings' },
            { label: 'Inventory Settings', value: 'inventorySettings' },
            { label: 'Inv Late Pymnt Risk Calc Settings', value: 'invLatePymntRiskCalcSettings' },
            { label: 'Invocable Action Settings', value: 'invocableActionSettings' },
            { label: 'Knowledge Settings', value: 'knowledgeSettings' },
            { label: 'Language Settings', value: 'languageSettings' },
            { label: 'Lead Config Settings', value: 'leadConfigSettings' },
            { label: 'Lead Convert Settings', value: 'leadConvertSettings' },
            { label: 'Live Agent Settings', value: 'liveAgentSettings' },
            { label: 'Lightning Experience Settings', value: 'lightningExperienceSettings' },
            { label: 'Live Message Settings', value: 'liveMessageSettings' },
            { label: 'Macro Settings', value: 'macroSettings' },
            { label: 'Mail Merge Settings', value: 'mailMergeSettings' },
            { label: 'MailMergeSettings', value: 'mailMergeSettings' },
            { label: 'Map And Location Settings', value: 'mapAndLocationSettings' },
            { label: 'Meetings Settings', value: 'meetingsSettings' },
            { label: 'Mobile Settings', value: 'mobileSettings' },
            { label: 'My Domain Settings', value: 'myDomainSettings' },
            { label: 'Mfg Service Console Settings', value: 'mfgServiceConsoleSettings' },
            { label: 'Name Settings', value: 'nameSettings' },
            { label: 'Notifications Settings', value: 'notificationsSettings' },
            { label: 'OAuth Oidc Settings', value: 'OAuthOidcSettings' },
            { label: 'Object Hierarchy Relationship', value: 'objectHierarchyRelationship' },
            { label: 'Object Linking Settings', value: 'ibjectLinkingSettings' },
            { label: 'Omni Channel Settings', value: 'omniChannelSettings' },
            { label: 'Omni Interaction Access Config', value: 'omniInteractionAccessConfig' },
            { label: 'OmniInteractionAccessConfig', value: 'omniInteractionAccessConfig' },
            { label: 'Omni Interaction Config', value: 'omniInteractionConfig' },
            { label: 'OmniInteractionAccessConfig', value: 'omniInteractionAccessConfig' },
            { label: 'Opportunity Insights Settings', value: 'opportunityInsightsSettings' },
            { label: 'OmniInteractionAccessConfig', value: 'omniInteractionAccessConfig' },
            { label: 'Opportunity Settings', value: 'opportunitySettings' },
            { label: 'Opportunity Score Settings', value: 'opportunityScoreSettings' },
            { label: 'Order Management Settings', value: 'orderManagementSettings' },
            { label: 'Order Settings', value: 'orderSettings' },
            { label: 'Org Preference Settings', value: 'orgPreferenceSettings' },
            { label: 'Party Data Model Settings', value: 'partyDataModelSettings' },
            { label: 'Pardot Settings', value: 'pardotSettings' },
            { label: 'Pardot Einstein Settings', value: 'pardotEinsteinSettings' },
            { label: 'Path Assistant Settings', value: 'pathAssistantSettings' },
            { label: 'Payments Settings', value: 'paymentsSettings' },
            { label: 'Picklist Settings', value: 'picklistSettings' },
            { label: 'Platform Encryption Settings', value: 'platformEncryptionSettings' },
            { label: 'Platform Event Settings', value: 'platformEventSettings' },
            { label: 'Prediction Builder Settings', value: 'predictionBuilderSettings' },
            { label: 'Privacy Settings', value: 'privacySettings' },
            { label: 'Process Flow Migration', value: 'processFlowMigration' },
            { label: 'Product Settings', value: 'productSettings' },
            { label: 'Quote Settings', value: 'quoteSettings' },
            { label: 'Real Time Event Settings', value: 'realTimeEventSettings' },
            { label: 'Record Page Settings', value: 'recordPageSettings' },
            { label: 'Retail Execution Settings', value: 'retailExecutionSettings' },
            { label: 'Sales Agreement Settings', value: 'aalesAgreementSettings' },
            { label: 'Sandbox Settings', value: 'sandboxSettings' },
            { label: 'Schema Settings', value: 'schemaSettings' },
            { label: 'Search Settings', value: 'searchSettings' },
            { label: 'Security Settings', value: 'securitySettings' },
            { label: 'Service Cloud Voice Settings', value: 'serviceCloudVoiceSettings' },
            { label: 'Service Setup Assistant Settings', value: 'serviceSetupAssistantSettings' },
            { label: 'Sharing Settings', value: 'sharingSettings' },
            { label: 'Site Settings', value: 'siteSettings' },
            { label: 'Social Customer Service Settings', value: 'socialCustomerServiceSettings' },
            { label: 'Social Profile Settings', value: 'socialProfileSettings' },
            { label: 'Source Tracking Settings', value: 'sourceTrackingSettings' },
            { label: 'Subscription Management Settings', value: 'subscriptionManagementSettings' },
            { label: 'Survey Settings', value: 'surveySettings' },
            { label: 'Territory2 Settings', value: 'territory2Settings' },
            { label: 'Trailhead Settings', value: 'trailheadSettings' },
            { label: 'Trial Org Settings', value: 'trialOrgSettings' },
            { label: 'User Engagement Settings', value: 'userEngagementSettings' },
            { label: 'User Interface Settings', value: 'userInterfaceSettings' },
            { label: 'User Management Settings', value: 'userManagementSettings' },
            { label: 'Voice Settings', value: 'voiceSettings' },
            { label: 'Warranty LifeCycle Mgmt Settings', value: 'warrantyLifeCycleMgmtSettings' },
            { label: 'Work Dot Com Settings', value: 'workDotComSettings' },
            { label: 'Workforce Engagement Settings', value: 'workforceEngagementSettings' }
        ];
    }

}