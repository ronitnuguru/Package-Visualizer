import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getPackage2VersionCreateRequestList from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestList";
import getPackage2VersionCreateRequestErrorList from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestErrorList";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";

const PACKAGE_VERSION_CREATE_ERROR_SYSTEM_PROMPT = `You are a Salesforce 2GP Package Version Build Debugger for ISV partners. Analyze structured Package2VersionCreateRequest data from a failed managed-package version creation and produce a concise troubleshooting brief for a release engineer.

Input: A JSON object containing createRequestContext (request id, status, package version id, branch, tag, language, and the build options that were selected) and errors (the validation/build error messages the request returned).

Rules:
- Ground every statement in the provided input. Do not invent package metadata, org details, Salesforce limits, or hidden logs.
- Package version creation fails for reasons like dependency resolution problems, code coverage below 75% (when SkipValidation is false), metadata that won't compile or deploy, feature/setting mismatches, and Apex test failures. Use the build options in the context to reason about likely causes (e.g. SkipValidation true means coverage was not enforced).
- Prioritize the single most likely actionable root cause from the error messages.
- If evidence is insufficient, say what is unknown and recommend the next diagnostic step.
- Keep the response short enough to scan in a Lightning card.

Return ONLY a single valid JSON object with this exact schema. Do not include markdown fences or prose outside the JSON:
{
  "severity": "Critical | High | Medium | Low",
  "estimatedResolutionTime": "string",
  "summary": "string - 1 to 2 sentences",
  "rootCause": "string - 1 to 2 sentences",
  "debuggingSteps": ["array of 3 to 5 concrete steps"],
  "preventativeMeasures": ["array of 2 to 4 concrete prevention steps"]
}`;

// The sequential build phases a create request moves through, in order. The
// value must match the Package2VersionCreateRequest Status picklist verbatim
// (no spaces) so the raw status drives the progress indicator's current-step;
// the label is the human-readable text shown on the step.
const BUILD_PHASES = [
  { value: "Queued", label: "Queued" },
  { value: "Initializing", label: "Initializing" },
  {
    value: "VerifyingFeaturesAndSettings",
    label: "Verifying Features And Settings"
  },
  { value: "VerifyingDependencies", label: "Verifying Dependencies" },
  { value: "VerifyingMetadata", label: "Verifying Metadata" },
  { value: "PerformingValidations", label: "Performing Validations" },
  { value: "FinalizingPackageVersion", label: "Finalizing Package Version" }
];

// Value of the terminal step shown after the build phases. Kept constant so
// current-step matching works; its label reflects the outcome (see below).
const TERMINAL_STEP_VALUE = "Completed";

// Status values that represent an in-flight (not yet terminal) build job.
const IN_PROGRESS_VALUES = new Set(BUILD_PHASES.map((phase) => phase.value));

export default class PackageVersionCreateRequestDetail extends LightningElement {
  @api requestId;
  @api branch;
  @api tag;
  @api language;
  @api asyncValidation;
  @api calculateCodeCoverage;
  @api calcTransitiveDependencies;
  @api skipValidation;
  @api isDevUsePkgZipRequested;
  @api isPasswordProtected;
  @api isConversionRequest;
  @api createdByName;
  @api createdDate;

  // Mutable fields — parent seeds them, and Refresh re-fetches and overwrites
  // them so live status changes are reflected without leaving the detail view.
  _status;
  _package2VersionId;
  _dependencyGraphJson;

  @api
  get status() {
    return this._status;
  }
  set status(value) {
    this._status = value;
  }

  @api
  get package2VersionId() {
    return this._package2VersionId;
  }
  set package2VersionId(value) {
    this._package2VersionId = value;
  }

  @api
  get dependencyGraphJson() {
    return this._dependencyGraphJson;
  }
  set dependencyGraphJson(value) {
    this._dependencyGraphJson = value;
  }

  displaySpinner;
  errorMessages = [];

  // Agentforce analysis state (Models API via invokePromptAndUserModelsGenAi).
  modelsValue = "sfdc_ai__DefaultBedrockAnthropicClaude45Haiku";
  aiResponse;
  showAgentforceCard = false;
  displayAgentforceSpinner = false;
  // The Agentforce dependent extension package (offered when analysis fails).
  agentforceExtensionPackageVersionId = "04tRh000001bOxFIAU";

  connectedCallback() {
    if (this._status === "Error") {
      this.loadErrors();
    }
  }

  // Ordered steps for the progress indicator: the build phases plus a terminal
  // step whose label is the outcome (Success/Error) once the job finishes, or
  // "Completed" while it's still running.
  get progressSteps() {
    const terminalLabel = IN_PROGRESS_VALUES.has(this._status)
      ? "Completed"
      : this._status;
    return [
      ...BUILD_PHASES,
      { value: TERMINAL_STEP_VALUE, label: terminalLabel }
    ];
  }

