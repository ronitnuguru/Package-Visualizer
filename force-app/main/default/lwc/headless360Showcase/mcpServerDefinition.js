export const MCP_SERVER_DEFINITION = `<?xml version="1.0" encoding="UTF-8"?>
<McpServerDefinition xmlns="http://soap.sforce.com/2006/04/metadata">
  <description>Package Visualizer prepared push upgrades. Administrator-owned setup; no HXL.</description>
  <masterLabel>Package Visualizer Custom MCP Server</masterLabel>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__HeadlessPlanPushAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__HeadlessPlanPushAction</operation>
    </apiDefinition>
    <descriptionOverride>Prepare up to 2000 eligible orgs, creating a Created request, private CSV and manifest, and staging jobs without dispatch. Only prepare after explicit authorization to create the request; confirming a package or version is not authorization. Never automatically retry an uncertain preparation.</descriptionOverride>
    <destructive>false</destructive>
    <idempotent>false</idempotent>
    <openWorld>false</openWorld>
    <readOnly>false</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>plan_push_upgrade</toolName>
    <toolTitle>Plan Push Upgrade</toolTitle>
  </tools>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__HeadlessExecutePushAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__HeadlessExecutePushAction</operation>
    </apiDefinition>
    <descriptionOverride>Dispatch the reviewed prepared request using its immutable manifest version and digest. Require explicit native user approval for this exact write; a version confirmation alone is not approval.</descriptionOverride>
    <destructive>true</destructive>
    <idempotent>true</idempotent>
    <openWorld>false</openWorld>
    <readOnly>false</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>execute_push_upgrade</toolName>
    <toolTitle>Execute Push Upgrade</toolTitle>
  </tools>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__HeadlessPushStatusAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__HeadlessPushStatusAction</operation>
    </apiDefinition>
    <descriptionOverride>Read readiness and platform outcomes for the prepared request, including job counts and errors.</descriptionOverride>
    <destructive>false</destructive>
    <idempotent>true</idempotent>
    <openWorld>false</openWorld>
    <readOnly>true</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>get_push_upgrade_status</toolName>
    <toolTitle>Get Push Upgrade Status</toolTitle>
  </tools>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__HeadlessCancelPushAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__HeadlessCancelPushAction</operation>
    </apiDefinition>
    <descriptionOverride>Cancel the reviewed Created or Pending request after native confirmation. Running or completed upgrades cannot be rolled back.</descriptionOverride>
    <destructive>true</destructive>
    <idempotent>true</idempotent>
    <openWorld>false</openWorld>
    <readOnly>false</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>cancel_push_upgrade</toolName>
    <toolTitle>Cancel Push Upgrade</toolTitle>
  </tools>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__HeadlessResolvePushTargetAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__HeadlessResolvePushTargetAction</operation>
    </apiDefinition>
    <descriptionOverride>For latest push upgrade target set latestReleased=true; selects highest released non-deprecated version after package disambiguation. Exact version or ID reports blockers. A version selection or confirmation alone does not authorize preparing or scheduling an upgrade.</descriptionOverride>
    <destructive>false</destructive>
    <idempotent>true</idempotent>
    <openWorld>false</openWorld>
    <readOnly>true</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>resolve_push_target</toolName>
    <toolTitle>Resolve Push Target</toolTitle>
  </tools>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__HeadlessPreviewPushAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__HeadlessPreviewPushAction</operation>
    </apiDefinition>
    <descriptionOverride>Read-only subscriber eligibility preview from pasted IDs, a Salesforce File, filters, or confirmed failures from an owned source manifest. Return selectionFingerprint for preparation. No requests, Files or jobs are created.</descriptionOverride>
    <destructive>false</destructive>
    <idempotent>true</idempotent>
    <openWorld>false</openWorld>
    <readOnly>true</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>preview_push_upgrade</toolName>
    <toolTitle>Preview Push Upgrade</toolTitle>
  </tools>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__HeadlessFindPushRunsAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__HeadlessFindPushRunsAction</operation>
    </apiDefinition>
    <descriptionOverride>Find the current Salesforce operator's manifest-backed runs. Select a manifestVersionId to retrieve validated references for resuming. Page using both beforeDate and beforeId. Never dispatches.</descriptionOverride>
    <destructive>false</destructive>
    <idempotent>true</idempotent>
    <openWorld>false</openWorld>
    <readOnly>true</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>find_push_upgrades</toolName>
    <toolTitle>Find Push Upgrades</toolTitle>
  </tools>
  <tools>
    <apiDefinition>
      <apiIdentifier>aa:apex-pkgviz__AgentforcePushRequestAnalysisAction</apiIdentifier>
      <apiSource>API_CATALOG</apiSource>
      <operation>pkgviz__AgentforcePushRequestAnalysisAction</operation>
    </apiDefinition>
    <descriptionOverride>Read authoritative job outcomes and failure patterns for a selected PackagePushRequest. Diagnosis does not authorize a retry; preview and prepare a fresh reviewed recovery cohort.</descriptionOverride>
    <destructive>false</destructive>
    <idempotent>true</idempotent>
    <openWorld>false</openWorld>
    <readOnly>true</readOnly>
    <returnDirect>false</returnDirect>
    <toolName>analyze_push_upgrade</toolName>
    <toolTitle>Analyze Push Upgrade</toolTitle>
  </tools>
</McpServerDefinition>
`;
