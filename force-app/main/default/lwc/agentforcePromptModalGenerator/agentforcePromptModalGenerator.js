import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";

export default class AgentforcePromptModalGenerator extends LightningModal {
    @api content;
    @api label;

    userPrompt;
    systemPrompt;

    promptCurrentTime;
    responseCurrentTime;

    response;
    displayResult;
    displayExtensionIllustration = false;
    displayModels;
    displayEditPrompt;

    get enableAskAgain(){
        return !this.displayResult;
    }

    modelsValue = 'sfdc_ai__DefaultGPT4Omni';
    currentPkgVersionId = '04tRh000000iBB3IAM';

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

    connectedCallback(){
        this.promptCurrentTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        this.userPrompt = this.content.userPrompt;
        this.systemPrompt = this.content.systemPrompt;
        this.handleGenerate();
    }

    handleGenerate(){
        (async () => {
            await invokePromptAndUserModelsGenAi({
                className: 'GenAiController',
                methodName: 'createChatGeneration',
                modelName: this.modelsValue,
                userPrompt : this.userPrompt,
                systemPrompt: this.systemPrompt
            })
                .then(result => {
                    this.response = result;
                    this.displayResult = true;
                    this.responseCurrentTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                })
                .catch(error => {
                    console.error(error);
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

    handleAskAgain(){
        this.displayEditPrompt = false;
        this.displayModels = false;
        this.displayResult = false;
        this.handleGenerate();
    }

    handleAgentPromptMenu(event){
        switch (event.detail.value) {
            case "switchModel":
                this.displayModels = true;
                this.template.querySelector('.modal-window').scrollTop = 0;
                break;
            case "editPrompt":
                this.displayEditPrompt = true;
                break;
            default:
                break;
        }
    }

    hanbleBack(){
        this.displayModels = false;
        this.displayEditPrompt = false;
    }

    handleCancel(){
        this.close();
    }

    handleExtensionInstall(){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`
            }
        });
    }

    handleUserPromptChange(event){
        this.userPrompt = event.target.value;
    }

    handleSystemPromptChange(event){
        this.systemPrompt = event.target.value;
    }
}