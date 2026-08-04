import { LightningElement, api } from "lwc";
import invokeGenAiPromptTemplate from "@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate";

export default class GenAiResponseCard extends LightningElement {
  @api titleHeader;
  @api titleIcon;
  @api objectName;
  @api promptTemplateName;
  @api recordId;

  displaySpinner = true;
  displayExtensionIllustration = false;

  aiResponse;
  error;

  connectedCallback() {
    this.generateAiResponse();
  }

  async generateAiResponse() {
    try {
      this.aiResponse = await invokeGenAiPromptTemplate({
        className: "pkgviz__AgentGenAiPromptTemplateController",
        methodName: `recordSummary`,
        recordId: this.recordId,
        objectInput: this.objectName,
        promptTemplateName: this.promptTemplateName
      });
      this.error = undefined;
      this.displaySpinner = false;
    } catch (error) {
      this.aiResponse = undefined;
      this.error = error;
      console.error(this.error);
      this.displaySpinner = false;
    }
  }
}
