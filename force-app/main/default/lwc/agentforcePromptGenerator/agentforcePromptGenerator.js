import { LightningElement, api } from 'lwc';
import invokeModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokeModelsGenAi";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class AgentforcePromptGenerator extends NavigationMixin(LightningElement) {

    @api titleHeader;
    @api titleIcon;
    @api templatePrompts;
    
    displaySpinner;
    prompt;
    response;
    displayResult;
    displayExtensionIllustration = false;

    modelsValue = 'sfdc_ai__DefaultGPT4Omni';

    connectedCallback(){
        if(this.templatePrompts){
            if(typeof this.templatePrompts === 'string'){
                this.templatePrompts = JSON.parse(this.templatePrompts);
            }
        }
    }

    get modelsTypeOptions() {
        return [
            { label: 'Anthropic Claude 3 Haiku on Amazon (Salesforce Managed)', value: 'sfdc_ai__DefaultBedrockAnthropicClaude3Haiku' },
            { label: 'Azure OpenAI Ada 002 (Embeddings Only)', value: 'sfdc_ai__DefaultTextEmbeddingAda_002' },
            { label: 'Azure OpenAI GPT-3.5 Turbo', value: 'sfdc_ai__DefaultGPT35Turbo' },
            { label: 'Azure OpenAI GPT-4 Turbo (Older GPT-4 Model)', value: 'sfdc_ai__DefaultGPT4Turbo' },
            { label: 'Azure OpenAI GPT-4o (Latest GPT-4 Model)', value: 'sfdc_ai__DefaultGPT4Omni' },
            { label: 'OpenAI GPT-4 (Older GPT-4 Model)', value: 'sfdc_ai__DefaultGPT4' },
            { label: 'OpenAI GPT 3.5 Turbo Instruct', value: 'sfdc_ai__DefaultGPT35TurboInstruct' }
        ];
    }

    handleModelsTypeChange(event) {
        this.modelsValue = event.detail.value;
    }

    navigateToHelpSupportedModels(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: 'https://developer.salesforce.com/docs/einstein/genai/guide/supported-models.html'
            }
        });
    }

    handleIllustrationClear(){
        this.displayExtensionIllustration = false;
        this.prompt = '';
    }

    handleExtensionInstall(){
        const currentPkgVersionId = '04tRh000000hdEDIAY';
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/packaging/installPackage.apexp?p0=${currentPkgVersionId}`
            }
        });
    }
    

    handlePromptChange(event){
        this.prompt = event.target.value;
    }

    handlePromptTemplateInput(event){
        if(event.target.value.endsWith("...")){
            this.prompt = event.target.value.replace("...", " ");
        } else {
            this.prompt = event.target.value;
        }
        
    }

    get enableGenerate(){
        return !this.prompt;
    }

    handleClear(){
        this.prompt = '';
        this.response = '';
        this.displayResult = false;
    }

    handleCopyPaste(){
        return navigator.clipboard.writeText(this.response).then(()=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Text copied to clipboard',
                    variant: 'success',
                }),
            );
        }).catch(error => {
            console.error('Failed to copy text: ', error);
        });
    }

    handleGenerate(){
        this.displaySpinner = true;
        (async () => {
            await invokeModelsGenAi({
                className: 'GenAiController',
                methodName: 'createGeneration',
                modelName: this.modelsValue,
                prompt: this.prompt
            })
                .then(result => {
                    this.displaySpinner = false;
                    this.response = result;
                    this.displayResult = true;
                })
                .catch(error => {
                    console.error(error);
                    this.displaySpinner = false;
                    this.displayExtensionIllustration = true;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: error.statusText,
                            message: error.body.message,
                            variant: "error"
                        })
                    );
                });
        })();
    }
}