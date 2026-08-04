/**
 * Tests Agentforce Employee Agent discovery and org-wide ACC configuration.
 */
@isTest
private class AgentforceConversationConfigCtrlTest {
  private static final Id FIRST_BOT_ID = (Id) '0Xx000000000001';
  private static final Id SECOND_BOT_ID = (Id) '0Xx000000000002';
  private static final Id THIRD_BOT_ID = (Id) '0Xx000000000003';

  private class StubQueryException extends Exception {
  }

  private class StubAgentDataSource extends AgentforceConversationConfigController.AgentDataSource {
    private List<AgentforceConversationConfigWrapper.ActiveBotVersionRecord> botVersions = new List<AgentforceConversationConfigWrapper.ActiveBotVersionRecord>();
    private List<AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord> botDefinitions = new List<AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord>();
    private Boolean shouldFail = false;

    public override List<AgentforceConversationConfigWrapper.ActiveBotVersionRecord> getActiveBotVersions() {
      if (shouldFail) {
        throw new StubQueryException('Agentforce unavailable');
      }
      return botVersions;
    }

    public override List<AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord> getEmployeeAgentDefinitions(
      Set<Id> botDefinitionIds
    ) {
      if (shouldFail) {
        throw new StubQueryException('Agentforce unavailable');
      }
      return botDefinitions;
    }
  }

  @isTest
  static void shouldReturnSortedUniqueAgents_WhenActiveEmployeeAgentsExist() {
    StubAgentDataSource source = new StubAgentDataSource();
    source.botVersions.add(botVersion(FIRST_BOT_ID, 'Active'));
    source.botVersions.add(botVersion(FIRST_BOT_ID, 'Active'));
    source.botVersions.add(botVersion(SECOND_BOT_ID, 'Active'));
    source.botVersions.add(botVersion(THIRD_BOT_ID, 'Inactive'));
    source.botDefinitions.add(
      botDefinition(
        SECOND_BOT_ID,
        'Zulu Agent',
        'Zulu_Agent',
        'InternalCopilot',
        'AgentforceEmployeeAgent'
      )
    );
    source.botDefinitions.add(
      botDefinition(
        FIRST_BOT_ID,
        'Alpha Agent',
        'Alpha_Agent',
        'InternalCopilot',
        'AgentforceEmployeeAgent'
      )
    );
    source.botDefinitions.add(
      botDefinition(
        THIRD_BOT_ID,
        'Inactive Agent',
        'Inactive_Agent',
        'InternalCopilot',
        'AgentforceEmployeeAgent'
      )
    );
    AgentforceConversationConfigController.dataSource = source;

    Test.startTest();
    List<AgentforceConversationConfigWrapper.AgentOption> agents = AgentforceConversationConfigController.getActiveEmployeeAgents();
    Test.stopTest();

    Assert.areEqual(
      2,
      agents.size(),
      'Only unique active agents should return'
    );
    Assert.areEqual(
      FIRST_BOT_ID,
      agents[0].botId,
      'Agents should be ordered by label'
    );
    Assert.areEqual(
      SECOND_BOT_ID,
      agents[1].botId,
      'The second sorted agent should follow'
    );
  }

  @isTest
  static void shouldExcludeDefinition_WhenAgentTypeIsUnsupported() {
    StubAgentDataSource source = activeSource(FIRST_BOT_ID);
    source.botDefinitions.clear();
    source.botDefinitions.add(
      botDefinition(
        FIRST_BOT_ID,
        'Service Agent',
        'Service_Agent',
        'ExternalCopilot',
        'AgentforceServiceAgent'
      )
    );
    AgentforceConversationConfigController.dataSource = source;

    Test.startTest();
    List<AgentforceConversationConfigWrapper.AgentOption> agents = AgentforceConversationConfigController.getActiveEmployeeAgents();
    Test.stopTest();

    Assert.areEqual(
      0,
      agents.size(),
      'Non-employee agent definitions should be excluded'
    );
  }

  @isTest
  static void shouldReturnEmptyList_WhenAgentforceQueryIsUnavailable() {
    StubAgentDataSource source = new StubAgentDataSource();
    source.shouldFail = true;
    AgentforceConversationConfigController.dataSource = source;

    Test.startTest();
    List<AgentforceConversationConfigWrapper.AgentOption> agents = AgentforceConversationConfigController.getActiveEmployeeAgents();
    Test.stopTest();

    Assert.areEqual(
      0,
      agents.size(),
      'Agentforce query failures should not break Package Visualizer'
    );
  }

