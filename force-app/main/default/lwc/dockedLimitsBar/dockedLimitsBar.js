import { LightningElement, api } from 'lwc';

export default class DockedLimitsBar extends LightningElement {
    @api name;
    @api remaining;
    @api max;
    @api percentage;
}