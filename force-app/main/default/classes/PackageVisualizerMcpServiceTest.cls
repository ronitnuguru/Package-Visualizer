/** Contract tests for create-once provisioning and read-only existing servers. */
@IsTest
private with sharing class PackageVisualizerMcpServiceTest {
  private static final String ID = '1g1000000000001AAA';
  private static final String NAME = 'PackageVisualizerCustomMcpServer';
  private static final List<String> ACTIONS = new List<String>{
    'pkgviz__HeadlessPlanPushAction',
    'pkgviz__HeadlessExecutePushAction',
    'pkgviz__HeadlessPushStatusAction',
    'pkgviz__HeadlessCancelPushAction',
    'pkgviz__HeadlessResolvePushTargetAction',
    'pkgviz__HeadlessPreviewPushAction',
    'pkgviz__HeadlessFindPushRunsAction',
    'pkgviz__AgentforcePushRequestAnalysisAction'
  };
  private class CatalogMock implements HttpCalloutMock {
    Boolean exists = true;
    Boolean active = false;
    Boolean missingAction = false;
    Boolean failPut = false;
    Boolean failCurated = false;
    Boolean uncertainCreate = false;
    Boolean duplicateCreate = false;
    Boolean conflict = false;
    Boolean duplicateListing = false;
    Boolean identityChanged = false;
    Boolean malformedAssets = false;
    Boolean truncatedPut = false;
    Boolean changeAfterPut = false;
    Boolean changeAnnotationAfterPut = false;
    Boolean useNamedCredential = true;
    Boolean changeAuthChoice = false;
    Integer failureStatus;
    Integer requests = 0;
    Integer writes = 0;
    Integer actionReads = 0;
    List<Object> assets = new List<Object>();
    Map<String, Object> server() {
      return new Map<String, Object>{
        'id' => ID,
        'name' => NAME,
        'type' => conflict ? 'EXTERNAL' : 'PLATFORM',
        'source' => 'CUSTOM',
        'active' => active,
        'serverUrl' => 'https://api.salesforce.com/example',
        'label' => 'Administrator label',
        'description' => 'Administrator description'
      };
    }
    public HttpResponse respond(HttpRequest req) {
      requests++;
      Assert.areEqual(
        (useNamedCredential
          ? 'callout:pkgviz_Tooling_Named_Credential'
          : URL.getOrgDomainUrl().toExternalForm()) + '/services/data/v68.0',
        req.getEndpoint()
          .substringBefore('/api-catalog')
          .substringBefore('/actions'),
        'Keep the chosen authentication route and API version for every request'
      );
      Assert.areEqual(
        useNamedCredential
          ? null
          : 'Bearer we can not run getContent in test class',
        req.getHeader('Authorization'),
        'Only session authentication supplies an explicit bearer header'
      );
      if (changeAuthChoice)
        Package2Interface.useNamedCredentialOverride = !useNamedCredential;
      String path = req.getEndpoint().substringAfter('/services/data/v68.0');
      String method = req.getMethod();
      HttpResponse res = new HttpResponse();
      res.setStatusCode(200);
      if (failureStatus != null) {
        res.setStatusCode(failureStatus);
        res.setBody('[]');
        return res;
      }
      Object body;
      if (method != 'GET')
        writes++;
      if (method == 'GET' && path == '/api-catalog/mcp-servers') {
        List<Object> servers = new List<Object>{
          new Map<String, Object>{ 'id' => 'other', 'name' => 'OtherServer' }
        };
        if (exists)
          servers.add(server());
        if (duplicateListing)
          servers.add(server());
        body = new Map<String, Object>{ 'mcpServers' => servers };
      } else if (path == '/actions/custom/apex') {
        Assert.areEqual('GET', method, 'Never invoke actions');
        actionReads++;
        List<Object> definitions = new List<Object>();
        for (String action : ACTIONS)
          if (!missingAction || action != ACTIONS[0])
            definitions.add(
              new Map<String, Object>{
                'name' => action,
                'type' => 'APEX',
                'label' => action
              }
            );
        body = new Map<String, Object>{ 'actions' => definitions };
      } else if (method == 'POST' && path == '/api-catalog/mcp-servers') {
        exists = true;
        if (uncertainCreate)
          throw new CalloutException('Unknown write outcome');
        if (duplicateCreate) {
          active = true;
          res.setStatusCode(409);
          body = new List<Object>();
        } else {
          Map<String, Object> input = (Map<String, Object>) JSON.deserializeUntyped(
            req.getBody()
          );
          Assert.areEqual(NAME, input.get('name'), 'Only canonical server');
          Assert.areEqual('PLATFORM', input.get('type'), 'Hosted server');
          body = new Map<String, Object>{
            'server' => server(),
            'assets' => assets
          };
        }
      } else if (
        method == 'PUT' &&
        path == '/api-catalog/mcp-servers/' + ID + '/assets'
      ) {
        Assert.isFalse(
          active,
          'Provision only the newly created inactive server'
        );
        if (failPut) {
          res.setStatusCode(500);
          body = new List<Object>();
        } else {
          List<Object> inputs = (List<Object>) ((Map<String, Object>) JSON.deserializeUntyped(
              req.getBody()
            ))
            .get('assets');
          Assert.areEqual(8, inputs.size(), 'All eight tools in one request');
          Set<String> found = new Set<String>();
          assets = new List<Object>();
          for (Object item : inputs) {
            Map<String, Object> input = (Map<String, Object>) item;
            Assert.areEqual(
              new Set<String>{ 'source', 'sourceId', 'assetId', 'kind' },
              input.keySet(),
              'Bindings only: no names, descriptions, labels or annotation overrides'
            );
            String action = (String) input.get('assetId');
            found.add(action);
            Assert.areEqual(
              'apex-' + action,
              input.get('sourceId'),
              'Exact source identity'
            );
            Assert.areEqual(
              'APEX_ACTION',
              input.get('source'),
              'Existing Apex action'
            );
            assets.add(
              new Map<String, Object>{
                'id' => 'asset' + assets.size(),
                'kind' => 'MCP_TOOL',
                'name' => 'generated_' + action,
                'label' => action,
                'description' => 'Inherited description',
                'annotations' => new Map<String, Object>{
                  'readOnlyHint' => false,
                  'destructiveHint' => false
                }
              }
            );
          }
          Assert.areEqual(
            new Set<String>(ACTIONS),
            found,
            'Exact curated allowlist'
          );
          if (truncatedPut)
            assets.remove(0);
          body = new Map<String, Object>{ 'assets' => assets };
        }
      } else if (
        method == 'PUT' &&
        path.startsWith('/api-catalog/mcp-servers/' + ID + '/assets/')
      ) {
        Assert.isFalse(active, 'Only update an inactive newly created server');
        if (failCurated) {
          res.setStatusCode(500);
          body = new List<Object>();
        } else {
          String assetId = path.substringAfterLast('/');
          Map<String, Object> updateFields = (Map<String, Object>) JSON.deserializeUntyped(
            req.getBody()
          );
          Assert.areEqual(
            new Set<String>{ 'name', 'label', 'annotations' },
            updateFields.keySet(),
            'Preserve inherited description'
          );
          for (Object raw : assets) {
            Map<String, Object> asset = (Map<String, Object>) raw;
            if (asset.get('id') == assetId) {
              asset.putAll(updateFields);
              body = asset;
            }
          }
          Assert.isNotNull(body, 'Only update a returned asset');
        }
      } else if (method == 'GET' && path == '/api-catalog/mcp-servers/' + ID) {
        Map<String, Object> detail = server();
        if (identityChanged)
          detail.put('name', 'DifferentServer');
        body = detail;
      } else if (
        method == 'GET' &&
        path == '/api-catalog/mcp-servers/' + ID + '/assets'
      ) {
        if (changeAfterPut && writes > 0)
          active = true;
        if (changeAnnotationAfterPut && writes == 10)
          ((Map<String, Object>) ((Map<String, Object>) assets[2])
              .get('annotations'))
            .put('readOnlyHint', false);
        if (changeAfterPut && writes > 0 && !assets.isEmpty())
          ((Map<String, Object>) assets[0]).put('label', 'Concurrent edit');
        body = malformedAssets
          ? new Map<String, Object>()
          : new Map<String, Object>{ 'assets' => assets };
      } else {
        Assert.fail('Unexpected endpoint or mutation: ' + method + ' ' + path);
      }
      res.setBody(JSON.serialize(body));
      return res;
    }
  }
  private static CatalogMock setupMock() {
    PackageVisualizerMcpService.permissionOverride = true;
    PackageVisualizerMcpService.credentialOverride = true;
    Package2Interface.useNamedCredentialOverride = true;
    CatalogMock mock = new CatalogMock();
    Test.setMock(HttpCalloutMock.class, mock);
    return mock;
  }
  private static void expectCreationFailure(String message) {
    try {
      PackageVisualizerMcpController.createServer();
      Assert.fail('Expected creation failure');
    } catch (AuraHandledException e) {
      Assert.isTrue(
        e.getMessage().contains(message),
        'Actionable failure: ' + e.getMessage()
      );
    }
  }
  @IsTest
  static void createsAllToolsInactiveWithCuratedDetails() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Integer calls = Limits.getCallouts();
    Test.stopTest();
    Assert.areEqual(14, calls, 'Bounded creation including eight tool updates');
    Assert.areEqual(
      10,
      mock.writes,
      'Create, bulk population and eight updates'
    );
    Assert.isFalse(state.active, 'Activation belongs to Setup');
    Assert.isTrue(state.loaded, 'Verified state');
    Assert.isFalse(state.canCreate, 'Existing server cannot be recreated');
    Assert.areEqual(8, state.assets.size(), 'All tools verified');
    Assert.areEqual(
      'plan_push_upgrade',
      state.assets[0].name,
      'Curated MCP tool name'
    );
    Assert.areEqual(
      'Prepare Bulk Push Upgrade',
      state.assets[0].label,
      'Curated display label'
    );
    Assert.isTrue(
      state.assets[1].annotations.get('destructiveHint'),
      'Execute is destructive'
    );
    Assert.isTrue(
      state.assets[1].annotations.get('idempotentHint'),
      'Execute is idempotent'
    );
    Assert.isTrue(
      state.assets[2].annotations.get('readOnlyHint'),
      'Status is read only'
    );
    Assert.isTrue(
      state.assets[2].annotations.get('idempotentHint'),
      'Status is idempotent'
    );
    Assert.areEqual(
      'Inherited description',
      state.assets[0].description,
      'Native metadata retained'
    );
    Assert.isFalse(
      state.assets[0].annotations.get('destructiveHint'),
      'Display actual platform defaults'
    );
    Assert.isTrue(
      JSON.serialize(state).contains('plan_push_upgrade'),
      'Supported top-level DTO serializes'
    );
  }
  @IsTest
  static void absentReadNeedsOneCallAndNoWrites() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.getProvisioningState();
    Integer calls = Limits.getCallouts();
    Test.stopTest();
    Assert.areEqual(1, calls, 'No discovery before explicit creation');
    Assert.isTrue(state.canCreate, 'Creation available');
    Assert.isTrue(state.loaded, 'Known absent');
    Assert.areEqual(0, mock.writes, 'Read only');
  }
  private static void assertExistingUnchanged(Boolean active) {
    CatalogMock mock = setupMock();
    mock.active = active;
    mock.missingAction = true;
    mock.assets.add(
      new Map<String, Object>{
        'id' => 'extra',
        'kind' => 'MCP_PROMPT',
        'name' => 'AdminPrompt',
        'description' => 'Keep custom description',
        'annotations' => null
      }
    );
    String before = JSON.serialize(mock.assets);
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Integer calls = Limits.getCallouts();
    Test.stopTest();
    Assert.areEqual(3, calls, 'Read-only existing-server path');
    Assert.areEqual(0, mock.writes, 'Existing server is never edited');
    Assert.areEqual(
      0,
      mock.actionReads,
      'Installed actions do not gate existing servers'
    );
    Assert.areEqual(active, state.active, 'Activation preserved');
    Assert.areEqual(
      before,
      JSON.serialize(mock.assets),
      'All existing assets preserved'
    );
    Assert.areEqual(
      'AdminPrompt',
      state.assets[0].name,
      'Actual configuration displayed'
    );
  }
  @IsTest
  static void activeExistingServerIsNeverWritten() {
    assertExistingUnchanged(true);
  }
  @IsTest
  static void inactiveExistingServerIsNeverWritten() {
    assertExistingUnchanged(false);
  }
  @IsTest
  static void emptyExistingServerIsNotRepaired() {
    CatalogMock mock = setupMock();
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Test.stopTest();
    Assert.isTrue(state.assets.isEmpty(), 'Respect empty configuration');
    Assert.areEqual(0, mock.writes, 'No automatic repair');
  }
  @IsTest
  static void refreshReflectsExternalActivationAndAssets() {
    CatalogMock mock = setupMock();
    Test.startTest();
    PackageVisualizerMcpStateDTO first = PackageVisualizerMcpController.getProvisioningState();
    mock.active = true;
    mock.assets.add(
      new Map<String, Object>{
        'id' => 'external',
        'name' => 'Renamed tool',
        'kind' => 'MCP_TOOL',
        'annotations' => new Map<String, Object>{
          'readOnlyHint' => true,
          'destructiveHint' => true
        }
      }
    );
    PackageVisualizerMcpStateDTO second = PackageVisualizerMcpController.getProvisioningState();
    Test.stopTest();
    Assert.isFalse(first.active, 'Initial state');
    Assert.isTrue(second.active, 'External activation reflected');
    Assert.areEqual(1, second.assets.size(), 'External membership reflected');
    Assert.isTrue(
      second.assets[0].annotations.get('destructiveHint'),
      'Actual annotations displayed'
    );
    Assert.areEqual(0, mock.writes, 'Never synchronize');
  }
  @IsTest
  static void missingActionBlocksBeforeCreation() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.missingAction = true;
    Test.startTest();
    expectCreationFailure('Required action unavailable');
    Test.stopTest();
    Assert.areEqual(
      0,
      mock.writes,
      'No partial server when prerequisites missing'
    );
  }
  @IsTest
  static void populationFailureDoesNotRepopulateOnRetry() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.failPut = true;
    Test.startTest();
    expectCreationFailure('HTTP 500');
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Test.stopTest();
    Assert.areEqual(2, mock.writes, 'No retry writes');
    Assert.isFalse(state.active, 'Leave inactive');
    Assert.isTrue(state.assets.isEmpty(), 'Finish manually in Setup');
  }
  @IsTest
  static void uncertainCreationIsNotRetried() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.uncertainCreate = true;
    Test.startTest();
    expectCreationFailure('could not be confirmed');
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Test.stopTest();
    Assert.areEqual(1, mock.writes, 'Never blindly retry creation');
    Assert.areEqual(ID, state.serverId, 'Reload existing server');
  }
  @IsTest
  static void concurrentCreationConflictDoesNotPopulateOtherServer() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.duplicateCreate = true;
    Test.startTest();
    expectCreationFailure('HTTP 409');
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Test.stopTest();
    Assert.areEqual(1, mock.writes, 'No membership write to competing server');
    Assert.isTrue(state.active, 'Respect its activation');
  }
  @IsTest
  static void conflictingCanonicalIdentityBlocksWrites() {
    CatalogMock mock = setupMock();
    mock.conflict = true;
    Test.startTest();
    expectCreationFailure('conflicting definition');
    Test.stopTest();
    Assert.areEqual(0, mock.writes, 'Never overwrite identity collision');
  }
  @IsTest
  static void duplicateCanonicalNameBlocksWrites() {
    CatalogMock mock = setupMock();
    mock.duplicateListing = true;
    Test.startTest();
    expectCreationFailure('ambiguous');
    Test.stopTest();
    Assert.areEqual(0, mock.writes, 'Never pick an arbitrary match');
  }
  @IsTest
  static void changedDetailIdentityIsNotDisplayed() {
    CatalogMock mock = setupMock();
    mock.identityChanged = true;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.getProvisioningState();
    Test.stopTest();
    Assert.isFalse(state.loaded, 'Do not claim a verified read');
    Assert.isFalse(state.issues.isEmpty(), 'Explain identity mismatch');
    Assert.areEqual(0, mock.writes, 'Read only');
  }
  @IsTest
  static void incompleteAssetListIsNotAnEmptySuccess() {
    CatalogMock mock = setupMock();
    mock.malformedAssets = true;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.getProvisioningState();
    Test.stopTest();
    Assert.isFalse(state.loaded, 'Incomplete response is not success');
    Assert.isFalse(state.canCreate, 'Unknown state never offers Create');
  }
  @IsTest
  static void partialPopulationResponseFailsVerification() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.truncatedPut = true;
    Test.startTest();
    expectCreationFailure('fully confirmed');
    Test.stopTest();
    Assert.isFalse(mock.active, 'No activation after partial population');
    Assert.areEqual(2, mock.writes, 'Stop after failure');
  }
  @IsTest
  static void concurrentAssetChangeFailsVerification() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.changeAfterPut = true;
    Test.startTest();
    expectCreationFailure('changed during creation');
    Test.stopTest();
    Assert.areEqual(10, mock.writes, 'Never attempt repair or reactivation');
  }
  @IsTest
  static void missingPermissionBlocksAllRequests() {
    CatalogMock mock = setupMock();
    PackageVisualizerMcpService.permissionOverride = false;
    Test.startTest();
    expectCreationFailure('administrator');
    Integer calls = Limits.getCallouts();
    Test.stopTest();
    Assert.areEqual(0, calls, 'Guard before requests');
    Assert.areEqual(0, mock.writes, 'No mutations');
  }
  @IsTest
  static void missingCredentialBlocksAllRequests() {
    setupMock();
    PackageVisualizerMcpService.credentialOverride = false;
    Test.startTest();
    expectCreationFailure('Named Credential');
    Integer calls = Limits.getCallouts();
    Test.stopTest();
    Assert.areEqual(0, calls, 'Credential access checked first');
  }
  @IsTest
  static void sessionCreationUsesOneRouteForAllSixRequests() {
    CatalogMock mock = setupMock();
    Package2Interface.useNamedCredentialOverride = false;
    // An unavailable Named Credential must not gate the selected session route.
    PackageVisualizerMcpService.credentialOverride = false;
    mock.useNamedCredential = false;
    mock.changeAuthChoice = true;
    mock.exists = false;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Test.stopTest();
    Assert.isTrue(state.loaded, 'Session route verifies creation');
    Assert.isFalse(state.active, 'Creation remains inactive');
    Assert.areEqual(8, state.assets.size(), 'All curated tools populated');
    Assert.areEqual(14, mock.requests, 'No authentication retries');
    Assert.areEqual(10, mock.writes, 'Create, populate and curate');
  }
  @IsTest
  static void failedToolUpdateStopsWithoutRetry() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.failCurated = true;
    Test.startTest();
    expectCreationFailure('HTTP 500');
    Test.stopTest();
    Assert.areEqual(3, mock.writes, 'Stop at first unsuccessful tool update');
    Assert.isFalse(mock.active, 'Leave partial server inactive');
  }
  @IsTest
  static void changedAnnotationFailsVerification() {
    CatalogMock mock = setupMock();
    mock.exists = false;
    mock.changeAnnotationAfterPut = true;
    Test.startTest();
    expectCreationFailure('tool details could not be verified');
    Test.stopTest();
    Assert.areEqual(10, mock.writes, 'No repair after a verification mismatch');
    Assert.isFalse(mock.active, 'Leave the server inactive');
  }
  @IsTest
  static void sessionRoutePreservesExistingActiveServer() {
    CatalogMock mock = setupMock();
    Package2Interface.useNamedCredentialOverride = false;
    mock.useNamedCredential = false;
    mock.active = true;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.createServer();
    Test.stopTest();
    Assert.isTrue(state.loaded, 'Existing server read successfully');
    Assert.isTrue(state.active, 'Existing activation preserved');
    Assert.areEqual(3, mock.requests, 'Existing server only read');
    Assert.areEqual(0, mock.writes, 'No changes to existing server');
  }
  @IsTest
  static void namedCredentialRouteDoesNotSwitchDuringOperation() {
    CatalogMock mock = setupMock();
    mock.changeAuthChoice = true;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.getProvisioningState();
    Test.stopTest();
    Assert.isTrue(state.loaded, 'Original authentication remains in use');
    Assert.areEqual(3, mock.requests, 'No fallback requests');
  }
  @IsTest
  static void namedCredentialDenialDoesNotFallBackToSession() {
    CatalogMock mock = setupMock();
    mock.failureStatus = 403;
    Test.startTest();
    expectCreationFailure('HTTP 403');
    Test.stopTest();
    Assert.areEqual(1, mock.requests, 'Stop on access denial');
    Assert.areEqual(0, mock.writes, 'No writes or session fallback');
  }
  @IsTest
  static void expiredSessionDoesNotRetryOrExposeSession() {
    CatalogMock mock = setupMock();
    Package2Interface.useNamedCredentialOverride = false;
    mock.useNamedCredential = false;
    mock.failureStatus = 401;
    Test.startTest();
    PackageVisualizerMcpStateDTO state = PackageVisualizerMcpController.getProvisioningState();
    Test.stopTest();
    Assert.isFalse(
      state.loaded,
      'Authentication failure is not a successful read'
    );
    Assert.isTrue(state.issues[0].contains('HTTP 401'), 'Actionable status');
    Assert.isFalse(
      JSON.serialize(state).contains('getContent'),
      'Never expose session'
    );
    Assert.areEqual(1, mock.requests, 'No automatic authentication retry');
  }
}
