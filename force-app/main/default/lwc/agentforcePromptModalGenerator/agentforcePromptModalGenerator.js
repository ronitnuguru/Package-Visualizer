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
    providerValue = 'OpenAI';
    currentPkgVersionId = '04tRh000001bMQnIAM';

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
            { provider: 'Google', label: 'Vertex AI (Google) Gemini 3 Pro (Beta)', value: 'sfdc_ai__DefaultVertexAIGeminiPro30' },
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