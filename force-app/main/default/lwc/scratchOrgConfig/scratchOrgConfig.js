/**
 * Shared configuration for the Scratch Org Definition File builder.
 * Consumed by scratchDefFileBuildCard, scratchSettingsExpression, and scratchRowMetaExpression.
 *
 * Docs:
 *  - https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm
 *  - https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm
 *  - https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_settings.htm
 */

const FEATURE_DOC_BASE =
  "https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm";

/**
 * Features pre-populated when the builder loads. Mirrors the seed used in
 * `config/project-scratch-def.json` and the historical default of this card.
 * Adjust here to change first-load behavior across all consumers.
 */
export const DEFAULT_FEATURES = ["EnableSetPasswordInApi"];

export const EDITION_OPTIONS = [
  { label: "Developer", value: "Developer" },
  { label: "Enterprise", value: "Enterprise" },
  { label: "Group", value: "Group" },
  { label: "Professional", value: "Professional" },
  { label: "Partner Developer", value: "Partner Developer" },
  { label: "Partner Enterprise", value: "Partner Enterprise" },
  { label: "Partner Group", value: "Partner Group" },
  { label: "Partner Professional", value: "Partner Professional" }
];

export const RELEASE_OPTIONS = [
  { label: "Current", value: "current" },
  { label: "Preview", value: "preview" },
  { label: "Previous", value: "previous" }
];

export const CREATE_USING_OPTIONS = [
  { label: "Edition", value: "edition" },
  { label: "Org Shape", value: "orgShape" }
];

export const OPERATOR_OPTIONS = [
  { label: "Boolean", value: "boolean" },
  { label: "String", value: "string" },
  { label: "Integer", value: "integer" }
];

export const BOOLEAN_OPTIONS = [
  { label: "TRUE", value: "true" },
  { label: "FALSE", value: "false" }
];

export const PREFERRED_LANGUAGE_OPTIONS = [
  { label: "English", value: "en_US" },
  { label: "Chinese (Simplified)", value: "zh_CN" },
  { label: "Chinese (Traditional)", value: "zh_TW" },
  { label: "Danish", value: "da_DK" },
  { label: "Dutch", value: "nl_NL" },
  { label: "Finnish", value: "fi" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Italian", value: "it" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Norwegian", value: "no" },
  { label: "Portuguese (Brazil)", value: "pt_BR" },
  { label: "Russian", value: "ru" },
  { label: "Spanish", value: "es" },
  { label: "Spanish (Mexico)", value: "es_MX" },
  { label: "Swedish", value: "sv" },
  { label: "Thai", value: "th" }
];

