import { LightningElement } from 'lwc';

export default class FeatureParametersCard extends LightningElement {

    dataFlowValue = 'LMO to Subscriber';

    get dataFlowOptions() {
        return [
            { label: 'LMO to Subscriber', value: 'LMO to Subscriber' },
            { label: 'Subscriber to LMO', value: 'Subscriber to LMO' },
        ];
    }
}