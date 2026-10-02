/**
 * Maps PackageSubscriber Tooling records to typed HXL result contracts.
 * Mirrors HxlPackageResultMapper structure for consistent conversion patterns.
 */
public with sharing class HxlSubscriberResultMapper {
  private static final String SUBSCRIBER_SETUP_PATH = '/lightning/setup/PackageSubscribers/home';

  /**
   * Maps a bounded query result to a list-page result.
   *
   * @param records Raw PackageSubscriber Tooling records
   * @param pageSize Number of records to expose to the client
   * @return A ready or empty typed subscriber-list result
   */
  public static HxlSubscriberListResult toListResult(
    List<Object> records,
    Integer pageSize
  ) {
    HxlSubscriberListResult result = new HxlSubscriberListResult();
    Integer recordCount = records == null ? 0 : records.size();
    for (Integer i = 0; i < Math.min(pageSize, recordCount); i++) {
      result.subscribers.add(toSummary((Map<String, Object>) records[i]));
    }
    result.hasMore = recordCount > pageSize;
    result.state = result.subscribers.isEmpty() ? 'EMPTY' : 'READY';
    result.message = result.subscribers.isEmpty()
      ? 'No subscribers found on this page.'
      : 'Showing ' + result.subscribers.size() + ' subscribers.';
    result.openInSalesforceUrl = getOpenInSalesforceUrl();
    return result;
  }

  /**
   * Maps one PackageSubscriber Tooling record to a subscriber-detail result.
   *
   * @param record Raw PackageSubscriber Tooling record
   * @return A ready typed subscriber-detail result
   */
  public static HxlSubscriberDetailResult toDetailResult(
    Map<String, Object> record
  ) {
    HxlSubscriberDetailResult result = new HxlSubscriberDetailResult();
    result.state = 'READY';
    result.message = 'Subscriber organization information';
    result.orgKey = (String) record.get('OrgKey');
    result.orgName = (String) record.get('OrgName');
    result.orgType = (String) record.get('OrgType');
    result.orgStatus = (String) record.get('OrgStatus');
    result.instanceName = (String) record.get('InstanceName');
    result.parentOrg = (String) record.get('ParentOrg');
    result.customUpgradeType = (String) record.get('CustomUpgradeType');
    result.hasRestrictionEnabled = (Boolean) record.get(
      'HasRestrictionEnabled'
    );
    result.isCustomUpgradeAllowed = (Boolean) record.get(
      'IsCustomUpgradeAllowed'
    );
    result.systemModstamp = toDatetime(record.get('SystemModstamp'));
    result.openInSalesforceUrl = getOpenInSalesforceUrlWithOrgKey(
      result.orgKey
    );
    return result;
  }

  private static HxlSubscriberListResult.Subscriber toSummary(
    Map<String, Object> record
  ) {
    HxlSubscriberListResult.Subscriber subscriber = new HxlSubscriberListResult.Subscriber();
    subscriber.orgKey = (String) record.get('OrgKey');
    subscriber.orgName = (String) record.get('OrgName');
    subscriber.metadataPackageVersionId = (String) record.get(
      'MetadataPackageVersionId'
    );
    subscriber.installedStatus = (String) record.get('InstalledStatus');
    subscriber.orgType = (String) record.get('OrgType');
    subscriber.instanceName = (String) record.get('InstanceName');
    subscriber.systemModstamp = toDatetime(record.get('SystemModstamp'));
    return subscriber;
  }

  private static DateTime toDatetime(Object value) {
    if (value == null) {
      return null;
    }
    try {
      return DateTime.valueOf(
        String.valueOf(value).replace('T', ' ').replace('Z', '')
      );
    } catch (Exception e) {
      return null;
    }
  }

  public static String getOpenInSalesforceUrl() {
    return Url.getOrgDomainUrl().toExternalForm() + SUBSCRIBER_SETUP_PATH;
  }

  private static String getOpenInSalesforceUrlWithOrgKey(String orgKey) {
    return Url.getOrgDomainUrl().toExternalForm() +
      '/lightning/setup/PackageSubscribers/view?address=' +
      EncodingUtil.urlEncode(orgKey, 'UTF-8');
  }
}
