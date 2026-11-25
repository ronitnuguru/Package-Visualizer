/** Non-secret status of the subscriber-owned Tooling ECA. */
public with sharing class PackageVisualizerEcaStateDTO {
  @AuraEnabled
  public Boolean exists { get; set; }
  @AuraEnabled
  public Boolean configured { get; set; }
  @AuraEnabled
  public String appId { get; set; }
  @AuraEnabled
  public String runAsUsername { get; set; }
  @AuraEnabled
  public String message { get; set; }
  public PackageVisualizerEcaStateDTO() {
    exists = false;
    configured = false;
  }
}
