import { LightningElement, api, wire } from 'lwc';

export default class ScratchRowMetaExperession extends LightningElement {

    @api confirmSelected;
    @api rowIndex;
    @api settingValue;
    
    operatorValue = 'boolean';
    dynamicRowMetaExpression;

    displayBoolean = true;
    displayString;
    displayInteger;

    count = 0;
    fieldSettings = [];
    confirmedFieldSettings;

    @api getMetaRows(){
        let rows;
        this.fieldSettings.forEach(row => {
            rows = { ...rows, [row.fieldName]: row.fieldValue};
        });
        return `"${[this.settingValue]}": ${JSON.stringify(rows)}`;
    }

    connectedCallback(){
        if(this.settingValue === 'lightningExperienceSettings'){
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: 'enableS1DesktopEnabled',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                },
                {
                    autoNumber: 1,
                    fieldName: 'enableUsersAreLightningOnly',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                },
                {
                    autoNumber: 2,
                    fieldName: 'enableLexEndUsersNoSwitching',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                }
            ];
        }
        else if (this.settingValue == 'mobileSettings'){
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: 'enableS1EncryptedStoragePref2',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'false'
                }
            ];
        } 
        else if (this.settingValue == 'einsteinGptSettings'){
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: 'enableEinsteinGptPlatform',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                }
            ];
        }
        else if (this.settingValue == 'botSettings'){
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: 'enableBots',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                }
            ];
        }
        else if (this.settingValue == 'customerDataPlatformSettings'){
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: 'enableCustomerDataPlatform',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                }
            ];
        }
        else if (this.settingValue == 'analyticsSettings'){
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: 'enableInsights',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                }
            ];
        }
        else if (this.settingValue == 'devHubSettings'){
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: 'enableDevOpsCenterGA',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: 'true'
                }
            ];
        }
        else {
            this.fieldSettings = [
                {
                    autoNumber: 0,
                    fieldName: '',
                    displayBoolean: true,
                    displayString: false,
                    displayInteger: false,
                    fieldOperator: 'boolean',
                    fieldValue: ''
                }
            ];
        }
    }

    handleAddMetaSetting(){
        this.count++;
        this.fieldSettings = [
            ...this.fieldSettings, 
            {
                autoNumber: this.count, 
                fieldName: '',
                displayBoolean: true,
                displayString: false,
                displayInteger: false,
                fieldOperator: 'boolean',
                fieldValue: ''
            }
        ];
    }



    handleDeleteMetaSetting(event){
        let index = event.target.dataset.index;
        this.fieldSettings.splice(index, 1);
        this.fieldSettings = [...this.fieldSettings];
    }

    get operatorOptions(){
        return [
            { label: 'Boolean', value: 'boolean' },
            { label: 'String', value: 'string' },
            { label: 'Integer', value: 'integer' }
        ];
    }

    get booleanOptions(){
        return [
            { label: 'TRUE', value: 'true' },
            { label: 'FALSE', value: 'false' }
        ];
    }

    handleMetadataValueChange(event){
        let index = event.target.dataset.index;
        let value = event.target.value;
        this.fieldSettings[index].fieldValue = value;
    }

    handleMetadataFieldChange(event){
        let index = event.target.dataset.index;
        let name = event.target.value;
        this.fieldSettings[index].fieldName = name;
    }

    handleOperatorChange(event){
        let index = event.target.dataset.index;
        let operatorVal = event.target.value;
        this.operatorChange(index, operatorVal);
    }

    operatorChange(index, operatorVal){
        switch (operatorVal) {
            case 'boolean':
                this.fieldSettings[index].fieldOperator = operatorVal;
                this.fieldSettings[index].displayBoolean = true;
                this.fieldSettings[index].displayString = false;
                this.fieldSettings[index].displayInteger = false;
                this.fieldSettings = [...this.fieldSettings];
            break;
            case 'string':
                this.fieldSettings[index].fieldOperator = operatorVal;
                this.fieldSettings[index].displayBoolean = false;
                this.fieldSettings[index].displayString = true;
                this.fieldSettings[index].displayInteger = false;
                this.fieldSettings = [...this.fieldSettings];
            break;
            case 'integer':
                this.fieldSettings[index].fieldOperator = operatorVal;
                this.fieldSettings[index].displayBoolean = false;
                this.fieldSettings[index].displayString = false;
                this.fieldSettings[index].displayInteger = true;
                this.fieldSettings = [...this.fieldSettings];
            break;
            default:
                this.fieldSettings[index].fieldOperator = 'boolean';
                this.fieldSettings[index].displayBoolean = true;
                this.fieldSettings[index].displayString = false;
                this.fieldSettings[index].displayInteger = false;
                this.fieldSettings = [...this.fieldSettings];
            break;
        }
    }
}