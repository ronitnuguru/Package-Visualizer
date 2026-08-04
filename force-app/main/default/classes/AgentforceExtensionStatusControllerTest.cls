/**
 * Tests the Package Visualizer Agentforce extension registry and installed
 * package status resolution.
 */
@isTest
private class AgentforceExtensionStatusControllerTest {
  private static final String SUBSCRIBER_PACKAGE_ID = '033000000000001AAA';
  private static final String TARGET_VERSION_ID = '04t000000000001AAA';
  private static final String OTHER_VERSION_ID = '04t000000000002AAA';

  private class StubToolingException extends Exception {
  }

  private class StubExtensionDataSource extends AgentforceExtensionStatusController.ExtensionDataSource {
    private Package_Visualizer_Extension__mdt registry = validRegistry();
    private List<ObjectWrappers.InstalledPackageWrapper> installedPackages = new List<ObjectWrappers.InstalledPackageWrapper>();
    private Boolean shouldFail = false;

    public override Package_Visualizer_Extension__mdt getAgentforceRegistry() {
      return registry;
    }

    public override List<ObjectWrappers.InstalledPackageWrapper> getInstalledPackages(
      List<String> subscriberPackageIds
    ) {
      Assert.areEqual(
        new List<String>{ SUBSCRIBER_PACKAGE_ID },
        subscriberPackageIds,
        'The Tooling query should be scoped to the configured extension package'
      );
      if (shouldFail) {
        throw new StubToolingException('Tooling unavailable');
      }
      return installedPackages;
    }
  }

  @isTest
  static void shouldReturnReady_WhenExactTargetVersionIsInstalled() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    source.installedPackages.add(
      installedPackage(SUBSCRIBER_PACKAGE_ID, TARGET_VERSION_ID)
    );
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'READY',
      status.state,
      'The exact target version should be ready'
    );
    Assert.areEqual(
      TARGET_VERSION_ID,
      status.installedSubscriberPackageVersionId,
      'The installed target version should be returned'
    );
    Assert.areEqual(
      '/packaging/installPackage.apexp?p0=' + TARGET_VERSION_ID,
      status.directInstallUrl,
      'The direct-install URL should be derived from the target version'
    );
  }

  @isTest
  static void shouldReturnNotInstalled_WhenNoMatchingPackageExists() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    source.installedPackages.add(
      installedPackage('033000000000002AAA', OTHER_VERSION_ID)
    );
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'NOT_INSTALLED',
      status.state,
      'An empty matching result should be reported as not installed'
    );
    Assert.isNull(
      status.installedSubscriberPackageVersionId,
      'No installed version should be reported for an absent extension'
    );
  }

  @isTest
  static void shouldReturnUpdateRequired_WhenAnotherVersionIsInstalled() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    source.installedPackages.add(
      installedPackage(SUBSCRIBER_PACKAGE_ID, OTHER_VERSION_ID)
    );
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'UPDATE_REQUIRED',
      status.state,
      'A different installed version should require an update'
    );
    Assert.areEqual(
      OTHER_VERSION_ID,
      status.installedSubscriberPackageVersionId,
      'The mismatched installed version should be returned'
    );
  }

  @isTest
  static void shouldReturnMisconfigured_WhenRegistryIdIsMalformed() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    source.registry.Subscriber_Package_Id__c = 'not-a-package-id';
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'MISCONFIGURED',
      status.state,
      'Malformed registry IDs should be reported as configuration errors'
    );
    Assert.isTrue(
      status.message.contains('registry'),
      'The safe message should direct attention to the registry'
    );
  }

  @isTest
  static void shouldReturnMisconfigured_WhenRegistryIsMissing() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    source.registry = null;
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'MISCONFIGURED',
      status.state,
      'A missing registry record should be reported as misconfigured'
    );
  }

  @isTest
  static void shouldReturnUnavailable_WhenToolingQueryFails() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    source.shouldFail = true;
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'UNAVAILABLE',
      status.state,
      'Tooling failures must not be mistaken for an absent extension'
    );
    Assert.isFalse(
      status.message.contains('Tooling unavailable'),
      'Raw exception details must not be exposed'
    );
  }

  @isTest
  static void shouldReturnUnavailable_WhenInstalledVersionIsMalformed() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    source.installedPackages.add(
      installedPackage(SUBSCRIBER_PACKAGE_ID, 'unknown')
    );
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'UNAVAILABLE',
      status.state,
      'Incomplete Tooling data should be unavailable, not an update state'
    );
  }

  @isTest
  static void shouldReturnPresentationMetadata_WhenRegistryIsValid() {
    StubExtensionDataSource source = new StubExtensionDataSource();
    AgentforceExtensionStatusController.dataSource = source;

    Test.startTest();
    AgentforceExtensionStatusWrapper status = AgentforceExtensionStatusController.getStatus();
    Test.stopTest();

    Assert.areEqual(
      'Package Visualizer Agentforce Extension',
      status.extensionLabel,
      'The extension label should be returned for shared install UI'
    );
    Assert.areEqual(
      'standard:agent_astro',
      status.iconName,
      'The configured SLDS icon should be returned'
    );
    Assert.areEqual(
      'Package_Visualizer_Agentforce_Extension_Permissions',
      status.permissionSetLabel,
      'The extension permission-set label should be returned'
    );
    Assert.areEqual(
      'pkgviz',
      status.namespacePrefix,
      'The extension namespace should be returned'
    );
  }

  private static Package_Visualizer_Extension__mdt validRegistry() {
    return new Package_Visualizer_Extension__mdt(
      Subscriber_Package_Id__c = SUBSCRIBER_PACKAGE_ID,
      Target_Package_Version_Id__c = TARGET_VERSION_ID,
      Target_Version_Label__c = '1.7.0-1',
      Extension_Label__c = 'Package Visualizer Agentforce Extension',
      Description__c = 'Adds optional Agentforce intelligence to Package Visualizer.',
      Icon__c = 'standard:agent_astro',
      Permission_Set_Label__c = 'Package_Visualizer_Agentforce_Extension_Permissions',
      Namespace__c = 'pkgviz'
    );
  }

  private static ObjectWrappers.InstalledPackageWrapper installedPackage(
    String subscriberPackageId,
    String subscriberPackageVersionId
  ) {
    ObjectWrappers.InstalledPackageWrapper installedPackage = new ObjectWrappers.InstalledPackageWrapper();
    installedPackage.subscriberPackageId = subscriberPackageId;
    installedPackage.subscriberPackageVersionId = subscriberPackageVersionId;
    return installedPackage;
  }
}
