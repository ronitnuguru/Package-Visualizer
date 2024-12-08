import { LightningElement, api } from 'lwc';

export default class EmptyIllustrationWithButton extends LightningElement {
    @api title;
    @api body;
    @api buttonLabel;
    @api neutralButtonLabel;
    @api size;

    get modalSize(){
        return this.size === "large" ? `slds-illustration slds-illustration_large` : `slds-illustration slds-illustration_small`;
    }

    handleClick(){
        this.dispatchEvent(new CustomEvent('select'));
    }

    handleNeutralClick(){
        this.dispatchEvent(new CustomEvent('neutralselect'));
    }
}