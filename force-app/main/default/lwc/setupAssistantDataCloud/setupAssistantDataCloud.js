import { LightningElement, api } from "lwc";

export default class SetupAssistantDataCloud extends LightningElement {
  @api orgId;

  // Launch the embedded scratch org builder already in the confirmed "Edit Settings" state.
  autoConfirmSettings = true;

  navigateToDataCloudPackagingCheatSheet() {
    window.open(
      `https://developer.salesforce.com/docs/data/data-cloud-dev/guide/component-cheatsheet.html`,
      "_blank"
    );
  }

  navigateToDataCloudWorkflow() {
    window.open(
      `https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html`,
      "_blank"
    );
  }
}
