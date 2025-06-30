import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { NavigationMixin } from "lightning/navigation";
import invokeGenAiPromptTemplate from '@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class GenAiLimitsModal  extends LightningModal {
    @api content;
    @api label;

    displaySpinner = true;

    aiResponse;
    error;

    currentPkgVersionId = '04tRh000001ANXRIA4';

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

    handleClose(){
        this.close();
    }

    async generateAiResponse() {
        try {
            this.aiResponse = await invokeGenAiPromptTemplate({
                className: 'GenAiPromptTemplateController',
                methodName: `singleFreeText`,
                recordId: this.content,
                objectInput: 'Limits_Data',
                promptTemplateName: 'Org_Limits_Summary'
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