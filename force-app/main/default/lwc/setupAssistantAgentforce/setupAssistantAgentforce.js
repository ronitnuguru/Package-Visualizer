import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

const columns = [
    { 
        label: 'Component Name', 
        fieldName: 'componentName', 
        iconName: 'utility:component_customization', 
        fixedWidth: 280
    },
    { 
        label: 'Metadata Name', 
        fieldName: 'metadataUrl', 
        iconName: 'utility:database', 
        fixedWidth: 280, 
        type: 'url', 
        typeAttributes: {
            label: {
                fieldName: "metadataName",
                target: "_blank"
            }
        }, 
    },
    { 
        label: '2GP', 
        fieldName: '1gp', 
        iconName: 'utility:funding_requirement', 
        type: 'boolean', 
        fixedWidth: 70 
    },
    { 
        label: '1GP', 
        fieldName: '2gp', 
        iconName: 'utility:funding_requirement', 
        type: 'boolean', 
        fixedWidth: 70  
    }
];


export default class SetupAssistantAgentforce extends NavigationMixin(LightningElement) {

    @api orgId;

    data = [
        {
            "componentName": 'Agent Actions',
            "metadataName": 'GenAiFunction',
            "1gp": true,
            "2gp": true,
            "metadataUrl": "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaifunction"
        },
        {
            "componentName": 'Agent Topics',
            "metadataName": 'GenAiPlugin',
            "1gp": true,
            "2gp": true,
            "metadataUrl": 'https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaiplugin'
        },
        {
            "componentName": 'Prompt Templates',
            "metadataName": 'GenAiPromptTemplate',
            "1gp": true,
            "2gp": true,
            "metadataUrl": 'https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaiprompttemplate'
        },
        {
            "componentName": 'Agent Templates',
            "metadataName": 'BotTemplate',
            "1gp": true,
            "2gp": true,
            "metadataUrl": 'https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_bot_template'

        },
        {
            "componentName": 'Agent Templates',
            "metadataName": 'GenAiPlannerBundle',
            "1gp": true,
            "2gp": true,
            "metadataUrl": 'https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaiplannerbundle'

        },
        {
            "componentName": 'Lightning Types',
            "metadataName": 'LightningTypeBundle',
            "1gp": true,
            "2gp": true,
            "metadataUrl": 'https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_lightning_types'

        }
    ];
    columns = columns;

    selectedItem = `metadata`;

    handleSelect(event){

    }

    activeSections = ['A', 'B'];
    activeSectionsMessage = '';

    handleSectionToggle(event) {
        const openSections = event.detail.openSections;

        if (openSections.length === 0) {
            this.activeSectionsMessage = 'All sections are closed';
        } else {
            this.activeSectionsMessage =
                'Open sections: ' + openSections.join(', ');
        }
    }

    navigateScratchOrgBuild(){
        this[NavigationMixin.Navigate]({
            type: "standard__component",
            attributes: {
                componentName: "pkgviz__scratchDefFileBuildCard",
            }
        });
    }
}