/**
 * Typed list result for PackageSubscriber queries.
 * Mirrors HxlPackageListResult structure for consistent HXL pagination.
 */
global class HxlSubscriberListResult {
  @AuraEnabled
  global String state;

  @AuraEnabled
  global String message;

  @AuraEnabled
  global Boolean hasMore;

  @AuraEnabled
  global String nextCursor;

  @AuraEnabled
  global List<Subscriber> subscribers;

  @AuraEnabled
  global String openInSalesforceUrl;

  public HxlSubscriberListResult() {
    this.subscribers = new List<Subscriber>();
    this.hasMore = false;
  }

  global class Subscriber {
    @AuraEnabled
    global String orgKey;

    @AuraEnabled
    global String orgName;

    @AuraEnabled
    global String metadataPackageVersionId;

    @AuraEnabled
    global String installedStatus;

    @AuraEnabled
    global String orgType;

    @AuraEnabled
    global String instanceName;

    @AuraEnabled
    global DateTime systemModstamp;
  }
}
