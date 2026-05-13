import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import getLmaTimeline from "@salesforce/apexContinuation/PackageVisualizerCtrl.getLmaTimeline";
import modifyLicense from "@salesforce/apexContinuation/PackageVisualizerCtrl.modifyLicense";
import isFmaParameter from "@salesforce/apex/PackageVisualizerCtrl.isFmaParameter";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";

const LICENSE_HEALTH_SYSTEM_PROMPT = `You are a License Health Analyst for Salesforce ISV partners. Given structured license record data as a JSON object, produce an operational intelligence brief that helps the ISV partner assess license health, predict churn risk, and take proactive action.

INPUT: A JSON object containing license record fields (the user prompt). Fields may include: licenseName, accountName, contactName, leadName, leadSource, leadEmail, licenseStatus, licenseType, licensedSeats, usedLicenses, installDate, expirationDate, lastModifiedDate. Some fields may be absent if the data is unavailable.

INSTRUCTIONS:
1. Analyze the license holistically. Consider seat utilization (usedLicenses vs licensedSeats), license status, time since install, proximity to expiration, and whether customer identity fields are populated.
2. If licensedSeats is "Site License" or seats is -1, treat it as an unlimited/site-wide license - do not calculate utilization percentages. Note this in seatUtilization.
3. Derive a healthScore based on multiple signals: seat adoption rate, expiration proximity (< 90 days = urgent), status (Suspended/Uninstalled = critical), recency of modifications, and customer engagement signals (e.g. missing contact/account = less engaged).
4. Provide concrete, actionable recommendations specific to the license data - not generic advice. Reference the actual data points (e.g. "Only 3 of 25 seats active" not "Consider improving adoption").
5. If the license is Uninstalled, focus recommendations on win-back strategies rather than retention.
6. Stay grounded. Use "likely" / "suggests" framing. No marketing fluff.

OUTPUT: Return ONLY a single valid JSON object - no prose, no markdown fences, no preamble. Use this exact schema:

{
  "healthScore": "Healthy | At Risk | Critical",
  "healthRationale": "string - 2-3 sentences explaining why this score was assigned, citing specific data points",
  "seatUtilization": "string - analysis of seat usage (e.g. '12% utilization - only 3 of 25 seats active') or 'Site License - unlimited seats' if applicable",
  "expirationOutlook": "string - time-to-expiration analysis with urgency level, or 'No expiration set - perpetual license' if not set",
  "churnRiskFactors": ["array of 2-4 specific risk signals derived from the license data, e.g. 'Low seat adoption at 12%', 'License expires in 45 days with no recent activity'"],
  "recommendedActions": ["array of 3-5 concrete next steps tailored to this license, e.g. 'Schedule adoption review with Jane Doe (contact)', 'Send renewal proposal 60 days before 2025-01-15 expiration'"],
  "engagementSuggestions": ["array of 2-3 engagement ideas, e.g. 'Offer personalized training webinar to boost seat activation', 'Share latest release notes highlighting features relevant to their usage pattern'"],
  "customerProfile": "string - brief contextual note on the customer if account name is recognizable, or 'Customer context unavailable' if not identifiable"
}

Hard rules:
- Output JSON only. No code fences. No commentary outside the JSON.
- Never invent data not present in the input. If a field is missing, say so explicitly rather than guessing.
- Keep each string field under 400 characters.
- churnRiskFactors should be empty array [] only if the license is genuinely healthy with no identifiable risks.`;

export default class PackageLmaTimeline extends NavigationMixin(LightningElement) {
  @api license;

  licenseId;
  viewMoreLink;

  licenseTimelineData;
  displaySpinner = true;
  selectedItem = `activity_timeline`;
  timelineDisplay;
  modifyLicenseDisplay;
  featureParametersDisplay;
  displayModifyLicenseNav;
  displayGenAiNav;
  campaignDisplay;
  displayEditView;

  showAgentforceCard = false;
  displayAgentforceSpinner = false;
  aiResponse;
  displayExtensionIllustration = false;
  currentPkgVersionId = '04tRh000001bMYrIAM';
  modelsValue = 'sfdc_ai__DefaultBedrockAnthropicClaude46Sonnet';

  expirationToggle;
  seatsToggle;
  modifyExpirationDate;
  modifySeats;
  modifyStatusValue;

  editorValue;

  templatePrompts = [
    {
      label: "Create an email template...",
      icon: "utility:email"
    },
    {
      label: "Help me write...",
      icon: "utility:edit_gpt"
    },
    {
      label: "How do I...",
      icon: "utility:ai_search"
    }
  ];

  @wire(isFmaParameter)
  fma({ data, error }) {
    if (data) {
      if (data === true) {
        this.displayFMA = true;
      } else {
        this.displayFMA = false;
      }
    } else if (error) {
      this.displayFMA = undefined;
      console.error(error);
    }
  }

