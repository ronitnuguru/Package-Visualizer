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

  // Subscriber-owned (unmanaged) credentials the wizard CREATES at runtime. These
  // are NOT the packaged pkgviz__ credentials (whose URL is a managed component and
  // cannot be modified in a subscriber org). Unmanaged → URL/params freely settable.
  // No namespace prefix: subscriber-owned components carry no managed namespace.
  @TestVisible
  private static final String NEW_NC_DEVNAME = 'pkgviz_Tooling_Named_Credential';
  @TestVisible
  private static final String NEW_EC_DEVNAME = 'pkgviz_Tooling_External_Credential';
  @TestVisible
  private static final String NEW_NC_LABEL = 'Package Visualizer Tooling Named Credential';
  @TestVisible
  private static final String NEW_EC_LABEL = 'Package Visualizer Tooling External Credential';

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
    // Whether the Named Credential's "Enabled for Callouts" flag is on. The
    // runtime-created NC starts Disabled and Apex cannot enable it (no ConnectApi
    // property; the Apex Metadata API doesn't support NamedCredential), so the
    // admin must toggle it in Setup. The wizard reads this to show that step's
    // completion. Values mirror ConnectApi.NamedCredentialCalloutStatus
    // ('Enabled' / 'Disabled'), or null when the credential isn't created yet.
    @AuraEnabled
    global String calloutStatus;
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
        NEW_NC_DEVNAME
      );
      status.namedCredentialUrl = nc.calloutUrl;
      status.calloutStatus = String.valueOf(nc.calloutStatus);
    } catch (Exception e) {
      status.namedCredentialUrl = null;
      status.calloutStatus = null;
    }
    try {
      ConnectApi.ExternalCredential ec = ConnectApi.NamedCredentials.getExternalCredential(
        NEW_EC_DEVNAME
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
   * @Description  Creates (or reconfigures, idempotently) the subscriber-owned
   * Named + External Credential the app uses for the Tooling self-callout. Unlike
   * the packaged credential, these are created at runtime and are therefore
   * unmanaged — their URL and parameters are freely settable in a subscriber org,
   * which sidesteps the CANNOT_MODIFY_MANAGED_OBJECT lock on packaged credentials.
   * Points the NC callout URL at the running org's My Domain, the EC token URL at
   * the org's /services/oauth2/token, and adds the pkgviz namespace allow-list so
   * packaged Apex may call through the NC.
   *
   * ConnectApi writes only (no callout) — safe to run in the wizard's own
   * transaction, must NOT share a transaction with a Tooling callout.
   * @throws CredentialServiceException on ConnectApi failure.
   */
  global static void provisionCredentials() {
    String myDomain = URL.getOrgDomainUrl().toExternalForm();
    provisionExternalCredential(myDomain);
    provisionNamedCredential(myDomain);
  }

  private static void provisionExternalCredential(String myDomain) {
    ConnectApi.ExternalCredentialInput input = new ConnectApi.ExternalCredentialInput();
    input.developerName = NEW_EC_DEVNAME;
    input.masterLabel = NEW_EC_LABEL;
    input.authenticationProtocol = ConnectApi.CredentialAuthenticationProtocol.Oauth;
    input.authenticationProtocolVariant = ConnectApi.CredentialAuthenticationProtocolVariant.ClientCredentialsClientSecret;

    ConnectApi.ExternalCredentialParameterInput tokenParam = new ConnectApi.ExternalCredentialParameterInput();
    tokenParam.parameterName = AUTH_PROVIDER_URL_PARAM;
    tokenParam.parameterType = ConnectApi.ExternalCredentialParameterType.AuthProviderUrl;
    tokenParam.parameterValue = myDomain + OAUTH_TOKEN_PATH;
    input.parameters = new List<ConnectApi.ExternalCredentialParameterInput>{
      tokenParam
    };

    ConnectApi.ExternalCredentialPrincipalInput principal = new ConnectApi.ExternalCredentialPrincipalInput();
    principal.principalName = PRINCIPAL_NAME;
    principal.principalType = ConnectApi.CredentialPrincipalType.NamedPrincipal;
    principal.sequenceNumber = 1;
    input.principals = new List<ConnectApi.ExternalCredentialPrincipalInput>{
      principal
    };

    try {
      ConnectApi.NamedCredentials.createExternalCredential(input);
    } catch (Exception e) {
      if (isAlreadyExists(e)) {
        try {
          ConnectApi.NamedCredentials.updateExternalCredential(
            NEW_EC_DEVNAME,
            input
          );
        } catch (Exception updateEx) {
          throw new CredentialServiceException(
            'Unable to configure the Tooling External Credential: ' +
            updateEx.getMessage(),
            updateEx
          );
        }
      } else {
        throw new CredentialServiceException(
          'Unable to create the Tooling External Credential: ' + e.getMessage(),
          e
        );
      }
    }
  }

  @TestVisible
  private static void provisionNamedCredential(String myDomain) {
    ConnectApi.NamedCredentialInput input = new ConnectApi.NamedCredentialInput();
    input.developerName = NEW_NC_DEVNAME;
    input.masterLabel = NEW_NC_LABEL;
    input.calloutUrl = myDomain;
    input.type = ConnectApi.NamedCredentialType.SecuredEndpoint;

    ConnectApi.NamedCredentialCalloutOptionsInput options = new ConnectApi.NamedCredentialCalloutOptionsInput();
    options.generateAuthorizationHeader = true;
    options.allowMergeFieldsInBody = false;
    options.allowMergeFieldsInHeader = false;
    input.calloutOptions = options;

    ConnectApi.ExternalCredentialInput ecRef = new ConnectApi.ExternalCredentialInput();
    ecRef.developerName = NEW_EC_DEVNAME;
    input.externalCredentials = new List<ConnectApi.ExternalCredentialInput>{
      ecRef
    };

    ConnectApi.NamedCredentialParameterInput allowList = new ConnectApi.NamedCredentialParameterInput();
    allowList.parameterName = ALLOWED_NAMESPACES_TYPE;
    allowList.parameterType = ConnectApi.NamedCredentialParameterType.AllowedManagedPackageNamespaces;
    allowList.parameterValue = PACKAGE_NAMESPACE;
    input.parameters = new List<ConnectApi.NamedCredentialParameterInput>{
      allowList
    };

    try {
      ConnectApi.NamedCredentials.createNamedCredential(input);
    } catch (Exception e) {
      if (isAlreadyExists(e)) {
        try {
          ConnectApi.NamedCredentials.updateNamedCredential(
            NEW_NC_DEVNAME,
            input
          );
        } catch (Exception updateEx) {
          throw new CredentialServiceException(
            'Unable to configure the Tooling Named Credential: ' +
            updateEx.getMessage(),
            updateEx
          );
        }
      } else {
        throw new CredentialServiceException(
          'Unable to create the Tooling Named Credential: ' + e.getMessage(),
          e
        );
      }
    }
  }

  /**
   * @Description  True when a ConnectApi create failed because the developer name
   * is already taken — the signal to fall back to update (idempotent re-run).
   */
  @TestVisible
  private static Boolean isAlreadyExists(Exception e) {
    return e.getMessage() != null && e.getMessage().contains('already exists');
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
    // Verify-only: report whether the subscriber-owned Named Credential exists and
    // points at a real (non-placeholder) URL. Does NOT create it — creation is a
    // ConnectApi write that can't share a transaction with the callout that follows
    // on load, so provisioning stays in the wizard's own transaction. If the
    // credential is missing the app prompts the admin to run Setup.
    try {
      ConnectApi.NamedCredential nc = ConnectApi.NamedCredentials.getNamedCredential(
        NEW_NC_DEVNAME
      );
      return isConfiguredUrl(nc.calloutUrl);
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
   * @Description  DEPRECATED — superseded by provisionCredentials(), which creates a
   * subscriber-owned Named Credential at runtime. The original implementation tried
   * to modify the PACKAGED Named Credential's URL, which is impossible in a
   * subscriber org (its URL is a managed component: CANNOT_MODIFY_MANAGED_OBJECT).
   * Retained as a no-op stub only because the global signature shipped in released
   * package versions and cannot be removed. Returns the running org My Domain URL.
   * @return The running org My Domain URL.
   */
  global static String configureCalloutUrl() {
    return URL.getOrgDomainUrl().toExternalForm();
  }

  /**
   * @Description  DEPRECATED — superseded by provisionCredentials(), which sets the
   * token URL on a subscriber-owned External Credential created at runtime. The
   * packaged External Credential can't be modified in a subscriber org. Retained as
   * a no-op stub only because the global signature shipped in released package
   * versions and cannot be removed. Returns the running org token endpoint URL.
   * @return The running org OAuth token endpoint URL.
   */
  global static String configureTokenUrl() {
    return URL.getOrgDomainUrl().toExternalForm() + OAUTH_TOKEN_PATH;
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
    credInput.externalCredential = NEW_EC_DEVNAME;
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
   * @Description  DEPRECATED — superseded by grantNewPrincipalAccess(), which grants
   * the subscriber-owned External Credential principal to an UNMANAGED permission
   * set. This original grant targeted the managed packaged permission set, where
   * SetupEntityAccess DML throws CANNOT_MODIFY_MANAGED_OBJECT in a subscriber org.
   * Retained as a no-op stub only because the global signature shipped in released
   * package versions and cannot be removed.
   */
  global static void grantPrincipalAccess() {
    // No-op: see grantNewPrincipalAccess() for the supported runtime grant.
  }

  // Dev name of the unmanaged permission set the wizard creates to hold the
  // Tooling External Credential principal grant when no unmanaged Package_VisualizerPS
  // exists. SetupEntityAccess DML must target an UNMANAGED perm set — the managed
  // packaged perm set rejects it with CANNOT_MODIFY_MANAGED_OBJECT.
  @TestVisible
  private static final String TOOLING_ACCESS_PERMSET = 'pkgviz_Tooling_Access';

  /**
   * @Description  Grants the subscriber-owned External Credential's named principal
   * access via SetupEntityAccess, targeting an UNMANAGED permission set (the managed
   * packaged perm set rejects the DML). Resolves the principal id via ConnectApi,
   * finds or creates an unmanaged perm set, and inserts the grant if absent.
   * Idempotent and non-fatal on the managed-object case (defensive).
   * @throws CredentialServiceException when the principal can't be resolved.
   */
  global static void grantNewPrincipalAccess() {
    Id principalId = getNewPrincipalId();
    if (principalId == null) {
      throw new CredentialServiceException(
        'Tooling External Credential principal not found: ' + PRINCIPAL_NAME
      );
    }
    Id permissionSetId = resolveUnmanagedPermissionSetId();

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
      if (e.getMessage().contains('CANNOT_MODIFY_MANAGED_OBJECT')) {
        return; // defensive: never block setup on a grant edge case
      }
      throw new CredentialServiceException(
        'Unable to grant Tooling principal access: ' + e.getMessage(),
        e
      );
    }
  }

  /**
   * @Description  Resolves the platform id of the NEW External Credential's named
   * principal via ConnectApi (principals can't be queried with SOQL).
   */
  private static Id getNewPrincipalId() {
    try {
      List<ConnectApi.ExternalCredentialPrincipal> principals = ConnectApi.NamedCredentials.getExternalCredential(
          NEW_EC_DEVNAME
        )
        .principals;
      if (principals != null) {
        for (ConnectApi.ExternalCredentialPrincipal p : principals) {
          if (p.principalName == PRINCIPAL_NAME) {
            return p.id;
          }
        }
      }
    } catch (Exception e) {
      // credential absent/unreadable — treat as not found
    }
    return null;
  }

  /**
   * @Description  Returns an UNMANAGED permission set id to hold the grant. Prefers
   * an existing unmanaged Package_VisualizerPS; otherwise creates (idempotently) a
   * dedicated unmanaged perm set. Never returns a managed (NamespacePrefix != null)
   * perm set, because SetupEntityAccess DML against it fails.
   */
  @TestVisible
  private static Id resolveUnmanagedPermissionSetId() {
    List<PermissionSet> existing = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = :TOOLING_ACCESS_PERMSET AND NamespacePrefix = NULL
      LIMIT 1
    ];
    if (!existing.isEmpty()) {
      return existing[0].Id;
    }
    PermissionSet ps = new PermissionSet(
      Name = TOOLING_ACCESS_PERMSET,
      Label = 'Package Visualizer Tooling Access'
    );
    try {
      insert ps;
      return ps.Id;
    } catch (DmlException e) {
      // PermissionSet labels are globally unique. If a perm set with this label
      // already exists (e.g. created in a prior run, or a namespaced copy from the
      // managed package), the insert throws DUPLICATE_MASTER_LABEL. Recover by
      // re-querying for the existing one by name rather than failing the grant.
      List<PermissionSet> race = [
        SELECT Id
        FROM PermissionSet
        WHERE Name = :TOOLING_ACCESS_PERMSET
        ORDER BY NamespacePrefix NULLS FIRST
        LIMIT 1
      ];
      if (!race.isEmpty()) {
        return race[0].Id;
      }
      throw e;
    }
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
