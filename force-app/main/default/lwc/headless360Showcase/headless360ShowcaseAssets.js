export const PACKAGE_VISUALIZER_APEX_TOOLS = [
  {
    apiName: "pkgviz__HeadlessPlanPushAction",
    description:
      "Prepares an upgrade for up to 2,000 eligible subscriber orgs for your review and confirmation before submission."
  },
  {
    apiName: "pkgviz__HeadlessExecutePushAction",
    description:
      "Dispatches the reviewed prepared upgrade after confirmation and revalidation."
  },
  {
    apiName: "pkgviz__HeadlessPushStatusAction",
    description:
      "Returns staging progress, upgrade outcomes, errors, and available reports."
  },
  {
    apiName: "pkgviz__HeadlessCancelPushAction",
    description: "Cancels a prepared or pending push upgrade request."
  },
  {
    apiName: "pkgviz__HeadlessResolvePushTargetAction",
    description:
      "Resolve a package name and numeric version, or exact version ID. Return ambiguity and readiness blockers without creating a request."
  },
  {
    apiName: "pkgviz__HeadlessPreviewPushAction",
    description:
      "Read-only subscriber eligibility preview from pasted IDs, a Salesforce File, filters, or confirmed failures from an owned source manifest. Return selectionFingerprint for preparation. No requests, Files or jobs are created."
  },
  {
    apiName: "pkgviz__HeadlessFindPushRunsAction",
    description:
      "Find the current Salesforce operator's manifest-backed runs. Select a manifestVersionId to retrieve validated references for resuming. Page using both beforeDate and beforeId. Never dispatches."
  },
  {
    apiName: "pkgviz__AgentforcePushRequestAnalysisAction",
    description:
      "Read authoritative job outcomes and failure patterns for a selected PackagePushRequest. Diagnosis does not authorize a retry; preview and prepare a fresh reviewed recovery cohort."
  }
];
