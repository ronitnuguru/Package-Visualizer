/**
 * Maps PackageSubscriber records to typed HXL result contracts.
 * PackageSubscriber is read via direct SOQL, not the Tooling API, so records
 * arrive as SObjects rather than deserialized JSON maps.
 */
public with sharing class HxlSubscriberResultMapper {
  private static final String SUBSCRIBER_SETUP_PATH = '/lightning/setup/PackageSubscribers/home';

  /**
   * Maps a bounded query result to a list-page result.
   *
   * @param records Raw PackageSubscriber records
   * @param pageSize Number of records to expose to the client
   * @return A ready or empty typed subscriber-list result
   */
  public static HxlSubscriberListResult toListResult(
    List<SObject> records,
    Integer pageSize
  ) {
    HxlSubscriberListResult result = new HxlSubscriberListResult();
    Integer recordCount = records == null ? 0 : records.size();
    for (Integer i = 0; i < Math.min(pageSize, recordCount); i++) {
      result.subscribers.add(toSummary(records[i]));
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
   * Maps one PackageSubscriber record to a subscriber-detail result.
   *
   * @param record Raw PackageSubscriber record
   * @return A ready typed subscriber-detail result
   */
  public static HxlSubscriberDetailResult toDetailResult(SObject record) {
    HxlSubscriberDetailResult result = new HxlSubscriberDetailResult();
    result.state = 'READY';
    result.message = 'Subscriber organization information';
    result.orgKey = (String) record.get('OrgKey');
    result.orgName = (String) record.get('OrgName');
    result.orgType = (String) record.get('OrgType');
    result.orgStatus = (String) record.get('OrgStatus');
    result.instanceName = (String) record.get('InstanceName');
    result.parentOrg = (String) record.get('ParentOrg');
    result.metadataPackageId = (String) record.get('MetadataPackageId');
    result.metadataPackageVersionId = (String) record.get(
      'MetadataPackageVersionId'
    );
    result.customUpgradeType = (String) record.get('CustomUpgradeType');
    result.hasRestrictionEnabled = (Boolean) record.get(
      'HasRestrictionEnabled'
    );
    result.isCustomUpgradeAllowed = (Boolean) record.get(
      'IsCustomUpgradeAllowed'
    );
    result.systemModstamp = (DateTime) record.get('SystemModstamp');
    result.openInSalesforceUrl = getOpenInSalesforceUrlWithOrgKey(
      result.orgKey
    );
    return result;
  }

  private static HxlSubscriberListResult.Subscriber toSummary(SObject record) {
    HxlSubscriberListResult.Subscriber subscriber = new HxlSubscriberListResult.Subscriber();
    subscriber.orgKey = (String) record.get('OrgKey');
    subscriber.orgName = (String) record.get('OrgName');
    subscriber.metadataPackageVersionId = (String) record.get(
      'MetadataPackageVersionId'
    );
    subscriber.installedStatus = (String) record.get('InstalledStatus');
    subscriber.orgType = (String) record.get('OrgType');
    subscriber.instanceName = (String) record.get('InstanceName');
    subscriber.systemModstamp = (DateTime) record.get('SystemModstamp');
    return subscriber;
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