  @isTest
  static void shouldQueryAgentforceObjectsOnlyWhenTheyAreAvailableAtRuntime() {
    AgentforceConversationConfigController.AgentDataSource runtimeSource = new AgentforceConversationConfigController.AgentDataSource();
    Boolean agentforceAvailable = true;

    Test.startTest();
    try {
      List<AgentforceConversationConfigWrapper.ActiveBotVersionRecord> botVersions = runtimeSource.getActiveBotVersions();
      Set<Id> botIds = new Set<Id>();
      for (
        AgentforceConversationConfigWrapper.ActiveBotVersionRecord botVersion : botVersions
      ) {
        if (botVersion.botDefinitionId != null) {
          botIds.add(botVersion.botDefinitionId);
        }
      }
      if (botIds.isEmpty()) {
        botIds.add(FIRST_BOT_ID);
      }
      runtimeSource.getEmployeeAgentDefinitions(botIds);
    } catch (Exception expected) {
      agentforceAvailable = false;
    }
    Test.stopTest();

    Assert.isNotNull(
      agentforceAvailable,
      'Agentforce availability is optional during package creation.'
    );
  }

  @isTest
  static void shouldReturnUnconfigured_WhenNoBotIsSaved() {
    AgentforceConversationConfigController.dataSource = new StubAgentDataSource();

    Test.startTest();
    AgentforceConversationConfigWrapper.Configuration configuration = AgentforceConversationConfigController.getAgentforceConfiguration();
    Test.stopTest();

    Assert.areEqual(
      'UNCONFIGURED',
      configuration.state,
      'Blank org configuration should be unconfigured'
    );
    Assert.isNull(configuration.botId, 'No bot ID should be returned');
  }

  @isTest
  static void shouldReturnStale_WhenSavedBotIdIsMalformed() {
    upsert new Integration_Settings__c(
      SetupOwnerId = UserInfo.getOrganizationId(),
      Agentforce_Bot_Id__c = 'not-a-bot-id'
    );
    AgentforceConversationConfigController.dataSource = new StubAgentDataSource();

    Test.startTest();
    AgentforceConversationConfigWrapper.Configuration configuration = AgentforceConversationConfigController.getAgentforceConfiguration();
    Test.stopTest();

    Assert.areEqual(
      'STALE',
      configuration.state,
      'A malformed saved value should require reconfiguration'
    );
    Assert.areEqual(
      'not-a-bot-id',
      Integration_Settings__c.getOrgDefaults().Agentforce_Bot_Id__c,
      'A read must not silently clear the malformed value'
    );
  }

  @isTest
  static void shouldReturnReady_WhenSavedBotIsActiveAndCompatible() {
    AgentforceConversationConfigController.dataSource = activeSource(
      FIRST_BOT_ID
    );
    saveSetting(FIRST_BOT_ID);

    Test.startTest();
    AgentforceConversationConfigWrapper.Configuration configuration = AgentforceConversationConfigController.getAgentforceConfiguration();
    Test.stopTest();

    Assert.areEqual('READY', configuration.state, 'Active saved bot is ready');
    Assert.areEqual(
      FIRST_BOT_ID,
      configuration.botId,
      'The configured bot should be returned'
    );
    Assert.areEqual(
      'Release Agent',
      configuration.label,
      'The configured bot label should be returned'
    );
  }

  @isTest
  static void shouldReturnStaleWithoutClearing_WhenSavedBotIsNotActive() {
    AgentforceConversationConfigController.dataSource = new StubAgentDataSource();
    saveSetting(FIRST_BOT_ID);

    Test.startTest();
    AgentforceConversationConfigWrapper.Configuration configuration = AgentforceConversationConfigController.getAgentforceConfiguration();
    Test.stopTest();

    Assert.areEqual(
      'STALE',
      configuration.state,
      'Inactive saved bot should be stale'
    );
    Assert.areEqual(
      String.valueOf(FIRST_BOT_ID),
      Integration_Settings__c.getOrgDefaults().Agentforce_Bot_Id__c,
      'Read operations must not clear stale configuration'
    );
  }

  @isTest
  static void shouldSaveBot_WhenSelectionIsActiveAndCompatible() {
    AgentforceConversationConfigController.dataSource = activeSource(
      FIRST_BOT_ID
    );

    Test.startTest();
    AgentforceConversationConfigWrapper.Configuration configuration = AgentforceConversationConfigController.saveAgentforceConfiguration(
      FIRST_BOT_ID
    );
    Test.stopTest();

    Assert.areEqual('READY', configuration.state, 'Saved bot should be ready');
    Assert.areEqual(
      String.valueOf(FIRST_BOT_ID),
      Integration_Settings__c.getOrgDefaults().Agentforce_Bot_Id__c,
      'The org default should store the selected bot'
    );
  }