export const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "AF", label: "Afghanistan" },
  { value: "AX", label: "Aland Islands" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AS", label: "American Samoa" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AI", label: "Anguilla" },
  { value: "AQ", label: "Antarctica" },
  { value: "AG", label: "Antigua And Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AW", label: "Aruba" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BZ", label: "Belize" },
  { value: "BE", label: "Belgium" },
  { value: "BJ", label: "Benin" },
  { value: "BM", label: "Bermuda" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia, Plurinational State of" },
  { value: "BQ", label: "Bonaire, Sint Eustatius and Saba" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BV", label: "Bouvet Island" },
  { value: "BR", label: "Brazil" },
  { value: "IO", label: "British Indian Ocean Territory" },
  { value: "BN", label: "Brunei Darussalam" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CV", label: "Cape Verde" },
  { value: "KY", label: "Cayman Islands" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CX", label: "Christmas Island" },
  { value: "CC", label: "Cocos (Keeling) Islands" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "Congo, the Democratic Republic of the" },
  { value: "CK", label: "Cook Islands" },
  { value: "CR", label: "Costa Rica" },
  { value: "CI", label: "Cote D'Ivoire" },
  { value: "HR", label: "Croatia" },
  { value: "CW", label: "Curacao" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" },
  { value: "FK", label: "Falkland Islands (Malvinas)" },
  { value: "FO", label: "Faroe Islands" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GF", label: "French Guiana" },
  { value: "PF", label: "French Polynesia" },
  { value: "TF", label: "French Southern Territories" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
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
  { value: "GG", label: "Guernsey" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HM", label: "Heard and McDonald Islands" },
  { value: "VA", label: "Holy See (Vatican City State)" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IM", label: "Isle of Man" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JE", label: "Jersey" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KR", label: "Korea, Republic of" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Lao People's Democratic Republic" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MO", label: "Macao" },
  { value: "MK", label: "Macedonia, the former Yugoslav Republic of" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MQ", label: "Martinique" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "YT", label: "Mayotte" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova, Republic of" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MS", label: "Montserrat" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "AN", label: "Netherlands Antilles" },
  { value: "NC", label: "New Caledonia" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NU", label: "Niue" },
  { value: "NF", label: "Norfolk Island" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PN", label: "Pitcairn" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "PR", label: "Puerto Rico" },
  { value: "QA", label: "Qatar" },
  { value: "RE", label: "Reunion" },
  { value: "RO", label: "Romania" },
  { value: "RW", label: "Rwanda" },
  { value: "BL", label: "Saint Barthelemy" },
  { value: "SH", label: "Saint Helena, Ascension and Tristan da Cunha" },
  { value: "KN", label: "Saint Kitts And Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "MF", label: "Saint Martin (French part)" },
  { value: "PM", label: "Saint Pierre and Miquelon" },
  { value: "VC", label: "Saint Vincent And The Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SX", label: "Sint Maarten (Dutch part)" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "GS", label: "South Georgia and the South Sandwich Islands" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SR", label: "Suriname" },
  { value: "SJ", label: "Svalbard And Jan Mayen" },
  { value: "SZ", label: "Swaziland" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania, United Republic of" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TK", label: "Tokelau" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad And Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TC", label: "Turks and Caicos Islands" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "UM", label: "United States Minor Outlying Islands" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VE", label: "Venezuela, Bolivarian Republic of" },
  { value: "VN", label: "Vietnam" },
  { value: "VG", label: "Virgin Islands, British" },
  { value: "VI", label: "Virgin Islands (US)" },
  { value: "WF", label: "Wallis And Futuna" },
  { value: "EH", label: "Western Sahara" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" }
];

// Deduplicated and sorted list of supported metadata Settings types.
export const SETTING_OPTIONS = [
  { label: "Account Plan Settings", value: "accountPlanSettings" },
  { label: "Account Settings", value: "accountSettings" },
  { label: "Account Insights Settings", value: "accountInsightsSettings" },
  {
    label: "Account Intelligence Settings",
    value: "accountIntelligenceSettings"
  },
  { label: "Accounting Settings", value: "accountingSettings" },
  { label: "Actions Settings", value: "actionsSettings" },
  { label: "Activities Settings", value: "activitiesSettings" },
  { label: "Address Settings", value: "addressSettings" },
  {
    label: "AI Reply Recommendations Settings",
    value: "aiReplyRecommendationsSettings"
  },
  { label: "Agent Platform Settings", value: "agentPlatformSettings" },
  {
    label: "Agentforce For Developers Settings",
    value: "agentforceForDevelopersSettings"
  },
  { label: "Analytics Settings", value: "analyticsSettings" },
  { label: "Apex Settings", value: "apexSettings" },
  { label: "App Analytics Settings", value: "appAnalyticsSettings" },
  { label: "App Experience Settings", value: "appExperienceSettings" },
  { label: "Association Engine Settings", value: "associationEngineSettings" },
  { label: "Automated Contacts Settings", value: "automatedContactsSettings" },
  { label: "Bot Settings", value: "botSettings" },
  { label: "Branch Management Settings", value: "branchManagementSettings" },
  { label: "Business Hours Settings", value: "businessHoursSettings" },
  { label: "Campaign Settings", value: "campaignSettings" },
  { label: "Case Settings", value: "caseSettings" },
  { label: "Chatter Answers Settings", value: "chatterAnswersSettings" },
  { label: "Chatter Emails MD Settings", value: "chatterEmailsMDSettings" },
  { label: "Chatter Settings", value: "chatterSettings" },
  { label: "Code Builder Settings", value: "codeBuilderSettings" },
  {
    label: "Collections Dashboard Settings",
    value: "collectionsDashboardSettings"
  },
  { label: "Communities Settings", value: "communitiesSettings" },
  { label: "Company Settings", value: "companySettings" },
  { label: "Connected App Settings", value: "connectedAppSettings" },
  { label: "Content Settings", value: "contentSettings" },
  { label: "Contract Settings", value: "contractSettings" },
  {
    label: "Conversational Intelligence Settings",
    value: "conversationalIntelligenceSettings"
  },
  {
    label: "Conversation Channel Definition",
    value: "conversationChannelDefinition"
  },
  { label: "Currency Settings", value: "currencySettings" },
  {
    label: "Custom Address Field Settings",
    value: "customAddressFieldSettings"
  },
  {
    label: "Customer Data Platform Settings",
    value: "customerDataPlatformSettings"
  },
  { label: "Data Dot Com Settings", value: "dataDotComSettings" },
  {
    label: "Data Import Management Settings",
    value: "dataImportManagementSettings"
  },
  { label: "Deployment Settings", value: "deploymentSettings" },
  { label: "Dev Hub Settings", value: "devHubSettings" },
  { label: "Document Generation Setting", value: "documentGenerationSetting" },
  { label: "Dynamic Forms Settings", value: "dynamicFormsSettings" },
  { label: "EAC Settings", value: "eacSettings" },
  { label: "Einstein AI Settings", value: "einsteinAISettings" },
  { label: "Einstein Agent Settings", value: "einsteinAgentSettings" },
  { label: "Einstein Gpt Settings", value: "einsteinGptSettings" },
  {
    label: "Email Administration Settings",
    value: "emailAdministrationSettings"
  },
  {
    label: "Email Authorization Settings",
    value: "emailAuthorizationSettings"
  },
  { label: "Email Integration Settings", value: "emailIntegrationSettings" },
  { label: "Email Template Settings", value: "emailTemplateSettings" },
  { label: "Employee User Settings", value: "employeeUserSettings" },
  { label: "Enhanced Notes Settings", value: "enhancedNotesSettings" },
  { label: "Encryption Key Settings", value: "encryptionKeySettings" },
  { label: "Entitlement Settings", value: "entitlementSettings" },
  { label: "Event Settings", value: "eventSettings" },
  { label: "Experience Bundle Settings", value: "experienceBundleSettings" },
  { label: "External Client App Settings", value: "externalClientAppSettings" },
  { label: "External Services Settings", value: "externalServicesSettings" },
  { label: "Field Service Settings", value: "fieldServiceSettings" },
  { label: "Files Connect Settings", value: "filesConnectSettings" },
  {
    label: "File Upload And Download Security Settings",
    value: "fileUploadAndDownloadSecuritySettings"
  },
  { label: "Flow Settings", value: "flowSettings" },
  {
    label: "Forecasting Object List Settings",
    value: "forecastingObjectListSettings"
  },
  { label: "Forecasting Settings", value: "forecastingSettings" },
  { label: "High Velocity Sales Settings", value: "highVelocitySalesSettings" },
  { label: "Ideas Settings", value: "ideasSettings" },
  { label: "Identity Provider Settings", value: "identityProviderSettings" },
  {
    label: "Iframe White List Url Settings",
    value: "iframeWhiteListUrlSettings"
  },
  { label: "Incident Mgmt Settings", value: "incidentMgmtSettings" },
  {
    label: "Industries Einstein Feature Settings",
    value: "industriesEinsteinFeatureSettings"
  },
  { label: "Industries Loyalty Settings", value: "industriesLoyaltySettings" },
  { label: "Industries Settings", value: "industriesSettings" },
  { label: "Interest Tagging Settings", value: "interestTaggingSettings" },
  { label: "Inventory Settings", value: "inventorySettings" },
  {
    label: "Inv Late Pymnt Risk Calc Settings",
    value: "invLatePymntRiskCalcSettings"
  },
  { label: "Invocable Action Settings", value: "invocableActionSettings" },
  { label: "Knowledge Settings", value: "knowledgeSettings" },
  { label: "Language Settings", value: "languageSettings" },
  { label: "Lead Config Settings", value: "leadConfigSettings" },
  { label: "Lead Convert Settings", value: "leadConvertSettings" },
  { label: "Live Agent Settings", value: "liveAgentSettings" },
  {
    label: "Lightning Experience Settings",
    value: "lightningExperienceSettings"
  },
  { label: "Live Message Settings", value: "liveMessageSettings" },
  { label: "Macro Settings", value: "macroSettings" },
  { label: "Mail Merge Settings", value: "mailMergeSettings" },
  { label: "Map And Location Settings", value: "mapAndLocationSettings" },
  { label: "Meetings Settings", value: "meetingsSettings" },
  { label: "Mobile Settings", value: "mobileSettings" },
  { label: "My Domain Settings", value: "myDomainSettings" },
  { label: "Mfg Service Console Settings", value: "mfgServiceConsoleSettings" },
  { label: "Name Settings", value: "nameSettings" },
  { label: "Notifications Settings", value: "notificationsSettings" },
  { label: "Oauth Oidc Settings", value: "oauthOidcSettings" },
  {
    label: "Object Hierarchy Relationship",
    value: "objectHierarchyRelationship"
  },
  { label: "Object Linking Settings", value: "objectLinkingSettings" },
  { label: "Omni Channel Settings", value: "omniChannelSettings" },
  {
    label: "Opportunity Insights Settings",
    value: "opportunityInsightsSettings"
  },
  { label: "Opportunity Settings", value: "opportunitySettings" },
  { label: "Opportunity Score Settings", value: "opportunityScoreSettings" },
  { label: "Order Management Settings", value: "orderManagementSettings" },
  { label: "Order Settings", value: "orderSettings" },
  { label: "Org Preference Settings", value: "orgPreferenceSettings" },
  { label: "Org Settings", value: "orgSettings" },
  { label: "Party Data Model Settings", value: "partyDataModelSettings" },
  { label: "Pardot Settings", value: "pardotSettings" },
  { label: "Pardot Einstein Settings", value: "pardotEinsteinSettings" },
  { label: "Path Assistant Settings", value: "pathAssistantSettings" },
  { label: "Payments Settings", value: "paymentsSettings" },
  { label: "Picklist Settings", value: "picklistSettings" },
  {
    label: "Platform Encryption Settings",
    value: "platformEncryptionSettings"
  },
  { label: "Platform Event Settings", value: "platformEventSettings" },
  { label: "Prediction Builder Settings", value: "predictionBuilderSettings" },
  { label: "Privacy Settings", value: "privacySettings" },
  { label: "Process Flow Migration", value: "processFlowMigration" },
  { label: "Product Settings", value: "productSettings" },
  { label: "Quote Settings", value: "quoteSettings" },
  { label: "Real Time Event Settings", value: "realTimeEventSettings" },
  { label: "Record Page Settings", value: "recordPageSettings" },
  { label: "Retail Execution Settings", value: "retailExecutionSettings" },
  { label: "Sales Agreement Settings", value: "salesAgreementSettings" },
  { label: "Sandbox Settings", value: "sandboxSettings" },
  { label: "Schema Settings", value: "schemaSettings" },
  { label: "Search Settings", value: "searchSettings" },
  { label: "Security Settings", value: "securitySettings" },
  { label: "Service Cloud Voice Settings", value: "serviceCloudVoiceSettings" },
  {
    label: "Service Setup Assistant Settings",
    value: "serviceSetupAssistantSettings"
  },
  { label: "Sharing Settings", value: "sharingSettings" },
  { label: "Site Settings", value: "siteSettings" },
  {
    label: "Social Customer Service Settings",
    value: "socialCustomerServiceSettings"
  },
  { label: "Social Profile Settings", value: "socialProfileSettings" },
  { label: "Source Tracking Settings", value: "sourceTrackingSettings" },
  {
    label: "Subscription Management Settings",
    value: "subscriptionManagementSettings"
  },
  { label: "Survey Settings", value: "surveySettings" },
  { label: "Territory2 Settings", value: "territory2Settings" },
  { label: "Trailhead Settings", value: "trailheadSettings" },
  { label: "Trial Org Settings", value: "trialOrgSettings" },
  { label: "User Engagement Settings", value: "userEngagementSettings" },
  { label: "User Interface Settings", value: "userInterfaceSettings" },
  { label: "User Management Settings", value: "userManagementSettings" },
  { label: "Voice Settings", value: "voiceSettings" },
  {
    label: "Warranty Life Cycle Mgmt Settings",
    value: "warrantyLifeCycleMgmtSettings"
  },
  { label: "Work Dot Com Settings", value: "workDotComSettings" },
  {
    label: "Workforce Engagement Settings",
    value: "workforceEngagementSettings"
  }
];

const boolField = (fieldName, fieldValue = true) => ({
  fieldName,
  fieldOperator: "boolean",
  fieldValue: String(fieldValue)
});

/**
 * Default field rows pre-populated when a Setting is selected.
 * Keep keys aligned to SETTING_OPTIONS values.
 */
export const DEFAULT_FIELDS = {
  lightningExperienceSettings: [
    boolField("enableS1DesktopEnabled"),
    boolField("enableUsersAreLightningOnly"),
    boolField("enableLexEndUsersNoSwitching")
  ],
  mobileSettings: [boolField("enableS1EncryptedStoragePref2", false)],
  einsteinGptSettings: [boolField("enableEinsteinGptPlatform")],
  botSettings: [boolField("enableBots")],
  customerDataPlatformSettings: [boolField("enableCustomerDataPlatform")],
  analyticsSettings: [boolField("enableInsights")],
  devHubSettings: [boolField("enableDevOpsCenterGA")],
  revenueManagementSettings: [boolField("enableCoreCPQ")],
  orderManagementSettings: [boolField("enableOrderManagement")],
  orderSettings: [boolField("enableOrders")],
  fieldServiceSettings: [
    boolField("enableWorkOrders"),
    boolField("enableWorkPlansAutoGeneration"),
    boolField("isLocationHistoryEnabled")
  ]
};

/**
 * Sample template registry. Each entry produces a fully-formed scratch org definition shape
 * (edition + features + settings) that the parent card applies in one click.
 */
export const TEMPLATES = {
  agentforce: {
    label: "Agentforce",
    edition: "Partner Developer",
    features: ["Einstein1AIPlatform", "Chatbot"],
    settings: {
      einsteinGptSettings: { enableEinsteinGptPlatform: true },
      botSettings: { enableBots: true }
    }
  },
  dataCloud: {
    label: "Data Cloud",
    edition: "Partner Developer",
    features: [
      "CustomerDataPlatform",
      "CustomerDataPlatformLite",
      "MarketingUser"
    ],
    settings: {
      customerDataPlatformSettings: { enableCustomerDataPlatform: true }
    }
  },
  crmAnalytics: {
    label: "CRM Analytics",
    edition: "Partner Developer",
    features: [
      "DevelopmentWave",
      "AnalyticsAdminPerms",
      "AnalyticsAppEmbedded",
      "EAOutputConnectors",
      "EinsteinAnalyticsPlus",
      "InsightsPlatform"
    ],
    settings: {
      analyticsSettings: { enableInsights: true }
    }
  },
  tableauNext: {
    label: "Tableau Next",
    edition: "Partner Developer",
    features: [
      "TableauEinstein",
      "DevelopmentWave",
      "CustomerDataPlatform",
      "CustomerDataPlatformLite",
      "MarketingUser"
    ],
    settings: {
      customerDataPlatformSettings: { enableCustomerDataPlatform: true }
    }
  },
  marketingCloud: {
    label: "Marketing Cloud",
    edition: "Partner Developer",
    features: ["MarketingCloud", "MarketingUser", "AIAttribution"],
    settings: {}
  },
  orderManagement: {
    label: "Order Management",
    edition: "Developer",
    features: ["OrderManagement"],
    settings: {
      orderManagementSettings: { enableOrderManagement: true },
      orderSettings: { enableOrders: true }
    }
  },
  fieldService: {
    label: "Field Service",
    edition: "Partner Developer",
    features: [
      "FieldService:10",
      "FieldServiceAppointmentAssistantUser:10",
      "FieldServiceDispatcherUser:10",
      "FieldServiceLastMileUser:10",
      "FieldServiceMobileExtension",
      "FieldServiceMobileUser:10",
      "FieldServiceSchedulingUser:10",
      "MobileExtMaxFileSizeMB:1000"
    ],
    settings: {
      fieldServiceSettings: {
        enableWorkOrders: true,
        enableWorkPlansAutoGeneration: true,
        isLocationHistoryEnabled: true
      }
    }
  },
  devOpsCenter: {
    label: "DevOps Center",
    edition: "Partner Developer",
    features: ["DevOpsCenter"],
    settings: {
      devHubSettings: { enableDevOpsCenterGA: true }
    }
  },
  revCloud: {
    label: "Revenue Cloud",
    features: ["BillingAdvanced", "InvoiceManagement", "CoreCpq"],
    settings: {
      revenueManagementSettings: { enableCoreCPQ: true }
    }
  },
  fsc: {
    label: "Financial Service Cloud",
    features: [
      "FinancialServicesCommunityUser:5",
      "FinancialServicesInsuranceUser",
      "FinancialServicesUser:5",
      "FSCAlertFramework",
      "FSCServiceProcess",
      "IndustriesBranchManagement",
      "PersonAccounts",
      "ContactsToMultipleAccounts",
      "AssociationEngine"
    ],
    settings: {}
  },
  hls: {
    label: "Health Cloud",
    features: [
      "HealthCloudAddOn",
      "HealthCloudForCmty",
      "HealthCloudMedicationReconciliation",
      "HealthCloudPNMAddOn",
      "HealthCloudUser",
      "HLSAnalytics",
      "PersonAccounts",
      "ContactsToMultipleAccounts"
    ],
    settings: {}
  },
  cg: {
    label: "Consumer Goods Cloud",
    features: ["EinsteinVisits", "CGAnalytics"],
    settings: {}
  },
  edu: {
    label: "Education Cloud",
    features: ["EducationCloud:3"],
    settings: {}
  },
  eu: {
    label: "Energy and Utilities Cloud",
    features: ["EnergyAndUtilitiesCloud", "EAndUDigitalSales"],
    settings: {}
  },
  netZero: {
    label: "Net Zero Cloud",
    features: [
      "SustainabilityApp",
      "SustainabilityCloud",
      "TCRMforSustainability",
      "DisclosureFramework"
    ],
    settings: {}
  },
  pubSec: {
    label: "Public Sector Cloud",
    features: [
      "PublicSectorAccess",
      "PublicSectorApplicationUsageCreditsAddOn",
      "PublicSectorSiteTemplate"
    ],
    settings: {}
  },
  b2bCommerce: {
    label: "B2B Commerce",
    edition: "Developer",
    features: [
      "B2BCommerce",
      "B2BLoyaltyManagement",
      "RevSubscriptionManagement"
    ],
    settings: {}
  },
  b2cCommerce: {
    label: "B2C Commerce",
    edition: "Developer",
    features: [
      "B2CCommerceGMV",
      "B2CLoyaltyManagement",
      "B2CLoyaltyManagementPlus"
    ],
    settings: {}
  },
  loyaltyCloud: {
    label: "Loyalty Cloud",
    edition: "Developer",
    features: [
      "LoyaltyAnalytics",
      "LoyaltyEngine",
      "LoyaltyManagementStarter",
      "LoyaltyMaximumPartners:1",
      "LoyaltyMaximumPrograms:1",
      "LoyaltyMaxOrderLinePerHour:3500000",
      "LoyaltyMaxProcExecPerHour:500000",
      "LoyaltyMaxTransactions:50000000",
      "LoyaltyMaxTrxnJournals"
    ],
    settings: {}
  }
};

/**
 * Build a feature pill object compatible with `lightning-pill-container`.
 */
export function buildFeaturePill(name) {
  const trimmed = String(name || "").trim();
  const anchor = trimmed.toLowerCase().split(":")[0];
  return {
    type: "icon",
    label: trimmed,
    name: trimmed,
    iconName: "standard:settings",
    alternativeText: "Feature",
    href: `${FEATURE_DOC_BASE}#so_${anchor}`
  };
}

/**
 * Coerce a string field value into the runtime type implied by the operator.
 * Returns the value untouched (as a string) when the operator is unknown.
 */
export function castFieldValue(operator, value) {
  if (value === undefined || value === null || value === "") {
    return value;
  }
  switch (operator) {
    case "boolean":
      return value === true || value === "true";
    case "integer": {
      const n = Number(value);
      return Number.isFinite(n) ? n : value;
    }
    default:
      return value;
  }
}
