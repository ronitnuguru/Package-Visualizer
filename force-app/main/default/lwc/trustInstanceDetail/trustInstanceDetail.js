import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";

const TRUST_INSTANCE_SYSTEM_PROMPT = `You are a Salesforce Trust analyst writing a quick-read briefing for a Salesforce ISV partner.

Severity rubric:
- "OK" — status OK, no incidents/maintenances/messages.
- "Informational" — only general messages.
- "Maintenance" — active or imminent maintenance, no incident.
- "Minor" — any minor incident.
- "Major" — any major incident (core > noncore).

Rules:
- Ground every statement in the input. Never invent. Omit empty arrays.
- summary: ONE sentence. Plain English. What is happening right now.
- actionItems: up to 3 short bullets, each <= 12 words. Concrete next steps for the partner.
- incidents/maintenances: include only if non-empty.
- generalMessages: include all. For each, write a briefSummary (1 sentence, max 20 words). Extract the first URL from the body as link (null if none).
- If everything is empty: severity "OK", summary = "Instance is healthy.", actionItems = ["No action needed."].

Return ONLY this JSON, no prose, no fences:
{"severity":"OK|Informational|Maintenance|Minor|Major","summary":"one sentence","actionItems":["..."],"incidents":[{"title":"","endUserImpact":""}],"maintenances":[{"title":"","plannedEndTime":""}],"generalMessages":[{"subject":"","briefSummary":"","link":"url or null"}]}`;

function trimTrustPayload(raw) {
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((node) => ({
    key: node?.key,
    status: node?.status,
    releaseVersion: node?.releaseVersion,
    Incidents: (node?.Incidents || []).map((i) => ({
      id: i.id,
      message: i.message,
      affectsAll: i.affectsAll,
      isCore: i.isCore,
      IncidentImpacts: (i.IncidentImpacts || []).slice(-1).map((x) => ({
        startTime: x.startTime,
        endTime: x.endTime,
        endUserImpact: x.endUserImpact,
        type: x.type
      }))
    })),
    Maintenances: (node?.Maintenances || []).map((m) => ({
      id: m.id,
      name: m.name,
      message: m.message,
      affectsAll: m.affectsAll,
      isCore: m.isCore,
      plannedStartTime: m.plannedStartTime,
      plannedEndTime: m.plannedEndTime,
      MaintenanceImpacts: (m.MaintenanceImpacts || []).slice(-1).map((x) => ({
        systemAvailability: x.systemAvailability,
        type: x.type
      }))
    })),
    GeneralMessages: (node?.GeneralMessages || []).map((g) => ({
      subject: g.subject,
      body: g.body
    }))
  }));
}

