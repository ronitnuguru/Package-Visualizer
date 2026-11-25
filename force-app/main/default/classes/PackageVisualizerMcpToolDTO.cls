/** Top-level read-only representation of a configured server asset. */
public with sharing class PackageVisualizerMcpToolDTO {
  @AuraEnabled
  public String id { get; set; }
  @AuraEnabled
  public String name { get; set; }
  @AuraEnabled
  public String label { get; set; }
  @AuraEnabled
  public String description { get; set; }
  @AuraEnabled
  public String kind { get; set; }
  @AuraEnabled
  public Map<String, Boolean> annotations { get; set; }
  public PackageVisualizerMcpToolDTO(Map<String, Object> asset) {
    id = (String) asset.get('id');
    name = (String) asset.get('name');
    label = (String) asset.get('label');
    description = (String) asset.get('description');
    kind = (String) asset.get('kind');
    annotations = (Map<String, Boolean>) JSON.deserialize(
      JSON.serialize(asset.get('annotations')),
      Map<String, Boolean>.class
    );
  }
}
