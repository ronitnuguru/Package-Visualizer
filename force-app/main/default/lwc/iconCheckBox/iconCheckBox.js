import { LightningElement, api } from 'lwc';

export default class IconCheckBox extends LightningElement {

    @api label;
    @api description;
    @api errors;

    _value;

    get options() {
        return [
            { label: 'SLDS', value: 'SLDS' },
            { label: 'CMS', value: 'CMS' },
        ];
    }

    @api
    set value(iconType) {
        this._value = iconType;
    }

    get value() {
        return this._value;
    }

    handleIconGroupChange(event) {
        const value = event.target.value;
        this.value = value;
        this.dispatchEvent(new CustomEvent("valuechange", 
        {detail: {value: this.value}}));
    }
}