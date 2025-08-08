import { api } from 'lwc';
import invokeGenAiPromptTemplate from '@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ScratchBuildModal extends LightningModal {
    @api label;
    @api content;

    aiDiff;
    displaySpinner;
    aiResponse;
    error;
    displayAiSuggest;
    aiSuggestion;

    currentPkgVersionId = '04tRh000001FlXWIA0';

    get isAiSuggestionEmpty(){
        return !this.aiSuggestion;
    }

    handleUserDownloadJson(){
        const blob = new Blob([this.content], { type: 'application/json'});
        const link = document.createElement('a');
        link.download = 'project-scratch-def.json';
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleAiSuggestImprovements(){
        this.displayAiSuggest = true;
    }

    handlePopoverClose(){
        this.displayAiSuggest = false;
    }

    handleAiSuggestionChange(event){
        this.aiSuggestion = event.target.value;
    }

    handleAiDownloadJson(){
        if (this.aiResponse) {
            const blob = new Blob([this.aiResponse], { type: 'application/json'});
            const link = document.createElement('a');
            link.download = 'ai-generated-scratch-def.json';
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    handleAiRewrite(){
        this.aiDiff = true;
        this.displaySpinner = true;
        this.generateAiResponse();
        this.handlePopoverClose();
    }

    async generateAiResponse() {
        try {
            this.aiResponse = await invokeGenAiPromptTemplate({
                className: 'GenAiPromptTemplateController',
                methodName: `singleFreeText`,
                recordId: `${this.aiSuggestion} ${this.content}`,
                objectInput: `User_Generated_Scratch_Org_File`,
                promptTemplateName: 'pkgviz__Generate_AI_Scratch_Org_Definition_File'
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

    handleAiClear(){
        this.aiDiff = false;
    }

    handleUserCopyPaste(){
        if (this.content) {
            navigator.clipboard.writeText(this.content).then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Text copied to clipboard',
                        variant: 'success',
                    }),
                );
            }).catch(err => {
                console.error('Failed to copy user content to clipboard:', err);
                // Fallback for older browsers
                this.fallbackCopyToClipboard(this.content);
            });
        }
    }

    handleAiCopyPaste(){
        if (this.aiResponse) {
            navigator.clipboard.writeText(this.aiResponse).then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Text copied to clipboard',
                        variant: 'success',
                    }),
                );
                // Optional: Show success message
                console.log('AI response copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy AI response to clipboard:', err);
                // Fallback for older browsers
                this.fallbackCopyToClipboard(this.aiResponse);
            });
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Text copied to clipboard',
                    variant: 'success',
                }),
            );
            console.log('AI response copied to clipboard (fallback method)');
        } catch (err) {
            console.error('Fallback copy to clipboard failed:', err);
        }
        document.body.removeChild(textArea);
    }

    handleIllustrationClear(){
        this.displayExtensionIllustration = false;
        this.prompt = '';
    }

    handleExtensionInstall(){
        window.open(`/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`, '_blank');
    }

    handleCloseModal(){
        this.close();
    }
}