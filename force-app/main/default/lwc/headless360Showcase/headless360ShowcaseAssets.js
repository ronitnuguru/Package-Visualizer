export const PACKAGE_VISUALIZER_APEX_TOOLS = [
  {
    apiName: "pkgviz__AgentforcePackagePortfolioAction",
    description:
      "Returns authoritative, bounded health context for active 2GP managed and unlocked packages."
  },
  {
    apiName: "pkgviz__AgentforcePackageDetailAction",
    description:
      "Resolves a package and returns bounded authoritative package, version, build, and subscriber context."
  },
  {
    apiName: "pkgviz__AgentforcePackageBuildDiagnosisAction",
    description:
      "Refreshes authoritative error context for a failed 08c package-version create request."
  },
  {
    apiName: "pkgviz__AgentforcePackageBuildComparisonAction",
    description:
      "Compares exact error signatures across recent failed build requests for the same Package2."
  },
  {
    apiName: "pkgviz__AgentforcePushRequestAnalysisAction",
    description:
      "Returns authoritative job outcomes and failure patterns for a direct 0DV PackagePushRequest."
  },
  {
    apiName: "pkgviz__AgentforcePushJobDiagnosisAction",
    description:
      "Refreshes and normalizes authoritative evidence for a failed PackagePushJob."
  },
  {
    apiName: "pkgviz__AgentforcePushRequestComparisonAction",
    description:
      "Derives the owning PackagePushRequest from an active PackagePushJob and compares exact and normalized sibling failure patterns."
  },
  {
    apiName: "pkgviz__AgentforceSubscriberSupportAction",
    description:
      "Returns read-only PackageSubscriber installation, upgrade, sandbox, and support context."
  },
  {
    apiName: "pkgviz__AgentforcePackageVersionReadinessAction",
    description:
      "Returns authoritative release, coverage, dependency, subscriber-impact, and blocker context for a 04t package version."
  }
];
