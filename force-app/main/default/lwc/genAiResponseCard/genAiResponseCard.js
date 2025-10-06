import { LightningElement, api } from 'lwc';
import invokeGenAiPromptTemplate from '@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class GenAiResponseCard extends NavigationMixin(LightningElement) {
    
    @api titleHeader;
    @api titleIcon;
    @api objectName;
    @api promptTemplateName;
    @api recordId;

    displaySpinner = true;
    displayExtensionIllustration = false;

    aiResponse;
    error;

    currentPkgVersionId = '04tRh000001NBdJIAW';

    connectedCallback(){
        this.generateAiResponse();
    }

    handleExtensionInstall(){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`
            }
        });
    }

    async generateAiResponse() {
        try {
            this.aiResponse = await invokeGenAiPromptTemplate({
                className: 'AgentGenAiPromptTemplateController',
                methodName: `recordSummary`,
                recordId: this.recordId,
                objectInput: this.objectName,
                promptTemplateName: this.promptTemplateName
            });
            this.error = undefined;
            this.displaySpinner = false;
        } catch (error) {
            this.aiResponse = undefined;
            this.error = error;
            console.error(this.error);
            this.displaySpinner = false;
        }
    }
}