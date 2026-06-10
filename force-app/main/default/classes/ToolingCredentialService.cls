/*******************************************************************************************
 * @Name         ToolingCredentialService
 * @Description  Manages the packaged Named Credential + External Credential that front the
 *               org's own Tooling/REST API via OAuth Client Credentials. Wraps the
 *               ConnectApi.NamedCredentials surface so the Setup wizard (migration UI)
 *               can set the per-org callout URL, populate the OAuth client id/secret,
 *               grant principal access, and read credential status without touching
 *               ConnectApi types directly. Subscribers cannot edit the developer-controlled Named
 *               Credential in the UI, so ConnectApi is the supported way to set its URL.
 *******************************************************************************************/
global with sharing class ToolingCredentialService {
  // Must match the <label> in the packaged Named Credential metadata —
  // ConnectApi.updateNamedCredential requires masterLabel in the payload.
  @TestVisible
  private static final String NAMED_CREDENTIAL_LABEL = 'Package Visualizer Named Credential';
  // Must match the NamedPrincipal parameter name in the External Credential metadata.
  global static final String PRINCIPAL_NAME = 'PackageVisualizerPrincipal';
  // Developer name of the packaged permission set that fronts External Credential
  // principal access. We reuse the core Package Visualizer permission set (every
  // app user already has it, and the whole app runs on Tooling API callouts) so
  // there's no separate integration permission set to assign.
  //
  // The principal-access grant is NOT packaged. The declarative
  // <externalCredentialPrincipalAccesses> block fails `sf package version create`
  // with "Package_VisualizerPS: invalid cross reference id" (confirmed 2026-06-10)
  // because the External Credential principal isn't resolvable in the build
  // context. The runtime grantPrincipalAccess() below is a best-effort grant for
  // the packaging/dev org where the permission set isn't yet managed; in a
  // subscriber org the permission set is managed-installed and SetupEntityAccess
  // DML against it throws CANNOT_MODIFY_MANAGED_OBJECT, which that method swallows
  // as a non-fatal no-op. The grant is not actually required for the callout —
  // authorization flows through the Named Credential's
  // AllowedManagedPackageNamespaces allow-list.
  @TestVisible
  private static final String CALLOUT_PERMISSION_SET_NAME = 'Package_VisualizerPS';
  // ConnectApi.NamedCredentialParameterType name of the managed-package namespace
  // allow-list. Used to rebuild that parameter on update (see parametersToPreserve).
  @TestVisible
  private static final String ALLOWED_NAMESPACES_TYPE = 'AllowedManagedPackageNamespaces';
  // Fixed namespace of this managed package and the authoritative value of the
  // credential's AllowedManagedPackageNamespaces allow-list. Runtime reflection
  // (getRunningNamespace) returns this in an installed subscriber org but resolves
  // to blank in the namespace/packaging org — where the credential is still treated
  // as managed — so this constant is the fallback that keeps the protected
  // parameter present on update. Matches the namespace in sfdx-project.json and the
  // value in the packaged Named Credential metadata.
  @TestVisible
  private static final String PACKAGE_NAMESPACE = 'pkgviz';
  // ConnectApi parameter name of the External Credential's OAuth token endpoint.
  // For the Client Credentials flow this is the URL the platform POSTs to in order
  // to mint the bearer token. Ships as a placeholder and is set per-subscriber at
  // setup time to the org's own My Domain token endpoint.
  @TestVisible
  private static final String AUTH_PROVIDER_URL_PARAM = 'AuthProviderUrl';
  // Path appended to the org My Domain to form the OAuth token endpoint.
  @TestVisible
  private static final String OAUTH_TOKEN_PATH = '/services/oauth2/token';
  // The placeholder host the Named/External Credential metadata ships with. Both
  // URLs carry this until setup points them at the subscriber's My Domain. Used to
  // detect an unconfigured credential — a package upgrade that re-pushes the
  // credential metadata resets the runtime URLs back to this placeholder while the
  // Use_Named_Credential__c toggle (a persisted custom setting) stays on, so the
  // toggle alone can't be trusted to mean "callouts will work".
  @TestVisible
  private static final String PLACEHOLDER_HOST = 'loopback.placeholder.com';
  // Must match the <label> in the packaged External Credential metadata —
  // updateExternalCredential requires masterLabel in the payload.
  @TestVisible
  private static final String EXTERNAL_CREDENTIAL_LABEL = 'Package Visualizer External Credential';

  global class CredentialServiceException extends Exception {
  }

  /**
   * @Description  DTO describing the current integration configuration, used to
   * drive the migration UI checklist.
   */
  global class IntegrationStatus {
    @AuraEnabled
    global String myDomainUrl;
    @AuraEnabled
    global String namedCredentialUrl;
    @AuraEnabled
    global String externalCredentialStatus;
    @AuraEnabled
    global String tokenUrl;
    @AuraEnabled
    global Boolean useNamedCredential;
    @AuraEnabled
    global String principalName;
  }

  /**
   * @Description  Reads the current integration status: the org My Domain, the
   * Named Credential's configured URL, the External Credential authentication
   * status (NotConfigured until the client id/secret are populated), and the
   * runtime toggle. Used by the migration UI to show what's left to configure.
   * @return A populated IntegrationStatus.
   */
  global static IntegrationStatus getStatus() {
    IntegrationStatus status = new IntegrationStatus();
    status.myDomainUrl = URL.getOrgDomainUrl().toExternalForm();
    status.useNamedCredential = Package2Interface.isNamedCredentialEnabled();
    status.principalName = PRINCIPAL_NAME;
    try {
      ConnectApi.NamedCredential nc = ConnectApi.NamedCredentials.getNamedCredential(
        Package2Interface.getQualifiedNamedCredentialName()
      );
      status.namedCredentialUrl = nc.calloutUrl;
    } catch (Exception e) {
      status.namedCredentialUrl = null;
    }
    try {
      ConnectApi.ExternalCredential ec = ConnectApi.NamedCredentials.getExternalCredential(
        Package2Interface.getQualifiedExternalCredentialName()
      );
      status.externalCredentialStatus = String.valueOf(ec.authenticationStatus);
      if (ec.parameters != null) {
        for (ConnectApi.ExternalCredentialParameter pr : ec.parameters) {
          if (pr.parameterName == AUTH_PROVIDER_URL_PARAM) {
            status.tokenUrl = pr.parameterValue;
          }
        }
      }
    } catch (Exception e) {
      status.externalCredentialStatus = 'Unknown';
    }
    return status;
  }

  /**
   * @Description  Self-heals the runtime callout/token URLs when the Named
   * Credential path is enabled but the URLs still point at the shipped
   * placeholder (or are blank). This happens after a package upgrade re-pushes
   * the credential metadata: the Use_Named_Credential__c toggle persists in a
   * custom setting and stays on, but the URLs revert to the placeholder, so
   * every callout fails with a TLS "unrecognized_name" against
   * loopback.placeholder.com. Re-points both URLs at the subscriber's My Domain.
   *
   * Does ConnectApi writes only (no HTTP callout), so it is safe to invoke in its
   * own transaction immediately before a callout — it must NOT share a
   * transaction with a callout, or the platform throws "uncommitted work
   * pending". A no-op when the toggle is off or the URLs are already configured.
   * Swallows failures (returns false) so it can never block page load on its own;
   * the subsequent callout surfaces a specific error if config is genuinely
   * broken.
   * @return true when the URLs are configured (already or after healing); false
   * when the toggle is off or healing failed.
   */
  global static Boolean ensureUrlsConfigured() {
    if (!Package2Interface.isNamedCredentialEnabled()) {
      return false;
    }
    IntegrationStatus status = getStatus();
    if (
      isConfiguredUrl(status.namedCredentialUrl) &&
      isConfiguredUrl(status.tokenUrl)
    ) {
      return true;
    }
    try {
      configureCalloutUrl();
      configureTokenUrl();
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * @Description  A callout URL is "configured" when it is non-blank and no
   * longer points at the shipped placeholder host.
   */
  @TestVisible
  private static Boolean isConfiguredUrl(String url) {
    return String.isNotBlank(url) && !url.contains(PLACEHOLDER_HOST);
  }

  /**
   * @Description  Sets the Named Credential's callout URL to the running org's
   * My Domain URL. The URL differs per subscriber org and isn't known at
   * package time, so it's set at runtime. Preserves the external-credential
   * link, callout options, and the managed-package namespace allow-list on
   * update.
   * @return The URL that was applied.
   * @throws CredentialServiceException when the ConnectApi update fails.
   */
  global static String configureCalloutUrl() {
    String myDomainUrl = URL.getOrgDomainUrl().toExternalForm();
    String ncName = Package2Interface.getQualifiedNamedCredentialName();
    try {
      ConnectApi.NamedCredentialInput input = new ConnectApi.NamedCredentialInput();
      input.developerName = ncName;
      input.masterLabel = NAMED_CREDENTIAL_LABEL;
      input.calloutUrl = myDomainUrl;
      input.type = ConnectApi.NamedCredentialType.SecuredEndpoint;

      ConnectApi.NamedCredentialCalloutOptionsInput options = new ConnectApi.NamedCredentialCalloutOptionsInput();
      options.generateAuthorizationHeader = true;
      options.allowMergeFieldsInBody = false;
      options.allowMergeFieldsInHeader = false;
      input.calloutOptions = options;

      ConnectApi.ExternalCredentialInput ecRef = new ConnectApi.ExternalCredentialInput();
      ecRef.developerName = Package2Interface.getQualifiedExternalCredentialName();
      input.externalCredentials = new List<ConnectApi.ExternalCredentialInput>{
        ecRef
      };

      // updateNamedCredential treats this input as the credential's COMPLETE
      // parameter set and deletes anything not represented. The fields above only
      // express the Url (calloutUrl) and Authentication (externalCredentials)
      // parameters, so the packaged credential's AllowedManagedPackageNamespaces
      // allow-list — the parameter that lets pkgviz code call out through it —
      // would be dropped. That deletion isn't allowed on a managed-package
      // credential and surfaces as "You can't delete the named credential
      // parameter type AllowedManagedPackageNamespaces ... because the named
      // credential is from a managed package." Re-supply only that allow-list so
      // it survives the update without disturbing other platform-managed
      // parameters.
      input.parameters = parametersToPreserve();

      ConnectApi.NamedCredentials.updateNamedCredential(ncName, input);
      return myDomainUrl;
    } catch (Exception e) {
      throw new CredentialServiceException(
        'Unable to set the Named Credential URL: ' + e.getMessage(),
        e
      );
    }
  }

  /**
   * @Description  Sets the External Credential's AuthProviderUrl (the OAuth token
   * endpoint for the Client Credentials flow) to the running org's My Domain token
   * endpoint. The packaged credential ships this as a placeholder; it differs per
   * subscriber org and isn't known at package time, so it's set at runtime.
   *
   * updateExternalCredential is a FULL-STATE REPLACE: anything not re-supplied is
   * deleted. The protocol variant (ClientCredentialsClientSecret) must be set as the
   * authenticationProtocolVariant property — it is NOT a parameter type, and without
   * it the platform rejects the AuthProviderUrl parameter. The named principal must
   * be re-supplied or it (and its stored, encrypted client id/secret) is wiped;
   * re-supplying it preserves the stored secret.
   * @return The token URL that was applied.
   * @throws CredentialServiceException when the ConnectApi update fails.
   */
  global static String configureTokenUrl() {
    String tokenUrl = URL.getOrgDomainUrl().toExternalForm() + OAUTH_TOKEN_PATH;
    String ecName = Package2Interface.getQualifiedExternalCredentialName();
    try {
      ConnectApi.ExternalCredentialInput input = new ConnectApi.ExternalCredentialInput();
      input.developerName = ecName;
      input.masterLabel = EXTERNAL_CREDENTIAL_LABEL;
      input.authenticationProtocol = ConnectApi.CredentialAuthenticationProtocol.Oauth;
      input.authenticationProtocolVariant = ConnectApi.CredentialAuthenticationProtocolVariant.ClientCredentialsClientSecret;

      ConnectApi.ExternalCredentialParameterInput tokenParam = new ConnectApi.ExternalCredentialParameterInput();
      tokenParam.parameterName = AUTH_PROVIDER_URL_PARAM;
      tokenParam.parameterType = ConnectApi.ExternalCredentialParameterType.AuthProviderUrl;
      tokenParam.parameterValue = tokenUrl;
      input.parameters = new List<ConnectApi.ExternalCredentialParameterInput>{
        tokenParam
      };

      // Re-supply the named principal or updateExternalCredential deletes it
      // (and the stored client id/secret with it).
      ConnectApi.ExternalCredentialPrincipalInput principal = new ConnectApi.ExternalCredentialPrincipalInput();
      principal.principalName = PRINCIPAL_NAME;
      principal.principalType = ConnectApi.CredentialPrincipalType.NamedPrincipal;
      principal.sequenceNumber = 1;
      input.principals = new List<ConnectApi.ExternalCredentialPrincipalInput>{
        principal
      };

      ConnectApi.NamedCredentials.updateExternalCredential(ecName, input);
      return tokenUrl;
    } catch (Exception e) {
      throw new CredentialServiceException(
        'Unable to set the External Credential token URL: ' + e.getMessage(),
        e
      );
    }
  }

  /**
   * @Description  Builds the parameter set to pass on updateNamedCredential so the
   * managed-package namespace allow-list survives the update. Because
   * updateNamedCredential replaces the credential's entire parameter set and the
   * convenience fields (calloutUrl, externalCredentials) only express the Url and
   * Authentication parameters, the AllowedManagedPackageNamespaces parameter would
   * otherwise be deleted — which the platform forbids on a managed-package
   * credential ("You can't delete the named credential parameter type
   * AllowedManagedPackageNamespaces ..."). Only that allow-list is rebuilt and
   * re-supplied: echoing every platform-reported parameter is unsafe because some
   * carry credential/component references in fields this copy can't reproduce, and
   * re-supplying them with those references blank makes updateNamedCredential fail
   * with "We couldn't access the credential(s) ... the named credential null might
   * not exist." The value is the running namespace when reflection resolves it
   * (installed subscriber org) and otherwise the package's fixed namespace — never
   * blank — so the protected parameter is always present, even in the
   * namespace/packaging org where reflection returns nothing.
   * @return The parameters to re-supply on update.
   */
  @TestVisible
  private static List<ConnectApi.NamedCredentialParameterInput> parametersToPreserve() {
    List<ConnectApi.NamedCredentialParameterInput> preserved = new List<ConnectApi.NamedCredentialParameterInput>();

    String allowedNamespaces = getRunningNamespace();
    if (String.isBlank(allowedNamespaces)) {
      allowedNamespaces = PACKAGE_NAMESPACE;
    }

    ConnectApi.NamedCredentialParameterInput allowList = new ConnectApi.NamedCredentialParameterInput();
    allowList.parameterName = ALLOWED_NAMESPACES_TYPE;
    allowList.parameterType = ConnectApi.NamedCredentialParameterType.AllowedManagedPackageNamespaces;
    allowList.parameterValue = allowedNamespaces;
    preserved.add(allowList);
    return preserved;
  }

  /**
   * @Description  Returns the namespace prefix this class runs under ('pkgviz'
   * when executing as the installed managed package, blank in a local/scratch
   * org). Used to populate the Named Credential's allowed managed-package
   * namespaces. Mirrors the reflection approach used elsewhere in the package:
   * String.valueOf(T.class) yields 'namespace.ClassName' inside a managed package
   * and just 'ClassName' otherwise.
   * @return The running namespace prefix, or '' when non-namespaced.
   */
  @TestVisible
  private static String getRunningNamespace() {
    String fullName = String.valueOf(ToolingCredentialService.class);
    Integer dotIndex = fullName.indexOf('.');
    return dotIndex > 0 ? fullName.substring(0, dotIndex) : '';
  }

  /**
   * @Description  Populates the OAuth client id and client secret on the
   * External Credential's named principal. Values are stored encrypted by the
   * platform and are never packaged. Admin obtains them from the External
   * Client App they create in their org.
   * @param principalName  The named principal developer name to populate.
   * @param clientId       The OAuth client id (consumer key) of the External Client App.
   * @param clientSecret   The OAuth client secret (consumer secret).
   * @throws CredentialServiceException on blank input or ConnectApi failure.
   */
  global static void populateClientCredentials(
    String principalName,
    String clientId,
    String clientSecret
  ) {
    if (
      String.isBlank(principalName) ||
      String.isBlank(clientId) ||
      String.isBlank(clientSecret)
    ) {
      throw new CredentialServiceException(
        'Principal name, client id, and client secret are all required.'
      );
    }
    ConnectApi.CredentialInput credInput = new ConnectApi.CredentialInput();
    credInput.externalCredential = Package2Interface.getQualifiedExternalCredentialName();
    credInput.principalType = ConnectApi.CredentialPrincipalType.NamedPrincipal;
    credInput.principalName = principalName;
    credInput.authenticationProtocol = ConnectApi.CredentialAuthenticationProtocol.Oauth;
    credInput.authenticationProtocolVariant = ConnectApi.CredentialAuthenticationProtocolVariant.ClientCredentialsClientSecret;

    Map<String, ConnectApi.CredentialValueInput> values = new Map<String, ConnectApi.CredentialValueInput>();
    // clientId is not a secret (encrypted=false); clientSecret is (encrypted=true).
    values.put('clientId', buildValue(clientId, false));
    values.put('clientSecret', buildValue(clientSecret, true));
    credInput.credentials = values;

    // First-time setup uses createCredential (POST); re-entry to rotate the
    // secret must use updateCredential (PUT) — createCredential throws
    // "credentials ... already exist" when the principal is already populated.
    // Try create, fall back to update so both paths work.
    try {
      ConnectApi.NamedCredentials.createCredential(credInput);
    } catch (ConnectApi.ConnectApiException createEx) {
      try {
        ConnectApi.NamedCredentials.updateCredential(credInput);
      } catch (Exception updateEx) {
        throw new CredentialServiceException(
          'Unable to populate client credentials: ' + updateEx.getMessage(),
          updateEx
        );
      }
    } catch (Exception e) {
      throw new CredentialServiceException(
        'Unable to populate client credentials: ' + e.getMessage(),
        e
      );
    }
  }

  /**
   * @Description  Grants the core Package Visualizer permission set access to the
   * External Credential's named principal by inserting a SetupEntityAccess row.
   * This is the runtime equivalent of a permission set's
   * <externalCredentialPrincipalAccesses> block, which can't be packaged in 2GP
   * (package version create fails with "invalid cross reference id" because the
   * principal isn't resolvable in the build context). Idempotent: a no-op when
   * the grant already exists, so it's safe to re-run.
   *
   * All SOQL/DML here runs in user mode (WITH USER_MODE / AccessLevel.USER_MODE)
   * so the running admin's CRUD/FLS governs the grant — the operation is also
   * gated upstream by the Manage Named Credentials permission required to reach
   * the wizard that calls it.
   * @throws CredentialServiceException when the permission set or principal can't
   * be resolved, or the SetupEntityAccess insert fails.
   */
  global static void grantPrincipalAccess() {
    List<PermissionSet> permSets = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = :CALLOUT_PERMISSION_SET_NAME
      WITH USER_MODE
      LIMIT 1
    ];
    if (permSets.isEmpty()) {
      throw new CredentialServiceException(
        'Permission set not found: ' + CALLOUT_PERMISSION_SET_NAME
      );
    }
    Id permissionSetId = permSets[0].Id;

    Id principalId = getPrincipalId();
    if (principalId == null) {
      throw new CredentialServiceException(
        'External credential principal not found: ' + PRINCIPAL_NAME
      );
    }

    // Idempotency: skip when the grant is already in place (safe to re-run).
    List<SetupEntityAccess> existing = [
      SELECT Id
      FROM SetupEntityAccess
      WHERE ParentId = :permissionSetId AND SetupEntityId = :principalId
      WITH USER_MODE
      LIMIT 1
    ];
    if (!existing.isEmpty()) {
      return;
    }

    try {
      Database.insert(
        new SetupEntityAccess(
          ParentId = permissionSetId,
          SetupEntityId = principalId
        ),
        AccessLevel.USER_MODE
      );
    } catch (Exception e) {
      // In a subscriber org the resolved permission set is managed-installed, so
      // SetupEntityAccess DML against it throws CANNOT_MODIFY_MANAGED_OBJECT — a
      // managed permission set can't be modified at runtime by any means. That's
      // expected and non-fatal: the principal access is shipped declaratively in
      // the packaged permission set's <externalCredentialPrincipalAccesses>, and
      // the Tooling callout authorizes through the Named Credential's
      // AllowedManagedPackageNamespaces allow-list regardless. Swallow that
      // specific case (and an already-granted race) so the setup wizard proceeds;
      // only genuinely unexpected failures surface.
      if (e.getMessage().contains('CANNOT_MODIFY_MANAGED_OBJECT')) {
        return;
      }
      throw new CredentialServiceException(
        'Unable to grant external credential principal access: ' +
        e.getMessage(),
        e
      );
    }
  }

  /**
   * @Description  Resolves the platform Id of the External Credential's named
   * principal via ConnectApi (the principal can't be queried with SOQL). Used as
   * the SetupEntityAccess.SetupEntityId target. Returns null when the credential
   * or principal isn't present/readable so callers can treat it as "not found".
   */
  private static Id getPrincipalId() {
    try {
      List<ConnectApi.ExternalCredentialPrincipal> principals = ConnectApi.NamedCredentials.getExternalCredential(
          Package2Interface.getQualifiedExternalCredentialName()
        )
        .principals;
      if (principals != null) {
        for (ConnectApi.ExternalCredentialPrincipal principal : principals) {
          if (principal.principalName == PRINCIPAL_NAME) {
            return principal.id;
          }
        }
      }
    } catch (Exception e) {
      // Credential absent or not readable in this context — treat as not found.
    }
    return null;
  }

  private static ConnectApi.CredentialValueInput buildValue(
    String raw,
    Boolean encrypted
  ) {
    ConnectApi.CredentialValueInput value = new ConnectApi.CredentialValueInput();
    value.value = raw;
    value.encrypted = encrypted;
    return value;
  }
}
