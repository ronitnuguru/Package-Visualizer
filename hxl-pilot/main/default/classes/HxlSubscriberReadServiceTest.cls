/** Isolated HTTP contract tests; no real subscribers, credentials, or org data required. */
@IsTest
private class HxlSubscriberReadServiceTest {
  private static String orgKey(Integer sequenceNumber) {
    return '00D' + String.valueOf(sequenceNumber).leftPad(12, '0') + 'EAU';
  }

  private static String subscriberPackageId(Integer sequenceNumber) {
    return String.valueOf(
      Id.valueOf('033' + String.valueOf(sequenceNumber).leftPad(12, '0'))
    );
  }

  private static String subscriberPackageVersionId(Integer sequenceNumber) {
    return String.valueOf(
      Id.valueOf('04t' + String.valueOf(sequenceNumber).leftPad(12, '0'))
    );
  }

  private static Map<String, Object> subscriberRecord(
    Integer sequenceNumber,
    String orgName
  ) {
    return new Map<String, Object>{
      'Id' => String.valueOf(sequenceNumber),
      'OrgKey' => orgKey(sequenceNumber),
      'OrgName' => orgName,
      'OrgType' => 'Production',
      'OrgStatus' => 'Active',
      'InstanceName' => 'NA' + Math.mod(sequenceNumber, 100),
      'MetadataPackageId' => subscriberPackageId(1),
      'MetadataPackageVersionId' => subscriberPackageVersionId(1),
      'InstalledStatus' => 'i',
      'ParentOrg' => null,
      'CustomUpgradeType' => 'Mixed',
      'HasRestrictionEnabled' => false,
      'IsCustomUpgradeAllowed' => true,
      'SystemModstamp' => '2026-10-01T' +
      String.valueOf(Math.mod(12 + sequenceNumber, 24)).leftPad(2, '0') +
      ':00:00.000Z'
    };
  }

  private static void configure(HttpCalloutMock mock) {
    HxlSubscriberReadService.permissionOverride = true;
    Package2Interface.setNamedCredentialEnabled(true);
    Test.setMock(HttpCalloutMock.class, mock);
  }

  private class SubscriberQueryMock implements HttpCalloutMock {
    private List<Object> records;
    private Integer status;
    private List<String> queries = new List<String>();
    SubscriberQueryMock(List<Object> records, Integer status) {
      this.records = records;
      this.status = status;
    }
    public HttpResponse respond(HttpRequest request) {
      String query = EncodingUtil.urlDecode(
        request.getEndpoint().substringAfter('query?q='),
        'UTF-8'
      );
      queries.add(query);
      Assert.areEqual(
        'GET',
        request.getMethod(),
        'Subscriber browsing must be read-only.'
      );
      Assert.isTrue(
        request.getEndpoint().startsWith('callout:'),
        'Use the existing named credential.'
      );
      Assert.isTrue(
        query.contains(' FROM PackageSubscriber WHERE '),
        'Query only subscriber data.'
      );
      HttpResponse response = new HttpResponse();
      response.setStatusCode(status);
      response.setBody(
        status == 200
          ? JSON.serialize(new Map<String, Object>{ 'records' => records })
          : 'Private upstream credential diagnostics'
      );
      return response;
    }
  }

