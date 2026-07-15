@IsTest
private class PackageVisualizerCtrlSoqlSecurityTest {
  private static final String INVALID_SORT = 'Name DESC NULLS FIRST';
  private static final String INVALID_DIRECTION = 'DESC NULLS FIRST';
  private static final String INVALID_LIMIT = '50 OFFSET 0';
  private static final String INVALID_OFFSET = '0 LIMIT 500';
  private static final String INVALID_SORT_MESSAGE = 'Invalid sort field.';
  private static final String INVALID_DIRECTION_MESSAGE = 'Invalid sort direction.';
  private static final String INVALID_LIMIT_MESSAGE = 'Invalid limit.';
  private static final String INVALID_OFFSET_MESSAGE = 'Invalid offset.';
  private static final String INVALID_DAYS_MESSAGE = 'Invalid days value.';
  private static final String INVALID_FILTER_DATATYPE_MESSAGE = 'Invalid filter data type.';

  @IsTest
  static void shouldRejectLmaLicenseSortField_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PackageVisualizerCtrl.getPackageVersionLicenses(
        filters('sfLma__Package_Version__c', 'a0R000000000000AAA', 'STRING'),
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

    assertValidationRejectedBeforeQuery(
      outcome,
      INVALID_SORT_MESSAGE,
      'An invalid LMA sort field'
    );
  }

  @IsTest
  static void shouldRejectLmaLicenseDirection_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PackageVisualizerCtrl.getPackageVersionLicenses(
        filters('sfLma__Package_Version__c', 'a0R000000000000AAA', 'STRING'),
        'Name',
        INVALID_DIRECTION,
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertValidationRejectedBeforeQuery(
      outcome,
      INVALID_DIRECTION_MESSAGE,
      'An invalid LMA sort direction'
    );
  }

  @IsTest
  static void shouldRejectLmaLicenseLimit_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PackageVisualizerCtrl.getPackageVersionLicenses(
        filters('sfLma__Package_Version__c', 'a0R000000000000AAA', 'STRING'),
        'Name',
        'DESC',
        INVALID_LIMIT,
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertValidationRejectedBeforeQuery(
      outcome,
      INVALID_LIMIT_MESSAGE,
      'An invalid LMA limit'
    );
  }

  @IsTest
  static void shouldRejectLmaLicenseOffset_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PackageVisualizerCtrl.getPackageVersionLicenses(
        filters('sfLma__Package_Version__c', 'a0R000000000000AAA', 'STRING'),
        'Name',
        'DESC',
        '50',
        INVALID_OFFSET
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertValidationRejectedBeforeQuery(
      outcome,
      INVALID_OFFSET_MESSAGE,
      'An invalid LMA offset'
    );
  }

  @IsTest
  static void shouldRejectSignupCountLastNDaysInjection_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PackageVisualizerCtrl.getSignupCount(
        '7 WITH USER_MODE LIMIT 1 /* injection */'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertValidationRejectedBeforeQuery(
      outcome,
      INVALID_DAYS_MESSAGE,
      'An invalid LAST_N_DAYS value'
    );
  }

