/** Read-only dashboard and explicit initial provisioning for the package MCP server. */
public with sharing class PackageVisualizerMcpController {
  @AuraEnabled
  public static PackageVisualizerMcpStateDTO getProvisioningState() {
    return new PackageVisualizerMcpStateDTO(
      new PackageVisualizerMcpService().getState()
    );
  }
  @AuraEnabled
  public static PackageVisualizerMcpStateDTO createServer() {
    try {
      return new PackageVisualizerMcpStateDTO(
        new PackageVisualizerMcpService().createServer()
      );
    } catch (Exception e) {
      String message = e instanceof PackageVisualizerMcpService.ProvisioningException
        ? e.getMessage()
        : 'Provisioning did not complete. Refresh and review the server in Setup before retrying.';
      AuraHandledException error = new AuraHandledException(message);
      error.setMessage(message);
      throw error;
    }
  }
}
