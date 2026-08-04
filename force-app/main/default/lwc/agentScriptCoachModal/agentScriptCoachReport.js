const SCORE_CATEGORIES = [
  ["structureSyntax", "Structure & Syntax", 15],
  ["safety", "Safety", 15],
  ["deterministicLogic", "Deterministic Logic", 20],
  ["instructionResolution", "Instruction Resolution", 20],
  ["fsmArchitecture", "FSM Architecture", 10],
  ["actionConfiguration", "Action Configuration", 10],
  ["deploymentReadiness", "Deployment Readiness", 10]
];

const INPUT_QUALITIES = new Set(["Good", "Needs Improvement", "Missing"]);
const IMPROVEMENT_PRIORITIES = new Set(["High", "Medium", "Low"]);
const IMPROVEMENT_CATEGORIES = new Set([
  "Architecture",
  "Safety",
  "Instructions",
  "Actions",
  "Variables",
  "Deployment"
]);
const SAFETY_CATEGORIES = new Set([
  "Identity & Transparency",
  "Prompt Injection Resistance",
  "Data Handling",
  "Content Safety",
  "Fairness & Bias",
  "Deception & Manipulation",
  "Scope & Boundary Enforcement"
]);
const SAFETY_SEVERITIES = new Set(["Critical", "High", "Medium", "Low"]);
const ENRICHMENT_KEYS = [
  "schemaVersion",
  "scriptHash",
  "overviewSummary",
  "subagentSuggestions",
  "actionAssessments",
  "variableConcerns",
  "improvements",
  "safetyFindings",
  "isvReadiness",
  "scores"
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value, keys) {
  return (
    isObject(value) && Object.keys(value).every((key) => keys.includes(key))
  );
}

function isNonBlankString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function isStringList(value) {
  return Array.isArray(value) && value.every(isNonBlankString);
}

function isScore(value, max) {
  return (
    isObject(value) &&
    Object.keys(value).length === 3 &&
    value.max === max &&
    Number.isFinite(value.score) &&
    value.score >= 0 &&
    value.score <= max &&
    isNonBlankString(value.notes)
  );
}

function emptyScores() {
  return SCORE_CATEGORIES.reduce(
    (scores, [key, , max]) => ({
      ...scores,
      [key]: { score: 0, max, notes: null }
    }),
    { overall: 0 }
  );
}

function routingAnalysis(name, routingEdges) {
  const outgoing = routingEdges
    .filter((edge) => edge.source === name)
    .map((edge) => edge.target);
  const incoming = routingEdges
    .filter((edge) => edge.target === name)
    .map((edge) => edge.source);
  const details = [];
  if (outgoing.length) details.push(`Routes to: ${outgoing.join(", ")}`);
  if (incoming.length) details.push(`Receives from: ${incoming.join(", ")}`);
  return details.join(". ");
}

export function createDeterministicReport(manifest = {}) {
  const overview = manifest.overview || {};
  const routingEdges = manifest.routingEdges || [];
  return {
    overview: {
      agentType: overview.agentType || "AgentScript",
      architecturePattern: "Deterministic Manifest",
      summary: "Deterministic AgentScript facts are shown below.",
      purpose:
        overview.description ||
        overview.label ||
        manifest.scriptId ||
        "AgentScript",
      startAgent: overview.startAgent || null,
      startAgentSource: manifest.sourceBlocks?.startAgent?.source || null
    },
    subagents: (manifest.subagents || []).map((subagent) => ({
      ...subagent,
      purpose: subagent.description,
      hasAfterReasoning: false,
      routingAnalysis: routingAnalysis(subagent.name, routingEdges),
      suggestions: []
    })),
    actions: (manifest.actions || []).map((action) => ({
      ...action,
      parentSubagent: action.owner,
      hasAvailableWhen: Boolean(action.availableWhen),
      inputQuality: null,
      outputQuality: null,
      suggestions: []
    })),
    variables: (manifest.variables || []).map((variable) => ({
      ...variable,
      concern: null
    })),
    improvements: [],
    safetyFindings: [],
    isvReadiness: {},
    scores: emptyScores()
  };
}

