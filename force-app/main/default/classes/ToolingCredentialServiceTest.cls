/*******************************************************************************************
 * @Name         ToolingCredentialServiceTest
 * @Description  Tests for ToolingCredentialService. The ConnectApi.NamedCredentials
 *               methods can't be mocked in Apex tests, so these tests cover the
 *               deterministic paths: input validation, the IntegrationStatus DTO shape,
 *               and that ConnectApi failures are wrapped in CredentialServiceException
 *               rather than leaking raw ConnectApi exceptions.
 *******************************************************************************************/
@isTest
private class ToolingCredentialServiceTest {
  /**************************************************************************************
   * @Description  populateClientCredentials rejects blank input before any callout.
   **************************************************************************************/
  @isTest
  static void shouldThrow_WhenClientIdBlank() {
    Test.startTest();
    try {
      ToolingCredentialService.populateClientCredentials(
        ToolingCredentialService.PRINCIPAL_NAME,
        '',
        'secret'
      );
      Assert.fail('Expected CredentialServiceException for blank client id');
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('required'),
        'Message should indicate the fields are required'
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  populateClientCredentials rejects blank secret.
   **************************************************************************************/
  @isTest
  static void shouldThrow_WhenClientSecretBlank() {
    Test.startTest();
    try {
      ToolingCredentialService.populateClientCredentials(
        ToolingCredentialService.PRINCIPAL_NAME,
        'clientId',
        ''
      );
      Assert.fail(
        'Expected CredentialServiceException for blank client secret'
      );
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('required'),
        'Message should indicate the fields are required'
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  populateClientCredentials wraps ConnectApi failures (unconfigured
   * credential in test context) as CredentialServiceException.
   **************************************************************************************/
  @isTest
  static void shouldWrapConnectApiError_WhenPopulating() {
    Test.startTest();
    try {
      ToolingCredentialService.populateClientCredentials(
        ToolingCredentialService.PRINCIPAL_NAME,
        'clientId',
        'clientSecret'
      );
      // If no exception is thrown in this org/test context, that is acceptable —
      // the assertion below only matters when ConnectApi raises.
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('Unable to populate client credentials'),
        'ConnectApi failures should be wrapped in a service exception'
      );
    } catch (Exception other) {
      Assert.fail(
        'ConnectApi errors should be wrapped, not leaked: ' +
        other.getTypeName()
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  configureCalloutUrl wraps ConnectApi failures as a service
   * exception rather than leaking the raw ConnectApi exception.
   **************************************************************************************/
  @isTest
  static void shouldWrapConnectApiError_WhenConfiguringUrl() {
    Test.startTest();
    try {
      ToolingCredentialService.configureCalloutUrl();
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('Unable to set the Named Credential URL'),
        'ConnectApi failures should be wrapped in a service exception'
      );
    } catch (Exception other) {
      Assert.fail(
        'ConnectApi errors should be wrapped, not leaked: ' +
        other.getTypeName()
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  configureTokenUrl wraps ConnectApi failures as a service
   * exception rather than leaking the raw ConnectApi exception. ConnectApi
   * credential mutations can't be mocked in tests, so this typically takes the
   * failure path; the assertion only requires that failures are wrapped (never a
   * raw/leaked exception), exercising the External-Credential update path that
   * sets the OAuth token URL.
   **************************************************************************************/
  @isTest
  static void shouldWrapConnectApiError_WhenConfiguringTokenUrl() {
    Test.startTest();
    try {
      ToolingCredentialService.configureTokenUrl();
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage()
          .contains('Unable to set the External Credential token URL'),
        'ConnectApi failures should be wrapped in a service exception: ' +
        e.getMessage()
      );
    } catch (Exception other) {
      Assert.fail(
        'ConnectApi errors should be wrapped, not leaked: ' +
        other.getTypeName()
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  grantPrincipalAccess resolves the core Package Visualizer
   * permission set and the External Credential principal, then grants access. ConnectApi can't be
   * mocked in tests, so the principal lookup typically returns "not found" here —
   * the assertion only requires that failures are wrapped in a service exception
   * (never a raw/leaked exception), exercising the permission-set query and
   * principal-resolution paths.
   **************************************************************************************/
  @isTest
  static void shouldWrapOrSucceed_WhenGrantingPrincipalAccess() {
    Test.startTest();
    try {
      ToolingCredentialService.grantPrincipalAccess();
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('principal') ||
        e.getMessage().contains('Permission set'),
        'Failures should be wrapped in a service exception: ' + e.getMessage()
      );
    } catch (Exception other) {
      Assert.fail(
        'Errors should be wrapped, not leaked: ' + other.getTypeName()
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  getStatus returns a populated DTO with the org My Domain and
   * principal name even when the credential isn't fully configured.
   **************************************************************************************/
  @isTest
  static void shouldReturnStatusDto_WithMyDomainAndPrincipal() {
    Test.startTest();
    ToolingCredentialService.IntegrationStatus status = ToolingCredentialService.getStatus();
    Test.stopTest();
    Assert.isNotNull(status, 'Status DTO should not be null');
    Assert.isNotNull(status.myDomainUrl, 'My Domain URL should be populated');
    Assert.areEqual(
      ToolingCredentialService.PRINCIPAL_NAME,
      status.principalName,
      'Principal name should match the configured principal'
    );
    Assert.isNotNull(
      status.useNamedCredential,
      'Toggle state should be populated'
    );
  }

  /**************************************************************************************
   * @Description  getRunningNamespace returns the bare namespace prefix (or empty
   * string), never the dotted 'namespace.ClassName' form, so it's safe to use as
   * the AllowedManagedPackageNamespaces parameter value when rebuilding the Named
   * Credential's allow-list.
   **************************************************************************************/
  @isTest
  static void shouldReturnBareNamespace_WhenResolvingRunningNamespace() {
    Test.startTest();
    String namespacePrefix = ToolingCredentialService.getRunningNamespace();
    Test.stopTest();
    Assert.isNotNull(namespacePrefix, 'Running namespace should never be null');
    Assert.isFalse(
      namespacePrefix.contains('.'),
      'Running namespace should be a bare prefix, not a qualified class name'
    );
  }

  /**************************************************************************************
   * @Description  parametersToPreserve always re-supplies the
   * AllowedManagedPackageNamespaces allow-list with a non-blank value (the running
   * namespace, or the package's fixed namespace when reflection resolves nothing in
   * the namespace/packaging org). This is what prevents updateNamedCredential from
   * dropping the protected parameter ("You can't delete the named credential
   * parameter type AllowedManagedPackageNamespaces ...").
   **************************************************************************************/
  @isTest
  static void shouldAlwaysSupplyAllowedNamespaces_WhenBuildingParameters() {
    Test.startTest();
    List<ConnectApi.NamedCredentialParameterInput> params = ToolingCredentialService.parametersToPreserve();
    Test.stopTest();
    Assert.areEqual(
      1,
      params.size(),
      'Exactly the namespace allow-list parameter should be supplied'
    );
    ConnectApi.NamedCredentialParameterInput allowList = params[0];
    Assert.areEqual(
      ConnectApi.NamedCredentialParameterType.AllowedManagedPackageNamespaces,
      allowList.parameterType,
      'The preserved parameter must be the managed-package namespace allow-list'
    );
    Assert.isTrue(
      String.isNotBlank(allowList.parameterValue),
      'The allow-list value must never be blank, or the protected parameter is dropped'
    );
  }
}