  // The step the indicator marks as current. In-flight statuses map to their
  // own phase; the terminal Success/Error statuses map to the terminal step.
  get currentStep() {
    return IN_PROGRESS_VALUES.has(this._status)
      ? this._status
      : TERMINAL_STEP_VALUE;
  }

  // The progress indicator renders the error icon on the current step.
  get hasProgressError() {
    return this._status === "Error";
  }

  get hasErrorMessages() {
    return this.errorMessages && this.errorMessages.length > 0;
  }

  get hasDependencyGraph() {
    return !!this._dependencyGraphJson;
  }

  // The Generate button is offered only when the request failed and there are
  // error messages to analyze, and only until the card has been shown.
  get canGenerate() {
    return (
      this.hasProgressError && this.hasErrorMessages && !this.showAgentforceCard
    );
  }

  // Parse the model's JSON payload; fall back to raw text if it isn't valid JSON.
  get parsedResponse() {
    if (!this.aiResponse) {
      return null;
    }
    try {
      const cleaned = this.aiResponse.replace(/```json\s*|\s*```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return { summary: this.aiResponse };
    }
  }

  get severityVariant() {
    if (!this.parsedResponse?.severity) {
      return "";
    }
    const variantMap = {
      critical: "slds-theme_error",
      high: "slds-theme_error",
      medium: "slds-theme_warning",
      low: "slds-theme_success"
    };
    return variantMap[this.parsedResponse.severity.toLowerCase()] || "";
  }

  // Build the user prompt from this request's context and its error messages.
  buildCreateRequestUserPrompt() {
    const prompt = {
      createRequestContext: {
        createRequestId: this.requestId || "",
        status: this._status || "",
        package2VersionId: this._package2VersionId || "",
        branch: this.branch || "",
        tag: this.tag || "",
        language: this.language || "",
        calculateCodeCoverage: !!this.calculateCodeCoverage,
        skipValidation: !!this.skipValidation,
        calcTransitiveDependencies: !!this.calcTransitiveDependencies,
        asyncValidation: !!this.asyncValidation,
        isConversionRequest: !!this.isConversionRequest
      },
      errors: (this.errorMessages || []).map((err) => err.message)
    };
    return JSON.stringify(prompt);
  }

  async generateAiResponse() {
    try {
      this.aiResponse = await invokePromptAndUserModelsGenAi({
        className: "AgentGenAiController",
        methodName: "createChatGeneration",
        modelName: this.modelsValue,
        userPrompt: this.buildCreateRequestUserPrompt(),
        systemPrompt: PACKAGE_VERSION_CREATE_ERROR_SYSTEM_PROMPT
      });
      this.displayAgentforceSpinner = false;
    } catch (error) {
      this.displayAgentforceSpinner = false;
      console.error("Agentforce analysis failed:", error);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Agentforce Analysis Failed",
          message: error.body?.message || "Unable to analyze errors",
          variant: "error"
        })
      );
    }
  }

  handleAskAgentforce() {
    this.showAgentforceCard = true;
    this.displayAgentforceSpinner = true;
    this.generateAiResponse();
  }

  handleExtensionInstall() {
    window.open(
      `/packaging/installPackage.apexp?p0=${this.agentforceExtensionPackageVersionId}`,
      "_blank"
    );
  }

  loadErrors() {
    this.displaySpinner = true;
    (async () => {
      await getPackage2VersionCreateRequestErrorList({
        requestId: this.requestId
      })
        .then((result) => {
          this.displaySpinner = false;
          this.errorMessages = (result || []).map((row, index) => ({
            key: row.Id || `error-${index}`,
            message: row.Message
          }));
        })
        .catch((error) => {
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

  // Re-fetch this request by Id so an in-flight build's latest status (and the
  // fields that appear once it completes) show without reloading the page.
  handleRefresh() {
    this.displaySpinner = true;
    (async () => {
      await getPackage2VersionCreateRequestList({
        filterWrapper: [
          { fieldName: "Id", value: this.requestId, dataType: "STRING" }
        ],
        sortedBy: null,
        sortDirection: null,
        requestLimit: "1",
        requestOffset: "0"
      })
        .then((result) => {
          this.displaySpinner = false;
          const row = (result || [])[0];
          if (!row) {
            return;
          }
          this._status = row.Status;
          this._package2VersionId = row.Package2VersionId;
          this._dependencyGraphJson = row.DependencyGraphJson;
          if (this._status === "Error") {
            this.loadErrors();
          } else {
            this.errorMessages = [];
            this.showAgentforceCard = false;
            this.aiResponse = undefined;
          }
        })
        .catch((error) => {
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
