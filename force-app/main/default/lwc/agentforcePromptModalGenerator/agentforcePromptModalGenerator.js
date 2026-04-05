import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";

export default class AgentforcePromptModalGenerator extends LightningModal  {
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

    modelsValue = 'sfdc_ai__DefaultGPT5';
    currentPkgVersionId = '04tRh000001NBdJIAW';

    /** Aligns with plan §3.6 "Package GenAI Prompt Template Library" (ISV packaging / Agentforce). */
    promptTemplateCardTitle = 'Package GenAI Prompt Template Library';
    promptTemplateCardIcon = 'utility:sparkles';

    /**
     * Sample template prompts aligned with the prompt template library idea
     * (ISV packaging / Agentforce). Selection wiring comes in a later step.
     */
    get samplePromptTemplates() {
        return [
            {
                id: 'push_upgrade_analysis',
                label: 'Push Upgrade Analysis',
                description: 'Analyze push job results and suggest remediation',
                iconName: 'utility:sparkles'
            },
            {
                id: 'subscriber_health',
                label: 'Subscriber Health Report',
                description: 'Generate a health snapshot for a subscriber org',
                iconName: 'utility:sparkles'
            },
            {
                id: 'release_notes',
                label: 'Release Notes Draft',
                description: 'Outline release notes from version context',
                iconName: 'utility:sparkles'
            },
            {
                id: 'deprecation_impact',
                label: 'Deprecation Impact',
                description: 'Assess impact of deprecating a version',
                iconName: 'utility:sparkles'
            },
            {
                id: 'upgrade_communication',
                label: 'Upgrade Email Draft',
                description: 'Draft subscriber-facing upgrade communication',
                iconName: 'utility:sparkles'
            },
            {
                id: 'error_diagnosis',
                label: 'Error Diagnosis',
                description: 'Diagnose push or API errors from details you provide',
                iconName: 'utility:sparkles'
            }
        ];
    }

    handleSampleTemplateClick(event) {
        const templateId = event?.currentTarget?.dataset?.templateId;
        if (!templateId) {
            return;
        }
        // Fills user/system prompts from the chosen template in a follow-up step.
    }

    get modelsTypeOptions() {
        return [
            { label: 'Azure OpenAI GPT-5', value: 'sfdc_ai__DefaultGPT5' },
            { label: 'Azure OpenAI GPT-4.1', value: 'sfdc_ai__DefaultGPT41Mini' },
            { label: 'Azure OpenAI GPT-5 Mini', value: 'sfdc_ai__DefaultGPT5Mini' },
            { label: 'Azure OpenAI GPT-4.1 Mini', value: 'sfdc_ai__DefaultGPT41Mini' },
            { label: 'Anthropic Claude 4 Sonnet on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude4Sonnet' },
            { label: 'Amazon Nova Pro on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAmazonNovaPro' },
            { label: 'Amazon Nova Lite on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAmazonNovaLite' },
            { label: 'Anthropic Claude 3.7 Sonnet on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude37Sonnet' },
            { label: 'Anthropic Claude 3 Haiku on Amazon Bedrock', value: 'sfdc_ai__DefaultBedrockAnthropicClaude3Haiku' },
            { label: 'Vertex AI (Google) Gemini 2.5 Flash', value: 'sfdc_ai__DefaultVertexAIGemini25Flash001' },
            { label: 'Vertex AI (Google) Gemini 2.5 Flash Lite', value: 'sfdc_ai__DefaultVertexAIGemini25FlashLite001' },
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
                className: 'AgentGenAiController',
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

    handleBack(){
        this.displayModels = false;
        this.displayEditPrompt = false;
    }

    handleCancel(){
        this.close();
    }

    handleExtensionInstall(){
        /*
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`
            }
        });
        */
        window.open(`/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`, "_blank");
    }

    handleUserPromptChange(event){
        this.userPrompt = event.target.value;
    }

    handleSystemPromptChange(event){
        this.systemPrompt = event.target.value;
    }
}