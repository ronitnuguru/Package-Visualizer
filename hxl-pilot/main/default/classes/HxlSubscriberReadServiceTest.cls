/**
 * PackageSubscriber is a system object: its fields are not constructor-
 * writeable or put()-able ("Field is not writeable" / "Field X is not
 * editable", confirmed live) and the object cannot be inserted via DML.
 * Tests build fixtures by round-tripping a field map through
 * JSON.serialize/JSON.deserialize(..., PackageSubscriber.class), which
 * bypasses the write-access check (confirmed live, including for Id and a
 * native DateTime on SystemModstamp), and inject them through
 * HxlPackageToolingGateway.subscriberTestRecords, which the gateway's two
 * query methods return directly in test context instead of calling
 * Database.query.
 */
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

  private static String recordId(Integer sequenceNumber) {
    return String.valueOf(
      Id.valueOf('0Hb' + String.valueOf(sequenceNumber).leftPad(12, '0'))
    );
  }

  private static PackageSubscriber subscriberRecord(
    Integer sequenceNumber,
    String orgName
  ) {
    Map<String, Object> fields = new Map<String, Object>{
      'Id' => recordId(sequenceNumber),
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
      'SystemModstamp' => DateTime.newInstanceGmt(2026, 10, 1, 12, 0, 0)
        .addHours(sequenceNumber)
    };
    return (PackageSubscriber) JSON.deserialize(
      JSON.serialize(fields),
      PackageSubscriber.class
    );
  }

  /** Returns a copy of a fixture record with one field overridden, since
   * PackageSubscriber fields cannot be reassigned after construction. */
  private static PackageSubscriber withField(
    PackageSubscriber record,
    String fieldName,
    Object value
  ) {
    Map<String, Object> fields = (Map<String, Object>) JSON.deserializeUntyped(
      JSON.serialize(record)
    );
    fields.put(fieldName, value);
    return (PackageSubscriber) JSON.deserialize(
      JSON.serialize(fields),
      PackageSubscriber.class
    );
  }

  private static void configure(List<SObject> testRecords) {
    HxlSubscriberReadService.permissionOverride = true;
    HxlPackageToolingGateway.subscriberTestRecords = testRecords;
  }

  @IsTest
  static void listsTenByPackageIdAndReturnsCursor() {
    List<SObject> records = new List<SObject>();
    for (Integer i = 10; i >= 0; i--) {
      records.add(subscriberRecord(i, 'Test Org ' + i));
    }
    configure(records);
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
      'Should have more when gateway returns pageSize + 1'
    );
    Assert.isNotNull(
      result.nextCursor,
      'Should provide nextCursor when hasMore'
    );
  }

  @IsTest
  static void listsFiveByVersionIdWithoutCursor() {
    List<SObject> records = new List<SObject>();
    for (Integer i = 0; i < 5; i++) {
      records.add(subscriberRecord(i, 'Test Org ' + i));
    }
    configure(records);
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
  }

  @IsTest
  static void paginatesWithKeysetCursor() {
    List<SObject> page1 = new List<SObject>();
    for (Integer i = 10; i >= 0; i--) {
      page1.add(subscriberRecord(i, 'Org ' + i));
    }
    configure(page1);
    List<HxlSubscriberListResult> results1 = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ null }
    );
    String cursor = results1[0].nextCursor;
    Assert.isNotNull(cursor, 'First page should return cursor');

    List<SObject> page2 = new List<SObject>();
    for (Integer i = 4; i >= 0; i--) {
      page2.add(subscriberRecord(i, 'Org ' + i));
    }
    HxlPackageToolingGateway.subscriberTestRecords = page2;
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
  }

  @IsTest
  static void returnsInvalidFilterForNullFilter() {
    configure(new List<SObject>());
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
    configure(new List<SObject>());
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
    configure(new List<SObject>());
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
    configure(new List<SObject>());
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
    configure(new List<SObject>());
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
  static void returnsInvalidCursorForWrongJsonShape() {
    configure(new List<SObject>());
    String badCursor = EncodingUtil.base64Encode(
      Blob.valueOf(JSON.serialize(new Map<String, Object>{ 'foo' => 1 }))
    );
    List<HxlSubscriberListResult> results = HxlSubscriberReadService.listSubscribers(
      new List<String>{ subscriberPackageId(1) },
      new List<String>{ badCursor }
    );
    Assert.areEqual(
      'INVALID_CURSOR',
      results[0].state,
      'Cursor missing lastModstamp/lastId should return INVALID_CURSOR'
    );
  }

  @IsTest
  static void returnsNoAccessWhenPackageSubscriberUnavailable() {
    HxlSubscriberReadService.permissionOverride = false;
    HxlPackageToolingGateway.subscriberTestRecords = new List<SObject>();
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
  static void returnsNoAccessForDetailsWhenPackageSubscriberUnavailable() {
    HxlSubscriberReadService.permissionOverride = false;
    HxlPackageToolingGateway.subscriberTestRecords = new List<SObject>();
    List<HxlSubscriberDetailResult> results = HxlSubscriberReadService.getSubscriberDetails(
      new List<String>{ orgKey(1) }
    );
    Assert.areEqual(
      'NO_ACCESS',
      results[0].state,
      'Unavailable PackageSubscriber access should return NO_ACCESS for details too'
    );
  }

  @IsTest
  static void getsDetailsByOrgKey() {
    PackageSubscriber record = subscriberRecord(1, 'Production Org');
    configure(new List<SObject>{ record });
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
      subscriberPackageId(1),
      result.metadataPackageId,
      'Should map metadataPackageId for back-navigation'
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
    Assert.isNotNull(
      result.systemModstamp,
      'Should map systemModstamp directly from the native Datetime field'
    );
    Assert.isTrue(
      result.openInSalesforceUrl.contains(orgKey(1)),
      'URL should contain orgKey'
    );
  }

  @IsTest
  static void returnsNotFoundForMissingOrgKey() {
    configure(new List<SObject>());
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
    configure(new List<SObject>());
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
  static void listsSubscribersViaAction() {
    List<SObject> records = new List<SObject>();
    for (Integer i = 0; i < 5; i++) {
      records.add(subscriberRecord(i, 'Action Org ' + i));
    }
    configure(records);
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
    PackageSubscriber record = subscriberRecord(1, 'Detail Org');
    configure(new List<SObject>{ record });
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
    List<SObject> records = new List<SObject>();
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
      new List<SObject>(),
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
    PackageSubscriber record = subscriberRecord(5, 'Full Detail Org');
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
    PackageSubscriber record = withField(
      subscriberRecord(1, 'Null Timestamp Org'),
      'SystemModstamp',
      null
    );
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
    PackageSubscriber record = withField(
      withField(subscriberRecord(1, 'No Parent Org'), 'ParentOrg', null),
      'CustomUpgradeType',
      null
    );
    HxlSubscriberDetailResult result = HxlSubscriberResultMapper.toDetailResult(
      record
    );
    Assert.isNull(result.parentOrg, 'Null parentOrg should map to null');
    Assert.isNull(
      result.customUpgradeType,
      'Null customUpgradeType should map to null'
    );
  }

  @IsTest
  static void handlesNullBooleanFieldsGracefully() {
    PackageSubscriber record = withField(
      withField(
        subscriberRecord(1, 'Null Booleans Org'),
        'HasRestrictionEnabled',
        null
      ),
      'IsCustomUpgradeAllowed',
      null
    );
    HxlSubscriberDetailResult result = HxlSubscriberResultMapper.toDetailResult(
      record
    );
    Assert.isNull(
      result.hasRestrictionEnabled,
      'Null HasRestrictionEnabled should map to null, not throw'
    );
    Assert.isNull(
      result.isCustomUpgradeAllowed,
      'Null IsCustomUpgradeAllowed should map to null, not throw'
    );
  }
}
