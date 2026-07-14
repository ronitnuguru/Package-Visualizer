import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import isLMA from "@salesforce/apex/PackageVisualizerCtrl.isLMA";
import { NavigationMixin } from "lightning/navigation";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import getPackageVersionLicenses from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackageVersionLicenses";
import get2GPPackageVersionList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageVersionList";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";
import PushUpgradeInstructionsModal from "c/pushUpgradeInstructionsModal";

const SUBSCRIBER_INSIGHT_SYSTEM_PROMPT = `You are an enterprise customer intelligence analyst helping Salesforce ISV partners understand their subscriber organizations. Given ONLY a company name, produce a concise, factual research brief that helps an ISV partner understand who this customer is and how they likely use Salesforce.

INPUT: A single company / organization name (the user prompt).

INSTRUCTIONS:
1. Identify the company. If the name is ambiguous (e.g. matches multiple real entities), pick the most prominent enterprise match and note the assumption in "companyOverview".
2. If the company is genuinely unknown or you cannot find reliable signal, set "confidence" to "Low" and keep all fields short and clearly hedged - never fabricate specifics like revenue, employee counts, or named executives.
3. Reason about WHY a company of this profile (industry, size, geography, business model) would adopt Salesforce, and which Salesforce clouds / products are the strongest fit.
4. Surface the use cases that matter most to a Salesforce ISV partner - what business problems would this customer be trying to solve on the platform.
5. Stay grounded. Prefer "likely" / "typically" framing over false precision. No marketing fluff.
6. If the input does NOT look like a real company name - e.g. it contains characters like "#" or "@", contains tokens like "unpackaged" / "sfdc" / ".apps.", looks like a Salesforce org or metadata identifier, is all digits, or is otherwise clearly an internal system string - DO NOT refuse, DO NOT ask the user for clarification, and DO NOT emit prose. Return the same JSON schema with: companyName set to the input verbatim, confidence "Low", industry / headquarters / companySize set to "Unknown", companyOverview set to a single sentence like "This appears to be an internal Salesforce identifier rather than a customer-facing company name, so no research could be performed.", marketPosition / whySalesforce set to "Unknown", and likelySalesforceClouds / idealUseCases / isvOpportunities set to empty arrays.

OUTPUT: Return ONLY a single valid JSON object - no prose, no markdown fences, no preamble. Use this exact schema:

{
  "companyName": "string - canonical company name",
  "confidence": "High | Medium | Low",
  "industry": "string - primary industry vertical",
  "headquarters": "string - city, country (or 'Unknown')",
  "companySize": "string - e.g. 'Enterprise (10,000+ employees)' or 'Unknown'",
  "companyOverview": "string - 2-3 sentence factual summary of what the company does and its market position",
  "marketPosition": "string - 1-2 sentences on competitive standing, differentiation, or notable strategic moves",
  "whySalesforce": "string - 2-3 sentences explaining the most likely strategic drivers for adopting Salesforce given this company's profile",
  "likelySalesforceClouds": ["array of strings - e.g. 'Sales Cloud', 'Service Cloud', 'Data360', 'Marketing Cloud', 'Agentforce'"],
  "idealUseCases": ["array of 3-5 concise use-case strings tailored to this company's industry and scale"],
  "isvOpportunities": ["array of 2-4 concise strings - angles an ISV partner could pursue (e.g. integrations, vertical extensions, data enrichment) given this customer's profile"]
}

Hard rules:
- Output JSON only. No code fences. No commentary outside the JSON.
- Never invent precise numbers (revenue, headcount, ARR) you are not confident about - say "Unknown" or use a qualitative band.
- Keep each string field under 400 characters.`;

