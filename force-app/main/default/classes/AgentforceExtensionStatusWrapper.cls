/**
 * Read-only status and presentation metadata for the optional Package
 * Visualizer Agentforce extension.
 */
public with sharing class AgentforceExtensionStatusWrapper {
  @AuraEnabled
  public String state { get; set; }
  @AuraEnabled
  public String message { get; set; }
  @AuraEnabled
  public String configuredSubscriberPackageId { get; set; }
  @AuraEnabled
  public String configuredSubscriberPackageVersionId { get; set; }
  @AuraEnabled
  public String installedSubscriberPackageId { get; set; }
  @AuraEnabled
  public String installedSubscriberPackageVersionId { get; set; }
  @AuraEnabled
  public String targetVersionLabel { get; set; }
  @AuraEnabled
  public String directInstallUrl { get; set; }
  @AuraEnabled
  public String extensionLabel { get; set; }
  @AuraEnabled
  public String description { get; set; }
  @AuraEnabled
  public String iconName { get; set; }
  @AuraEnabled
  public String permissionSetLabel { get; set; }
  @AuraEnabled
  public String namespacePrefix { get; set; }
}
