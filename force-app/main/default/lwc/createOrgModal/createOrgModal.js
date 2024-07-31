import { LightningElement, api, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import isSignupRequest from "@salesforce/apex/DemoTrialsController.isSignupRequest";
import createSignupTrial from "@salesforce/apex/DemoTrialsController.createSignupTrial";
import Toast from 'lightning/toast';

export default class CreateOrgModal extends LightningModal {

    @api content;
    @api label;

    displayError;
    displaySpinner;
    errorText;
    displaySignUpRequest;

    preferredLanguage = 'en_US';
    country = 'US';

    @wire(isSignupRequest)
    signupRequest({ data }) {
        this.displaySpinner = false;
        if (data === true) {
            this.displaySignUpRequest = true;
        } else if (data === undefined) {
            this.displaySpinner = true;
            this.displaySignUpRequest = false;
        }
        else {
            this.displaySignUpRequest = false;
        }
    }

    handlePopoverClose() {
        this.displayError = false;
    }

    handleNeutralButtonClick(){
        this.close();
    }

    handleBrandButtonClick(event) {
        this.displaySpinner = true;
        const allValid = [...this.template.querySelectorAll('lightning-input'), ...this.template.querySelectorAll('lightning-combobox'), ...this.template.querySelectorAll('lightning-radio-group')].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        if (allValid) {
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
        this.close();

        this.template.querySelector('.firstName').value = null;
        this.template.querySelector('.lastName').value = null;
        this.template.querySelector('.email').value = null;
        this.template.querySelector('.userName').value = null;
        this.template.querySelector('.company').value = null;
        this.template.querySelector('.myDomain').value = null;

        this.displayError = false;
        this.errorText = false;

        Toast.show({
            label: `Trial for ${company} has been queued`,
            message: `Review login instructions in ${email}'s inbox`,
            mode: 'dismissible',
            variant: 'success'
        }, this);

    }

    createSignupTrial() {
        let company = this.template.querySelector('.company').value;
        let email = this.template.querySelector('.email').value;

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
                templateId: this.content.trialTemplateId,
                trialDays: this.content.trialDays,
                isSignupEmailSuppressed: false,
                shouldConnectToEnvHub: this.content.shouldConnectToEnvHub,
                signupSource: this.content.signupSource
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
                        Toast.show({
                            label: `Error`,
                            message: `Can't create trial for ${company}`,
                            mode: 'dismissible',
                            variant: "error"
                        }, this);
                    } else {
                        Toast.show({
                            label: `Error`,
                            message: `Can't create trial for ${company}`,
                            mode: 'dismissible',
                            variant: "error"
                        }, this);
                    }
                });
        })();
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