  connectedCallback() {
    this.licenseId = /[^/]*$/.exec(this.license.id)[0];
    this.displayModifyLicenseNav =
      this.license.licenseStatus === "Uninstalled" ? false : true;
    this.getOriginalValues();
    this.getTimeline();
  }

  get nowDate() {
    return new Date().toISOString();
  }

  get statusOptions() {
    return [
      { label: "Active", value: "Active" },
      { label: "Suspended", value: "Suspended" }
    ];
  }

  get isSiteLicense() {
    return this.license.licensedSeats === "Site License" ? true : false;
  }

  handleStatusChange(event) {
    this.modifyStatusValue = event.detail.value;
  }

  handleHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.workbook_lma.meta/workbook_lma/lma_edit_license.htm`
      }
    });
  }

  getTimeline() {
    this.displaySpinner = true;
    (async () => {
      await getLmaTimeline({
        licenseId: this.licenseId
      })
        .then(result => {
          this.displaySpinner = false;
          this.timelineDisplay = true;
          this.licenseTimelineData = result;
          this.viewMoreLink = `/lightning/r/${this.licenseId}/related/Histories/view`;
        })
        .catch(error => {
          console.error(error);
          this.displaySpinner = false;
          this.timelineDisplay = false;
          this.licenseTimelineData = undefined;
        });
    })();
  }

  handleActivityTimelineClick() {
    this.selectedItem = `activity_timeline`;
    this.timelineDisplay = true;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = false;
    this.campaignDisplay = false;
    this.displayGenAiNav = false;
    this.displayGenAiSummary = false;
    this.getTimeline();
  }

  handleModifyLicenseClick() {
    this.selectedItem = `modify_license`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = true;
    this.featureParametersDisplay = false;
    this.campaignDisplay = false;
    this.displayGenAiNav = false;
    this.displayGenAiSummary = false;
  }

  handleGenerativeAi(){
    this.selectedItem = `generative_ai`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = false;
    this.campaignDisplay = false;
    this.displayGenAiNav = true;
    this.displayGenAiSummary = false;
  }

  handleAiSummary(){
    this.selectedItem = `summary_ai`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = false;
    this.campaignDisplay = false;
    this.displayGenAiNav = false;
    this.displayGenAiSummary = true;
  }

  handleFeatureParameters() {
    this.selectedItem = `feature_parameters`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = true;
    this.campaignDisplay = false;
    this.displayGenAiNav = false;
    this.displayGenAiSummary = false;
  }

  handleCampaignHistory() {
    this.selectedItem = `campaign_history`;
    this.timelineDisplay = false;
    this.modifyLicenseDisplay = false;
    this.featureParametersDisplay = false;
    this.campaignDisplay = true;
    this.displayGenAiSummary = false;
  }

  handleEdit() {
    this.displayEditView = true;
    this.getOriginalValues();
  }

  handleModifyLicenseCancel() {
    this.displayEditView = false;
    this.getOriginalValues();
  }

  getOriginalValues() {
    this.expirationToggle = this.license.lmaExpirationDate ? false : true;
    this.seatsToggle =
      this.license.licensedSeats === "Site License" ? true : false;
    this.modifySeats = this.license.seats === -1 ? "" : this.license.seats;
    this.modifyExpirationDate = this.license.lmaExpirationDate;
  }

  handleExpirationToggle(event) {
    if (this.template.querySelector(".expirationDate").checkValidity()) {
      this.expirationToggle = event.target.checked;
      if (this.expirationToggle) {
        this.modifyExpirationDate = undefined;
        this.template.querySelector(".expirationDate").setCustomValidity("");
        this.template.querySelector(".expirationDate").reportValidity();
      }
    }
  }

  handleSeatsToggle(event) {
    if (this.template.querySelector(".seats").checkValidity()) {
      this.seatsToggle = event.target.checked;
      if (this.seatsToggle) {
        this.modifySeats = "";
        this.template.querySelector(".seats").setCustomValidity("");
        this.template.querySelector(".seats").reportValidity();
      }
    }
  }

  handleSeatsChange(event) {
    this.modifySeats = event.detail.value;
  }

  handleExpirationChange(event) {
    this.modifyExpirationDate = event.detail.value;
  }

  handleModifyLicenseSave() {
    const expirationInput = this.template.querySelector(".expirationDate");
    const seatsInput = this.template.querySelector(".seats");

    if (expirationInput.checkValidity() && seatsInput.checkValidity()) {
      this.displaySpinner = true;
      (async () => {
        await modifyLicense({
          licenseId: this.licenseId,
          expirationDate: expirationInput.value,
          seats: seatsInput.value,
          status: this.modifyStatusValue
        })
          .then(result => {
            this.displaySpinner = false;
            if (result === this.licenseId) {
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Success",
                  message: `${this.license.name} has been successfully modified`,
                  variant: "success"
                })
              );
            }
            this.displayEditView = false;
            this.dispatchEvent(new CustomEvent("refresh"));
          })
          .catch(error => {
            console.error(error);
            this.displaySpinner = false;
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Something went wrong",
                message: error,
                variant: "error"
              })
            );
          });
      })();
    }
  }
  
  handleEditorChange(event) {
    this.editorValue = event.detail.value;
  }

  handleSendEmailClick() {
    let _licencseId = this.extractIdFromUrl(this.license.id);
    let _sendToId;
    let _relatedToId;

    if (this.license.leadId) {
      _sendToId = this.extractIdFromUrl(this.license.leadId);
    }else if (this.license.contactId) {
      _sendToId = this.extractIdFromUrl(this.license.contactId);
      _relatedToId = _sendToId;
    } else {
      _sendToId = null;
    }
    var pageRef = {
      type: "standard__quickAction",
      attributes: {
        apiName: "Global.SendEmail"
      },
      state: {
        recordId: _sendToId,
        defaultFieldValues:
          encodeDefaultFieldValues({
            RelatedToId: _relatedToId
          })
      }
    };
    this[NavigationMixin.Navigate](pageRef);
  }

  handleAskAgentforce() {
    this.showAgentforceCard = true;
    this.displayAgentforceSpinner = true;
    this.displayExtensionIllustration = false;
    this.aiResponse = undefined;
    this.generateLicenseInsight();
  }

  buildLicenseUserPrompt() {
    const prompt = {};
    const l = this.license;
    if (l.name) prompt.licenseName = l.name;
    if (l.accountName) prompt.accountName = l.accountName;
    if (l.contactName) prompt.contactName = l.contactName;
    if (l.leadName) prompt.leadName = l.leadName;
    if (l.leadSource) prompt.leadSource = l.leadSource;
    if (l.leadEmail) prompt.leadEmail = l.leadEmail;
    if (l.licenseStatus) prompt.licenseStatus = l.licenseStatus;
    if (l.licenseType) prompt.licenseType = l.licenseType;
    if (l.licensedSeats != null) prompt.licensedSeats = String(l.licensedSeats);
    if (l.usedLicenses != null) prompt.usedLicenses = String(l.usedLicenses);
    if (l.installDate) prompt.installDate = l.installDate;
    if (l.lmaExpirationDate) prompt.expirationDate = l.lmaExpirationDate;
    if (l.lastModifiedDate) prompt.lastModifiedDate = l.lastModifiedDate;
    return JSON.stringify(prompt);
  }

  async generateLicenseInsight() {
    try {
      this.aiResponse = await invokePromptAndUserModelsGenAi({
        className: "AgentGenAiController",
        methodName: "createChatGeneration",
        modelName: this.modelsValue,
        userPrompt: this.buildLicenseUserPrompt(),
        systemPrompt: LICENSE_HEALTH_SYSTEM_PROMPT
      });
      this.displayAgentforceSpinner = false;
    } catch (error) {
      console.error("License insight generation failed:", error);
      this.displayAgentforceSpinner = false;
      this.displayExtensionIllustration = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: error.statusText || "Agentforce Generation Failed",
          message: error.body?.message || "Unable to generate license insight",
          variant: "error"
        })
      );
    }
  }

  get parsedResponse() {
    if (!this.aiResponse) return null;
    try {
      const cleaned = this.aiResponse.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      parsed.healthScoreClass = this.getHealthScoreClass(parsed.healthScore);
      const isMeaningfulString = (v) =>
        typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'unknown';
      const isMeaningfulArray = (v) => Array.isArray(v) && v.length > 0;
      ['healthRationale', 'seatUtilization', 'expirationOutlook', 'customerProfile']
        .forEach((k) => { if (!isMeaningfulString(parsed[k])) parsed[k] = null; });
      ['churnRiskFactors', 'recommendedActions', 'engagementSuggestions']
        .forEach((k) => { if (!isMeaningfulArray(parsed[k])) parsed[k] = null; });
      return parsed;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return { healthRationale: this.aiResponse };
    }
  }

  getHealthScoreClass(healthScore) {
    switch ((healthScore || '').toLowerCase()) {
      case 'healthy':
        return 'slds-theme_success';
      case 'at risk':
        return 'slds-theme_warning';
      case 'critical':
        return 'slds-theme_error';
      default:
        return '';
    }
  }

  handleExtensionInstall() {
    window.open(`/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`, '_blank');
  }

  extractIdFromUrl(url) {
    const regex = /\/([a-zA-Z0-9]{18})$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}