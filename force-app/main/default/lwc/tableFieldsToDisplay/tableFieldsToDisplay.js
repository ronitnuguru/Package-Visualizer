import { LightningElement, api } from 'lwc';

export default class TableFieldsToDisplay extends LightningElement {

    @api tableOptions;
    @api tableSelectedOptions;
    @api requiredOptions;
    @api fieldLevelHelp;
    @api label;

    selectedOptions;

    handleCancel(){
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleSave(){
        this.dispatchEvent(new CustomEvent('save', { detail: this.selectedOptions }));
    }

    handleTableChange(event){
        this.selectedOptions = event.detail.value;
    }
}