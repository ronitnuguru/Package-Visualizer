import { LightningElement, api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ViewDetailsModal extends LightningModal {

    @api content;
    @api label;

    handleBrandButtonClick() {
        this.close('Sign Up');
    }

    handleNeutralButtonClick(){
        this.close();
    }
}