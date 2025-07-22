import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import invokeGenAiPromptTemplate from '@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate';

export default class GenAiLimitsModal extends LightningModal {
    @api content;
    @api label;

    displaySpinner = true;

    aiResponse;
    error;

    currentPkgVersionId = '04tRh000001APUPIA4';

    connectedCallback(){
        this.generateAiResponse();
    }
    handleExtensionInstall(){
        window.open(`/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`, "_blank");
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
                promptTemplateName: 'pkgviz__Org_Limits_Summary'
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