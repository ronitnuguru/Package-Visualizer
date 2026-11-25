/** Explicit administrator actions for a local, subscriber-owned OAuth app. */
public with sharing class PackageVisualizerEcaController {
  @AuraEnabled
  public static PackageVisualizerEcaStateDTO getState() {
    try {
      return new PackageVisualizerEcaService().getState();
    } catch (Exception e) {
      throw handled(e);
    }
  }
  @AuraEnabled
  public static PackageVisualizerEcaStateDTO createLocalEca(
    String runAsUsername,
    String contactEmail
  ) {
    try {
      return new PackageVisualizerEcaService()
        .createLocalEca(runAsUsername, contactEmail);
    } catch (Exception e) {
      throw handled(e);
    }
  }
  private static AuraHandledException handled(Exception e) {
    String message = e instanceof PackageVisualizerEcaService.EcaException
      ? e.getMessage()
      : 'Unable to confirm the local ECA. Refresh and review External Client App Manager before retrying.';
    AuraHandledException result = new AuraHandledException(message);
    result.setMessage(message);
    return result;
  }
}
