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

    connectedCallback(){
        if(this.templatePrompts){
            if(typeof this.templatePrompts === 'string'){
                this.templatePrompts = JSON.parse(this.templatePrompts);
            }
        }
    }

    modelsValue = 'sfdc_ai__DefaultGPT5';
    providerValue = 'OpenAI';
    currentPkgVersionId = '04tRh000001bMQnIAM';

    get modelProviderOptions() {
        return [
            { label: 'OpenAI', value: 'OpenAI' },
            { label: 'Anthropic', value: 'Anthropic' },
            { label: 'Google', value: 'Google' },
            { label: 'Amazon', value: 'Amazon' },
            { label: 'NVIDIA', value: 'NVIDIA' },
        ];
    }

    get allModelsTypeOptions() {
        return [
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 5.5 (Beta)', value: 'sfdc_ai__DefaultGPT55' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 5.4 Mini (Beta)', value: 'sfdc_ai__DefaultGPT54Mini' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 5.4', value: 'sfdc_ai__DefaultGPT54' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 5.2', value: 'sfdc_ai__DefaultGPT52' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 5.1', value: 'sfdc_ai__DefaultGPT51' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 5', value: 'sfdc_ai__DefaultGPT5' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 5 Mini', value: 'sfdc_ai__DefaultGPT5Mini' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 4.1', value: 'sfdc_ai__DefaultGPT41' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 4.1 Mini', value: 'sfdc_ai__DefaultGPT41Mini' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 4 Omni (GPT-4o)', value: 'sfdc_ai__DefaultGPT4Omni' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI GPT 4 Omni Mini (GPT-4o mini)', value: 'sfdc_ai__DefaultGPT4OmniMini' },
            { provider: 'OpenAI', label: 'OpenAI GPT 4 Omni Mini (GPT-4o mini)', value: 'sfdc_ai__DefaultOpenAIGPT4OmniMini' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI O4 Mini', value: 'sfdc_ai__DefaultO4Mini' },
            { provider: 'OpenAI', label: 'OpenAI / Azure OpenAI O3', value: 'sfdc_ai__DefaultO3' },
            { provider: 'Anthropic', label: 'Anthropic Claude Opus 4.7 on Amazon Bedrock (Beta)', value: 'sfdc_ai__DefaultBedrockAnthropicClaude47Opus' },
            { provider: 'Anthropic', label: 'Anthropic Claude Opus 4.6 on Amazon Bedrock (Beta)', value: 'sfdc_ai__DefaultBedrockAnthropicClaude46Opus' },
            { provider: 'Anthropic', label: 'Anthropic Claude Opus 4.5 on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude45Opus' },
            { provider: 'Anthropic', label: 'Anthropic Claude Sonnet 4.6 on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude46Sonnet' },
            { provider: 'Anthropic', label: 'Anthropic Claude Sonnet 4.5 on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude45Sonnet' },
            { provider: 'Anthropic', label: 'Anthropic Claude Sonnet 4 on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude4Sonnet' },
            { provider: 'Anthropic', label: 'Anthropic Claude Haiku 4.5 on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude45Haiku' },
            { provider: 'Google', label: 'Vertex AI (Google) Gemini 3.1 Pro (Beta)', value: 'sfdc_ai__DefaultVertexAIGeminiPro31' },
            { provider: 'Google', label: 'Vertex AI (Google) Gemini 3.1 Flash Lite (Beta)', value: 'sfdc_ai__DefaultVertexAIGemini31FlashLite' },
            { provider: 'Google', label: 'Vertex AI (Google) Gemini 3 Flash', value: 'sfdc_ai__DefaultVertexAIGemini30Flash' },
            { provider: 'Google', label: 'Vertex AI (Google) Gemini 2.5 Pro', value: 'sfdc_ai__DefaultVertexAIGeminiPro25' },
            { provider: 'Google', label: 'Vertex AI (Google) Gemini 2.5 Flash', value: 'sfdc_ai__DefaultVertexAIGemini25Flash001' },
            { provider: 'Google', label: 'Vertex AI (Google) Gemini 2.5 Flash Lite', value: 'sfdc_ai__DefaultVertexAIGemini25FlashLite001' },
            { provider: 'Amazon', label: 'Amazon Nova Pro on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAmazonNovaPro' },
            { provider: 'Amazon', label: 'Amazon Nova Lite on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAmazonNovaLite' },
            { provider: 'NVIDIA', label: 'NVIDIA Nemotron 3 Nano 30B (Beta) on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockNvidiaNemotronNano330b' },
        ];
    }

    get modelsTypeOptions() {
        return this.allModelsTypeOptions
            .filter((model) => model.provider === this.providerValue)
            .map(({ label, value }) => ({ label, value }));
    }

    handleProviderTypeChange(event) {
        this.providerValue = event.detail.value;
        const selectedProviderModels = this.modelsTypeOptions;
        this.modelsValue = selectedProviderModels.length ? selectedProviderModels[0].value : null;
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
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`
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

    handleFeedback(){
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Thanks for your feedback',
                variant: 'success',
            }),
        );
    }

    handleGenerate(){
        this.displaySpinner = true;
        (async () => {
            await invokeModelsGenAi({
                className: 'AgentGenAiController',
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