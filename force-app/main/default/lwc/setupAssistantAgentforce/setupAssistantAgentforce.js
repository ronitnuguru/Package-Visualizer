import { LightningElement, api } from "lwc";

const columns = [
  {
    label: "Component Name",
    fieldName: "componentName",
    iconName: "utility:component_customization"
  },
  {
    label: "Metadata Name",
    fieldName: "metadataUrl",
    iconName: "utility:database",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "metadataName",
        target: "_blank"
      }
    }
  },
  {
    label: "2GP",
    fieldName: "1gp",
    iconName: "utility:funding_requirement",
    type: "boolean"
  },
  {
    label: "1GP",
    fieldName: "2gp",
    iconName: "utility:funding_requirement",
    type: "boolean"
  },
  {
    label: "Next Gen Builder",
    fieldName: "nextGenBuilder",
    iconName: "utility:builder",
    type: "boolean"
  },
  {
    label: "Legacy Builder",
    fieldName: "legacyBuilder",
    iconName: "utility:builder",
    type: "boolean"
  }
];

export default class SetupAssistantAgentforce extends LightningElement {
  @api orgId;

  // Launch the embedded scratch org builder already in the confirmed "Edit Settings" state.
  autoConfirmSettings = true;

  data = [
    {
      componentName: "AgentScript",
      metadataName: "AiAuthoringBundle",
      "1gp": false,
      "2gp": false,
      nextGenBuilder: true,
      legacyBuilder: false,
      metadataUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_aiauthoringbundle.htm"
    },
    {
      componentName: "Agent Actions",
      metadataName: "GenAiFunction",
      "1gp": true,
      "2gp": true,
      nextGenBuilder: true,
      legacyBuilder: true,
      metadataUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaifunction"
    },
    {
      componentName: "Subagents",
      metadataName: "GenAiPlugin",
      "1gp": true,
      "2gp": true,
      nextGenBuilder: false,
      legacyBuilder: true,
      metadataUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaiplugin"
    },
    {
      componentName: "Prompt Templates",
      metadataName: "GenAiPromptTemplate",
      "1gp": true,
      "2gp": true,
      nextGenBuilder: true,
      legacyBuilder: true,
      metadataUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaiprompttemplate"
    },
    {
      componentName: "Agent Templates",
      metadataName: "BotTemplate",
      "1gp": true,
      "2gp": true,
      nextGenBuilder: false,
      legacyBuilder: true,
      metadataUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_bot_template"
    },
    {
      componentName: "Agent Templates",
      metadataName: "GenAiPlannerBundle",
      "1gp": true,
      "2gp": true,
      nextGenBuilder: false,
      legacyBuilder: true,
      metadataUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_genaiplannerbundle"
    },
    {
      componentName: "Lightning Types",
      metadataName: "LightningTypeBundle",
      "1gp": true,
      "2gp": true,
      nextGenBuilder: true,
      legacyBuilder: true,
      metadataUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/packaging_packageable_components.htm#mdc_lightning_types"
    }
  ];
  columns = columns;

  selectedItem = `metadata`;

  handleSelect() {}

  activeSections = ["A", "B"];
  activeSectionsMessage = "";

  handleSectionToggle(event) {
    const openSections = event.detail.openSections;

    if (openSections.length === 0) {
      this.activeSectionsMessage = "All sections are closed";
    } else {
      this.activeSectionsMessage = "Open sections: " + openSections.join(", ");
    }
  }
}
