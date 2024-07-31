import { api } from 'lwc';
import LightningModal from 'lightning/modal';


export default class ScratchBuildModal extends LightningModal {
    @api label;
    @api content;

    handleDownloadJson(){
        const blob = new Blob([this.content], { type: 'application/json'});
        const link = document.createElement('a');
        link.download = 'project-scratch-def.json';
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}