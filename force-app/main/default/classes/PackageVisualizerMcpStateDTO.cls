/** Top-level LWC response containing observed state, without editor or reconciliation fields. */
public with sharing class PackageVisualizerMcpStateDTO {
  @AuraEnabled
  public String serverId { get; set; }
  @AuraEnabled
  public String serverUrl { get; set; }
  @AuraEnabled
  public Boolean active { get; set; }
  @AuraEnabled
  public Boolean loaded { get; set; }
  @AuraEnabled
  public Boolean canCreate { get; set; }
  @AuraEnabled
  public List<String> issues { get; set; }
  @AuraEnabled
  public List<PackageVisualizerMcpToolDTO> assets { get; set; }
  public PackageVisualizerMcpStateDTO(PackageVisualizerMcpService.State state) {
    serverId = state.serverId;
    serverUrl = state.serverUrl;
    active = state.active;
    loaded = state.loaded;
    canCreate = state.canCreate;
    issues = state.issues;
    assets = new List<PackageVisualizerMcpToolDTO>();
    for (Map<String, Object> asset : state.assets)
      assets.add(new PackageVisualizerMcpToolDTO(asset));
  }
}
