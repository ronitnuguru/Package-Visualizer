import { createElement } from "lwc";
import AgentScriptCoachModal from "c/agentScriptCoachModal";
import analyzeAgentScriptCoach from "@salesforce/apex/PackageVisualizerCtrl.analyzeAgentScriptCoach";
import getTargetRecordId from "@salesforce/apex/PackageVisualizerCtrl.getTargetRecordId";

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.analyzeAgentScriptCoach",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.getTargetRecordId",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const manifest = {
  schemaVersion: 1,
  scriptId: "test-agent",
  scriptHash: "hash-a",
  overview: {
    label: "Test Agent",
    description: "A deterministic report.",
    agentType: "AgentforceEmployeeAgent",
    startAgent: {
      name: "agent_router",
      label: "Agent Router",
      reasoningMode: "narrative"
    }
  },
  subagents: [
    {
      name: "router",
      label: "Router",
      description: "Routes requests.",
      reasoningMode: "workflow"
    }
  ],
  actions: [
    {
      name: "lookup",
      owner: "router",
      label: "Lookup",
      description: "Looks up a package.",
      target: "apex://pkgviz__Lookup",
      inputs: [{ name: "id", type: "string", required: true }],
      outputs: [{ name: "result", type: "string" }],
      availableWhen: null
    }
  ],
  variables: [
    { name: "package_id", type: "string", kind: "mutable", visibility: "agent" }
  ],
  routingEdges: [
    {
      source: "router",
      target: "package_lookup",
      description: "Looks up packages."
    }
  ],
  sourceBlocks: {
    startAgent: { name: "agent_router", source: "start_agent agent_router:" },
    subagents: [
      { name: "router", source: "subagent router:\n    reasoning: ->" }
    ]
  }
};

const evidence = {
  schemaVersion: 1,
  scriptId: "test-agent",
  scriptHash: "hash-a",
  identity: {
    developerName: "Test_Agent",
    agentType: "AgentforceEmployeeAgent"
  },
  instructions: [
    { kind: "system", owner: "system", text: "Stay in scope." },
    { kind: "startAgent", owner: "agent_router", text: "Route requests." },
    { kind: "subagent", owner: "router", text: "Handle package requests." }
  ],
  routingEdges: [],
  actionFlags: [
    {
      owner: "router",
      name: "lookup",
      target: "apex://pkgviz__Lookup",
      hasInputs: true,
      hasOutputs: true,
      hasAvailabilityRule: false
    }
  ],
  variableFlags: [
    { name: "package_id", type: "string", kind: "mutable", visibility: "agent" }
  ]
};

