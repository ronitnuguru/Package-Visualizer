import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getPushJobPackageSubscriber from "@salesforce/apex/PushUpgradesCtrl.getPushJobPackageSubscriber";
import invokeGenAiPromptTemplate from '@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate';

export default class PackagePushJobDetail extends LightningElement {
  @api pushJobDetails;

  displaySubscriber = true;
  packageSubscriberAccordionClass = `slds-section slds-var-p-top_medium slds-is-open`;

  displaySubscriberData;
  displaySpinner = true;
  displayAgentforceSpinner = false;
  installedStatus;
  instanceName;
  metadataPackageId;
  metadataPackageVersionId;
  orgKey;
  orgName;
  orgStatus;
  orgType;
  packageType;
  aiResponse;
  showAgentforceCard = false;
  displayAiSuggest = false;
  aiSuggestion;

  get isAiSuggestionEmpty() {
    return !this.aiSuggestion;
  }

  get pushJobError() {
    let errorTitle, errorMessage;
    if(this.pushJobDetails.PackagePushErrors){
      errorTitle = this.pushJobDetails.PackagePushErrors.records[0].ErrorTitle;
      errorMessage = this.pushJobDetails.PackagePushErrors.records[0].ErrorMessage;
      return `${errorTitle}: ${errorMessage}`;
    }
    return undefined;
  }

  @wire(getPushJobPackageSubscriber, {
    orgId: "$pushJobDetails.SubscriberOrganizationKey"
  })
  packageSubscriber(result) {
    if (result.data) {
      this.displaySubscriberData = true;
      const subsriberData = result.data;
      this.installedStatus = subsriberData.installedStatus;
      this.instanceName = subsriberData.instanceName;
      this.metadataPackageId = subsriberData.metadataPackageId;
      this.metadataPackageVersionId = subsriberData.metadataPackageVersionId;
      this.orgKey = subsriberData.orgKey;
      this.orgName = subsriberData.orgName;
      this.orgStatus = subsriberData.orgStatus;
      this.orgType = subsriberData.orgType;
      this.packageType = "Managed";
      this.displaySpinner = false;
    } else if (result.error) {
      console.error(result.error);
      this.displaySubscriberData = false;
      this.displaySpinner = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Something went wrong",
          message: result.error,
          variant: "error"
        })
      );
    }
  }

  togglePackageSubscriberAccordion() {
    this.displaySubscriber = !this.displaySubscriber;
    this.packageSubscriberAccordionClass = this.displaySubscriber
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
  }

  get displayLoadingIcon() {
    return this.pushJobDetails.Status === "Created" ||
      this.pushJobDetails.Status === "Pending" ||
      this.pushJobDetails.Status === "InProgress"
      ? true
      : false;
  }

  get displaySuccessIcon() {
    return this.pushJobDetails.Status === "Succeeded" ? true : false;
  }

  get displayWarningIcon() {
    return this.pushJobDetails.Status === "Canceled" ? true : false;
  }

  get displayErrorIcon() {
    return this.pushJobDetails.Status === "Failed" ? true : false;
  }

  get parsedResponse() {
    if (!this.aiResponse) return null;
    try {
      return JSON.parse(this.aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return { summary: this.aiResponse };  // Fallback to raw text
    }
  }

  get severityVariant() {
    if (!this.parsedResponse?.severity) return '';
    const severity = this.parsedResponse.severity.toLowerCase();
    const variantMap = {
      'critical': 'slds-theme_error',
      'high': 'slds-theme_error',
      'medium': 'slds-theme_warning',
      'low': 'slds-theme_success'
    };
    return variantMap[severity] || '';
  }

  handleAiSuggestImprovements() {
    this.displayAiSuggest = true;
  }

  handlePopoverClose() {
    this.displayAiSuggest = false;
  }

  handleAiSuggestionChange(event) {
    this.aiSuggestion = event.target.value;
  }

  handleAiSuggestAssist() {
    this.displayAgentforceSpinner = true;
    this.generateAiResponse(true);
    this.handlePopoverClose();
  }

  getCleanErrorsPayload() {
    const errorRecords = this.pushJobDetails.PackagePushErrors?.records || [];
    return errorRecords.map((error) => ({
      errorTitle: error.ErrorTitle || "",
      errorMessage: error.ErrorMessage || "",
      errorType: error.ErrorType || "",
      errorDetails: error.ErrorDetails || "",
      errorSeverity: error.ErrorSeverity || ""
    }));
  }

  async generateAiResponse(includeUserSuggestion = false) {
    const cleanErrors = this.getCleanErrorsPayload();
    const basePayload = JSON.stringify(cleanErrors);
    const recordId = includeUserSuggestion
      ? `${this.aiSuggestion} ${basePayload}`
      : basePayload;

    try {
      this.aiResponse = await invokeGenAiPromptTemplate({
        className: "AgentGenAiPromptTemplateController",
        methodName: "singleFreeText",
        recordId,
        objectInput: "Package_Push_Errors",
        promptTemplateName: "Package_Push_Error_Debugger"
      });
      this.displayAgentforceSpinner = false;
    } catch (error) {
      this.displayAgentforceSpinner = false;
      console.error("AI analysis failed:", error);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "AI Analysis Failed",
          message: error.body?.message || "Unable to analyze errors",
          variant: "error"
        })
      );
    }
  }

  handleAskAgentforce() {
    this.showAgentforceCard = true;
    this.displayAgentforceSpinner = true;
    this.generateAiResponse(false);
  }
}