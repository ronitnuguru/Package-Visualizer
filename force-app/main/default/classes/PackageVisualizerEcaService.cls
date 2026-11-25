/** Creates the local Tooling ECA once through authenticated Metadata API calls. */
public with sharing class PackageVisualizerEcaService {
  private static final String APP = 'PackageVisualizerTooling';
  private static final String LABEL = 'Package Visualizer Tooling';
  private static final String DESCRIPTION = 'Subscriber-owned OAuth app created by Package Visualizer for same-org Tooling API access.';
  private static final String NS = 'http://soap.sforce.com/2006/04/metadata';
  private static final String SOAP = 'http://schemas.xmlsoap.org/soap/envelope/';
  @TestVisible
  private static Boolean permissionOverride;
  private String sessionId;
  private Long started = DateTime.now().getTime();
  public class EcaException extends Exception {
  }

  /** Reads metadata only; no consumer credentials are returned to the client. */
  public PackageVisualizerEcaStateDTO getState() {
    initialize();
    return readState();
  }

  /** Existing apps are never updated or rotated, including after partial failure. */
  public PackageVisualizerEcaStateDTO createLocalEca(
    String runAsUsername,
    String contactEmail
  ) {
    initialize();
    PackageVisualizerEcaStateDTO existing = readState();
    if (existing.exists)
      return existing;
    if (String.isBlank(runAsUsername))
      fail('Enter the Run As username before creating the ECA.');
    runAsUsername = runAsUsername.trim();
    List<User> users = [
      SELECT Id
      FROM User
      WHERE Username = :runAsUsername AND IsActive = TRUE
      WITH USER_MODE
      LIMIT 1
    ];
    if (users.isEmpty())
      fail('Choose an active Run As user in this org.');
    contactEmail = String.isBlank(contactEmail)
      ? UserInfo.getUserEmail()
      : contactEmail.trim();
    if (
      String.isBlank(contactEmail) ||
      !Pattern.matches('[^\\s@]+@[^\\s@]+\\.[^\\s@]+', contactEmail)
    )
      fail('Enter a valid contact email address.');
    create(
      'ExternalClientApplication',
      APP,
      tag('contactEmail', contactEmail) +
        tag('description', DESCRIPTION) +
        tag('distributionState', 'Local') +
        tag('label', LABEL)
    );
    // OAuth settings must precede global OAuth settings; verified in a subscriber org.
    create(
      'ExtlClntAppOauthSettings',
      APP + '_oauth',
      // Previous API-only scope: tag('commaSeparatedOauthScopes', 'Api')
      tag('commaSeparatedOauthScopes', 'Api,RefreshToken') +
        tag('externalClientApplication', APP) +
        tag('label', LABEL)
    );
    create(
      'ExtlClntAppGlobalOauthSettings',
      APP + '_global',
      tag(
          'callbackUrl',
          'https://login.salesforce.com/services/oauth2/callback'
        ) +
        tag('externalClientApplication', APP) +
        tag('isClientCredentialsFlowEnabled', 'true') +
        tag('label', LABEL)
    );
    create(
      'ExtlClntAppOauthConfigurablePolicies',
      APP + '_oauthPolicies',
      tag('clientCredentialsFlowUser', runAsUsername) +
        tag('externalClientApplication', APP) +
        tag('isClientCredentialsFlowEnabled', 'true') +
        tag('label', LABEL)
    );
    PackageVisualizerEcaStateDTO verified = readState();
    if (!verified.configured || verified.runAsUsername != runAsUsername)
      fail(
        'ECA creation could not be fully verified. Review the existing app in Setup before retrying.'
      );
    return verified;
  }

  private void initialize() {
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
        'An administrator with Package Visualizer and setup permissions must create the ECA.'
      );
    // Bootstrap as the current administrator: the Tooling Named Credential may not work yet.
    sessionId = Package2Interface.getSessionId();
    if (String.isBlank(sessionId))
      fail(
        'Administrator session unavailable. Sign in again before creating the ECA.'
      );
  }

  private PackageVisualizerEcaStateDTO readState() {
    PackageVisualizerEcaStateDTO state = new PackageVisualizerEcaStateDTO();
    Dom.XmlNode header = read('ExternalClientApplication', APP);
    if (header == null)
      return state;
    state.exists = true;
    List<ExternalClientApplication> apps = [
      SELECT Id
      FROM ExternalClientApplication
      WHERE DeveloperName = :APP AND NamespacePrefix = NULL
      WITH USER_MODE
      LIMIT 1
    ];
    if (!apps.isEmpty())
      state.appId = apps[0].Id;
    if (
      value(header, 'distributionState') != 'Local' ||
      value(header, 'description') != DESCRIPTION
    ) {
      state.message = 'An app with this API name already exists. Review it in Setup; Package Visualizer will not overwrite it.';
      return state;
    }
    Dom.XmlNode oauth = read('ExtlClntAppOauthSettings', APP + '_oauth');
    Dom.XmlNode globalSettings = read(
      'ExtlClntAppGlobalOauthSettings',
      APP + '_global'
    );
    Dom.XmlNode policies = read(
      'ExtlClntAppOauthConfigurablePolicies',
      APP + '_oauthPolicies'
    );
    state.runAsUsername = value(policies, 'clientCredentialsFlowUser');
    state.configured =
      value(oauth, 'externalClientApplication') == APP &&
      // Previous API-only check: value(oauth, 'commaSeparatedOauthScopes') == 'Api'
      hasRequiredScopes(value(oauth, 'commaSeparatedOauthScopes')) &&
      value(globalSettings, 'externalClientApplication') == APP &&
      value(globalSettings, 'isClientCredentialsFlowEnabled') == 'true' &&
      value(policies, 'externalClientApplication') == APP &&
      value(policies, 'isClientCredentialsFlowEnabled') == 'true' &&
      String.isNotBlank(state.runAsUsername);
    state.message = state.configured
      ? 'Local ECA configured. Retrieve its Consumer Key and Consumer Secret in Setup, then save them in the credential step below.'
      : 'The local ECA exists but setup is incomplete or has changed. Review it in Setup; it will not be overwritten.';
    return state;
  }

  private static Boolean hasRequiredScopes(String scopeList) {
    Set<String> scopes = new Set<String>();
    if (scopeList != null)
      for (String scope : scopeList.split(','))
        scopes.add(scope.trim());
    return scopes.contains('Api') &&
      (scopes.contains('RefreshToken') || scopes.contains('OfflineAccess'));
  }

  private Dom.XmlNode read(String type, String name) {
    Dom.XmlNode response = send(
      'readMetadata',
      tag('type', type) + tag('fullNames', name)
    );
    Dom.XmlNode record = response.getChildElement('result', NS)
      ?.getChildElement('records', NS);
    return String.isBlank(value(record, 'fullName')) ? null : record;
  }

  private void create(String type, String name, String fields) {
    Dom.XmlNode response = send(
      'createMetadata',
      '<metadata xsi:type="' +
        type +
        '">' +
        tag('fullName', name) +
        fields +
        '</metadata>'
    );
    Dom.XmlNode result = response.getChildElement('result', NS);
    if (value(result, 'success') != 'true') {
      Dom.XmlNode error = result?.getChildElement('errors', NS);
      String code = value(error, 'statusCode');
      fail(
        'ECA creation stopped (' +
          (String.isBlank(code) ? 'unconfirmed result' : code) +
          '). Refresh and review the app in Setup. Check metadata permissions and the Run As user.'
      );
    }
  }

  private Dom.XmlNode send(String operation, String payload) {
    Long remaining = 90000 - (DateTime.now().getTime() - started);
    if (remaining < 1000)
      fail(
        'ECA setup time limit reached. Refresh and review the app before retrying.'
      );
    HttpRequest req = new HttpRequest();
    req.setEndpoint(
      URL.getOrgDomainUrl().toExternalForm() + '/services/Soap/m/68.0'
    );
    req.setMethod('POST');
    req.setTimeout(Integer.valueOf(String.valueOf(Math.min(remaining, 10000))));
    req.setHeader('Content-Type', 'text/xml');
    req.setHeader('SOAPAction', operation);
    req.setBody(
      '<env:Envelope xmlns:env="' +
        SOAP +
        '" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><env:Header><SessionHeader xmlns="' +
        NS +
        '">' +
        tag('sessionId', sessionId) +
        '</SessionHeader></env:Header><env:Body><' +
        operation +
        ' xmlns="' +
        NS +
        '">' +
        payload +
        '</' +
        operation +
        '></env:Body></env:Envelope>'
    );
    HttpResponse res;
    try {
      res = new Http().send(req);
    } catch (CalloutException e) {
      throw new EcaException(
        'ECA request could not be confirmed. Refresh and review Setup before retrying.',
        e
      );
    }
    Dom.Document doc = new Dom.Document();
    try {
      doc.load(res.getBody());
    } catch (System.XmlException e) {
      throw new EcaException(
        'Metadata API returned an unreadable response. Review the app in Setup.',
        e
      );
    }
    Dom.XmlNode body = doc.getRootElement().getChildElement('Body', SOAP);
    if (
      res.getStatusCode() != 200 ||
      body == null ||
      body.getChildElement('Fault', SOAP) != null ||
      body.getChildElements().isEmpty()
    )
      fail(
        'Metadata API access failed. Check your session, Metadata API and External Client App permissions, then refresh.'
      );
    Dom.XmlNode response = body.getChildElements()[0];
    if (response.getName() != operation + 'Response')
      fail(
        'Metadata API response could not be verified. Review Setup before retrying.'
      );
    return response;
  }
  private static String tag(String name, String text) {
    return '<' + name + '>' + text.escapeXml() + '</' + name + '>';
  }
  private static String value(Dom.XmlNode node, String name) {
    return node?.getChildElement(name, NS)?.getText();
  }
  private static void fail(String message) {
    throw new EcaException(message);
  }
}
