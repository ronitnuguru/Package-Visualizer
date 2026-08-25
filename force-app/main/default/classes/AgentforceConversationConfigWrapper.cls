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

  /**
   * Runtime McpServerDefinition values read through the Tooling API.
   */
  public class McpServerDefinitionRecord {
    public String id { get; private set; }
    public String developerName { get; private set; }

    /**
     * Creates a Tooling API MCP server definition record.
     *
     * @param idValue McpServerDefinition record ID.
     * @param developerNameValue McpServerDefinition developer name.
     */
    public McpServerDefinitionRecord(
      String idValue,
      String developerNameValue
    ) {
      id = idValue;
      developerName = developerNameValue;
    }
  }

  /**
   * Selectable Custom MCP Server option.
   */
  public class McpServerOption implements Comparable {
    @AuraEnabled
    public String id { get; set; }
    @AuraEnabled
    public String developerName { get; set; }

    /**
     * Creates a selectable Custom MCP Server option.
     *
     * @param idValue McpServerDefinition record ID.
     * @param developerNameValue McpServerDefinition developer name.
     */
    public McpServerOption(String idValue, String developerNameValue) {
      id = idValue;
      developerName = developerNameValue;
    }

    /**
     * Orders Custom MCP Server options by developer name.
     *
     * @param value Another McpServerOption.
     * @return A negative, zero, or positive sort value.
     */
    public Integer compareTo(Object value) {
      McpServerOption other = (McpServerOption) value;
      return String.valueOf(developerName)
        .toLowerCase()
        .compareTo(String.valueOf(other.developerName).toLowerCase());
    }
  }

  /**
   * Current org-wide Custom MCP Server configuration.
   */
  public class McpServerConfiguration {
    @AuraEnabled
    public String mcpServerDefinitionId { get; set; }
    @AuraEnabled
    public String developerName { get; set; }
    @AuraEnabled
    public String state { get; set; }
    @AuraEnabled
    public String message { get; set; }

    /**
     * Creates a Custom MCP Server configuration response.
     *
     * @param idValue Saved McpServerDefinition ID.
     * @param developerNameValue Selected definition developer name.
     * @param stateValue Configuration state.
     * @param messageValue User-facing configuration guidance.
     */
    public McpServerConfiguration(
      String idValue,
      String developerNameValue,
      String stateValue,
      String messageValue
    ) {
      mcpServerDefinitionId = idValue;
      developerName = developerNameValue;
      state = stateValue;
      message = messageValue;
    }
  }

  /**
   * Aggregate Custom MCP Server options and saved configuration.
   */
  public class McpServerSetupState {
    @AuraEnabled
    public List<McpServerOption> options { get; set; }
    @AuraEnabled
    public McpServerConfiguration configuration { get; set; }

    /**
     * Creates the aggregate Custom MCP Server setup response.
     *
     * @param optionValues Selectable Custom MCP Servers.
     * @param configurationValue Current saved configuration.
     */
    public McpServerSetupState(
      List<McpServerOption> optionValues,
      McpServerConfiguration configurationValue
    ) {
      options = optionValues;
      configuration = configurationValue;
    }
  }
}
