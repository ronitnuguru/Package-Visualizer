/*******************************************************************************************
 * @Description  Aura-serializable result returned by the AgentScript Coach enrichment API.
 *******************************************************************************************/
public with sharing class AgentScriptCoachResult {
  @AuraEnabled
  public String status { get; set; }
  @AuraEnabled
  public String analysisJson { get; set; }
  @AuraEnabled
  public Datetime generatedAt { get; set; }
}
