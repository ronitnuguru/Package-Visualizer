@IsTest
private class SoqlInputValidatorTest {
  private static final String INVALID_SORT = 'Name DESC NULLS FIRST';
  private static final String INVALID_DIRECTION = 'DESC NULLS FIRST';
  private static final String INVALID_LIMIT = '50 OFFSET 0';
  private static final String INVALID_OFFSET = '0 LIMIT 500';

  @IsTest
  static void shouldEscapeApostrophe_WhenSearchFilterContainsApostrophe() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'OrgName',
      'O\'Brien',
      'SEARCH'
    );

    assertNoException(outcome, 'A valid apostrophe SEARCH');
    Assert.areEqual(
      ' OrgName LIKE \'%O\\\'Brien%\'',
      outcome.whereClause,
      'SEARCH should keep apostrophes inside the quoted LIKE literal'
    );
  }

  @IsTest
  static void shouldPreserveOriginalBackslash_WhenSearchFilterContainsBackslash() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'OrgName',
      'C\\Temp',
      'SEARCH'
    );

    assertNoException(outcome, 'A valid backslash SEARCH');
    Assert.areEqual(
      ' OrgName LIKE \'%C\\\\Temp%\'',
      outcome.whereClause,
      'SEARCH should preserve a literal backslash by escaping it for SOQL LIKE'
    );
  }

  @IsTest
  static void shouldEscapeLikeWildcards_WhenSearchFilterContainsPercent() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'OrgName',
      '50%_match',
      'SEARCH'
    );

    assertNoException(outcome, 'A valid wildcard SEARCH');
    Assert.areEqual(
      ' OrgName LIKE \'%50\\%\\_match%\'',
      outcome.whereClause,
      'SEARCH should treat percent and underscore as literals'
    );
  }

  @IsTest
  static void shouldEscapeSearchPayload_WhenSearchContainsOrClause() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'OrgName',
      'x\' OR OrgName!=null OR OrgName LIKE \'',
      'SEARCH'
    );

    assertNoException(outcome, 'A safely escaped SEARCH payload');
    Assert.areEqual(
      ' OrgName LIKE \'%x\\\' OR OrgName!=null OR OrgName LIKE \\\'%\'',
      outcome.whereClause,
      'SEARCH should keep the complete payload inside one escaped LIKE literal'
    );
  }

  @IsTest
  static void shouldAcceptKeywordPhrase_WhenSearchContainsAndKeyword() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'OrgName',
      'Rock AND Roll',
      'SEARCH'
    );

    assertNoException(outcome, 'A legitimate SEARCH keyword phrase');
    Assert.areEqual(
      ' OrgName LIKE \'%Rock AND Roll%\'',
      outcome.whereClause,
      'SEARCH should accept ordinary words that resemble SOQL keywords'
    );
  }

  @IsTest
  static void shouldMatchOnlyIntendedAccount_WhenSearchLiteralContainsApostrophe() {
    Account intendedAccount = TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Lit O\'Brien target' }
    );
    TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Lit OBrien decoy' }
    );

    List<Account> matchedAccounts;
    Test.startTest();
    String whereClause = Package2Interface.getWhereClause(
      filters('Name', 'O\'Brien', 'SEARCH')
    );
    matchedAccounts = Database.query(
      'SELECT Id, Name FROM Account WHERE' + whereClause
    );
    Test.stopTest();

    Assert.areEqual(
      1,
      matchedAccounts.size(),
      'Only the apostrophe literal account should match'
    );
    Assert.areEqual(
      intendedAccount.Id,
      matchedAccounts[0].Id,
      'The matched row should be the intended apostrophe account'
    );
  }

  @IsTest
  static void shouldMatchOnlyIntendedAccount_WhenSearchLiteralContainsBackslash() {
    Account intendedAccount = TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Path C\\Temp marker' }
    );
    TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Path CTemp marker' }
    );

    List<Account> matchedAccounts;
    Test.startTest();
    String whereClause = Package2Interface.getWhereClause(
      filters('Name', 'C\\Temp', 'SEARCH')
    );
    matchedAccounts = Database.query(
      'SELECT Id, Name FROM Account WHERE' + whereClause
    );
    Test.stopTest();

    Assert.areEqual(
      1,
      matchedAccounts.size(),
      'Only the backslash literal account should match'
    );
    Assert.areEqual(
      intendedAccount.Id,
      matchedAccounts[0].Id,
      'The matched row should be the intended backslash account'
    );
  }

  @IsTest
  static void shouldTreatPercentAndUnderscoreAsLiterals_WhenSearchIsExecuted() {
    Account intendedAccount = TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Value 50%_match target' }
    );
    TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Value 50AAAmatch decoy' }
    );
    TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Value 50%Xmatch decoy' }
    );

    List<Account> matchedAccounts;
    Test.startTest();
    String whereClause = Package2Interface.getWhereClause(
      filters('Name', '50%_match', 'SEARCH')
    );
    matchedAccounts = Database.query(
      'SELECT Id, Name FROM Account WHERE' + whereClause
    );
    Test.stopTest();

    Assert.areEqual(
      1,
      matchedAccounts.size(),
      'Escaped wildcard literals should not match shaped decoys'
    );
    Assert.areEqual(
      intendedAccount.Id,
      matchedAccounts[0].Id,
      'The matched row should be the intended wildcard-literal account'
    );
  }

  @IsTest
  static void shouldContainPayloadInsideLikeLiteral_WhenSearchPayloadIsCrafted() {
    String payload = 'x\' OR Name!=null OR Name LIKE \'';
    Account intendedAccount = TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Payload ' + payload + ' target' }
    );
    TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Totally unrelated account' }
    );
    TestDataFactory.createAccount(
      true,
      new Map<String, Object>{ 'Name' => 'Payload x OR Name!=null target' }
    );

    List<Account> matchedAccounts;
    Test.startTest();
    String whereClause = Package2Interface.getWhereClause(
      filters('Name', payload, 'SEARCH')
    );
    matchedAccounts = Database.query(
      'SELECT Id, Name FROM Account WHERE' + whereClause
    );
    Test.stopTest();

    Assert.areEqual(
      1,
      matchedAccounts.size(),
      'Escaped payload should not break out or return unrelated accounts'
    );
    Assert.areEqual(
      intendedAccount.Id,
      matchedAccounts[0].Id,
      'The matched row should be the intended payload-literal account'
    );
  }

  @IsTest
  static void shouldCanonicalizeBoolean_WhenBooleanFilterIsValid() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'IsReleased',
      'TRUE',
      'BOOLEAN'
    );

    assertNoException(outcome, 'A valid BOOLEAN filter');
    Assert.areEqual(
      ' IsReleased = true',
      outcome.whereClause,
      'BOOLEAN filters should be canonicalized to strict SOQL boolean literals'
    );
  }

  @IsTest
  static void shouldRejectBooleanInjection_WhenBooleanContainsOrClause() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'IsReleased',
      'true OR Name != null',
      'BOOLEAN'
    );

    assertAuraRejected(outcome, 'A BOOLEAN injection payload');
  }

  @IsTest
  static void shouldAllowStrictNumber_WhenComparisonFilterIsNumeric() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'BuildNumber',
      '10',
      'LESSOREQUAL'
    );

    assertNoException(outcome, 'A valid numeric comparison filter');
    Assert.areEqual(
      ' BuildNumber <= 10',
      outcome.whereClause,
      'Numeric comparison filters should accept plain integer values'
    );
  }

  @IsTest
  static void shouldRejectComparisonInjection_WhenNumericFilterContainsOrClause() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'BuildNumber',
      '10 OR Name != null',
      'LESSOREQUAL'
    );

    assertAuraRejected(outcome, 'A numeric comparison injection payload');
  }

  @IsTest
  static void shouldQuoteIdValue_WhenIdFilterIsValid() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'SubscriberPackageVersionId',
      '04t000000000000AAA',
      'ID'
    );

    assertNoException(outcome, 'A valid ID filter');
    Assert.areEqual(
      ' SubscriberPackageVersionId = \'04t000000000000AAA\'',
      outcome.whereClause,
      'ID filters should be quoted as string literals'
    );
  }

  @IsTest
  static void shouldRejectUnknownDataType_WhenFilterDataTypeIsUnsupported() {
    WhereClauseOutcome outcome = invokeWhereClause(
      'OrgName',
      'Acme',
      'UNSUPPORTED'
    );

    assertAuraRejected(outcome, 'An unknown filter data type');
  }

  @IsTest
  static void shouldRejectInvalidPackageSortDirection_BeforeToolingCallout() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2(INVALID_DIRECTION);
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertAuraRejectedBeforeCallout(
      outcome,
      'An invalid package sort direction'
    );
  }

  @IsTest
  static void shouldRejectInvalidVersionSortField_BeforeToolingCallout() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        INVALID_SORT,
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertAuraRejectedBeforeCallout(outcome, 'An invalid version sort field');
  }

  @IsTest
  static void shouldRejectInvalidVersionSortDirection_BeforeToolingCallout() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        'CreatedDate',
        INVALID_DIRECTION,
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertAuraRejectedBeforeCallout(
      outcome,
      'An invalid version sort direction'
    );
  }

  @IsTest
  static void shouldRejectInvalidVersionLimit_BeforeToolingCallout() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        'CreatedDate',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertAuraRejectedBeforeCallout(outcome, 'An invalid version limit');
  }

  @IsTest
  static void shouldRejectInvalidVersionOffset_BeforeToolingCallout() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        'CreatedDate',
        'DESC',
        '50',
        INVALID_OFFSET
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertAuraRejectedBeforeCallout(outcome, 'An invalid version offset');
  }

  @IsTest
  static void shouldRejectInvalidVersionRange_BeforeToolingCallout() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        '1 OR Name != null',
        '2',
        '0',
        '5',
        'CreatedDate',
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertAuraRejectedBeforeCallout(outcome, 'An invalid version range');
  }

  @IsTest
  static void shouldRejectInvalidChartGroupField_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      Package2Interface.getSubscriberChartData(
        new List<ObjectWrappers.FilterWrapper>(),
        'OrgType FROM User'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid subscriber chart group field'
    );
  }

  @IsTest
  static void shouldRejectInvalidLatestVersionsLimit_BeforeToolingCallout() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getLatestPackageVersionsList(
        '033000000000000AAA',
        INVALID_LIMIT
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertAuraRejectedBeforeCallout(outcome, 'An invalid latest-version limit');
  }

  @IsTest
  static void shouldReachCallout_WhenPackage2VersionSortIsSystemModstamp() {
    CapturingToolingMock mock = new CapturingToolingMock();
    Test.setMock(HttpCalloutMock.class, mock);
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        'SystemModstamp',
        'desc',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertNoException(outcome, 'The LWC SystemModstamp sort path');
    Assert.areEqual(
      outcome.calloutsBefore + 1,
      outcome.calloutsAfter,
      'A valid SystemModstamp sort should reach the Tooling callout'
    );
    Assert.isTrue(
      mock.lastEndpoint.contains('SystemModstamp'),
      'The canonical SystemModstamp field should be present in the Tooling query'
    );
  }

  @IsTest
  static void shouldAcceptValidSortAndPagination_WhenGettingPackage1Versions() {
    CapturingToolingMock mock = new CapturingToolingMock();
    Test.setMock(HttpCalloutMock.class, mock);
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage1Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        'versionNumber',
        'desc',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertNoException(outcome, 'Valid Package1Version list inputs');
    Assert.areEqual(
      outcome.calloutsBefore + 1,
      outcome.calloutsAfter,
      'Valid Package1Version inputs should reach the Tooling callout'
    );
    Assert.isTrue(
      mock.lastEndpoint.contains('MajorVersion'),
      'The versionNumber alias should emit the compound version sort'
    );
  }

  @IsTest
  static void shouldRejectInvalidSort_WhenGettingPackage1Versions() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage1Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        INVALID_SORT,
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertExactAuraRejectedBeforeCallout(
      outcome,
      'Invalid version sort field.',
      'An invalid Package1Version sort field'
    );
  }

  @IsTest
  static void shouldRejectInvalidPagination_WhenGettingPackage1Versions() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage1Versions(
        new List<ObjectWrappers.FilterWrapper>(),
        null,
        null,
        null,
        null,
        'CreatedDate',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertExactAuraRejectedBeforeCallout(
      outcome,
      'Invalid version limit.',
      'An invalid Package1Version limit'
    );
  }

  @IsTest
  static void shouldAcceptValidSortAndPagination_WhenGettingSignUpRequests() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    try {
      Package2Interface.getSignUpRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'CreatedDate',
        'desc',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    Test.stopTest();

    assertNoException(outcome, 'Valid SignupRequest list inputs');
  }

  @IsTest
  static void shouldRejectInvalidSort_WhenGettingSignUpRequests() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      Package2Interface.getSignUpRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        INVALID_SORT,
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertExactAuraRejectedBeforeQuery(
      outcome,
      'Invalid sign-up sort field.',
      'An invalid SignupRequest sort field'
    );
  }

  @IsTest
  static void shouldRejectInvalidPagination_WhenGettingSignUpRequests() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      Package2Interface.getSignUpRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'CreatedDate',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertExactAuraRejectedBeforeQuery(
      outcome,
      'Invalid sign-up limit.',
      'An invalid SignupRequest limit'
    );
  }

  @IsTest
  static void shouldAcceptValidSortAndPagination_WhenGettingPackageSubscribers() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    try {
      Package2Interface.get2GPPackageSubscriberList(
        new List<ObjectWrappers.FilterWrapper>(),
        'OrgName',
        'asc',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    Test.stopTest();

    assertNoException(outcome, 'Valid PackageSubscriber list inputs');
  }

  @IsTest
  static void shouldRejectInvalidSort_WhenGettingPackageSubscribers() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      Package2Interface.get2GPPackageSubscriberList(
        new List<ObjectWrappers.FilterWrapper>(),
        INVALID_SORT,
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertExactAuraRejectedBeforeQuery(
      outcome,
      'Invalid subscriber sort field.',
      'An invalid PackageSubscriber sort field'
    );
  }

  @IsTest
  static void shouldRejectInvalidPagination_WhenGettingPackageSubscribers() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      Package2Interface.get2GPPackageSubscriberList(
        new List<ObjectWrappers.FilterWrapper>(),
        'OrgName',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertExactAuraRejectedBeforeQuery(
      outcome,
      'Invalid subscriber limit.',
      'An invalid PackageSubscriber limit'
    );
  }

  @IsTest
  static void shouldAcceptValidSortAndPagination_WhenGettingCreateRequests() {
    CapturingToolingMock mock = new CapturingToolingMock();
    Test.setMock(HttpCalloutMock.class, mock);
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2VersionCreateRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'CreatedByName',
        'desc',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertNoException(outcome, 'Valid create-request list inputs');
    Assert.areEqual(
      outcome.calloutsBefore + 1,
      outcome.calloutsAfter,
      'Valid create-request inputs should reach the Tooling callout'
    );
    Assert.isTrue(
      mock.lastEndpoint.contains('CreatedBy.Name'),
      'CreatedByName should map to the selected CreatedBy.Name relationship'
    );
  }

  @IsTest
  static void shouldRejectInvalidSort_WhenGettingCreateRequests() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2VersionCreateRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        INVALID_SORT,
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertExactAuraRejectedBeforeCallout(
      outcome,
      'Invalid create-request sort field.',
      'An invalid create-request sort field'
    );
  }

  @IsTest
  static void shouldRejectInvalidPagination_WhenGettingCreateRequests() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2VersionCreateRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'CreatedDate',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertExactAuraRejectedBeforeCallout(
      outcome,
      'Invalid create-request limit.',
      'An invalid create-request limit'
    );
  }

  @IsTest
  static void shouldAcceptAllowlistedGroup_WhenGettingLmaChartData() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    try {
      Package2Interface.getLmaChartData(
        new List<ObjectWrappers.FilterWrapper>(),
        'sfLma__Status__c'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    Test.stopTest();

    assertNoException(outcome, 'An allowlisted LMA chart group');
  }

  @IsTest
  static void shouldRejectInvalidGroup_WhenGettingLmaChartData() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      Package2Interface.getLmaChartData(
        new List<ObjectWrappers.FilterWrapper>(),
        'sfLma__Status__c FROM User'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertExactAuraRejectedBeforeQuery(
      outcome,
      'Invalid LMA chart group field.',
      'An invalid LMA chart group'
    );
  }

  @IsTest
  static void shouldAcceptAllowlistedGroup_WhenGettingPushJobChartData() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    try {
      Package2Interface.getPackagePushJobChartData(
        new List<ObjectWrappers.FilterWrapper>(),
        'status'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    Test.stopTest();

    assertNoException(outcome, 'An allowlisted PackagePushJob chart group');
  }

  @IsTest
  static void shouldRejectInvalidGroup_WhenGettingPushJobChartData() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      Package2Interface.getPackagePushJobChartData(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status FROM User'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertExactAuraRejectedBeforeQuery(
      outcome,
      'Invalid package push job chart group field.',
      'An invalid PackagePushJob chart group'
    );
  }

  @IsTest
  static void shouldAcceptNullFilters_WhenGettingPackage2Versions() {
    Test.setMock(HttpCalloutMock.class, new EmptyToolingMock());
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.calloutsBefore = Limits.getCallouts();
    try {
      Package2Interface.getPackage2Versions(
        null,
        null,
        null,
        null,
        null,
        'CreatedDate',
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.calloutsAfter = Limits.getCallouts();
    Test.stopTest();

    assertNoException(outcome, 'A null callout-backed filter list');
    Assert.areEqual(
      outcome.calloutsBefore + 1,
      outcome.calloutsAfter,
      'Null filters should remain compatible with the Tooling query path'
    );
  }

  @IsTest
  static void shouldAcceptNullFilters_WhenGettingLmaChartData() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    try {
      Package2Interface.getLmaChartData(null, 'sfLma__Status__c');
    } catch (Exception e) {
      outcome.capture(e);
    }
    Test.stopTest();

    assertNoException(outcome, 'A null optional-object filter list');
  }

  @IsTest
  static void shouldCanonicalizeIdentifier_WhenAllowlistedIdentifierIsValid() {
    Map<String, String> allowlist = new Map<String, String>{
      'createddate' => 'CreatedDate',
      'systemmodstamp' => 'SystemModstamp'
    };

    Test.startTest();
    String value = SoqlInputValidator.normalizeAllowlistedIdentifier(
      '  CREATEDDATE  ',
      allowlist,
      'Invalid sort field.'
    );
    Test.stopTest();

    Assert.areEqual(
      'CreatedDate',
      value,
      'Identifier should map case-insensitively to the canonical allowlist value'
    );
  }

  @IsTest
  static void shouldRejectNullIdentifier_WhenAllowlistedIdentifierIsValidated() {
    Map<String, String> allowlist = new Map<String, String>{
      'createddate' => 'CreatedDate'
    };
    try {
      Test.startTest();
      SoqlInputValidator.normalizeAllowlistedIdentifier(
        null,
        allowlist,
        'Invalid sort field.'
      );
      Assert.fail('Expected AuraHandledException for null identifier');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid sort field.',
        e.getMessage(),
        'Null identifier should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectBlankIdentifier_WhenAllowlistedIdentifierIsValidated() {
    Map<String, String> allowlist = new Map<String, String>{
      'createddate' => 'CreatedDate'
    };
    try {
      Test.startTest();
      SoqlInputValidator.normalizeAllowlistedIdentifier(
        '   ',
        allowlist,
        'Invalid sort field.'
      );
      Assert.fail('Expected AuraHandledException for blank identifier');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid sort field.',
        e.getMessage(),
        'Blank identifier should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectMissingIdentifier_WhenAllowlistedIdentifierIsValidated() {
    Map<String, String> allowlist = new Map<String, String>{
      'createddate' => 'CreatedDate'
    };
    try {
      Test.startTest();
      SoqlInputValidator.normalizeAllowlistedIdentifier(
        'Id',
        allowlist,
        'Invalid sort field.'
      );
      Assert.fail('Expected AuraHandledException for missing identifier');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid sort field.',
        e.getMessage(),
        'Missing identifier should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectNullAllowlist_WhenAllowlistedIdentifierIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeAllowlistedIdentifier(
        'CreatedDate',
        null,
        'Invalid sort field.'
      );
      Assert.fail('Expected AuraHandledException for null allowlist');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid sort field.',
        e.getMessage(),
        'Null allowlist should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectEmptyAllowlist_WhenAllowlistedIdentifierIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeAllowlistedIdentifier(
        'CreatedDate',
        new Map<String, String>(),
        'Invalid sort field.'
      );
      Assert.fail('Expected AuraHandledException for empty allowlist');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid sort field.',
        e.getMessage(),
        'Empty allowlist should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldCanonicalizeDirection_WhenSortDirectionIsValid() {
    Test.startTest();
    String direction = SoqlInputValidator.normalizeSortDirection(
      '  asc ',
      'Invalid sort direction.'
    );
    Test.stopTest();

    Assert.areEqual(
      'ASC',
      direction,
      'Sort direction should canonicalize to uppercase ASC or DESC'
    );
  }

  @IsTest
  static void shouldRejectBlankDirection_WhenSortDirectionIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeSortDirection(
        '  ',
        'Invalid sort direction.'
      );
      Assert.fail('Expected AuraHandledException for blank direction');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid sort direction.',
        e.getMessage(),
        'Blank sort direction should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectInvalidDirection_WhenSortDirectionIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeSortDirection(
        'DESC NULLS FIRST',
        'Invalid sort direction.'
      );
      Assert.fail('Expected AuraHandledException for invalid direction');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid sort direction.',
        e.getMessage(),
        'Non-allowlisted direction should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldParseBoundaries_WhenIntegerRangeIsValid() {
    Test.startTest();
    Integer minimum = SoqlInputValidator.parseIntegerInRange(
      '0',
      0,
      2000,
      'Invalid value.'
    );
    Integer maximum = SoqlInputValidator.parseIntegerInRange(
      '2000',
      0,
      2000,
      'Invalid value.'
    );
    Test.stopTest();

    Assert.areEqual(
      0,
      minimum,
      'Range parser should accept the minimum boundary'
    );
    Assert.areEqual(
      2000,
      maximum,
      'Range parser should accept the maximum boundary'
    );
  }

  @IsTest
  static void shouldRejectOutOfRangeValue_WhenIntegerRangeIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.parseIntegerInRange('2001', 0, 2000, 'Invalid value.');
      Assert.fail('Expected AuraHandledException for value above maximum');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid value.',
        e.getMessage(),
        'Out-of-range values should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectBelowMinimum_WhenIntegerRangeIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.parseIntegerInRange('-1', 0, 2000, 'Invalid value.');
      Assert.fail('Expected AuraHandledException for negative number token');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid value.',
        e.getMessage(),
        'Negative token should fail strict digits parsing'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectNonDigitToken_WhenIntegerRangeIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.parseIntegerInRange(
        '10 OFFSET 0',
        0,
        2000,
        'Invalid value.'
      );
      Assert.fail('Expected AuraHandledException for non-digit token');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid value.',
        e.getMessage(),
        'Non-digit token should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectOverflow_WhenIntegerRangeIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.parseIntegerInRange(
        '2147483648',
        0,
        2147483647,
        'Invalid value.'
      );
      Assert.fail('Expected AuraHandledException for integer overflow');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid value.',
        e.getMessage(),
        'Overflow token should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldParseZero_WhenNonNegativeIntegerIsValid() {
    Test.startTest();
    Integer parsed = SoqlInputValidator.parseNonNegativeInteger(
      '0',
      'Invalid nonnegative value.'
    );
    Test.stopTest();

    Assert.areEqual(0, parsed, 'Non-negative parser should accept zero');
  }

  @IsTest
  static void shouldRejectNegativeToken_WhenNonNegativeIntegerIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.parseNonNegativeInteger(
        '-10',
        'Invalid nonnegative value.'
      );
      Assert.fail('Expected AuraHandledException for negative token');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid nonnegative value.',
        e.getMessage(),
        'Negative token should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldCanonicalizeBoolean_WhenBooleanLiteralIsValid() {
    Test.startTest();
    String value = SoqlInputValidator.normalizeBooleanLiteral(
      ' FALSE ',
      'Invalid boolean value.'
    );
    Test.stopTest();

    Assert.areEqual(
      'false',
      value,
      'Boolean literal should canonicalize to lowercase true/false'
    );
  }

  @IsTest
  static void shouldRejectBlankBoolean_WhenBooleanLiteralIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeBooleanLiteral(' ', 'Invalid boolean value.');
      Assert.fail('Expected AuraHandledException for blank boolean');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid boolean value.',
        e.getMessage(),
        'Blank boolean should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectInvalidBoolean_WhenBooleanLiteralIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeBooleanLiteral(
        'true OR Name != null',
        'Invalid boolean value.'
      );
      Assert.fail('Expected AuraHandledException for invalid boolean token');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid boolean value.',
        e.getMessage(),
        'Invalid boolean token should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldAcceptStrictDecimals_WhenDecimalLiteralIsValid() {
    Test.startTest();
    String integerLiteral = SoqlInputValidator.normalizeStrictDecimalLiteral(
      '10',
      'Invalid decimal value.'
    );
    String decimalLiteral = SoqlInputValidator.normalizeStrictDecimalLiteral(
      '-0.75',
      'Invalid decimal value.'
    );
    Test.stopTest();

    Assert.areEqual(
      '10',
      integerLiteral,
      'Whole numbers should be accepted as strict decimals'
    );
    Assert.areEqual(
      '-0.75',
      decimalLiteral,
      'Negative decimals should be accepted as strict decimals'
    );
  }

  @IsTest
  static void shouldRejectMalformedDecimal_WhenDecimalLiteralIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeStrictDecimalLiteral(
        '1.',
        'Invalid decimal value.'
      );
      Assert.fail('Expected AuraHandledException for malformed decimal');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid decimal value.',
        e.getMessage(),
        'Malformed decimal should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldRejectLeadingZeroDecimal_WhenDecimalLiteralIsValidated() {
    try {
      Test.startTest();
      SoqlInputValidator.normalizeStrictDecimalLiteral(
        '01.5',
        'Invalid decimal value.'
      );
      Assert.fail('Expected AuraHandledException for leading zero decimal');
    } catch (AuraHandledException e) {
      Assert.areEqual(
        'Invalid decimal value.',
        e.getMessage(),
        'Leading-zero decimal should return the stable validation message'
      );
    } finally {
      Test.stopTest();
    }
  }

  @IsTest
  static void shouldEscapeLikeSpecialCharacters_WhenEscapingSearchValue() {
    Test.startTest();
    String escaped = SoqlInputValidator.escapeLikeSearchValue(
      'O\'Brien\\file%_name'
    );
    Test.stopTest();

    Assert.areEqual(
      'O\\\'Brien\\\\file\\%\\_name',
      escaped,
      'LIKE search escaping should preserve backslashes and escape quote/%/_ characters'
    );
  }

  private static WhereClauseOutcome invokeWhereClause(
    String fieldName,
    String value,
    String dataType
  ) {
    WhereClauseOutcome outcome = new WhereClauseOutcome();
    Test.startTest();
    try {
      outcome.whereClause = Package2Interface.getWhereClause(
        filters(fieldName, value, dataType)
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    Test.stopTest();
    return outcome;
  }

  private static void assertNoException(
    ValidationOutcome outcome,
    String behavior
  ) {
    Assert.isNull(
      outcome.exceptionType,
      behavior + ' should not throw. Got ' + outcome.exceptionType
    );
  }

  private static void assertAuraRejected(
    ValidationOutcome outcome,
    String behavior
  ) {
    Assert.areEqual(
      'System.AuraHandledException',
      outcome.exceptionType,
      behavior + ' should throw AuraHandledException'
    );
  }

  private static void assertAuraRejectedBeforeQuery(
    ValidationOutcome outcome,
    String behavior
  ) {
    assertAuraRejected(outcome, behavior);
    Assert.areEqual(
      outcome.queriesBefore,
      outcome.queriesAfter,
      behavior + ' should be rejected before Database.query'
    );
  }

  private static void assertAuraRejectedBeforeCallout(
    ValidationOutcome outcome,
    String behavior
  ) {
    assertAuraRejected(outcome, behavior);
    Assert.areEqual(
      outcome.calloutsBefore,
      outcome.calloutsAfter,
      behavior + ' should be rejected before Tooling callout'
    );
  }

  private static void assertExactAuraRejectedBeforeQuery(
    ValidationOutcome outcome,
    String expectedMessage,
    String behavior
  ) {
    assertAuraRejected(outcome, behavior);
    Assert.areEqual(
      expectedMessage,
      outcome.exceptionMessage,
      behavior + ' should return the stable validation message'
    );
    Assert.areEqual(
      outcome.queriesBefore,
      outcome.queriesAfter,
      behavior + ' should be rejected before Database.query'
    );
  }

  private static void assertExactAuraRejectedBeforeCallout(
    ValidationOutcome outcome,
    String expectedMessage,
    String behavior
  ) {
    assertAuraRejected(outcome, behavior);
    Assert.areEqual(
      expectedMessage,
      outcome.exceptionMessage,
      behavior + ' should return the stable validation message'
    );
    Assert.areEqual(
      outcome.calloutsBefore,
      outcome.calloutsAfter,
      behavior + ' should be rejected before Tooling callout'
    );
  }

  private virtual class ValidationOutcome {
    String exceptionType;
    String exceptionMessage;
    Integer queriesBefore;
    Integer queriesAfter;
    Integer calloutsBefore;
    Integer calloutsAfter;

    void capture(Exception error) {
      exceptionType = error.getTypeName();
      exceptionMessage = error.getMessage();
    }
  }

  private class WhereClauseOutcome extends ValidationOutcome {
    String whereClause;
  }

  private static List<ObjectWrappers.FilterWrapper> filters(
    String fieldName,
    String value,
    String dataType
  ) {
    return new List<ObjectWrappers.FilterWrapper>{
      filter(fieldName, value, dataType)
    };
  }

  private static ObjectWrappers.FilterWrapper filter(
    String fieldName,
    String value,
    String dataType
  ) {
    ObjectWrappers.FilterWrapper wrapper = new ObjectWrappers.FilterWrapper();
    wrapper.fieldName = fieldName;
    wrapper.value = value;
    wrapper.dataType = dataType;
    return wrapper;
  }

  private class EmptyToolingMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse response = new HttpResponse();
      response.setStatusCode(200);
      response.setHeader('Content-Type', 'application/json');
      response.setBody('{"size":0,"totalSize":0,"done":true,"records":[]}');
      return response;
    }
  }

  private class CapturingToolingMock implements HttpCalloutMock {
    String lastEndpoint;

    public HttpResponse respond(HttpRequest req) {
      lastEndpoint = req.getEndpoint();
      HttpResponse response = new HttpResponse();
      response.setStatusCode(200);
      response.setHeader('Content-Type', 'application/json');
      response.setBody('{"size":0,"totalSize":0,"done":true,"records":[]}');
      return response;
    }
  }
}
