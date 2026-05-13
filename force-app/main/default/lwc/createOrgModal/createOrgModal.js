import { LightningElement, api, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import isSignupRequest from "@salesforce/apex/DemoTrialsController.isSignupRequest";
import createSignupTrial from "@salesforce/apex/DemoTrialsController.createSignupTrial";
import Toast from 'lightning/toast';
import { COUNTRY_OPTIONS } from 'c/scratchOrgConfig';

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