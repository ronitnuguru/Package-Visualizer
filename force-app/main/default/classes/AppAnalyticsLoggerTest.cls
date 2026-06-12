@isTest
private class AppAnalyticsLoggerTest {
  // With the test guard ON, log() must be a complete no-op and must not throw,
  // regardless of whether the IsvPartners namespace is available in this org.
  @isTest
  static void log_isNoOpAndNeverThrows_whenDisabledForTest() {
    AppAnalyticsLogger.disableForTest = true;
    Test.startTest();
    AppAnalyticsLogger.log(
      PackageVisualizerInteractions.MIGRATED_TO_ECA,
      UserInfo.getOrganizationId()
    );
    Test.stopTest();
    System.assert(true, 'log() returned without throwing under disableForTest');
  }

  // With the guard OFF, log() still must never propagate an exception to callers
  // (analytics must not break auth/callouts). In a test context the underlying
  // API call is unavailable/ignored; log() must swallow any resulting exception.
  @isTest
  static void log_neverThrows_whenEnabled() {
    AppAnalyticsLogger.disableForTest = false;
    Test.startTest();
    AppAnalyticsLogger.log(
      PackageVisualizerInteractions.USING_LEGACY_SESSION_ID,
      UserInfo.getOrganizationId()
    );
    Test.stopTest();
    System.assert(true, 'log() swallowed any API exception and returned');
  }
}