export default class TrustInstanceDetail extends NavigationMixin(
  LightningElement
) {
  @api instanceKey;
  @api location;
  @api maintenanceWindow;
  @api releaseNumber;
  @api releaseVersion;
  @api status;

  sldsIcon;
  sldsIconVariant;
  statusTitle;
  trustUrl;

  displayAnalysis = false;
  displaySpinner = false;
  displayExtensionIllustration = false;
  response;

  modelsValue = "sfdc_ai__DefaultBedrockAnthropicClaude45Haiku";
  currentPkgVersionId = "04tRh000001bOxFIAU";

  connectedCallback() {
    this.trustUrl = `https://status.salesforce.com/instances/${this.instanceKey}`;
    if (this.status === "OK") {
      this.sldsIcon = "utility:success";
      this.sldsIconVariant = "success";
      this.statusTitle = "Available";
    } else if (
      this.status === "MAJOR_INCIDENT_CORE" ||
      this.status === "MAJOR_INCIDENT_NONCORE"
    ) {
      this.sldsIcon = "utility:error";
      this.sldsIconVariant = "error";
      this.statusTitle = "Service Disruption";
    } else if (
      this.status === "MINOR_INCIDENT_CORE" ||
      this.status === "MINOR_INCIDENT_NONCORE"
    ) {
      this.sldsIcon = "utility:warning";
      this.sldsIconVariant = "warning";
      this.statusTitle = "Performance Degradation";
    } else if (
      this.status === "MAINTENANCE_CORE" ||
      this.status === "MAINTENANCE_NONCORE"
    ) {
      this.sldsIcon = "utility:custom_apps";
      this.sldsIconVariant = "warning";
      this.statusTitle = "Maintenance";
    }
  }

  get region() {
    switch (this.location) {
      case "NA":
        return "Americas";
      case "EMEA":
        return "EMEA";
      case "APAC":
        return "Asia Pacific";
      default:
        return "";
    }
  }

  get analysisButtonTooltip() {
    return this.displayAnalysis ? "Hide AI Summary" : "Generate AI Summary";
  }

  get parsedResponse() {
    if (!this.response) return null;
    try {
      const cleaned = this.response.replace(/```json\s*|\s*```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      parsed.severityVariant = this.getSeverityVariant(parsed.severity);
      if (Array.isArray(parsed.actionItems)) {
        parsed.actionItems = parsed.actionItems.map((text, idx) => ({
          key: `action-${idx}`,
          text
        }));
      }
      if (Array.isArray(parsed.incidents)) {
        parsed.incidents = parsed.incidents.map((item, idx) => ({
          ...item,
          key: `incident-${idx}`,
          link: item.id
            ? `https://status.salesforce.com/incidents/${item.id}`
            : null,
          hasLink: !!item.id
        }));
      }
      if (Array.isArray(parsed.maintenances)) {
        parsed.maintenances = parsed.maintenances.map((item, idx) => ({
          ...item,
          key: `maintenance-${idx}`,
          link: item.id
            ? `https://status.salesforce.com/maintenances/${item.id}`
            : null,
          hasLink: !!item.id
        }));
      }
      if (Array.isArray(parsed.generalMessages)) {
        parsed.generalMessages = parsed.generalMessages.map((item, idx) => ({
          ...item,
          key: `message-${idx}`,
          hasLink: !!item.link
        }));
      }
      parsed.hasActionItems = (parsed.actionItems || []).length > 0;
      parsed.hasIncidents = (parsed.incidents || []).length > 0;
      parsed.hasMaintenances = (parsed.maintenances || []).length > 0;
      parsed.hasGeneralMessages = (parsed.generalMessages || []).length > 0;
      parsed.hasAnyDetail =
        parsed.hasIncidents ||
        parsed.hasMaintenances ||
        parsed.hasGeneralMessages;
      return parsed;
    } catch (e) {
      console.error("Failed to parse Trust analyst response:", e);
      return { rawResponse: this.response };
    }
  }

  get isRawFallback() {
    return (
      this.parsedResponse &&
      this.parsedResponse.rawResponse &&
      !this.parsedResponse.severity
    );
  }

  getSeverityVariant(severity) {
    switch ((severity || "").toLowerCase()) {
      case "ok":
        return "success";
      case "major":
        return "error";
      case "minor":
      case "maintenance":
        return "warning";
      default:
        return "inverse";
    }
  }

  async handleAgentforceDetails() {
    if (this.displayAnalysis) {
      this.displayAnalysis = false;
      return;
    }
    if (this.response) {
      this.displayAnalysis = true;
      return;
    }
    this.displayAnalysis = true;
    this.displaySpinner = true;
    this.displayExtensionIllustration = false;

    let trustJson;
    try {
      const trustEndPoint = `https://api.status.salesforce.com/v1/instances/${this.instanceKey}/status/preview?childProducts=false`;
      const res = await fetch(trustEndPoint);
      trustJson = await res.json();
    } catch (err) {
      this.displaySpinner = false;
      this.displayAnalysis = false;
      console.error(err);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Trust API Error",
          message: "Unable to reach Trust API",
          variant: "error"
        })
      );
      return;
    }

    const trimmed = trimTrustPayload(trustJson);

    await invokePromptAndUserModelsGenAi({
      className: "AgentGenAiController",
      methodName: "createChatGeneration",
      modelName: this.modelsValue,
      userPrompt: JSON.stringify(trimmed),
      systemPrompt: TRUST_INSTANCE_SYSTEM_PROMPT
    })
      .then((result) => {
        this.response = result;
      })
      .catch((error) => {
        console.error("Trust AI summary failed:", error);
        this.displayExtensionIllustration = true;
        this.dispatchEvent(
          new ShowToastEvent({
            title: error.statusText || "AI Summary Failed",
            message:
              error.body?.message ||
              "Unable to generate Trust analysis. Install the Agentforce extension package to enable AI summaries.",
            variant: "error"
          })
        );
      })
      .finally(() => {
        this.displaySpinner = false;
      });
  }

  handleExtensionInstall() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`
      }
    });
  }

  handleAdvisoryLink(event) {
    const url = event.currentTarget.dataset.url;
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: { url }
    });
  }

  handleInstanceHistory() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `${this.trustUrl}/history`
      }
    });
  }

  handleInstanceMaintenancePlan() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `${this.trustUrl}/maintenances`
      }
    });
  }

  handleReleaseNotes() {
    let releaseNotesVersion = this.releaseNumber
      ? this.releaseNumber.split(".")[0]
      : "";
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://help.salesforce.com/s/articleView?id=release-notes.salesforce_release_notes.htm&release=${releaseNotesVersion}`
      }
    });
  }
}
