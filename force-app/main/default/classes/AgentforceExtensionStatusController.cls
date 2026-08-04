/**
 * Resolves whether the optional Package Visualizer Agentforce extension is
 * installed at the package-controlled target version.
 */
public with sharing class AgentforceExtensionStatusController {
  private static final String REGISTRY_DEVELOPER_NAME = 'Agentforce';
  private static final String STATE_READY = 'READY';
  private static final String STATE_NOT_INSTALLED = 'NOT_INSTALLED';
  private static final String STATE_UPDATE_REQUIRED = 'UPDATE_REQUIRED';
  private static final String STATE_MISCONFIGURED = 'MISCONFIGURED';
  private static final String STATE_UNAVAILABLE = 'UNAVAILABLE';
  private static final String MISCONFIGURED_MESSAGE = 'Package Visualizer\'s Agentforce extension registry is incomplete or invalid. Contact your administrator.';
  private static final String UNAVAILABLE_MESSAGE = 'Package Visualizer couldn\'t verify the Agentforce extension right now. Try again later.';

  @TestVisible
  private static ExtensionDataSource dataSource = new ExtensionDataSource();

  /**
   * Returns the extension installation state and shared presentation metadata.
   * Tooling API failures are reported as UNAVAILABLE so callers never mistake
   * an infrastructure or permission issue for an absent package.
   *
   * @return Current Package Visualizer Agentforce extension status.
   */
  @AuraEnabled(cacheable=true)
  public static AgentforceExtensionStatusWrapper getStatus() {
    Package_Visualizer_Extension__mdt registry;
    try {
      registry = dataSource.getAgentforceRegistry();
    } catch (Exception ignored) {
      return buildStatus(null, STATE_UNAVAILABLE, UNAVAILABLE_MESSAGE);
    }

    if (!isValidRegistry(registry)) {
      return buildStatus(registry, STATE_MISCONFIGURED, MISCONFIGURED_MESSAGE);
    }

    List<ObjectWrappers.InstalledPackageWrapper> installedPackages;
    try {
      installedPackages = dataSource.getInstalledPackages(
        new List<String>{ registry.Subscriber_Package_Id__c }
      );
    } catch (Exception ignored) {
      return buildStatus(registry, STATE_UNAVAILABLE, UNAVAILABLE_MESSAGE);
    }

    return resolveInstalledStatus(registry, installedPackages);
  }

  private static AgentforceExtensionStatusWrapper resolveInstalledStatus(
    Package_Visualizer_Extension__mdt registry,
    List<ObjectWrappers.InstalledPackageWrapper> installedPackages
  ) {
    ObjectWrappers.InstalledPackageWrapper differentVersion;
    Boolean matchingPackageHasInvalidVersion = false;
    List<ObjectWrappers.InstalledPackageWrapper> packagesToInspect = installedPackages ==
      null
      ? new List<ObjectWrappers.InstalledPackageWrapper>()
      : installedPackages;

    for (
      ObjectWrappers.InstalledPackageWrapper installedPackage : packagesToInspect
    ) {
      if (
        installedPackage == null ||
        installedPackage.subscriberPackageId !=
        registry.Subscriber_Package_Id__c
      ) {
        continue;
      }

      if (
        installedPackage.subscriberPackageVersionId ==
        registry.Target_Package_Version_Id__c
      ) {
        return installedStatus(
          registry,
          installedPackage,
          STATE_READY,
          'The ' +
            registry.Extension_Label__c +
            ' is installed at version ' +
            registry.Target_Version_Label__c +
            '.'
        );
      }

      if (isPackageVersionId(installedPackage.subscriberPackageVersionId)) {
        differentVersion = installedPackage;
      } else {
        matchingPackageHasInvalidVersion = true;
      }
    }

    if (differentVersion != null) {
      return installedStatus(
        registry,
        differentVersion,
        STATE_UPDATE_REQUIRED,
        'Update the ' +
          registry.Extension_Label__c +
          ' to version ' +
          registry.Target_Version_Label__c +
          ' to use Agentforce features'
      );
    }
    if (matchingPackageHasInvalidVersion) {
      return buildStatus(registry, STATE_UNAVAILABLE, UNAVAILABLE_MESSAGE);
    }
    return buildStatus(
      registry,
      STATE_NOT_INSTALLED,
      'Install the ' +
        registry.Extension_Label__c +
        ' to use Agentforce features'
    );
  }

  private static AgentforceExtensionStatusWrapper installedStatus(
    Package_Visualizer_Extension__mdt registry,
    ObjectWrappers.InstalledPackageWrapper installedPackage,
    String state,
    String message
  ) {
    AgentforceExtensionStatusWrapper status = buildStatus(
      registry,
      state,
      message
    );
    status.installedSubscriberPackageId = installedPackage.subscriberPackageId;
    status.installedSubscriberPackageVersionId = installedPackage.subscriberPackageVersionId;
    return status;
  }

  private static AgentforceExtensionStatusWrapper buildStatus(
    Package_Visualizer_Extension__mdt registry,
    String state,
    String message
  ) {
    AgentforceExtensionStatusWrapper status = new AgentforceExtensionStatusWrapper();
    status.state = state;
    status.message = message;
    if (registry == null) {
      return status;
    }

    status.configuredSubscriberPackageId = registry.Subscriber_Package_Id__c;
    status.configuredSubscriberPackageVersionId = registry.Target_Package_Version_Id__c;
    status.targetVersionLabel = registry.Target_Version_Label__c;
    status.extensionLabel = registry.Extension_Label__c;
    status.description = registry.Description__c;
    status.iconName = registry.Icon__c;
    status.permissionSetLabel = registry.Permission_Set_Label__c;
    status.namespacePrefix = registry.Namespace__c;
    if (isPackageVersionId(registry.Target_Package_Version_Id__c)) {
      status.directInstallUrl =
        '/packaging/installPackage.apexp?p0=' +
        registry.Target_Package_Version_Id__c;
    }
    return status;
  }

  private static Boolean isValidRegistry(
    Package_Visualizer_Extension__mdt registry
  ) {
    return registry != null &&
      isSubscriberPackageId(registry.Subscriber_Package_Id__c) &&
      isPackageVersionId(registry.Target_Package_Version_Id__c) &&
      !String.isBlank(registry.Target_Version_Label__c) &&
      !String.isBlank(registry.Extension_Label__c) &&
      !String.isBlank(registry.Description__c) &&
      isIconName(registry.Icon__c) &&
      isDeveloperName(registry.Permission_Set_Label__c) &&
      isDeveloperName(registry.Namespace__c);
  }

  private static Boolean isSubscriberPackageId(String value) {
    return value != null &&
      Pattern.matches('^033[a-zA-Z0-9]{12}([a-zA-Z0-9]{3})?$', value);
  }

  private static Boolean isPackageVersionId(String value) {
    return value != null &&
      Pattern.matches('^04t[a-zA-Z0-9]{12}([a-zA-Z0-9]{3})?$', value);
  }

  private static Boolean isIconName(String value) {
    return value != null && Pattern.matches('^[a-z]+:[a-zA-Z0-9_]+$', value);
  }

  private static Boolean isDeveloperName(String value) {
    return value != null && Pattern.matches('^[a-zA-Z][a-zA-Z0-9_]*$', value);
  }

  /**
   * Replaceable query boundary for tests. Custom Metadata is read through its
   * generated getInstance method rather than SOQL.
   */
  @TestVisible
  private virtual with sharing class ExtensionDataSource {
    /**
     * @return Package-controlled Agentforce extension registry record.
     */
    public virtual Package_Visualizer_Extension__mdt getAgentforceRegistry() {
      return Package_Visualizer_Extension__mdt.getInstance(
        REGISTRY_DEVELOPER_NAME
      );
    }

    /**
     * @param subscriberPackageIds Package IDs to look up through Tooling API.
     * @return Installed package records matching the supplied IDs.
     */
    public virtual List<ObjectWrappers.InstalledPackageWrapper> getInstalledPackages(
      List<String> subscriberPackageIds
    ) {
      return Package2Interface.getInstalledPackages(subscriberPackageIds);
    }
  }
}
