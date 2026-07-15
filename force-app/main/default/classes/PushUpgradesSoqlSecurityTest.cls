@IsTest
private class PushUpgradesSoqlSecurityTest {
  private static final String INVALID_SORT = 'Status DESC NULLS FIRST';
  private static final String INVALID_DIRECTION = 'DESC NULLS FIRST';
  private static final String INVALID_GROUP = 'Status FROM User';
  private static final String INVALID_LIMIT = '50 OFFSET 0';
  private static final String INVALID_OFFSET = '0 LIMIT 500';

  @IsTest
  static void shouldRejectPushRequestSortField_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushRequests(
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

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushRequest sort field'
    );
  }

  @IsTest
  static void shouldRejectPushRequestDirection_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        INVALID_DIRECTION,
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushRequest sort direction'
    );
  }

  @IsTest
  static void shouldRejectPushRequestLimit_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushRequest limit'
    );
  }

  @IsTest
  static void shouldRejectPushRequestOffset_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        'DESC',
        '50',
        INVALID_OFFSET
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushRequest offset'
    );
  }

  @IsTest
  static void shouldRejectPushRequestLimitBelowMinimum_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        'DESC',
        '0',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'A below-minimum PackagePushRequest limit'
    );
  }

  @IsTest
  static void shouldRejectPushRequestOffsetAboveMaximum_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushRequests(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        'DESC',
        '50',
        '2001'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An above-maximum PackagePushRequest offset'
    );
  }

  @IsTest
  static void shouldRejectPushRequestSortFieldWithNullFilters_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushRequests(
        null,
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

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushRequest sort field with null filters'
    );
  }

  @IsTest
  static void shouldExecutePushRequestQuery_WhenValidFilterIsProvided() {
    ObjectWrappers.FilterWrapper filter = new ObjectWrappers.FilterWrapper();
    filter.fieldName = 'PackageVersionId';
    filter.value = '04t000000000000AAA';
    filter.dataType = 'STRING';
    ValidationOutcome outcome = new ValidationOutcome();
    List<ObjectWrappers.PackagePushRequestWrapper> pushRequests;

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      pushRequests = PushUpgradesInterface.getPushRequests(
        new List<ObjectWrappers.FilterWrapper>{ filter },
        'SystemModstamp',
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    Assert.isNull(
      outcome.exceptionType,
      'A valid PackagePushRequest filter should produce executable query syntax'
    );
    Assert.isTrue(
      outcome.queriesAfter > outcome.queriesBefore,
      'The optional PackagePushRequest query path must execute on PkgViz'
    );
    Assert.isNotNull(
      pushRequests,
      'A valid PackagePushRequest query should return a nonnull list'
    );
  }

  @IsTest
  static void shouldRejectPushJobSortField_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobs(
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

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushJob sort field'
    );
  }

  @IsTest
  static void shouldRejectPushJobDirection_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobs(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        INVALID_DIRECTION,
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushJob sort direction'
    );
  }

  @IsTest
  static void shouldRejectPushJobLimit_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobs(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(outcome, 'An invalid PackagePushJob limit');
  }

  @IsTest
  static void shouldRejectPushJobOffset_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobs(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        'DESC',
        '50',
        INVALID_OFFSET
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(outcome, 'An invalid PackagePushJob offset');
  }

  @IsTest
  static void shouldRejectPushJobLimitAboveMaximum_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobs(
        new List<ObjectWrappers.FilterWrapper>(),
        'Status',
        'DESC',
        '2001',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An above-maximum PackagePushJob limit'
    );
  }

  @IsTest
  static void shouldRejectPushJobSortFieldWithNullFilters_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobs(null, INVALID_SORT, 'DESC', '50', '0');
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushJob sort field with null filters'
    );
  }

  @IsTest
  static void shouldRejectPushJobGrouping_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobsChartData(
        new List<ObjectWrappers.FilterWrapper>(),
        INVALID_GROUP
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid PackagePushJob group field'
    );
  }

  @IsTest
  static void shouldRejectPushJobUnsupportedGroupingField_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesInterface.getPushJobsChartData(
        new List<ObjectWrappers.FilterWrapper>(),
        'Id'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An unsupported PackagePushJob group field'
    );
  }

  @IsTest
  static void shouldRejectEligibleHigherPackageVersionSortField_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesCtrl.getEligibleHigherPackageVersions(
        '1.0.0-1',
        '033000000000000AAA',
        'SystemModstamp DESC NULLS FIRST',
        'DESC'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid eligible-version sort field'
    );
  }

  @IsTest
  static void shouldRejectEligibleHigherPackageVersionDirection_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PushUpgradesCtrl.getEligibleHigherPackageVersions(
        '1.0.0-1',
        '033000000000000AAA',
        'SystemModstamp',
        INVALID_DIRECTION
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertAuraRejectedBeforeQuery(
      outcome,
      'An invalid eligible-version sort direction'
    );
  }

  private static void assertAuraRejectedBeforeQuery(
    ValidationOutcome outcome,
    String behavior
  ) {
    Assert.areEqual(
      'System.AuraHandledException',
      outcome.exceptionType,
      behavior + ' should throw AuraHandledException'
    );
    Assert.areEqual(
      outcome.queriesBefore,
      outcome.queriesAfter,
      behavior + ' should be rejected before Database.query'
    );
  }

  private class ValidationOutcome {
    String exceptionType;
    String exceptionMessage;
    Integer queriesBefore;
    Integer queriesAfter;

    void capture(Exception error) {
      exceptionType = error.getTypeName();
      exceptionMessage = error.getMessage();
    }
  }
}