const enrichment = {
  schemaVersion: 1,
  scriptHash: "hash-a",
  overviewSummary: "The routing design is clear.",
  subagentSuggestions: { router: ["Add a boundary reminder."] },
  actionAssessments: {
    "router.lookup": {
      inputQuality: "Good",
      outputQuality: "Needs Improvement",
      suggestions: ["Document the result format."]
    }
  },
  variableConcerns: { package_id: "Validate format before use." },
  improvements: [],
  safetyFindings: [],
  isvReadiness: {
    namespacePrefixed: true,
    customTypesUsed: true,
    externalVisibilityCorrect: true,
    packageDistributable: true,
    notes: "Ready."
  },
  scores: {
    structureSyntax: { score: 15, max: 15, notes: "Good." },
    safety: { score: 15, max: 15, notes: "Good." },
    deterministicLogic: { score: 20, max: 20, notes: "Good." },
    instructionResolution: { score: 20, max: 20, notes: "Good." },
    fsmArchitecture: { score: 10, max: 10, notes: "Good." },
    actionConfiguration: {
      score: 9,
      max: 10,
      notes: "Add result documentation."
    },
    deploymentReadiness: { score: 10, max: 10, notes: "Good." },
    overall: 99
  }
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

function createModal({ hash = "hash-a", publicChatSummary } = {}) {
  const element = createElement("c-agent-script-coach-modal", {
    is: AgentScriptCoachModal
  });
  element.scriptBody = "system:\nsubagent router:";
  element.scriptLabel = "Test Agent";
  element.scriptHeader = "Agentforce Analysis - Test Agent";
  element.scriptId = "test-agent";
  element.scriptHash = hash;
  element.scriptManifest = { ...manifest, scriptHash: hash };
  element.coachingEvidence = { ...evidence, scriptHash: hash };
  element.publicChatSummary = publicChatSummary || {
    scriptId: "test-agent",
    scriptHash: hash
  };
  document.body.appendChild(element);
  return element;
}

function findButton(element, label) {
  return Array.from(
    element.shadowRoot.querySelectorAll("lightning-button")
  ).find((button) => button.label === label);
}

function findCoachErrorStates(element) {
  return Array.from(
    element.shadowRoot.querySelectorAll("lightning-empty-state")
  ).filter((state) => state.title === "AI insights unavailable");
}

describe("c-agent-script-coach-modal progressive coaching", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue() }
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders the deterministic report before unresolved enrichment resolves", async () => {
    const pending = deferred();
    analyzeAgentScriptCoach.mockReturnValue(pending.promise);

    const element = createModal({ hash: "immediate-hash" });
    await flushPromises();

    expect(element.shadowRoot.querySelector("lightning-tabset")).not.toBeNull();
    expect(element.shadowRoot.textContent).toContain("Routes requests.");
    expect(element.shadowRoot.textContent).toContain(
      "Routes to: package_lookup"
    );
    expect(element.shadowRoot.textContent).toContain(
      "start_agent agent_router:"
    );
    const spinners = element.shadowRoot.querySelectorAll("lightning-spinner");
    expect(spinners).toHaveLength(6);
    expect(
      Array.from(spinners).map((spinner) => spinner.alternativeText)
    ).toEqual([
      "Generating score insights",
      "Generating subagent insights",
      "Generating action insights",
      "Generating improvement insights",
      "Generating variable insights",
      "Generating safety insights"
    ]);
    Array.from(spinners).forEach((spinner) => {
      expect(spinner.variant).toBe("brand");
      expect(spinner.size).toBe("medium");
    });
    const notifications = element.shadowRoot.querySelectorAll(
      ".slds-scoped-notification"
    );
    expect(notifications).toHaveLength(1);
    expect(notifications[0].querySelector("ul")).not.toBeNull();
    expect(notifications[0].querySelectorAll("li")).toHaveLength(1);
    expect(element.shadowRoot.textContent).not.toContain(
      "AI insights are loading"
    );
    expect(element.shadowRoot.textContent).not.toContain("Start agent:");
    expect(element.shadowRoot.textContent).not.toContain(
      "Major Rework Required"
    );
    expect(element.shadowRoot.textContent).not.toContain("0/100");
    expect(element.shadowRoot.textContent).not.toContain("rawResponse");
    expect(element.shadowRoot.textContent).not.toContain(
      "This agent passes all seven safety subcategories."
    );
    expect(element.shadowRoot.textContent).not.toContain(
      "No improvement suggestions are available"
    );
    expect(analyzeAgentScriptCoach).toHaveBeenCalledWith({
      scriptId: "test-agent",
      scriptHash: "immediate-hash",
      modelName: "sfdc_ai__DefaultBedrockAnthropicClaude5Sonnet",
      evidenceJson: JSON.stringify({
        ...evidence,
        scriptHash: "immediate-hash"
      })
    });
  });

  it("passes only public manifest fields to the report-level Agentforce action", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({ ...enrichment, scriptHash: "chat-hash" })
    });
    const element = createModal({
      hash: "chat-hash",
      publicChatSummary: {
        name: "Public Agent",
        label: "Public Agent Label",
        purpose: "Explain package health.",
        agents: [
          {
            name: "public_agent",
            label: "Public Agent",
            purpose: "Summarize package health.",
            reasoning: "FORBIDDEN_REASONING_MARKER",
            source: "FORBIDDEN_SOURCE_MARKER",
            variables: ["FORBIDDEN_VARIABLE_MARKER"]
          }
        ],
        actions: [
          {
            name: "public_action",
            label: "Public Action",
            description: "Retrieve package health.",
            inputs: "FORBIDDEN_SCHEMA_MARKER",
            outputs: "FORBIDDEN_OUTPUT_MARKER"
          }
        ],
        source: "FORBIDDEN_RAW_SCRIPT_MARKER",
        coachingEvidence: "FORBIDDEN_MODEL_FINDINGS_MARKER",
        manifest: "FORBIDDEN_MANIFEST_MARKER"
      }
    });
    await flushPromises();

    const action = element.shadowRoot.querySelector(
      "c-agentforce-conversation-actions"
    );
    const utterance = action.utterance;

    expect(action.displayMode).toBe("contextAction");
    expect(utterance).toContain("Public Agent Label");
    expect(utterance).toContain("Explain package health.");
    expect(utterance).toContain("public_agent");
    expect(utterance).toContain("Summarize package health.");
    expect(utterance).toContain("public_action");
    expect(utterance).toContain("Retrieve package health.");
    expect(utterance).toMatch(/untrusted data/i);
    expect(utterance).toMatch(/embedded instructions.*ignore/i);
    expect(utterance).toContain("End of public capability manifest.");
    expect(utterance).toMatch(/load this manifest as context/i);
    expect(utterance).toMatch(/do not summarize the full manifest/i);
    expect(utterance).toMatch(
      /invite me to ask about a named subagent or action/i
    );
    expect(utterance).toMatch(/use only the public manifest fields above/i);
    expect(utterance).not.toContain("FORBIDDEN_REASONING_MARKER");
    expect(utterance).not.toContain("FORBIDDEN_SOURCE_MARKER");
    expect(utterance).not.toContain("FORBIDDEN_VARIABLE_MARKER");
    expect(utterance).not.toContain("FORBIDDEN_SCHEMA_MARKER");
    expect(utterance).not.toContain("FORBIDDEN_OUTPUT_MARKER");
    expect(utterance).not.toContain("FORBIDDEN_RAW_SCRIPT_MARKER");
    expect(utterance).not.toContain("FORBIDDEN_MODEL_FINDINGS_MARKER");
    expect(utterance).not.toContain("FORBIDDEN_MANIFEST_MARKER");
  });

  it("closes after the report-level Agentforce conversation opens", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify(enrichment)
    });
    const element = createModal();
    await flushPromises();

    element.shadowRoot
      .querySelector("c-agentforce-conversation-actions")
      .dispatchEvent(new CustomEvent("conversationopen"));

    expect(element.close).toHaveBeenCalledTimes(1);
  });

  it("copies the manifest source block instead of reparsing the script body", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({ ...enrichment, scriptHash: "source-hash" })
    });
    const element = createModal({ hash: "source-hash" });
    await flushPromises();

    element.shadowRoot
      .querySelector('lightning-button-icon[data-name="router"]')
      .click();
    await flushPromises();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "subagent router:\n    reasoning: ->"
    );
  });

  it("copies the Start Agent source block from the overview card", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({ ...enrichment, scriptHash: "start-hash" })
    });
    const element = createModal({ hash: "start-hash" });
    await flushPromises();

    const startAgentCopyButton = element.shadowRoot.querySelector(
      '[data-id="copy-start-agent"]'
    );
    expect(startAgentCopyButton).not.toBeNull();
    expect(startAgentCopyButton.iconName).toBe("utility:copy");
    expect(startAgentCopyButton.tooltip).toBe("Copy to Clipboard");

    startAgentCopyButton.click();
    await flushPromises();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "start_agent agent_router:"
    );
  });

  it("keeps target verification available after progressive enrichment", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({ ...enrichment, scriptHash: "target-hash" })
    });
    getTargetRecordId.mockResolvedValue("01p000000000001AAA");
    const element = createModal({ hash: "target-hash" });
    await flushPromises();

    findButton(element, "Verify Targets").click();
    await flushPromises();

    expect(getTargetRecordId).toHaveBeenCalledWith({
      targetType: "apex",
      name: "Lookup",
      namespace: "pkgviz"
    });
  });

  it("clears the delayed-loading timer when disconnected", async () => {
    const pending = deferred();
    analyzeAgentScriptCoach.mockReturnValue(pending.promise);
    const element = createModal({ hash: "disconnect-hash" });
    await flushPromises();

    document.body.removeChild(element);

    expect(jest.getTimerCount()).toBe(0);
  });

  it("merges valid enrichment by subagent, owner-qualified action, and variable", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({ ...enrichment, scriptHash: "merge-hash" })
    });

    const element = createModal({ hash: "merge-hash" });
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "Add a boundary reminder."
    );
    expect(
      Array.from(element.shadowRoot.querySelectorAll("lightning-badge")).some(
        (badge) => badge.label === "Needs Improvement"
      )
    ).toBe(true);
    expect(
      element.shadowRoot.querySelector("lightning-datatable").data[0].concern
    ).toBe("Validate format before use.");
    expect(element.shadowRoot.textContent).toContain("99/100");
    expect(element.shadowRoot.textContent).not.toContain("Re-Analyze");
    expect(findButton(element, "Copy as Markdown")).toBeDefined();
  });

  it("reuses the page-session enrichment request for the same script hash", async () => {
    const pending = deferred();
    analyzeAgentScriptCoach.mockReturnValue(pending.promise);

    const first = createModal({ hash: "shared-hash" });
    const second = createModal({ hash: "shared-hash" });
    await flushPromises();

    expect(first.shadowRoot.querySelector("lightning-tabset")).not.toBeNull();
    expect(second.shadowRoot.querySelector("lightning-tabset")).not.toBeNull();
    expect(analyzeAgentScriptCoach).toHaveBeenCalledTimes(1);
  });

  it("reuses a completed schema-valid enrichment for a later modal in the page session", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "CACHE_HIT",
      analysisJson: JSON.stringify({ ...enrichment, scriptHash: "warm-hash" })
    });

    const first = createModal({ hash: "warm-hash" });
    await flushPromises();
    const second = createModal({ hash: "warm-hash" });
    await flushPromises();

    expect(analyzeAgentScriptCoach).toHaveBeenCalledTimes(1);
    expect(second.shadowRoot.textContent).toContain(
      "The routing design is clear."
    );
    expect(findButton(first, "Copy as Markdown")).toBeDefined();
  });

  it("shows a delayed inline loading notice after ten seconds", async () => {
    const pending = deferred();
    analyzeAgentScriptCoach.mockReturnValue(pending.promise);

    const element = createModal({ hash: "slow-hash" });
    await flushPromises();
    jest.advanceTimersByTime(10000);
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "Analysis is taking longer than expected"
    );
    expect(
      element.shadowRoot.querySelectorAll("lightning-spinner")
    ).toHaveLength(6);
    const notifications = element.shadowRoot.querySelectorAll(
      ".slds-scoped-notification"
    );
    expect(notifications).toHaveLength(1);
    expect(notifications[0].querySelector("ul").classList).toContain(
      "slds-list_dotted"
    );
    expect(notifications[0].querySelectorAll("li")).toHaveLength(2);
    expect(element.shadowRoot.querySelector(".ai-loading")).toBeNull();
    expect(element.shadowRoot.querySelector("lightning-tabset")).not.toBeNull();
  });

  it("keeps the deterministic report and permits one explicit retry after a failure", async () => {
    analyzeAgentScriptCoach
      .mockRejectedValueOnce({ body: { message: "Unavailable" } })
      .mockResolvedValueOnce({
        status: "GENERATED",
        analysisJson: JSON.stringify({
          ...enrichment,
          scriptHash: "retry-hash"
        })
      });

    const element = createModal({ hash: "retry-hash" });
    await flushPromises();

    expect(element.shadowRoot.querySelector("lightning-tabset")).not.toBeNull();
    const errorStates = findCoachErrorStates(element);
    expect(errorStates).toHaveLength(6);
    errorStates.forEach((state) => {
      expect(state.illustrationName).toBe("error:connectionissue");
    });
    expect(element.shadowRoot.textContent).toContain(
      "Models API couldn't complete the analysis. Retry to generate fresh insights."
    );
    expect(element.shadowRoot.textContent).not.toContain("No Safety Findings");
    expect(element.shadowRoot.textContent).not.toContain(
      "No Improvements Suggested"
    );
    expect(element.shadowRoot.textContent).not.toContain(
      "AI insights are loading. A deterministic report."
    );
    expect(
      Array.from(element.shadowRoot.querySelectorAll("lightning-badge")).some(
        (badge) => badge.label === "Loading"
      )
    ).toBe(false);
    expect(analyzeAgentScriptCoach).toHaveBeenCalledTimes(1);
    const retryButtons = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).filter((button) => button.label === "Retry");
    expect(retryButtons).toHaveLength(1);
    const [retry] = retryButtons;
    retry.click();
    await flushPromises();

    expect(analyzeAgentScriptCoach).toHaveBeenCalledTimes(2);
    expect(findButton(element, "Copy as Markdown")).toBeDefined();
  });

  it("explains an incomplete model response without exposing raw server content", async () => {
    analyzeAgentScriptCoach.mockRejectedValue({
      body: {
        message:
          "Coach enrichment rejected: Coach response is not valid JSON SECRET_RAW_RESPONSE"
      }
    });

    const element = createModal({ hash: "safe-error-hash" });
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "The model returned an incomplete analysis. Retry to generate fresh insights."
    );
    expect(element.shadowRoot.textContent).not.toContain("SECRET_RAW_RESPONSE");
  });

  it("keeps deterministic data when enrichment is incomplete and does not enable Markdown copy", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({
        schemaVersion: 1,
        scriptHash: "partial-hash"
      })
    });

    const element = createModal({ hash: "partial-hash" });
    await flushPromises();

    expect(element.shadowRoot.querySelector("lightning-tabset")).not.toBeNull();
    expect(findCoachErrorStates(element)).toHaveLength(6);
    expect(element.shadowRoot.textContent).not.toContain("Copy as Markdown");
  });

  it("renders valid empty AI sections as empty only after a valid enrichment", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({ ...enrichment, scriptHash: "empty-hash" })
    });

    const element = createModal({ hash: "empty-hash" });
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "This agent passes all seven safety subcategories."
    );
    expect(element.shadowRoot.textContent).toContain(
      "No improvement suggestions are available"
    );
  });

  it("does not mutate nested score objects retained in the session cache", async () => {
    const frozenScores = Object.fromEntries(
      Object.entries(enrichment.scores).map(([key, value]) => [
        key,
        value && typeof value === "object" ? Object.freeze({ ...value }) : value
      ])
    );
    const frozenEnrichment = Object.freeze({
      ...enrichment,
      scriptHash: "frozen-score-hash",
      scores: Object.freeze(frozenScores)
    });
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: "frozen-enrichment"
    });
    const parseSpy = jest
      .spyOn(JSON, "parse")
      .mockReturnValue(frozenEnrichment);

    const element = createModal({ hash: "frozen-score-hash" });
    await flushPromises();

    expect(findCoachErrorStates(element)).toHaveLength(0);
    expect(findButton(element, "Copy as Markdown")).toBeDefined();
    expect(Object.keys(frozenEnrichment.scores.structureSyntax)).toEqual([
      "score",
      "max",
      "notes"
    ]);
    parseSpy.mockRestore();
  });

  it("rejects malformed nested enrichment without enabling Markdown copy", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({
        ...enrichment,
        scriptHash: "malformed-nested-hash",
        scores: { ...enrichment.scores, overall: 100 },
        safetyFindings: [{}]
      })
    });

    const element = createModal({ hash: "malformed-nested-hash" });
    await flushPromises();

    expect(findCoachErrorStates(element)).toHaveLength(6);
    expect(findButton(element, "Copy as Markdown")).toBeUndefined();
  });

  it("rejects a blank required overview summary", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({
        ...enrichment,
        scriptHash: "blank-summary-hash",
        overviewSummary: ""
      })
    });

    const element = createModal({ hash: "blank-summary-hash" });
    await flushPromises();

    expect(findCoachErrorStates(element)).toHaveLength(6);
    expect(findButton(element, "Copy as Markdown")).toBeUndefined();
  });

  it("rejects an otherwise valid enrichment with an unknown root field", async () => {
    analyzeAgentScriptCoach.mockResolvedValue({
      status: "GENERATED",
      analysisJson: JSON.stringify({
        ...enrichment,
        scriptHash: "extra-root-hash",
        unexpected: "not part of the Coach contract"
      })
    });

    const element = createModal({ hash: "extra-root-hash" });
    await flushPromises();

    expect(findCoachErrorStates(element)).toHaveLength(6);
    expect(findButton(element, "Copy as Markdown")).toBeUndefined();
  });

  it("rejects blank nested strings while accepting finite fractional Apex scores", async () => {
    analyzeAgentScriptCoach
      .mockResolvedValueOnce({
        status: "GENERATED",
        analysisJson: JSON.stringify({
          ...enrichment,
          scriptHash: "blank-nested-hash",
          actionAssessments: {
            "router.lookup": {
              ...enrichment.actionAssessments["router.lookup"],
              suggestions: [""]
            }
          }
        })
      })
      .mockResolvedValueOnce({
        status: "GENERATED",
        analysisJson: JSON.stringify({
          ...enrichment,
          scriptHash: "fractional-score-hash",
          scores: {
            ...enrichment.scores,
            actionConfiguration: {
              ...enrichment.scores.actionConfiguration,
              score: 9.5
            },
            overall: 99.5
          }
        })
      });

    const blank = createModal({ hash: "blank-nested-hash" });
    await flushPromises();
    const fractional = createModal({ hash: "fractional-score-hash" });
    await flushPromises();

    expect(findCoachErrorStates(blank)).toHaveLength(6);
    expect(findButton(blank, "Copy as Markdown")).toBeUndefined();
    expect(fractional.shadowRoot.textContent).toContain("99.5/100");
    expect(findButton(fractional, "Copy as Markdown")).toBeDefined();
  });

  it("ignores a second Retry click while the retry request is active", async () => {
    const retryPending = deferred();
    analyzeAgentScriptCoach
      .mockRejectedValueOnce({ body: { message: "Unavailable" } })
      .mockReturnValueOnce(retryPending.promise);

    const element = createModal({ hash: "double-retry-hash" });
    await flushPromises();
    const retry = findButton(element, "Retry");
    retry.click();
    retry.click();
    await flushPromises();

    expect(analyzeAgentScriptCoach).toHaveBeenCalledTimes(2);
  });

  it("shares one new in-flight session request when two failed modals retry", async () => {
    const retryPending = deferred();
    analyzeAgentScriptCoach
      .mockRejectedValueOnce({ body: { message: "Unavailable" } })
      .mockReturnValueOnce(retryPending.promise);

    const first = createModal({ hash: "shared-retry-hash" });
    const second = createModal({ hash: "shared-retry-hash" });
    await flushPromises();
    findButton(first, "Retry").click();
    findButton(second, "Retry").click();
    await flushPromises();

    expect(analyzeAgentScriptCoach).toHaveBeenCalledTimes(2);
  });

  it("resets loading after disconnect so reconnect can use the completed session result", async () => {
    const pending = deferred();
    analyzeAgentScriptCoach.mockReturnValue(pending.promise);
    const element = createModal({ hash: "reconnect-hash" });
    await flushPromises();
    document.body.removeChild(element);
    pending.resolve({
      status: "GENERATED",
      analysisJson: JSON.stringify({
        ...enrichment,
        scriptHash: "reconnect-hash"
      })
    });
    await flushPromises();
    document.body.appendChild(element);
    await flushPromises();

    expect(findButton(element, "Copy as Markdown")).toBeDefined();
  });

  it("does not retain incomplete enrichment in the session cache", async () => {
    analyzeAgentScriptCoach
      .mockResolvedValueOnce({
        status: "GENERATED",
        analysisJson: JSON.stringify({
          schemaVersion: 1,
          scriptHash: "invalid-cache-hash"
        })
      })
      .mockResolvedValueOnce({
        status: "GENERATED",
        analysisJson: JSON.stringify({
          ...enrichment,
          scriptHash: "invalid-cache-hash"
        })
      });

    createModal({ hash: "invalid-cache-hash" });
    await flushPromises();
    const second = createModal({ hash: "invalid-cache-hash" });
    await flushPromises();

    expect(analyzeAgentScriptCoach).toHaveBeenCalledTimes(2);
    expect(findButton(second, "Copy as Markdown")).toBeDefined();
  });
});
