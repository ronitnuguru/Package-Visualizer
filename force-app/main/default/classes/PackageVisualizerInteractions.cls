/**************************************************************************************
 * @Description  App Analytics Custom Interaction labels for the package. Packaged,
 * compile-time enum values required by IsvPartners.AppAnalytics.logCustomInteraction().
 * Business-level labels per Salesforce best practice. Keep additions meaningful —
 * each value becomes an analytics label in Package Usage Logs.
 *
 *   MIGRATED_TO_ECA  Logged once when a subscriber org flips from the legacy
 *                    session-id auth path to the OAuth / External Client App path.
 **************************************************************************************/
public enum PackageVisualizerInteractions {
  MIGRATED_TO_ECA
}