  @IsTest
  static void listsTenByPackageIdAndReturnsCursor() {
    List<Object> records = new List<Object>();
    for (Integer i = 0; i < 11; i++) {
      records.add(subscriberRecord(i, 'Test Org ' + i));
    }
    SubscriberQueryMock mock = new SubscriberQueryMock(records, 200);
    configure(mock);
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ null }
    );
    Assert.areEqual(1, results.size(), 'Should return one result per filter');
    HxlSubscriberListResult result = results[0];
    Assert.areEqual('READY', result.state, 'State should be READY');
    Assert.areEqual(
      10,
      result.subscribers.size(),
      'Should show exactly pageSize subscribers'
    );
    Assert.areEqual(
      true,
      result.hasMore,
      'Should have more when query returns pageSize + 1'
    );
    Assert.isNotNull(
      result.nextCursor,
      'Should provide nextCursor when hasMore'
    );
    Assert.isTrue(
      mock.queries[0].contains('MetadataPackageId'),
      'Should filter by package ID'
    );
    Assert.isTrue(
      mock.queries[0].contains('ORDER BY SystemModstamp DESC'),
      'Should sort newest first'
    );
    Assert.isTrue(
      mock.queries[0].contains('OFFSET 0'),
      'First page should use offset 0'
    );
  }

  @IsTest
  static void listsFiveByVersionIdWithoutCursor() {
    List<Object> records = new List<Object>();
    for (Integer i = 0; i < 5; i++) {
      records.add(subscriberRecord(i, 'Test Org ' + i));
    }
    SubscriberQueryMock mock = new SubscriberQueryMock(records, 200);
    configure(mock);
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageVersionId(1) },
      new List<String>{ null }
    );
    HxlSubscriberListResult result = results[0];
    Assert.areEqual('READY', result.state, 'State should be READY');
    Assert.areEqual(
      5,
      result.subscribers.size(),
      'Should show all 5 subscribers'
    );
    Assert.areEqual(
      false,
      result.hasMore,
      'Should not have more when fewer than pageSize + 1'
    );
    Assert.isNull(
      result.nextCursor,
      'Should not provide nextCursor when no more pages'
    );
    Assert.isTrue(
      mock.queries[0].contains('MetadataPackageVersionId'),
      'Should filter by version ID'
    );
  }

  @IsTest
  static void paginatesWithCursor() {
    List<Object> page1 = new List<Object>();
    for (Integer i = 0; i < 11; i++) {
      page1.add(subscriberRecord(i, 'Org ' + i));
    }
    SubscriberQueryMock mock = new SubscriberQueryMock(page1, 200);
    configure(mock);
    List<HxlSubscriberListResult> results1 = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ null }
    );
    String cursor = results1[0].nextCursor;
    Assert.isNotNull(cursor, 'First page should return cursor');
    List<Object> page2 = new List<Object>();
    for (Integer i = 10; i < 15; i++) {
      page2.add(subscriberRecord(i, 'Org ' + i));
    }
    mock.records = page2;
    List<HxlSubscriberListResult> results2 = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ cursor }
    );
    HxlSubscriberListResult result2 = results2[0];
    Assert.areEqual('READY', result2.state, 'Second page should be READY');
    Assert.areEqual(
      5,
      result2.subscribers.size(),
      'Second page should show 5 subscribers'
    );
    Assert.isTrue(
      mock.queries[1].contains('OFFSET 10'),
      'Second page should use offset 10'
    );
  }

  @IsTest
  static void returnsInvalidFilterForNullFilter() {
    configure(new SubscriberQueryMock(new List<Object>(), 200));
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ null },
      new List<String>{ null }
    );
    Assert.areEqual(
      'INVALID_FILTER',
      results[0].state,
      'Null filter should return INVALID_FILTER'
    );
  }

  @IsTest
  static void returnsInvalidFilterForWrongPrefix() {
    configure(new SubscriberQueryMock(new List<Object>(), 200));
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ '0Ho000000000000' },
      new List<String>{ null }
    );
    Assert.areEqual(
      'INVALID_FILTER',
      results[0].state,
      'Wrong prefix should return INVALID_FILTER'
    );
  }

  @IsTest
  static void returnsInvalidFilterForWrongLength() {
    configure(new SubscriberQueryMock(new List<Object>(), 200));
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ '033123' },
      new List<String>{ null }
    );
    Assert.areEqual(
      'INVALID_FILTER',
      results[0].state,
      'Wrong length should return INVALID_FILTER'
    );
  }

  @IsTest
  static void returnsEmptyForNoRecords() {
    configure(new SubscriberQueryMock(new List<Object>(), 200));
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(999) },
      new List<String>{ null }
    );
    HxlSubscriberListResult result = results[0];
    Assert.areEqual(
      'EMPTY',
      result.state,
      'No records should return EMPTY state'
    );
    Assert.areEqual(
      0,
      result.subscribers.size(),
      'Should have zero subscribers'
    );
    Assert.isTrue(
      HxlSubscriberReadService.isSuccessfulState(result.state),
      'EMPTY is a successful outcome, not an error'
    );
  }

  @IsTest
  static void returnsInvalidCursorForMalformedCursor() {
    configure(new SubscriberQueryMock(new List<Object>(), 200));
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ 'not-valid-base64-json!!' }
    );
    Assert.areEqual(
      'INVALID_CURSOR',
      results[0].state,
      'Malformed cursor should return INVALID_CURSOR, not throw'
    );
  }

  @IsTest
  static void returnsNoAccessWhenPackageSubscriberUnavailable() {
    HxlSubscriberReadService.permissionOverride = false;
    Package2Interface.setNamedCredentialEnabled(true);
    Test.setMock(
      HttpCalloutMock.class,
      new SubscriberQueryMock(new List<Object>(), 200)
    );
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ null }
    );
    Assert.areEqual(
      'NO_ACCESS',
      results[0].state,
      'Unavailable PackageSubscriber access should return NO_ACCESS'
    );
  }

  @IsTest
  static void getsDetailsByOrgKey() {
    Map<String, Object> record = subscriberRecord(1, 'Production Org');
    configure(new SubscriberQueryMock(new List<Object>{ record }, 200));
    List<HxlSubscriberDetailResult> results = HxlSubscriberReadService.getSubscriberDetails(
      new List<String>{ orgKey(1) }
    );
    HxlSubscriberDetailResult result = results[0];
    Assert.areEqual('READY', result.state, 'State should be READY');
    Assert.areEqual(orgKey(1), result.orgKey, 'Should map orgKey');
    Assert.areEqual('Production Org', result.orgName, 'Should map orgName');
    Assert.areEqual('Production', result.orgType, 'Should map orgType');
    Assert.areEqual(
      'Mixed',
      result.customUpgradeType,
      'Should map customUpgradeType'
    );
    Assert.areEqual(
      false,
      result.hasRestrictionEnabled,
      'Should map hasRestrictionEnabled'
    );
    Assert.areEqual(
      true,
      result.isCustomUpgradeAllowed,
      'Should map isCustomUpgradeAllowed'
    );
    Assert.isTrue(
      result.openInSalesforceUrl.contains(orgKey(1)),
      'URL should contain orgKey'
    );
  }

  @IsTest
  static void returnsNotFoundForMissingOrgKey() {
    configure(new SubscriberQueryMock(new List<Object>(), 200));
    List<HxlSubscriberDetailResult> results = HxlSubscriberReadService.getSubscriberDetails(
      new List<String>{ orgKey(999) }
    );
    Assert.areEqual(
      'NOT_FOUND',
      results[0].state,
      'Missing orgKey should return NOT_FOUND'
    );
  }

  @IsTest
  static void returnsInvalidOrgKeyForBlankOrgKey() {
    configure(new SubscriberQueryMock(new List<Object>(), 200));
    List<HxlSubscriberDetailResult> results = HxlSubscriberReadService.getSubscriberDetails(
      new List<String>{ '' }
    );
    Assert.areEqual(
      'INVALID_ORG_KEY',
      results[0].state,
      'Blank orgKey should return INVALID_ORG_KEY'
    );
  }

  @IsTest
  static void returnsUpstreamErrorForHttp500() {
    configure(new SubscriberQueryMock(new List<Object>(), 500));
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ null }
    );
    Assert.areEqual(
      'UPSTREAM_ERROR',
      results[0].state,
      'HTTP 500 should return UPSTREAM_ERROR'
    );
  }

  @IsTest
  static void listsSubscribersViaAction() {
    List<Object> records = new List<Object>();
    for (Integer i = 0; i < 5; i++) {
      records.add(subscriberRecord(i, 'Action Org ' + i));
    }
    configure(new SubscriberQueryMock(records, 200));
    HxlListSubscribersAction.Request request = new HxlListSubscribersAction.Request();
    request.packageFilter = subscriberPackageId(1);
    request.cursor = null;
    List<HxlListSubscribersAction.Response> responses = HxlListSubscribersAction.listSubscribers(
      new List<HxlListSubscribersAction.Request>{ request }
    );
    Assert.areEqual(1, responses.size(), 'Should return one response');
    Assert.areEqual(true, responses[0].isSuccess, 'Action should succeed');
    Assert.isNull(responses[0].errorType, 'No error type on success');
    Assert.areEqual(
      5,
      responses[0].result.subscribers.size(),
      'Should return 5 subscribers'
    );
  }

  @IsTest
  static void listSubscribersActionHandlesEmptyRequestList() {
    List<HxlListSubscribersAction.Response> responses = HxlListSubscribersAction.listSubscribers(
      new List<HxlListSubscribersAction.Request>()
    );
    Assert.areEqual(
      0,
      responses.size(),
      'Empty request list should produce no responses'
    );
  }

  @IsTest
  static void getsDetailsViaAction() {
    Map<String, Object> record = subscriberRecord(1, 'Detail Org');
    configure(new SubscriberQueryMock(new List<Object>{ record }, 200));
    HxlGetSubscriberDetailsAction.Request request = new HxlGetSubscriberDetailsAction.Request();
    request.orgKey = orgKey(1);
    List<HxlGetSubscriberDetailsAction.Response> responses = HxlGetSubscriberDetailsAction.getSubscriberDetails(
      new List<HxlGetSubscriberDetailsAction.Request>{ request }
    );
    Assert.areEqual(1, responses.size(), 'Should return one response');
    Assert.areEqual(true, responses[0].isSuccess, 'Action should succeed');
    Assert.isNull(responses[0].errorType, 'No error type on success');
    Assert.areEqual(
      'Detail Org',
      responses[0].result.orgName,
      'Should return subscriber detail'
    );
  }

  @IsTest
  static void getSubscriberDetailsActionHandlesEmptyRequestList() {
    List<HxlGetSubscriberDetailsAction.Response> responses = HxlGetSubscriberDetailsAction.getSubscriberDetails(
      new List<HxlGetSubscriberDetailsAction.Request>()
    );
    Assert.areEqual(
      0,
      responses.size(),
      'Empty request list should produce no responses'
    );
  }

  @IsTest
  static void mapsListResultWithCorrectFields() {
    List<Object> records = new List<Object>();
    for (Integer i = 0; i < 3; i++) {
      records.add(subscriberRecord(i, 'Mapper Org ' + i));
    }
    HxlSubscriberListResult result = HxlSubscriberResultMapper.toListResult(
      records,
      10
    );
    Assert.areEqual('READY', result.state, 'State should be READY');
    Assert.areEqual(3, result.subscribers.size(), 'Should map all 3 records');
    Assert.areEqual(
      false,
      result.hasMore,
      'Should not have more when < pageSize'
    );
    HxlSubscriberListResult.Subscriber sub = result.subscribers[0];
    Assert.areEqual(orgKey(0), sub.orgKey, 'Should map orgKey');
    Assert.areEqual('Mapper Org 0', sub.orgName, 'Should map orgName');
    Assert.isNotNull(sub.systemModstamp, 'Should map systemModstamp');
  }

  @IsTest
  static void mapsEmptyListResult() {
    HxlSubscriberListResult result = HxlSubscriberResultMapper.toListResult(
      new List<Object>(),
      10
    );
    Assert.areEqual('EMPTY', result.state, 'Zero records should map to EMPTY');
    Assert.areEqual(
      'No subscribers found on this page.',
      result.message,
      'Should use empty-page message'
    );
  }

  @IsTest
  static void mapsDetailResultWithAllFields() {
    Map<String, Object> record = subscriberRecord(5, 'Full Detail Org');
    HxlSubscriberDetailResult result = HxlSubscriberResultMapper.toDetailResult(
      record
    );
    Assert.areEqual('READY', result.state, 'State should be READY');
    Assert.areEqual(orgKey(5), result.orgKey, 'Should map orgKey');
    Assert.areEqual('Full Detail Org', result.orgName, 'Should map orgName');
    Assert.areEqual('Production', result.orgType, 'Should map orgType');
    Assert.areEqual('Active', result.orgStatus, 'Should map orgStatus');
    Assert.areEqual(
      'Mixed',
      result.customUpgradeType,
      'Should map customUpgradeType'
    );
    Assert.areEqual(
      false,
      result.hasRestrictionEnabled,
      'Should map boolean field'
    );
    Assert.areEqual(
      true,
      result.isCustomUpgradeAllowed,
      'Should map boolean field'
    );
    Assert.isTrue(
      result.openInSalesforceUrl.contains('view?address='),
      'Should construct detail URL'
    );
  }

  @IsTest
  static void handlesNullSystemModstampGracefully() {
    Map<String, Object> record = subscriberRecord(1, 'Null Timestamp Org');
    record.put('SystemModstamp', null);
    HxlSubscriberDetailResult result = HxlSubscriberResultMapper.toDetailResult(
      record
    );
    Assert.isNull(
      result.systemModstamp,
      'Null timestamp should map to null DateTime'
    );
  }

  @IsTest
  static void handlesNullParentOrgAndCustomUpgradeTypeGracefully() {
    Map<String, Object> record = subscriberRecord(1, 'No Parent Org');
    record.put('ParentOrg', null);
    record.put('CustomUpgradeType', null);
    HxlSubscriberDetailResult result = HxlSubscriberResultMapper.toDetailResult(
      record
    );
    Assert.isNull(result.parentOrg, 'Null parentOrg should map to null');
    Assert.isNull(
      result.customUpgradeType,
      'Null customUpgradeType should map to null'
    );
  }
}