export function isValidEnrichment(enrichment, manifest = {}) {
  if (
    !enrichment ||
    !hasOnlyKeys(enrichment, ENRICHMENT_KEYS) ||
    Object.keys(enrichment).length !== ENRICHMENT_KEYS.length ||
    enrichment.schemaVersion !== 1 ||
    enrichment.scriptHash !== manifest.scriptHash ||
    !isNonBlankString(enrichment.overviewSummary) ||
    !Array.isArray(enrichment.improvements) ||
    !Array.isArray(enrichment.safetyFindings) ||
    !isObject(enrichment.subagentSuggestions) ||
    !isObject(enrichment.actionAssessments) ||
    !isObject(enrichment.variableConcerns) ||
    !isObject(enrichment.isvReadiness) ||
    !isObject(enrichment.scores)
  ) {
    return false;
  }
  const subagentNames = new Set(
    (manifest.subagents || []).map(({ name }) => name)
  );
  const actionKeys = (manifest.actions || []).map(
    (action) => `${action.owner}.${action.name}`
  );
  const variableNames = new Set(
    (manifest.variables || []).map(({ name }) => name)
  );
  const scoresAreValid = SCORE_CATEGORIES.every(([key, , max]) =>
    isScore(enrichment.scores[key], max)
  );
  const scoreSum = scoresAreValid
    ? SCORE_CATEGORIES.reduce(
        (sum, [key]) => sum + enrichment.scores[key].score,
        0
      )
    : null;
  if (
    !hasOnlyKeys(enrichment.subagentSuggestions, [...subagentNames]) ||
    !Object.values(enrichment.subagentSuggestions).every(isStringList) ||
    !hasOnlyKeys(enrichment.actionAssessments, actionKeys) ||
    !hasOnlyKeys(enrichment.variableConcerns, [...variableNames]) ||
    !Object.values(enrichment.variableConcerns).every(
      (value) => value === null || isNonBlankString(value)
    ) ||
    !scoresAreValid ||
    Object.keys(enrichment.scores).length !== SCORE_CATEGORIES.length + 1 ||
    !Number.isFinite(enrichment.scores.overall) ||
    enrichment.scores.overall !== scoreSum ||
    !hasOnlyKeys(enrichment.isvReadiness, [
      "namespacePrefixed",
      "customTypesUsed",
      "externalVisibilityCorrect",
      "packageDistributable",
      "notes"
    ]) ||
    ![
      "namespacePrefixed",
      "customTypesUsed",
      "externalVisibilityCorrect",
      "packageDistributable"
    ].every((key) => typeof enrichment.isvReadiness[key] === "boolean") ||
    !isNonBlankString(enrichment.isvReadiness.notes) ||
    !enrichment.improvements.every(
      (item) =>
        isObject(item) &&
        Object.keys(item).length === 5 &&
        IMPROVEMENT_PRIORITIES.has(item.priority) &&
        IMPROVEMENT_CATEGORIES.has(item.category) &&
        isNonBlankString(item.title) &&
        isNonBlankString(item.description) &&
        (item.codeSnippet === null || isNonBlankString(item.codeSnippet))
    ) ||
    !enrichment.safetyFindings.every(
      (item) =>
        isObject(item) &&
        Object.keys(item).length === 4 &&
        SAFETY_CATEGORIES.has(item.category) &&
        SAFETY_SEVERITIES.has(item.severity) &&
        isNonBlankString(item.description) &&
        isNonBlankString(item.mitigation)
    )
  ) {
    return false;
  }
  return actionKeys.every((actionKey) => {
    const assessment = enrichment.actionAssessments[actionKey];
    return (
      isObject(assessment) &&
      Object.keys(assessment).length === 3 &&
      INPUT_QUALITIES.has(assessment.inputQuality) &&
      INPUT_QUALITIES.has(assessment.outputQuality) &&
      isStringList(assessment.suggestions)
    );
  });
}

export function mergeEnrichment(report, enrichment) {
  return {
    ...report,
    overview: { ...report.overview, summary: enrichment.overviewSummary },
    subagents: report.subagents.map((subagent) => ({
      ...subagent,
      suggestions: enrichment.subagentSuggestions[subagent.name] || []
    })),
    actions: report.actions.map((action) => {
      const assessment =
        enrichment.actionAssessments[`${action.parentSubagent}.${action.name}`];
      return assessment
        ? {
            ...action,
            inputQuality: assessment.inputQuality,
            outputQuality: assessment.outputQuality,
            suggestions: assessment.suggestions
          }
        : action;
    }),
    variables: report.variables.map((variable) => ({
      ...variable,
      concern: enrichment.variableConcerns[variable.name] || null
    })),
    improvements: enrichment.improvements,
    safetyFindings: enrichment.safetyFindings,
    isvReadiness: enrichment.isvReadiness,
    scores: enrichment.scores
  };
}
