import { LightningElement } from "lwc";

const SCRATCH_ORG_WORKFLOW_URL =
  "https://developer.salesforce.com/docs/analytics/tableau-next-isv-dev/guide/tn-scratch-org-workflow.html";
const DEPLOY_ASSETS_URL =
  "https://developer.salesforce.com/docs/analytics/tableau-next-isv-dev/guide/tn-deploy-assets-using-cli.html";

export default class SetupAssistantTableauNext extends LightningElement {
  autoConfirmSettings = true;

  navigateToScratchOrgWorkflow() {
    window.open(SCRATCH_ORG_WORKFLOW_URL, "_blank", "noopener,noreferrer");
  }

  navigateToDeployAssetsGuide() {
    window.open(DEPLOY_ASSETS_URL, "_blank", "noopener,noreferrer");
  }
}
