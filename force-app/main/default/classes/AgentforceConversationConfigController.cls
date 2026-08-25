/**
 * Discovers active Agentforce Employee Agents and manages the org-wide
 * Agentforce Conversation Client selection.
 */
public with sharing class AgentforceConversationConfigController {
  private static final String ACTIVE_STATUS = 'Active';
  private static final String INTERNAL_COPILOT_TYPE = 'InternalCopilot';
  private static final String EMPLOYEE_AGENT_TYPE = 'AgentforceEmployeeAgent';
  private static final String STATE_UNCONFIGURED = 'UNCONFIGURED';
  private static final String STATE_READY = 'READY';
  private static final String STATE_STALE = 'STALE';
  private static final String STATE_UNAVAILABLE = 'UNAVAILABLE';
  private static final String UNCONFIGURED_MESSAGE = 'Select an active Agentforce Employee Agent to enable release intelligence.';
  private static final String STALE_MESSAGE = 'The configured agent is no longer active or compatible. Select another active Employee Agent in Setup Assistant.';
  private static final String INVALID_SELECTION_MESSAGE = 'Select an active Agentforce Employee Agent.';
  private static final String MCP_UNCONFIGURED_MESSAGE = 'Select a Custom MCP Server to configure client setup.';
  private static final String MCP_STALE_MESSAGE = 'The configured Custom MCP Server is no longer available. Select another Custom MCP Server in Setup Assistant.';
  private static final String MCP_UNAVAILABLE_MESSAGE = 'Custom MCP Server discovery is unavailable. Confirm the Tooling API integration is configured.';
  private static final String MCP_INVALID_SELECTION_MESSAGE = 'Select an available Custom MCP Server.';
  private static final String MCP_SERVER_DEFINITION_QUERY = 'SELECT Id, DeveloperName FROM McpServerDefinition ORDER BY DeveloperName LIMIT 2000';

  @TestVisible
  private static AgentDataSource dataSource = new AgentDataSource();

  /**
   * Returns compatible active Employee Agents ordered by label.
   *
   * @return Active Employee Agent options, or an empty list when Agentforce
   * isn't available to the running org or user.
   */
  @AuraEnabled(cacheable=true)
  public static List<AgentforceConversationConfigWrapper.AgentOption> getActiveEmployeeAgents() {
    try {
      return discoverActiveEmployeeAgents();
    } catch (Exception ignored) {
      return new List<AgentforceConversationConfigWrapper.AgentOption>();
    }
  }

  /**
   * Returns the current org-wide Agentforce configuration and its validity.
   *
   * @return Configuration in UNCONFIGURED, READY, or STALE state.
   */
  @AuraEnabled(cacheable=true)
  public static AgentforceConversationConfigWrapper.Configuration getAgentforceConfiguration() {
    String savedBotIdValue = getSavedBotIdValue();
    if (String.isBlank(savedBotIdValue)) {
      return unconfiguredConfiguration();
    }
    if (!isValidBotId(savedBotIdValue)) {
      return staleConfiguration(null);
    }
    Id savedBotId = (Id) savedBotIdValue;

    try {
      AgentforceConversationConfigWrapper.AgentOption selectedAgent = findAgent(
        discoverActiveEmployeeAgents(),
        savedBotId
      );
      if (selectedAgent == null) {
        return staleConfiguration(savedBotId);
      }
      return readyConfiguration(selectedAgent);
    } catch (Exception ignored) {
      return staleConfiguration(savedBotId);
    }
  }

  /**
   * Validates and saves the org-wide Employee Agent selection. Passing null
   * clears the integration.
   *
   * @param botId BotDefinition ID to save, or null to clear.
   * @return The resulting configuration.
   * @throws AuraHandledException when the selection isn't an active compatible
   * Employee Agent or the setting can't be saved.
   */
  @AuraEnabled
  public static AgentforceConversationConfigWrapper.Configuration saveAgentforceConfiguration(
    Id botId
  ) {
    if (botId == null) {
      persistBotId(null);
      return unconfiguredConfiguration();
    }
    if (!isValidBotId(String.valueOf(botId))) {
      throw handledException(INVALID_SELECTION_MESSAGE);
    }

    AgentforceConversationConfigWrapper.AgentOption selectedAgent;
    try {
      selectedAgent = findAgent(discoverActiveEmployeeAgents(), botId);
    } catch (Exception queryException) {
      throw handledException(
        'Unable to validate the selected Agentforce agent. Try again after confirming Agentforce is available.'
      );
    }
    if (selectedAgent == null) {
      throw handledException(INVALID_SELECTION_MESSAGE);
    }

    persistBotId(botId);
    return readyConfiguration(selectedAgent);
  }

  /**
   * Returns selectable Custom MCP Servers and the current org-wide selection.
   *
   * @return Aggregate options and configuration state.
   */
  @AuraEnabled(cacheable=true)
  public static AgentforceConversationConfigWrapper.McpServerSetupState getCustomMcpServerSetupState() {
    String savedDefinitionId = getSavedMcpServerDefinitionId();
    List<AgentforceConversationConfigWrapper.McpServerOption> options;
    try {
      options = discoverCustomMcpServers();
    } catch (Exception ignored) {
      return new AgentforceConversationConfigWrapper.McpServerSetupState(
        new List<AgentforceConversationConfigWrapper.McpServerOption>(),
        unavailableMcpConfiguration(savedDefinitionId)
      );
    }

    if (String.isBlank(savedDefinitionId)) {
      return new AgentforceConversationConfigWrapper.McpServerSetupState(
        options,
        unconfiguredMcpConfiguration()
      );
    }

    AgentforceConversationConfigWrapper.McpServerOption selectedServer = findMcpServer(
      options,
      savedDefinitionId
    );
    return new AgentforceConversationConfigWrapper.McpServerSetupState(
      options,
      selectedServer == null
        ? staleMcpConfiguration(savedDefinitionId)
        : readyMcpConfiguration(selectedServer)
    );
  }

  /**
   * Validates and saves the org-wide Custom MCP Server selection. Passing null
   * clears the integration without querying the Tooling API.
   *
   * @param mcpServerDefinitionId McpServerDefinition ID to save, or null to clear.
   * @return The resulting Custom MCP Server configuration.
   * @throws AuraHandledException when the selection isn't available or can't be saved.
   */
  @AuraEnabled
  public static AgentforceConversationConfigWrapper.McpServerConfiguration saveCustomMcpServerConfiguration(
    String mcpServerDefinitionId
  ) {
    if (mcpServerDefinitionId == null) {
      persistMcpServerDefinitionId(null);
      return unconfiguredMcpConfiguration();
    }
    if (String.isBlank(mcpServerDefinitionId)) {
      throw handledException(MCP_INVALID_SELECTION_MESSAGE);
    }

    List<AgentforceConversationConfigWrapper.McpServerOption> options;
    try {
      options = discoverCustomMcpServers();
    } catch (Exception queryException) {
      throw handledException(
        'Unable to validate the selected Custom MCP Server. Confirm the Tooling API integration is configured and try again.'
      );
    }
    AgentforceConversationConfigWrapper.McpServerOption selectedServer = findMcpServer(
      options,
      mcpServerDefinitionId
    );
    if (selectedServer == null) {
      throw handledException(MCP_INVALID_SELECTION_MESSAGE);
    }

    persistMcpServerDefinitionId(mcpServerDefinitionId);
    return readyMcpConfiguration(selectedServer);
  }

  /**
   * Validates a BotDefinition ID without throwing.
   *
   * @param botId Candidate ID.
   * @return true for 15- or 18-character BotDefinition IDs.
   */
  @TestVisible
  private static Boolean isValidBotId(String botId) {
    return (botId != null &&
    Pattern.matches('^0Xx[a-zA-Z0-9]{12}([a-zA-Z0-9]{3})?$', botId));
  }

  private static List<AgentforceConversationConfigWrapper.AgentOption> discoverActiveEmployeeAgents() {
    Set<Id> activeBotDefinitionIds = new Set<Id>();
    for (
      AgentforceConversationConfigWrapper.ActiveBotVersionRecord botVersion : dataSource.getActiveBotVersions()
    ) {
      if (
        botVersion.botDefinitionId != null &&
        ACTIVE_STATUS.equalsIgnoreCase(botVersion.status)
      ) {
        activeBotDefinitionIds.add(botVersion.botDefinitionId);
      }
    }

    List<AgentforceConversationConfigWrapper.AgentOption> options = new List<AgentforceConversationConfigWrapper.AgentOption>();
    if (activeBotDefinitionIds.isEmpty()) {
      return options;
    }

    Set<Id> addedBotIds = new Set<Id>();
    for (
      AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord botDefinition : dataSource.getEmployeeAgentDefinitions(
        activeBotDefinitionIds
      )
    ) {
      if (
        botDefinition.botId == null ||
        !activeBotDefinitionIds.contains(botDefinition.botId) ||
        addedBotIds.contains(botDefinition.botId) ||
        botDefinition.type != INTERNAL_COPILOT_TYPE ||
        botDefinition.agentType != EMPLOYEE_AGENT_TYPE
      ) {
        continue;
      }

      options.add(
        new AgentforceConversationConfigWrapper.AgentOption(
          botDefinition.botId,
          botDefinition.label,
          botDefinition.developerName
        )
      );
      addedBotIds.add(botDefinition.botId);
    }
    options.sort();
    return options;
  }

  private static AgentforceConversationConfigWrapper.AgentOption findAgent(
    List<AgentforceConversationConfigWrapper.AgentOption> agents,
    Id botId
  ) {
    for (AgentforceConversationConfigWrapper.AgentOption agentOption : agents) {
      if (agentOption.botId == botId) {
        return agentOption;
      }
    }
    return null;
  }

  private static List<AgentforceConversationConfigWrapper.McpServerOption> discoverCustomMcpServers() {
    List<AgentforceConversationConfigWrapper.McpServerOption> options = new List<AgentforceConversationConfigWrapper.McpServerOption>();
    Set<String> addedDefinitionIds = new Set<String>();
    for (
      AgentforceConversationConfigWrapper.McpServerDefinitionRecord definition : dataSource.getMcpServerDefinitions()
    ) {
      if (
        String.isBlank(definition.id) ||
        String.isBlank(definition.developerName) ||
        addedDefinitionIds.contains(definition.id)
      ) {
        continue;
      }
      options.add(
        new AgentforceConversationConfigWrapper.McpServerOption(
          definition.id,
          definition.developerName
        )
      );
      addedDefinitionIds.add(definition.id);
    }
    options.sort();
    return options;
  }

  private static AgentforceConversationConfigWrapper.McpServerOption findMcpServer(
    List<AgentforceConversationConfigWrapper.McpServerOption> options,
    String mcpServerDefinitionId
  ) {
    for (
      AgentforceConversationConfigWrapper.McpServerOption optionValue : options
    ) {
      if (optionValue.id == mcpServerDefinitionId) {
        return optionValue;
      }
    }
    return null;
  }

  private static String getSavedBotIdValue() {
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    return settings?.Agentforce_Bot_Id__c;
  }

  private static String getSavedMcpServerDefinitionId() {
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    return settings?.MCP_Server_Definition_Id__c;
  }

  // Package Visualizer's validated Apex boundary is the only supported writer.
  // User-mode CRUD enforcement would prevent packaged Apex from updating this
  // custom setting after its visibility is restored to Protected for packaging.
  @SuppressWarnings('PMD.ApexCRUDViolation')
  private static void persistBotId(Id botId) {
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    if (settings == null) {
      settings = new Integration_Settings__c();
    }
    if (settings.Id == null) {
      settings.SetupOwnerId = UserInfo.getOrganizationId();
    }
    settings.Agentforce_Bot_Id__c = botId == null
      ? null
      : String.valueOf(botId);

    try {
      upsert settings;
    } catch (DmlException dmlException) {
      throw handledException(
        'Unable to save the Agentforce configuration. Confirm your Package Visualizer access and try again.'
      );
    }
  }

  // Package Visualizer's validated Apex boundary is the only supported writer.
  // The setting is restored to Protected before packaging.
  @SuppressWarnings('PMD.ApexCRUDViolation')
  private static void persistMcpServerDefinitionId(
    String mcpServerDefinitionId
  ) {
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    if (settings == null) {
      settings = new Integration_Settings__c();
    }
    if (settings.Id == null) {
      settings.SetupOwnerId = UserInfo.getOrganizationId();
    }
    settings.MCP_Server_Definition_Id__c = mcpServerDefinitionId;

    try {
      upsert settings;
    } catch (DmlException dmlException) {
      throw handledException(
        'Unable to save the Custom MCP Server configuration. Confirm your Package Visualizer access and try again.'
      );
    }
  }

  private static AgentforceConversationConfigWrapper.Configuration unconfiguredConfiguration() {
    return new AgentforceConversationConfigWrapper.Configuration(
      null,
      null,
      null,
      STATE_UNCONFIGURED,
      UNCONFIGURED_MESSAGE
    );
  }

  private static AgentforceConversationConfigWrapper.Configuration readyConfiguration(
    AgentforceConversationConfigWrapper.AgentOption agentOption
  ) {
    return new AgentforceConversationConfigWrapper.Configuration(
      agentOption.botId,
      agentOption.label,
      agentOption.developerName,
      STATE_READY,
      'Package Visualizer is configured to use ' + agentOption.label + '.'
    );
  }

  private static AgentforceConversationConfigWrapper.Configuration staleConfiguration(
    Id savedBotId
  ) {
    return new AgentforceConversationConfigWrapper.Configuration(
      savedBotId,
      null,
      null,
      STATE_STALE,
      STALE_MESSAGE
    );
  }

  private static AgentforceConversationConfigWrapper.McpServerConfiguration unconfiguredMcpConfiguration() {
    return new AgentforceConversationConfigWrapper.McpServerConfiguration(
      null,
      null,
      STATE_UNCONFIGURED,
      MCP_UNCONFIGURED_MESSAGE
    );
  }

  private static AgentforceConversationConfigWrapper.McpServerConfiguration readyMcpConfiguration(
    AgentforceConversationConfigWrapper.McpServerOption optionValue
  ) {
    return new AgentforceConversationConfigWrapper.McpServerConfiguration(
      optionValue.id,
      optionValue.developerName,
      STATE_READY,
      'Package Visualizer is configured to use ' +
        optionValue.developerName +
        '.'
    );
  }

  private static AgentforceConversationConfigWrapper.McpServerConfiguration staleMcpConfiguration(
    String mcpServerDefinitionId
  ) {
    return new AgentforceConversationConfigWrapper.McpServerConfiguration(
      mcpServerDefinitionId,
      null,
      STATE_STALE,
      MCP_STALE_MESSAGE
    );
  }

  private static AgentforceConversationConfigWrapper.McpServerConfiguration unavailableMcpConfiguration(
    String mcpServerDefinitionId
  ) {
    return new AgentforceConversationConfigWrapper.McpServerConfiguration(
      mcpServerDefinitionId,
      null,
      STATE_UNAVAILABLE,
      MCP_UNAVAILABLE_MESSAGE
    );
  }

  private static AuraHandledException handledException(String message) {
    AuraHandledException exceptionValue = new AuraHandledException(message);
    exceptionValue.setMessage(message);
    return exceptionValue;
  }

  /**
   * Query boundary that is replaceable in Apex tests. Agentforce Bot objects
   * aren't packageable, so runtime discovery uses dynamic SOQL only after the
   * package is installed in a customer org.
   */
  @TestVisible
  private virtual with sharing class AgentDataSource {
    /**
     * Queries active BotVersion rows without a compile-time Agentforce type.
     *
     * @return Active bot versions.
     */
    public virtual List<AgentforceConversationConfigWrapper.ActiveBotVersionRecord> getActiveBotVersions() {
      List<SObject> rows = Database.queryWithBinds(
        'SELECT BotDefinitionId, Status FROM BotVersion WHERE Status = :activeStatus LIMIT 2000',
        new Map<String, Object>{ 'activeStatus' => ACTIVE_STATUS },
        AccessLevel.USER_MODE
      );
      List<AgentforceConversationConfigWrapper.ActiveBotVersionRecord> values = new List<AgentforceConversationConfigWrapper.ActiveBotVersionRecord>();
      for (SObject row : rows) {
        Object botDefinitionIdValue = row.get('BotDefinitionId');
        if (botDefinitionIdValue == null) {
          continue;
        }
        values.add(
          new AgentforceConversationConfigWrapper.ActiveBotVersionRecord(
            (Id) botDefinitionIdValue,
            String.valueOf(row.get('Status'))
          )
        );
      }
      return values;
    }

    /**
     * Queries compatible Agentforce Employee Agent definitions without a
     * compile-time Agentforce type.
     *
     * @param botDefinitionIds Active BotDefinition IDs.
     * @return Compatible BotDefinition records.
     */
    public virtual List<AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord> getEmployeeAgentDefinitions(
      Set<Id> botDefinitionIds
    ) {
      if (botDefinitionIds == null || botDefinitionIds.isEmpty()) {
        return new List<AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord>();
      }
      List<SObject> rows = Database.queryWithBinds(
        'SELECT Id, MasterLabel, DeveloperName, Type, AgentType FROM BotDefinition ' +
          'WHERE Id IN :botDefinitionIds AND Type = :internalCopilotType ' +
          'AND AgentType = :employeeAgentType ORDER BY MasterLabel, DeveloperName LIMIT 2000',
        new Map<String, Object>{
          'botDefinitionIds' => botDefinitionIds,
          'internalCopilotType' => INTERNAL_COPILOT_TYPE,
          'employeeAgentType' => EMPLOYEE_AGENT_TYPE
        },
        AccessLevel.USER_MODE
      );
      List<AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord> values = new List<AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord>();
      for (SObject row : rows) {
        Object botIdValue = row.get('Id');
        if (botIdValue == null) {
          continue;
        }
        values.add(
          new AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord(
            (Id) botIdValue,
            String.valueOf(row.get('MasterLabel')),
            String.valueOf(row.get('DeveloperName')),
            String.valueOf(row.get('Type')),
            String.valueOf(row.get('AgentType'))
          )
        );
      }
      return values;
    }

    /**
     * Queries subscriber-created Custom MCP Server definitions through Tooling API.
     *
     * @return Custom MCP Server definition records.
     */
    public virtual List<AgentforceConversationConfigWrapper.McpServerDefinitionRecord> getMcpServerDefinitions() {
      List<AgentforceConversationConfigWrapper.McpServerDefinitionRecord> values = new List<AgentforceConversationConfigWrapper.McpServerDefinitionRecord>();
      for (
        Object recordValue : Package2Interface.submitQuery(
          MCP_SERVER_DEFINITION_QUERY,
          30000
        )
      ) {
        Map<String, Object> row = (Map<String, Object>) recordValue;
        Object idValue = row.get('Id');
        Object developerNameValue = row.get('DeveloperName');
        if (idValue == null || developerNameValue == null) {
          continue;
        }
        values.add(
          new AgentforceConversationConfigWrapper.McpServerDefinitionRecord(
            String.valueOf(idValue),
            String.valueOf(developerNameValue)
          )
        );
      }
      return values;
    }
  }
}
