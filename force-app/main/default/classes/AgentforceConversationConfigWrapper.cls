/**
 * Data transfer objects used by the Agentforce Conversation Client setup and
 * runtime Lightning web components.
 */
public with sharing class AgentforceConversationConfigWrapper {
  /**
   * Runtime BotVersion values read through dynamic SOQL after installation.
   */
  public class ActiveBotVersionRecord {
    public Id botDefinitionId { get; private set; }
    public String status { get; private set; }

    public ActiveBotVersionRecord(Id botDefinitionIdValue, String statusValue) {
      botDefinitionId = botDefinitionIdValue;
      status = statusValue;
    }
  }

  /**
   * Runtime BotDefinition values read through dynamic SOQL after installation.
   */
  public class EmployeeAgentDefinitionRecord {
    public Id botId { get; private set; }
    public String label { get; private set; }
    public String developerName { get; private set; }
    public String type { get; private set; }
    public String agentType { get; private set; }

    public EmployeeAgentDefinitionRecord(
      Id botIdValue,
      String labelValue,
      String developerNameValue,
      String typeValue,
      String agentTypeValue
    ) {
      botId = botIdValue;
      label = labelValue;
      developerName = developerNameValue;
      type = typeValue;
      agentType = agentTypeValue;
    }
  }

  /**
   * Selectable active Agentforce Employee Agent.
   */
  public class AgentOption implements Comparable {
    @AuraEnabled
    public Id botId { get; set; }
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public String developerName { get; set; }

    /**
     * Creates an agent option.
     *
     * @param botIdValue BotDefinition record ID.
     * @param labelValue Agent display label.
     * @param developerNameValue Agent developer name.
     */
    public AgentOption(
      Id botIdValue,
      String labelValue,
      String developerNameValue
    ) {
      botId = botIdValue;
      label = labelValue;
      developerName = developerNameValue;
    }

    /**
     * Orders agent options by label, then developer name.
     *
     * @param value Another AgentOption.
     * @return A negative, zero, or positive sort value.
     */
    public Integer compareTo(Object value) {
      AgentOption other = (AgentOption) value;
      Integer labelComparison = String.valueOf(label)
        .toLowerCase()
        .compareTo(String.valueOf(other.label).toLowerCase());
      if (labelComparison != 0) {
        return labelComparison;
      }
      return String.valueOf(developerName)
        .toLowerCase()
        .compareTo(String.valueOf(other.developerName).toLowerCase());
    }
  }

  /**
   * Current org-wide Agentforce Conversation Client configuration.
   */
  public class Configuration {
    @AuraEnabled
    public Id botId { get; set; }
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public String developerName { get; set; }
    @AuraEnabled
    public String state { get; set; }
    @AuraEnabled
    public String message { get; set; }

    /**
     * Creates a configuration response.
     *
     * @param botIdValue Saved BotDefinition ID.
     * @param labelValue Agent display label.
     * @param developerNameValue Agent developer name.
     * @param stateValue Configuration state.
     * @param messageValue User-facing configuration guidance.
     */
    public Configuration(
      Id botIdValue,
      String labelValue,
      String developerNameValue,
      String stateValue,
      String messageValue
    ) {
      botId = botIdValue;
      label = labelValue;
      developerName = developerNameValue;
      state = stateValue;
      message = messageValue;
    }
  }
}
