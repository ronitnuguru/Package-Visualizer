/**************************************************************************************
 * @Description  Single guarded surface over the App Analytics Custom Interactions
 * API. Analytics must NEVER break auth or a callout, so every failure is swallowed.
 * disableForTest lets unit tests exercise call sites without invoking the real API
 * (which is unavailable outside a subscriber org).
 **************************************************************************************/
public with sharing class AppAnalyticsLogger {
  // Set true in tests to make log() a no-op. Production code never sets this.
  @TestVisible
  private static Boolean disableForTest = false;

  /**
   * @Description  Logs a Custom Interaction with an org-id correlation token.
   * Swallows all exceptions — analytics failures must not surface to callers.
   * @param label          The packaged interaction label.
   * @param correlationId  Identifier hashed/tokenized by App Analytics before storage.
   */
  public static void log(
    PackageVisualizerInteractions label,
    Id correlationId
  ) {
    if (disableForTest) {
      return;
    }
    try {
      IsvPartners.AppAnalytics.logCustomInteraction(label, correlationId);
    } catch (Exception e) {
      // Intentionally swallowed. App Analytics also silently ignores
      // over-limit calls; we mirror that contract so callouts never break.
      System.debug(
        LoggingLevel.FINE,
        'APP_ANALYTICS_WARN logCustomInteraction skipped: ' + e.getMessage()
      );
    }
  }
}
