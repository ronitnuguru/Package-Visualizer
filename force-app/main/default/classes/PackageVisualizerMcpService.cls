/** Creates the package MCP server once; existing servers are always read-only. */
public with sharing class PackageVisualizerMcpService {
  private static final String SERVER_NAME = 'PackageVisualizerCustomMcpServer';
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
  private static final Map<String, Map<String, Object>> CURATED = new Map<String, Map<String, Object>>{
    'pkgviz__HeadlessPlanPushAction' => curated(
      'plan_push_upgrade',
      'Prepare Bulk Push Upgrade',
      false,
      false,
      false
    ),
    'pkgviz__HeadlessExecutePushAction' => curated(
      'execute_push_upgrade',
      'Execute Prepared Push Upgrade',
      false,
      true,
      true
    ),
    'pkgviz__HeadlessPushStatusAction' => curated(
      'get_push_upgrade_status',
      'Get Prepared Push Upgrade Status',
      true,
      false,
      true
    ),
    'pkgviz__HeadlessCancelPushAction' => curated(
      'cancel_push_upgrade',
      'Cancel Prepared Push Upgrade',
      false,
      true,
      true
    ),
    'pkgviz__HeadlessResolvePushTargetAction' => curated(
      'resolve_push_target',
      'Resolve Push Target',
      true,
      false,
      true
    ),
    'pkgviz__HeadlessPreviewPushAction' => curated(
      'preview_push_upgrade',
      'Preview Push Upgrade',
      true,
      false,
      true
    ),
    'pkgviz__HeadlessFindPushRunsAction' => curated(
      'find_push_upgrades',
      'Find My Push Upgrades',
      true,
      false,
      true
    ),
    'pkgviz__AgentforcePushRequestAnalysisAction' => curated(
      'analyze_push_upgrade',
      'Analyze Push Request Context',
      true,
      false,
      true
    )
  };
  @TestVisible
  private static Boolean permissionOverride;
  @TestVisible
  private static Boolean credentialOverride;
  private Long started = DateTime.now().getTime();
  private String apiBase;
  private String sessionId;

  public class ProvisioningException extends Exception {
  }
  private static Map<String, Object> curated(
    String name,
    String label,
    Boolean readOnly,
    Boolean destructive,
    Boolean idempotent
  ) {
    return new Map<String, Object>{
      'name' => name,
      'label' => label,
      'annotations' => new Map<String, Object>{
        'readOnlyHint' => readOnly,
        'destructiveHint' => destructive,
        'idempotentHint' => idempotent,
        'openWorldHint' => false,
        'returnDirect' => false
      }
    };
  }
  /** Internal state copied into the supported top-level LWC DTO. */
  public class State {
    public String serverId;
    public String serverUrl;
    public Boolean active = false;
    public Boolean loaded = false;
    public Boolean canCreate = false;
    public List<String> issues = new List<String>();
    public List<Map<String, Object>> assets = new List<Map<String, Object>>();
  }
  /** Read the actual configuration without probing or reconciling package tools. */
  public State getState() {
    try {
      guard();
      return readState();
    } catch (Exception e) {
      State state = new State();
      state.issues.add(
        e instanceof ProvisioningException
          ? e.getMessage()
          : 'Unable to read MCP configuration. Refresh or check connection setup.'
      );
      return state;
    }
  }
  /** Create only when absent. An existing server is returned without any writes. */
  public State createServer() {
    guard();
    State existing = readState();
    if (existing.serverId != null)
      return existing;
    Set<String> installed = new Set<String>();
    for (
      Object item : items(
        request('GET', '/actions/custom/apex', null),
        'actions'
      )
    ) {
      Map<String, Object> action = (Map<String, Object>) item;
      if (action.get('type') == 'APEX')
        installed.add((String) action.get('name'));
    }
    for (String action : ACTIONS) {
      if (!installed.contains(action))
        fail(
          'Required action unavailable: ' +
            action +
            '. Check Agentforce Extension installation and credential access.'
        );
    }
    // Leave enough time before the first remote mutation; failures are never retried automatically.
    if (DateTime.now().getTime() - started > 75000)
      fail(
        'Provisioning time limit reached. Refresh before creating the server.'
      );
    Map<String, Object> response = request(
      'POST',
      '/api-catalog/mcp-servers',
      new Map<String, Object>{
        'name' => SERVER_NAME,
        'type' => 'PLATFORM',
        'label' => 'Package Visualizer Custom MCP Server',
        'description' => 'Package Visualizer custom tools. Managed by your administrator in Salesforce Setup.'
      }
    );
    Map<String, Object> server = (Map<String, Object>) response.get('server');
    if (server == null || String.isBlank((String) server.get('id')))
      fail(
        'Server creation could not be confirmed. Refresh and review it in Setup before retrying.'
      );
    String id = (String) server.get('id');
    validateIdentity(server, id);
    if (server.get('active') != false)
      fail('The new server is unexpectedly active. Review it in Setup.');
    List<Object> bindings = new List<Object>();
    for (String action : ACTIONS)
      bindings.add(
        new Map<String, Object>{
          'source' => 'APEX_ACTION',
          'sourceId' => 'apex-' + action,
          'assetId' => action,
          'kind' => 'MCP_TOOL'
        }
      );
    List<Object> saved = items(
      request(
        'PUT',
        '/api-catalog/mcp-servers/' + id + '/assets',
        new Map<String, Object>{ 'assets' => bindings }
      ),
      'assets'
    );
    Map<String, Object> expected = assetMap(saved);
    if (expected.size() != ACTIONS.size())
      fail(
        'Tool creation could not be fully confirmed. Leave the server inactive and review it in Setup.'
      );
    Map<String, String> idsByAction = new Map<String, String>();
    for (Object item : saved) {
      Map<String, Object> asset = (Map<String, Object>) item;
      String action = (String) asset.get('label');
      if (
        asset.get('kind') != 'MCP_TOOL' ||
        !CURATED.containsKey(action) ||
        idsByAction.containsKey(action)
      )
        fail(
          'Tool identities could not be confirmed. Review the inactive server in Setup.'
        );
      idsByAction.put(action, (String) asset.get('id'));
    }
    for (String action : ACTIONS)
      request(
        'PUT',
        '/api-catalog/mcp-servers/' + id + '/assets/' + idsByAction.get(action),
        CURATED.get(action)
      );
    State verified = readServer(id);
    List<Object> actual = new List<Object>();
    actual.addAll(verified.assets);
    Map<String, Object> actualById = assetMap(actual);
    if (verified.active || expected.keySet() != actualById.keySet())
      fail(
        'The new server changed during creation. Review its current state in Setup.'
      );
    for (String action : ACTIONS) {
      Map<String, Object> asset = (Map<String, Object>) actualById.get(
        idsByAction.get(action)
      );
      Map<String, Object> original = (Map<String, Object>) expected.get(
        idsByAction.get(action)
      );
      Map<String, Object> definition = CURATED.get(action);
      if (
        asset.get('kind') != 'MCP_TOOL' ||
        asset.get('name') != definition.get('name') ||
        asset.get('label') != definition.get('label') ||
        asset.get('description') != original.get('description') ||
        asset.get('annotations') != definition.get('annotations')
      )
        fail(
          'The new server changed during creation or tool details could not be verified. Review it in Setup.'
        );
    }
    return verified;
  }
  private State readState() {
    String id;
    for (
      Object item : items(
        request('GET', '/api-catalog/mcp-servers', null),
        'mcpServers'
      )
    ) {
      Map<String, Object> server = (Map<String, Object>) item;
      if (server.get('name') != SERVER_NAME)
        continue;
      if (id != null)
        fail('The canonical server name is ambiguous. Review it in Setup.');
      id = (String) server.get('id');
      validateIdentity(server, id);
    }
    if (id != null)
      return readServer(id);
    State state = new State();
    state.loaded = true;
    state.canCreate = true;
    return state;
  }
  private State readServer(String id) {
    String path = '/api-catalog/mcp-servers/' + id;
    Map<String, Object> server = request('GET', path, null);
    validateIdentity(server, id);
    if (!(server.get('active') instanceof Boolean))
      fail(
        'Activation state is unavailable. Refresh or review the server in Setup.'
      );
    List<Object> assets = items(
      request('GET', path + '/assets', null),
      'assets'
    );
    assetMap(assets);
    State state = new State();
    state.serverId = id;
    state.serverUrl = (String) server.get('serverUrl');
    state.active = (Boolean) server.get('active');
    state.loaded = true;
    for (Object asset : assets)
      state.assets.add((Map<String, Object>) asset);
    return state;
  }
  private static void validateIdentity(Map<String, Object> server, String id) {
    if (
      String.isBlank(id) ||
      server.get('id') != id ||
      server.get('name') != SERVER_NAME ||
      server.get('type') != 'PLATFORM' ||
      server.get('source') != 'CUSTOM'
    )
      fail(
        'The canonical server has a conflicting definition. Review it in Salesforce Setup.'
      );
  }
  private static List<Object> items(Map<String, Object> response, String key) {
    if (!(response.get(key) instanceof List<Object>))
      fail(
        'Salesforce returned an incomplete response. Refresh before continuing.'
      );
    return (List<Object>) response.get(key);
  }
  private static Map<String, Object> assetMap(List<Object> assets) {
    Map<String, Object> result = new Map<String, Object>();
    for (Object item : assets) {
      Map<String, Object> asset = (Map<String, Object>) item;
      String id = (String) asset.get('id');
      if (String.isBlank(id) || result.containsKey(id))
        fail(
          'Salesforce returned incomplete or duplicate asset identities. Review the server in Setup.'
        );
      result.put(id, asset);
    }
    return result;
  }
  private void guard() {
    Boolean permitted = permissionOverride;
    if (!Test.isRunningTest() || permitted == null) {
      UserPermissionAccess access = [
        SELECT PermissionsCustomizeApplication, PermissionsViewSetup
        FROM UserPermissionAccess
        WITH USER_MODE
        LIMIT 1
      ];
      permitted =
        FeatureManagement.checkPermission('Package_Visualizer_Core') &&
        access.PermissionsCustomizeApplication &&
        access.PermissionsViewSetup;
    }
    if (!permitted)
      fail(
        'Ask an administrator to assign Package Visualizer Permission and the required setup permissions.'
      );
    // Follow the app's authentication choice once, before any API Catalog request.
    apiBase = Package2Interface.getApiHost() + '/services/data/v68.0';
    if (!apiBase.startsWith('callout:')) {
      try {
        // Keep the Visualforce session server-side and reuse it throughout this operation.
        sessionId = Package2Interface.getSessionId();
      } catch (Exception e) {
        throw new ProvisioningException(
          'Unable to establish the administrator session. Sign in again and check Visualforce page access.',
          e
        );
      }
      if (String.isBlank(sessionId))
        fail(
          'Administrator session unavailable. Sign in again before retrying.'
        );
      return;
    }
    sessionId = null;
    if (Test.isRunningTest() && credentialOverride != null) {
      if (!credentialOverride)
        fail('Complete Named Credential setup in Setup Assistant.');
      return;
    }
    ToolingCredentialService.IntegrationStatus status = ToolingCredentialService.getStatus();
    if (
      status.namedCredentialUrl != URL.getOrgDomainUrl().toExternalForm() ||
      status.calloutStatus != 'Enabled'
    )
      fail(
        'Complete Named Credential setup for this org and enable callouts in Setup Assistant.'
      );
  }

  private Map<String, Object> request(String method, String path, Object body) {
    Long remaining = 105000 - (DateTime.now().getTime() - started);
    if (remaining < 1000 || Limits.getCallouts() >= 95)
      fail(
        'Provisioning time limit reached. Refresh to check the server before retrying.'
      );
    HttpRequest req = new HttpRequest();
    req.setEndpoint(apiBase + path);
    if (sessionId != null)
      req.setHeader('Authorization', 'Bearer ' + sessionId);
    req.setMethod(method);
    req.setTimeout(Integer.valueOf(String.valueOf(Math.min(remaining, 10000))));
    if (body != null) {
      req.setHeader('Content-Type', 'application/json');
      req.setBody(JSON.serialize(body));
    }
    HttpResponse res;
    try {
      res = new Http().send(req);
    } catch (CalloutException e) {
      throw new ProvisioningException(
        'API request could not be confirmed. Refresh and review the server in Setup before retrying.'
      );
    }
    if (res.getStatusCode() < 200 || res.getStatusCode() >= 300)
      fail(
        'Salesforce API returned HTTP ' +
          res.getStatusCode() +
          '. Refresh and check permissions or the server in Setup.'
      );
    if (String.isBlank(res.getBody()))
      return new Map<String, Object>();
    return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
  }
  private static void fail(String message) {
    throw new ProvisioningException(message);
  }
}
