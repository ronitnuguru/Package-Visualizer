/**
 * Typed detail result for a single PackageSubscriber record.
 * Mirrors HxlPackageDetailResult structure for consistent HXL navigation.
 */
global class HxlSubscriberDetailResult {
  @AuraEnabled
  global String state;

  @AuraEnabled
  global String message;

  @AuraEnabled
  global String orgKey;

  @AuraEnabled
  global String orgName;

  @AuraEnabled
  global String orgType;

  @AuraEnabled
  global String orgStatus;

  @AuraEnabled
  global String instanceName;

  @AuraEnabled
  global String parentOrg;

  @AuraEnabled
  global String metadataPackageId;

  @AuraEnabled
  global String metadataPackageVersionId;

  @AuraEnabled
  global String customUpgradeType;

  @AuraEnabled
  global Boolean hasRestrictionEnabled;

  @AuraEnabled
  global Boolean isCustomUpgradeAllowed;

  @AuraEnabled
  global DateTime systemModstamp;

  @AuraEnabled
  global String openInSalesforceUrl;
}
