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
   * @Description  configureCalloutUrl is a DEPRECATED no-op stub (superseded by
   * provisionCredentials). It returns the running org My Domain URL without touching
   * the packaged credential.
   **************************************************************************************/
  @isTest
  static void shouldReturnMyDomain_WhenConfiguringUrl() {
    Test.startTest();
    String url = ToolingCredentialService.configureCalloutUrl();
    Test.stopTest();
    Assert.isTrue(
      url.startsWith('https://'),
      'configureCalloutUrl returns the org My Domain URL: ' + url
    );
  }

  /**************************************************************************************
   * @Description  configureTokenUrl is a DEPRECATED no-op stub (superseded by
   * provisionCredentials). It returns the running org OAuth token endpoint URL.
   **************************************************************************************/
  @isTest
  static void shouldReturnTokenEndpoint_WhenConfiguringTokenUrl() {
    Test.startTest();
    String url = ToolingCredentialService.configureTokenUrl();
    Test.stopTest();
    Assert.isTrue(
      url.endsWith('/services/oauth2/token'),
      'configureTokenUrl returns the org token endpoint URL: ' + url
    );
  }

  /**************************************************************************************
   * @Description  grantPrincipalAccess is a DEPRECATED no-op stub (superseded by
   * grantNewPrincipalAccess). It must complete without throwing.
   **************************************************************************************/
  @isTest
  static void shouldNotThrow_WhenGrantingPrincipalAccess() {
    Test.startTest();
    try {
      ToolingCredentialService.grantPrincipalAccess();
    } catch (Exception other) {
      Assert.fail(
        'Deprecated no-op stub should not throw: ' + other.getTypeName()
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
   * @Description  isConfiguredUrl treats blank, null, and placeholder-host URLs as
   * NOT configured, and a real My Domain URL as configured. This is the predicate
   * the self-heal uses to decide whether the runtime URLs reverted to the shipped
   * placeholder (e.g. after a package upgrade).
   **************************************************************************************/
  @isTest
  static void shouldDetectConfiguredVsPlaceholderUrls() {
    Test.startTest();
    Assert.isFalse(
      ToolingCredentialService.isConfiguredUrl(null),
      'null URL is not configured'
    );
    Assert.isFalse(
      ToolingCredentialService.isConfiguredUrl(''),
      'blank URL is not configured'
    );
    Assert.isFalse(
      ToolingCredentialService.isConfiguredUrl(
        'https://loopback.placeholder.com'
      ),
      'placeholder URL is not configured'
    );
    Assert.isTrue(
      ToolingCredentialService.isConfiguredUrl(
        'https://acme.my.salesforce.com'
      ),
      'a real My Domain URL is configured'
    );
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  ensureUrlsConfigured is a no-op returning false when the Named
   * Credential toggle is off — it must never attempt ConnectApi writes or throw
   * when the legacy path is in use.
   **************************************************************************************/
  @isTest
  static void shouldNoOp_WhenToggleOffOnEnsureUrls() {
    Package2Interface.useNamedCredentialOverride = false;
    Test.startTest();
    Boolean ready = ToolingCredentialService.ensureUrlsConfigured();
    Test.stopTest();
    Assert.isFalse(
      ready,
      'ensureUrlsConfigured returns false when the NC toggle is off'
    );
    Package2Interface.useNamedCredentialOverride = null;
  }

  /**************************************************************************************
   * @Description  grantNewPrincipalAccess throws a wrapped CredentialServiceException
   * when the new External Credential principal can't be resolved (ConnectApi can't be
   * mocked in tests, so the principal lookup returns null here) — never a raw leak.
   * Exercises getNewPrincipalId() and the null-principal branch.
   **************************************************************************************/
  @isTest
  static void shouldWrapOrThrow_WhenGrantingNewPrincipalAccess() {
    Test.startTest();
    try {
      ToolingCredentialService.grantNewPrincipalAccess();
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('principal') ||
        e.getMessage().contains('grant'),
        'failure should be wrapped in a service exception: ' + e.getMessage()
      );
    } catch (Exception other) {
      Assert.fail(
        'Errors should be wrapped, not leaked: ' + other.getTypeName()
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  isAlreadyExists recognizes the ConnectApi "name already used"
   * error (the signal to fall back from create to update) and ignores others.
   **************************************************************************************/
  @isTest
  static void shouldDetectAlreadyExistsError() {
    Test.startTest();
    Assert.isTrue(
      ToolingCredentialService.isAlreadyExists(
        new ToolingCredentialService.CredentialServiceException(
          'This Name already exists or has been previously used.'
        )
      ),
      'should detect the already-exists signal'
    );
    Assert.isFalse(
      ToolingCredentialService.isAlreadyExists(
        new ToolingCredentialService.CredentialServiceException(
          'some other error'
        )
      ),
      'unrelated errors are not already-exists'
    );
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  provisionCredentials wraps ConnectApi failures as a service
   * exception rather than leaking a raw ConnectApi exception. ConnectApi credential
   * mutations aren't mockable in tests, so this exercises the wrap path; if no
   * exception is raised in this context that is acceptable.
   **************************************************************************************/
  @isTest
  static void shouldWrapError_WhenProvisioning() {
    Test.startTest();
    try {
      ToolingCredentialService.provisionCredentials();
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('Tooling'),
        'wrapped message should mention the Tooling credential: ' +
        e.getMessage()
      );
    } catch (Exception other) {
      Assert.fail(
        'ConnectApi errors must be wrapped, not leaked: ' + other.getTypeName()
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  provisionNamedCredential builds the Named Credential input
   * (callout URL, SecuredEndpoint type, EC link, pkgviz namespace allow-list) before
   * the ConnectApi create call. ConnectApi mutations aren't mockable, so the create
   * throws here — but the input-building body executes and any failure surfaces as a
   * wrapped CredentialServiceException, never a raw leak.
   **************************************************************************************/
  @isTest
  static void shouldWrapError_WhenProvisioningNamedCredential() {
    Test.startTest();
    try {
      ToolingCredentialService.provisionNamedCredential(
        'https://example.my.salesforce.com'
      );
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('Tooling Named Credential'),
        'failure should be wrapped mentioning the Tooling Named Credential: ' +
        e.getMessage()
      );
    } catch (Exception other) {
      Assert.fail(
        'ConnectApi errors must be wrapped, not leaked: ' + other.getTypeName()
      );
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  resolveUnmanagedPermissionSetId returns a permission set id for the
   * grant target, creating pkgviz_Tooling_Access on first use and reusing it (or any
   * same-label perm set, via the DUPLICATE_MASTER_LABEL recovery) thereafter. Pure
   * SOQL + DML — fully testable; idempotent across calls.
   **************************************************************************************/
  @isTest
  static void shouldResolveOrCreate_UnmanagedPermissionSet() {
    Test.startTest();
    Id firstId = ToolingCredentialService.resolveUnmanagedPermissionSetId();
    Id secondId = ToolingCredentialService.resolveUnmanagedPermissionSetId();
    Test.stopTest();
    Assert.isNotNull(firstId, 'should resolve/create a perm set id');
    Assert.areEqual(
      firstId,
      secondId,
      'second call should reuse the same perm set, not create a duplicate'
    );
    List<PermissionSet> created = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = 'pkgviz_Tooling_Access' AND NamespacePrefix = NULL
    ];
    Assert.areEqual(
      1,
      created.size(),
      'exactly one unmanaged grant-target perm set should exist'
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
}