export default class PackageSubscriberDetail extends NavigationMixin(
  LightningElement
) {
  @api installedStatus;
  @api instanceName;
  @api metadataPackageId;
  @api metadataPackageVersionId;
  @api orgKey;
  @api orgName;
  @api orgStatus;
  @api orgType;
  @api packageType;
  @api parentOrg;
  @api customUpgradeType;
  @api hasRestrictionEnabled;
  @api isCustomUpgradeAllowed;
  subscribers;

  displayLMA;
  displaySubLicense = false;
  licenseAccordionClass = `slds-section slds-var-p-top_medium`;

  displayPushUpgradeSection;
  displayPushUpgradeList = false;
  upgradeAccordionClass = `slds-section slds-var-p-top_medium`;

  displaySandboxes = false;
  sandboxAccordionClass = `slds-section slds-var-p-top_medium`;

  trustUrl;
  license;
  displayEmptyLMA;
  displaySpinner;
  displayUpgradeSpinner;
  pushUpgradeBreadCrumbLabel;
  packageVersionNumber;
  subscriberPackageId;

  instance;
  displayInstance;
  displayInstanceSpinner;
  displayAppAnalyticsModal = false;
  showAgentforceCard = false;
  displayAgentforceSpinner = false;
  aiResponse;
  displayExtensionIllustration = false;
  currentPkgVersionId = "04tRh000001bOxFIAU";
  modelsValue = "sfdc_ai__DefaultBedrockAnthropicClaude46Sonnet";

  get managedPackageType() {
    return this.packageType === "Managed" ? true : false;
  }

  get isActiveProductionOrg() {
    return this.orgType === "Production" && this.orgStatus === "Active"
      ? true
      : false;
  }

  get customUpgradeTypeLabel() {
    if (!this.customUpgradeType || this.customUpgradeType === "None")
      return null;
    return this.customUpgradeType.replace(/([A-Z])/g, " $1").trim();
  }

  get displayHasRestrictionEnabled() {
    return (
      this.hasRestrictionEnabled !== undefined &&
      this.hasRestrictionEnabled !== null
    );
  }

  get displayIsCustomUpgradeAllowed() {
    return (
      this.isCustomUpgradeAllowed !== undefined &&
      this.isCustomUpgradeAllowed !== null
    );
  }

  connectedCallback() {
    this.trustUrl = `https://status.salesforce.com/instances/${this.instanceName}`;
    if (hasPackageVisualizerPushUpgrade) {
      this.loadInstanceFromTrust()
        .then((result) => {
          if (result.message === "Instance not found") {
            this.instance = undefined;
          } else {
            this.instance = result;
          }
        })
        .catch(() => {
          this.instance = undefined;
        });
    }
    this.subscribers = [
      {
        orgKey: this.orgKey,
        orgName: this.orgName
      }
    ];
  }

  async loadInstanceFromTrust() {
    this.displayInstanceSpinner = true;
    let instances;
    let trustEndPoint = `https://api.status.salesforce.com/v1/instances/${this.instanceName}/status/preview?childProducts=false`;
    try {
      const response = await fetch(trustEndPoint);
      instances = await response.json();
      this.displayInstance = true;
      return instances;
    } catch (err) {
      this.displayInstanceSpinner = false;
      this.displayInstance = false;
      console.error(err);
      return undefined;
    }
  }

  get isPushUpgradeEnabled() {
    return hasPackageVisualizerPushUpgrade;
  }

  @wire(isLMA)
  lma({ data, error }) {
    if (data) {
      if (this.packageType === "Managed" && data === true) {
        this.displayLMA = true;
      } else {
        this.displayLMA = false;
      }
    } else if (error) {
      this.displayLMA = undefined;
      console.error(error);
    }
  }

  toggleLicenseAccordion() {
    this.displaySubLicense = !this.displaySubLicense;
    this.licenseAccordionClass = this.displaySubLicense
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
    if (this.displaySubLicense) {
      this.loadLicense();
    }
  }

  toggleSandboxAccordion() {
    this.displaySandboxes = !this.displaySandboxes;
    this.sandboxAccordionClass = this.displaySandboxes
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
  }

  togglePushUpgradeAccordion() {
    this.displayPushUpgradeList = !this.displayPushUpgradeList;
    this.upgradeAccordionClass = this.displayPushUpgradeList
      ? `slds-section slds-var-p-top_medium slds-is-open`
      : `slds-section slds-var-p-top_medium`;
    this.getPackageVersionDetails(this.metadataPackageVersionId);
  }

  getPackageVersionDetails(metadataPackageVersionId) {
    this.displayUpgradeSpinner = true;
    let wrapper = [
      {
        fieldName: "SubscriberPackageVersionId",
        value: metadataPackageVersionId,
        dataType: "STRING"
      }
    ];
    (async () => {
      await get2GPPackageVersionList({
        filterWrapper: wrapper,
        minMajorVersion: null,
        maxMajorVersion: null,
        minMinorVersion: null,
        maxMinorVersion: null,
        sortedBy: null,
        sortDirection: null,
        versionLimit: 1,
        versionOffset: 0
      })
        .then((result) => {
          this.displayUpgradeSpinner = false;
          this.displayPushUpgradeSection = true;
          const pkgVersion = result[0];
          this.pushUpgradeBreadCrumbLabel = `Released versions higher than ${pkgVersion.versionNumber}`;
          this.packageVersionNumber = pkgVersion.versionNumber;
          this.subscriberPackageId = pkgVersion.subscriberPackageVersionId;
        })
        .catch((error) => {
          console.error(error);
          this.displayUpgradeSpinner = false;
          // Toast for Failure
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

  loadLicense() {
    this.displaySpinner = true;
    let wrapper;
    wrapper = [
      {
        fieldName: "sfLma__Subscriber_Org_ID__c",
        value: this.orgKey,
        dataType: "STRING"
      },
      {
        fieldName: "sfLma__Package_Version__r.sfLma__Version_ID__c",
        value: this.metadataPackageVersionId,
        dataType: "STRING"
      }
    ];
    (async () => {
      await getPackageVersionLicenses({
        filterWrapper: wrapper,
        sortedBy: "Name",
        sortDirection: "DESC",
        lmaLicensesLimit: "1",
        lmaLicensesOffset: "0"
      })
        .then((result) => {
          this.license = result[0];
          this.displaySpinner = false;
          this.displayEmptyLMA = result.length === 0 ? true : false;
        })
        .catch((error) => {
          this.displayEmptyLMA = true;
          console.error(error);
          this.displaySpinner = false;
        });
    })();
  }

  handleTrust() {
    window.open(this.trustUrl, "_blank");
  }

  handleRefresh() {
    this.loadLicense();
  }

  handleAppAnalyticsSubscribers() {
    this.displayAppAnalyticsModal = true;
  }

  handleAskAgentforce() {
    this.showAgentforceCard = true;
    this.displayAgentforceSpinner = true;
    this.displayExtensionIllustration = false;
    this.aiResponse = undefined;
    this.generateSubscriberInsight();
  }

  async generateSubscriberInsight() {
    try {
      this.aiResponse = await invokePromptAndUserModelsGenAi({
        className: "AgentGenAiController",
        methodName: "createChatGeneration",
        modelName: this.modelsValue,
        userPrompt: this.orgName,
        systemPrompt: SUBSCRIBER_INSIGHT_SYSTEM_PROMPT
      });
      this.displayAgentforceSpinner = false;
    } catch (error) {
      console.error("Subscriber insight generation failed:", error);
      this.displayAgentforceSpinner = false;
      this.displayExtensionIllustration = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: error.statusText || "Agentforce Generation Failed",
          message:
            error.body?.message || "Unable to generate subscriber insight",
          variant: "error"
        })
      );
    }
  }

  get parsedResponse() {
    if (!this.aiResponse) return null;
    try {
      const cleaned = this.aiResponse.replace(/```json\s*|\s*```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      parsed.confidenceClass = this.getConfidenceClass(parsed.confidence);
      const isMeaningfulString = (v) =>
        typeof v === "string" &&
        v.trim() &&
        v.trim().toLowerCase() !== "unknown";
      const isMeaningfulArray = (v) => Array.isArray(v) && v.length > 0;
      [
        "industry",
        "headquarters",
        "companySize",
        "marketPosition",
        "whySalesforce",
        "companyOverview"
      ].forEach((k) => {
        if (!isMeaningfulString(parsed[k])) parsed[k] = null;
      });
      ["likelySalesforceClouds", "idealUseCases", "isvOpportunities"].forEach(
        (k) => {
          if (!isMeaningfulArray(parsed[k])) parsed[k] = null;
        }
      );
      return parsed;
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return { companyOverview: this.aiResponse };
    }
  }

  getConfidenceClass(confidence) {
    switch ((confidence || "").toLowerCase()) {
      case "high":
        return "slds-theme_success";
      case "medium":
        return "slds-theme_warning";
      case "low":
        return "slds-theme_error";
      default:
        return "";
    }
  }

  handleExtensionInstall() {
    window.open(
      `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`,
      "_blank"
    );
  }

  handleBlockPushUpgrade() {
    PushUpgradeInstructionsModal.open({
      size: "medium",
      label: "Block Push Upgrade",
      description: "Block Push Upgrade - Anonymous Apex instructions",
      packageId: this.metadataPackageId,
      subscriberOrgId: this.orgKey,
      orgName: this.orgName
    });
  }

  handleAppAnalyticsCloseModal() {
    this.displayAppAnalyticsModal = false;
  }

  handleLogIntoSubscriberConsole() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `/partnerbt/lmo/subOrgLogin.apexp?directLoginOrgId=${this.orgKey}`
      }
    });
  }

  navigateToHelpLma() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.workbook_lma.meta/workbook_lma/lma_associate_package.htm`
      }
    });
  }
}