  @IsTest
  static void shouldRejectLmaLicenseUnsupportedFilterDataType_BeforeQuery() {
    ValidationOutcome outcome = new ValidationOutcome();

    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      PackageVisualizerCtrl.getPackageVersionLicenses(
        filters(
          'sfLma__Package_Version__c',
          'a0R000000000000AAA',
          'BOOLEAN OR Name != null'
        ),
        'Name',
        'DESC',
        '50',
        '0'
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();

    assertValidationRejectedBeforeQuery(
      outcome,
      INVALID_FILTER_DATATYPE_MESSAGE,
      'An unsupported LMA filter data type'
    );
  }

  @IsTest
  static void shouldAcceptLmaLicenseSortFieldAliasIdLowercase() {
    ValidationOutcome outcome = invokeLicenseQuery(
      validLmaFilters(),
      'id',
      'asc',
      '50',
      '0'
    );

    assertSuccessfulLicenseQuery(outcome, 'Lowercase id alias compatibility');
  }

  @IsTest
  static void shouldAcceptLmaLicenseSortFieldAliasLastModifiedDateMixedCase() {
    ValidationOutcome outcome = invokeLicenseQuery(
      validLmaFilters(),
      'lastModifiedDate',
      'DESC',
      '50',
      '0'
    );

    assertSuccessfulLicenseQuery(
      outcome,
      'Mixed-case LastModifiedDate alias compatibility'
    );
  }

  @IsTest
  static void shouldAcceptLmaLicenseSortFieldAliasLastModifiedDateLowercase() {
    ValidationOutcome outcome = invokeLicenseQuery(
      validLmaFilters(),
      'lastmodifieddate',
      'DESC',
      '50',
      '0'
    );

    assertSuccessfulLicenseQuery(
      outcome,
      'Lowercase LastModifiedDate alias compatibility'
    );
  }

  @IsTest
  static void shouldAcceptLmaLicenseNullFilter() {
    ValidationOutcome outcome = invokeLicenseQuery(
      null,
      'Name',
      'ASC',
      '1',
      '0'
    );

    assertSuccessfulLicenseQuery(outcome, 'Null LMA filter compatibility');
  }

  @IsTest
  static void shouldAcceptLmaLicenseLimitMinimum() {
    ValidationOutcome outcome = invokeLicenseQuery(
      validLmaFilters(),
      'Name',
      'ASC',
      '1',
      '0'
    );

    assertSuccessfulLicenseQuery(outcome, 'LMA limit minimum boundary');
  }

  @IsTest
  static void shouldAcceptLmaLicenseLimitMaximum() {
    ValidationOutcome outcome = invokeLicenseQuery(
      validLmaFilters(),
      'Name',
      'ASC',
      '2000',
      '0'
    );

    assertSuccessfulLicenseQuery(outcome, 'LMA limit maximum boundary');
  }

  @IsTest
  static void shouldAcceptLmaLicenseOffsetMinimum() {
    ValidationOutcome outcome = invokeLicenseQuery(
      validLmaFilters(),
      'Name',
      'ASC',
      '1',
      '0'
    );

    assertSuccessfulLicenseQuery(outcome, 'LMA offset minimum boundary');
  }

  @IsTest
  static void shouldAcceptLmaLicenseOffsetMaximum() {
    ValidationOutcome outcome = invokeLicenseQuery(
      validLmaFilters(),
      'Name',
      'ASC',
      '1',
      '2000'
    );

    assertSuccessfulLicenseQuery(outcome, 'LMA offset maximum boundary');
  }

  @IsTest
  static void shouldAcceptSignupCountDaysMinimum() {
    ValidationOutcome outcome = invokeSignupCount('1');

    assertSuccessfulSignupCountQuery(outcome, 'days=1 minimum boundary');
  }

  @IsTest
  static void shouldAcceptSignupCountDaysSeven() {
    ValidationOutcome outcome = invokeSignupCount('7');

    assertSuccessfulSignupCountQuery(outcome, 'days=7 compatibility');
  }

  @IsTest
  static void shouldAcceptSignupCountDaysMaximum() {
    ValidationOutcome outcome = invokeSignupCount('9999');

    assertSuccessfulSignupCountQuery(outcome, 'days=9999 maximum boundary');
  }

  private static void assertValidationRejectedBeforeQuery(
    ValidationOutcome outcome,
    String expectedMessage,
    String behavior
  ) {
    Assert.areEqual(
      'System.AuraHandledException',
      outcome.exceptionType,
      behavior + ' should throw AuraHandledException'
    );
    Assert.areEqual(
      expectedMessage,
      outcome.exceptionMessage,
      behavior + ' should surface the stable validation message'
    );
    Assert.areEqual(
      outcome.queriesBefore,
      outcome.queriesAfter,
      behavior + ' should be rejected before Database.query'
    );
  }

  private static void assertSuccessfulLicenseQuery(
    ValidationOutcome outcome,
    String behavior
  ) {
    Assert.isNull(
      outcome.exceptionType,
      behavior + ' should not throw an exception: ' + outcome.exceptionMessage
    );
    Assert.areEqual(
      outcome.queriesBefore + 1,
      outcome.queriesAfter,
      behavior + ' should execute exactly one query'
    );
    Assert.isNotNull(
      outcome.licenseResult,
      behavior + ' should return a non-null license list'
    );
  }

  private static void assertSuccessfulSignupCountQuery(
    ValidationOutcome outcome,
    String behavior
  ) {
    Assert.isNull(
      outcome.exceptionType,
      behavior + ' should not throw an exception: ' + outcome.exceptionMessage
    );
    Assert.areEqual(
      outcome.queriesBefore + 1,
      outcome.queriesAfter,
      behavior + ' should execute exactly one query'
    );
    Assert.isNotNull(
      outcome.signupCountResult,
      behavior + ' should return a non-null aggregate list'
    );
    Assert.areEqual(
      1,
      outcome.signupCountResult.size(),
      behavior + ' should return one aggregate row'
    );
    Assert.isNotNull(
      outcome.signupCountResult[0].get('expr0'),
      behavior + ' should return the count value in expr0'
    );
  }

  private class ValidationOutcome {
    String exceptionType;
    String exceptionMessage;
    Integer queriesBefore;
    Integer queriesAfter;
    List<ObjectWrappers.LMALicenseWrapper> licenseResult;
    List<AggregateResult> signupCountResult;

    void capture(Exception error) {
      exceptionType = error.getTypeName();
      exceptionMessage = error.getMessage();
    }
  }

  private static ValidationOutcome invokeLicenseQuery(
    List<ObjectWrappers.FilterWrapper> filterWrapper,
    String sortedBy,
    String sortDirection,
    String lmaLicensesLimit,
    String lmaLicensesOffset
  ) {
    ValidationOutcome outcome = new ValidationOutcome();
    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      outcome.licenseResult = PackageVisualizerCtrl.getPackageVersionLicenses(
        filterWrapper,
        sortedBy,
        sortDirection,
        lmaLicensesLimit,
        lmaLicensesOffset
      );
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();
    return outcome;
  }

  private static ValidationOutcome invokeSignupCount(String days) {
    ValidationOutcome outcome = new ValidationOutcome();
    Test.startTest();
    outcome.queriesBefore = Limits.getQueries();
    try {
      outcome.signupCountResult = PackageVisualizerCtrl.getSignupCount(days);
    } catch (Exception e) {
      outcome.capture(e);
    }
    outcome.queriesAfter = Limits.getQueries();
    Test.stopTest();
    return outcome;
  }

  private static List<ObjectWrappers.FilterWrapper> validLmaFilters() {
    return filters('sfLma__Package_Version__c', 'a0R000000000000AAA', 'STRING');
  }

  private static List<ObjectWrappers.FilterWrapper> filters(
    String fieldName,
    String value,
    String dataType
  ) {
    ObjectWrappers.FilterWrapper wrapper = new ObjectWrappers.FilterWrapper();
    wrapper.fieldName = fieldName;
    wrapper.value = value;
    wrapper.dataType = dataType;
    return new List<ObjectWrappers.FilterWrapper>{ wrapper };
  }
}