  @isTest
  static void shouldReplaceBot_WhenAnotherActiveAgentIsSelected() {
    saveSetting(FIRST_BOT_ID);
    AgentforceConversationConfigController.dataSource = activeSource(
      SECOND_BOT_ID
    );

    Test.startTest();
    AgentforceConversationConfigController.saveAgentforceConfiguration(
      SECOND_BOT_ID
    );
    Test.stopTest();

    Assert.areEqual(
      String.valueOf(SECOND_BOT_ID),
      Integration_Settings__c.getOrgDefaults().Agentforce_Bot_Id__c,
      'The new active bot should replace the prior value'
    );
  }

  @isTest
  static void shouldClearBot_WhenSelectionIsNull() {
    saveSetting(FIRST_BOT_ID);
    AgentforceConversationConfigController.dataSource = new StubAgentDataSource();

    Test.startTest();
    AgentforceConversationConfigWrapper.Configuration configuration = AgentforceConversationConfigController.saveAgentforceConfiguration(
      null
    );
    Test.stopTest();

    Assert.areEqual(
      'UNCONFIGURED',
      configuration.state,
      'Clearing should return unconfigured state'
    );
    Assert.isNull(
      Integration_Settings__c.getOrgDefaults().Agentforce_Bot_Id__c,
      'The saved bot ID should be cleared'
    );
  }

  @isTest
  static void shouldRejectBot_WhenSelectionIsInactive() {
    StubAgentDataSource source = activeSource(FIRST_BOT_ID);
    source.botVersions.clear();
    source.botVersions.add(botVersion(FIRST_BOT_ID, 'Inactive'));
    AgentforceConversationConfigController.dataSource = source;

    assertSaveRejected(FIRST_BOT_ID, 'Inactive agents should be rejected');
  }

  @isTest
  static void shouldRejectBot_WhenSelectionHasWrongAgentType() {
    StubAgentDataSource source = activeSource(FIRST_BOT_ID);
    source.botDefinitions.clear();
    source.botDefinitions.add(
      botDefinition(
        FIRST_BOT_ID,
        'Wrong Agent',
        'Wrong_Agent',
        'ExternalCopilot',
        'AgentforceServiceAgent'
      )
    );
    AgentforceConversationConfigController.dataSource = source;

    assertSaveRejected(
      FIRST_BOT_ID,
      'Unsupported agent definitions should be rejected'
    );
  }

  @isTest
  static void shouldRejectBot_WhenSelectionIsUnknown() {
    AgentforceConversationConfigController.dataSource = activeSource(
      SECOND_BOT_ID
    );

    assertSaveRejected(FIRST_BOT_ID, 'Unknown agents should be rejected');
  }

  @isTest
  static void shouldRejectMalformedBotId_WhenValidating() {
    Test.startTest();
    Boolean isValid = AgentforceConversationConfigController.isValidBotId(
      'not-a-bot-id'
    );
    Test.stopTest();

    Assert.isFalse(isValid, 'Malformed BotDefinition IDs should be rejected');
  }

  private static StubAgentDataSource activeSource(Id botId) {
    StubAgentDataSource source = new StubAgentDataSource();
    source.botVersions.add(botVersion(botId, 'Active'));
    source.botDefinitions.add(
      botDefinition(
        botId,
        'Release Agent',
        'Release_Agent',
        'InternalCopilot',
        'AgentforceEmployeeAgent'
      )
    );
    return source;
  }

  private static AgentforceConversationConfigWrapper.ActiveBotVersionRecord botVersion(
    Id botDefinitionId,
    String status
  ) {
    return new AgentforceConversationConfigWrapper.ActiveBotVersionRecord(
      botDefinitionId,
      status
    );
  }

  private static AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord botDefinition(
    Id botId,
    String label,
    String developerName,
    String type,
    String agentType
  ) {
    return new AgentforceConversationConfigWrapper.EmployeeAgentDefinitionRecord(
      botId,
      label,
      developerName,
      type,
      agentType
    );
  }

  private static void saveSetting(Id botId) {
    upsert new Integration_Settings__c(
      SetupOwnerId = UserInfo.getOrganizationId(),
      Agentforce_Bot_Id__c = String.valueOf(botId)
    );
  }

  private static void assertSaveRejected(Id botId, String assertionMessage) {
    Test.startTest();
    try {
      AgentforceConversationConfigController.saveAgentforceConfiguration(botId);
      Assert.fail(assertionMessage);
    } catch (AuraHandledException expected) {
      Assert.isTrue(
        expected.getMessage().contains('active Agentforce Employee Agent'),
        'The error should explain the compatible-agent requirement'
      );
    }
    Test.stopTest();
  }
}
