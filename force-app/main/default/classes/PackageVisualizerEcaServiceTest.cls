/** Metadata contract tests for local ECA provisioning and safe recovery. */
@IsTest
private with sharing class PackageVisualizerEcaServiceTest {
  private static final String NS = 'http://soap.sforce.com/2006/04/metadata';
  private class MetadataMock implements HttpCalloutMock {
    Map<String, String> records = new Map<String, String>();
    Integer writes = 0;
    Integer calls = 0;
    Integer failWrite;
    Boolean fault = false;
    Boolean malformed = false;
    Boolean corruptPolicy = false;
    public HttpResponse respond(HttpRequest req) {
      calls++;
      Assert.areEqual(
        URL.getOrgDomainUrl().toExternalForm() + '/services/Soap/m/68.0',
        req.getEndpoint(),
        'Current org only, independent of Named Credential'
      );
      Assert.areEqual('POST', req.getMethod(), 'SOAP request');
      HttpResponse response = new HttpResponse();
      response.setStatusCode(200);
      if (malformed) {
        response.setBody('<invalid></different>');
        return response;
      }
      String result;
      String operation = req.getHeader('SOAPAction');
      Dom.Document request = new Dom.Document();
      request.load(req.getBody());
      Dom.XmlNode body = request.getRootElement()
        .getChildElement('Body', 'http://schemas.xmlsoap.org/soap/envelope/');
      Dom.XmlNode action = body.getChildElements()[0];
      if (fault) {
        result = '<env:Fault><faultcode>INVALID_SESSION_ID</faultcode><faultstring>secret-should-not-escape</faultstring></env:Fault>';
      } else if (operation == 'readMetadata') {
        String type = action.getChildElement('type', NS).getText();
        String content = records.get(type);
        if (
          corruptPolicy &&
          type == 'ExtlClntAppOauthConfigurablePolicies' &&
          content != null
        )
          content = content.replace(
            '<isClientCredentialsFlowEnabled>true</isClientCredentialsFlowEnabled>',
            '<isClientCredentialsFlowEnabled>false</isClientCredentialsFlowEnabled>'
          );
        result =
          '<readMetadataResponse xmlns="' +
          NS +
          '"><result>' +
          (content == null
            ? '<records xsi:nil="true"/>'
            : '<records xsi:type="' + type + '">' + content + '</records>') +
          '</result></readMetadataResponse>';
      } else {
        Assert.areEqual(
          'createMetadata',
          operation,
          'Never update, delete, rotate or change org settings'
        );
        writes++;
        Dom.XmlNode metadata = action.getChildElement('metadata', NS);
        String type = metadata.getAttribute(
          'type',
          'http://www.w3.org/2001/XMLSchema-instance'
        );
        if (writes == failWrite) {
          result =
            '<createMetadataResponse xmlns="' +
            NS +
            '"><result><errors><message>secret-should-not-escape</message><statusCode>INVALID_FIELD</statusCode></errors><success>false</success></result></createMetadataResponse>';
        } else {
          String content = req.getBody()
            .substringAfter('<metadata xsi:type="' + type + '">')
            .substringBefore('</metadata>');
          Assert.isFalse(
            content.contains('<consumerSecret>'),
            'Do not supply or rotate credentials'
          );
          if (type == 'ExternalClientApplication')
            Assert.isTrue(
              content.contains('<distributionState>Local</distributionState>'),
              'Subscriber-owned Local app'
            );
          if (type == 'ExtlClntAppGlobalOauthSettings')
            Assert.isTrue(
              records.containsKey('ExtlClntAppOauthSettings'),
              'Correct dependency order'
            );
          records.put(type, content);
          result =
            '<createMetadataResponse xmlns="' +
            NS +
            '"><result><success>true</success></result></createMetadataResponse>';
        }
      }
      response.setBody(
        '<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><env:Body>' +
          result +
          '</env:Body></env:Envelope>'
      );
      return response;
    }
  }
  private static MetadataMock setup() {
    PackageVisualizerEcaService.permissionOverride = true;
    MetadataMock mock = new MetadataMock();
    Test.setMock(HttpCalloutMock.class, mock);
    return mock;
  }
  private static void expectFailure(String message) {
    try {
      PackageVisualizerEcaController.createLocalEca(
        UserInfo.getUserName(),
        'admin@example.com'
      );
      Assert.fail('Expected failure');
    } catch (AuraHandledException e) {
      Assert.isTrue(
        e.getMessage().contains(message),
        'Actionable sanitized error: ' + e.getMessage()
      );
      Assert.isFalse(
        e.getMessage().contains('secret-should-not-escape'),
        'No response body exposure'
      );
    }
  }
  @IsTest
  static void createsAndVerifiesLocalAppWithoutNamedCredential() {
    MetadataMock mock = setup();
    Test.startTest();
    PackageVisualizerEcaStateDTO state = PackageVisualizerEcaController.createLocalEca(
      UserInfo.getUserName(),
      null
    );
    Test.stopTest();
    Assert.isTrue(state.exists, 'Created app');
    Assert.isTrue(state.configured, 'Verified configuration');
    Assert.isTrue(
      mock.records.get('ExtlClntAppOauthSettings')
        .contains(
          '<commaSeparatedOauthScopes>Api,RefreshToken</commaSeparatedOauthScopes>'
        ),
      'API access and Perform requests at any time are created together'
    );
    Assert.areEqual(
      UserInfo.getUserName(),
      state.runAsUsername,
      'Explicit selected identity'
    );
    Assert.areEqual(
      4,
      mock.writes,
      'Header, OAuth settings, global settings and policies'
    );
    Assert.areEqual(
      9,
      mock.calls,
      'One discovery, four writes and four verification reads'
    );
    Assert.isFalse(
      JSON.serialize(state).contains('consumerSecret'),
      'No consumer secret in DTO'
    );
  }
  @IsTest
  static void scopeVerificationAcceptsOrderingAndEquivalentOfflineAccess() {
    MetadataMock mock = setup();
    Test.startTest();
    PackageVisualizerEcaController.createLocalEca(UserInfo.getUserName(), null);
    String oauth = mock.records.get('ExtlClntAppOauthSettings');
    for (
      String scopes : new List<String>{
        'RefreshToken, Api,Web',
        'OfflineAccess,Api'
      }
    ) {
      mock.records.put(
        'ExtlClntAppOauthSettings',
        oauth.replace('Api,RefreshToken', scopes)
      );
      Assert.isTrue(
        PackageVisualizerEcaController.getState().configured,
        'Required scopes are order independent and permit equivalent OfflineAccess'
      );
    }
    for (String scopes : new List<String>{ 'Api', 'RefreshToken', '' }) {
      mock.records.put(
        'ExtlClntAppOauthSettings',
        oauth.replace('Api,RefreshToken', scopes)
      );
      Assert.isFalse(
        PackageVisualizerEcaController.createLocalEca(
            UserInfo.getUserName(),
            null
          )
          .configured,
        'Missing required scope needs review'
      );
    }
    Test.stopTest();
    Assert.areEqual(4, mock.writes, 'Existing scopes are never overwritten');
  }
  @IsTest
  static void repeatedCreationOnlyReadsExistingApp() {
    MetadataMock mock = setup();
    Test.startTest();
    PackageVisualizerEcaController.createLocalEca(
      UserInfo.getUserName(),
      'admin@example.com'
    );
    PackageVisualizerEcaStateDTO state = PackageVisualizerEcaController.createLocalEca(
      'different@example.com',
      'other@example.com'
    );
    Test.stopTest();
    Assert.areEqual(4, mock.writes, 'No overwrite or secret rotation');
    Assert.areEqual(
      UserInfo.getUserName(),
      state.runAsUsername,
      'Existing Run As respected'
    );
  }
  @IsTest
  static void absentReadDoesNotWrite() {
    MetadataMock mock = setup();
    Test.startTest();
    PackageVisualizerEcaStateDTO state = PackageVisualizerEcaController.getState();
    Test.stopTest();
    Assert.isFalse(state.exists, 'Known absent');
    Assert.areEqual(1, mock.calls, 'Only header read');
    Assert.areEqual(0, mock.writes, 'Read only');
  }
  @IsTest
  static void partialFailureIsNotAutomaticallyRepaired() {
    MetadataMock mock = setup();
    mock.failWrite = 2;
    Test.startTest();
    expectFailure('INVALID_FIELD');
    PackageVisualizerEcaStateDTO state = PackageVisualizerEcaController.createLocalEca(
      UserInfo.getUserName(),
      null
    );
    Test.stopTest();
    Assert.isTrue(state.exists, 'Partial header detected');
    Assert.isFalse(state.configured, 'Partial setup not success');
    Assert.areEqual(2, mock.writes, 'No retry or overwrite');
  }
  @IsTest
  static void missingPermissionBlocksRequests() {
    MetadataMock mock = setup();
    PackageVisualizerEcaService.permissionOverride = false;
    Test.startTest();
    expectFailure('administrator');
    Test.stopTest();
    Assert.areEqual(0, mock.calls, 'Authorize before session and callouts');
  }
  @IsTest
  static void faultsDoNotExposeResponses() {
    MetadataMock mock = setup();
    mock.fault = true;
    Test.startTest();
    expectFailure('Metadata API access failed');
    Test.stopTest();
    Assert.areEqual(0, mock.writes, 'Do not write after a failed read');
  }
  @IsTest
  static void malformedResponseBlocksCreation() {
    MetadataMock mock = setup();
    mock.malformed = true;
    Test.startTest();
    expectFailure('unreadable response');
    Test.stopTest();
    Assert.areEqual(0, mock.writes, 'Do not create with unknown state');
  }
  @IsTest
  static void policyMismatchFailsVerification() {
    MetadataMock mock = setup();
    mock.corruptPolicy = true;
    Test.startTest();
    expectFailure('fully verified');
    Test.stopTest();
    Assert.areEqual(4, mock.writes, 'Stop without repair');
  }
  @IsTest
  static void blankUsernameBlocksWrites() {
    MetadataMock mock = setup();
    Test.startTest();
    try {
      PackageVisualizerEcaController.createLocalEca(' ', null);
      Assert.fail('Expected validation');
    } catch (AuraHandledException e) {
      Assert.isTrue(
        e.getMessage().contains('Run As username'),
        'Explain required identity'
      );
    }
    Test.stopTest();
    Assert.areEqual(0, mock.writes, 'Validate before creation');
  }
  @IsTest
  static void invalidEmailBlocksWrites() {
    MetadataMock mock = setup();
    Test.startTest();
    try {
      PackageVisualizerEcaController.createLocalEca(
        UserInfo.getUserName(),
        'invalid'
      );
      Assert.fail('Expected validation');
    } catch (AuraHandledException e) {
      Assert.isTrue(e.getMessage().contains('email'), 'Explain invalid email');
    }
    Test.stopTest();
    Assert.areEqual(0, mock.writes, 'No invalid metadata');
  }
}
