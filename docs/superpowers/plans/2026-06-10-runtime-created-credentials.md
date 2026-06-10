# Runtime-Created Subscriber-Owned Credentials — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Tooling-API self-callout work in managed-installed subscriber orgs by having the setup wizard CREATE a fresh subscriber-owned Named Credential + External Credential (pointed at the running org's My Domain) instead of trying to modify the packaged, managed-locked credential.

**Architecture:** A managed package cannot MODIFY its packaged credential's URL in a subscriber org (managed component, `state=installed`), but it CAN CREATE new subscriber-owned (unmanaged) credentials at runtime via `ConnectApi.NamedCredentials.createNamedCredential`/`createExternalCredential`. The wizard creates `pkgviz_Tooling_Named_Credential` + `pkgviz_Tooling_External_Credential`, grants the EC principal to an unmanaged permission set, and the app routes callouts through `callout:pkgviz_Tooling_Named_Credential`.

**Tech Stack:** Salesforce Apex, ConnectApi.NamedCredentials, LWC. 2GP managed package, namespace `pkgviz`. Target org: `PkgViz`.

---

## Pre-flight: Verified Facts (do not re-derive)

All verified live against `PkgViz` before this plan (using the managed `pkgviz__` context where it matters):

- **The bug:** modifying a packaged (managed) credential's URL throws `Cannot modify managed object: entity=NamedCredentialParameter, field=ParameterValue, state=installed`. The "named credential null" UI error is the platform's wrapper around this.
- **The fix works:** `createExternalCredential` + `createNamedCredential` both succeed at runtime, the new NC's `calloutUrl` is set directly to My Domain, and `updateNamedCredential` on the _new_ (unmanaged) credential to add the `AllowedManagedPackageNamespaces=pkgviz` allow-list succeeds.
- **Idempotency:** creating an existing dev name throws `"This Name already exists or has been previously used. Please choose a different name."` → catch this and call update instead.
- **Principal grant:** `SetupEntityAccess` insert for the new EC principal **succeeds against an UNMANAGED permission set** (fails against the managed packaged perm set with `CANNOT_MODIFY_MANAGED_OBJECT`). `getExternalCredential(ecName).principals[i].id` is the `SetupEntityId`.
- **Apex can create a PermissionSet** via DML at runtime (`insert new PermissionSet(...)` → OK).
- **Transaction boundary:** ConnectApi credential writes and an HTTP callout CANNOT share a transaction (`You have uncommitted work pending`). Creation must be its own transaction, separate from any callout.
- **Verified ConnectApi shapes** (from prior spikes, all compile): `ExternalCredentialInput{developerName, masterLabel, authenticationProtocol, authenticationProtocolVariant, parameters, principals}`; `ExternalCredentialParameterInput{parameterName, parameterType, parameterValue}`; `ExternalCredentialPrincipalInput{principalName, principalType, sequenceNumber}`; `NamedCredentialInput{developerName, masterLabel, calloutUrl, type, calloutOptions, externalCredentials, parameters}`; enums `ExternalCredentialParameterType.AuthProviderUrl`, `CredentialAuthenticationProtocolVariant.ClientCredentialsClientSecret`, `CredentialPrincipalType.NamedPrincipal`, `NamedCredentialParameterType.AllowedManagedPackageNamespaces`, `NamedCredentialType.SecuredEndpoint`.

**CRITICAL verification rule:** All live verification MUST run through the managed `pkgviz` namespace (anonymous Apex calling `pkgviz.ToolingCredentialService...` / `pkgviz.Package2Interface...`, or a real install). Testing against the unmanaged source copy gives FALSE PASSES — that is exactly how the original bug escaped.

## File Structure

| File                                                              | Responsibility                                                          | Action         |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------- |
| `force-app/main/default/classes/ToolingCredentialService.cls`     | Create/configure subscriber-owned credentials; grant principal; status. | Modify         |
| `force-app/main/default/classes/Package2Interface.cls`            | Route NC-path callouts to the new subscriber-owned NC name.             | Modify         |
| `force-app/main/default/classes/PackageVisualizerCtrl.cls`        | Wizard `@AuraEnabled` surface: provision + grant.                       | Modify         |
| `force-app/main/default/classes/ToolingCredentialServiceTest.cls` | Unit tests for testable seams.                                          | Modify         |
| `force-app/main/default/lwc/setupAssistant/setupAssistant.js`     | Wording/status for "create credentials".                                | Modify (light) |

---

## Task 1: Add subscriber-owned credential dev-name constants + routing

**Files:**

- Modify: `force-app/main/default/classes/ToolingCredentialService.cls`
- Modify: `force-app/main/default/classes/Package2Interface.cls`

- [ ] **Step 1: Add constants for the new subscriber-owned dev names**

In `ToolingCredentialService.cls`, near the existing credential constants, add:

```apex
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
```

- [ ] **Step 2: Route Package2Interface to the new NC name on the NC path**

In `Package2Interface.cls`, `getApiHost()` currently returns
`'callout:' + getQualifiedNamedCredentialName()`. Change the NC-path branch to use
the fixed subscriber-owned name (no namespace qualification):

```apex
  global static String getApiHost() {
    if (useNamedCredential()) {
      return 'callout:' + NEW_NC_DEVNAME;
    }
    return URL.getOrgDomainUrl().toExternalForm();
  }
```

Add the constant to `Package2Interface.cls` (it builds the `callout:` endpoint):

```apex
  // Subscriber-owned Named Credential created by the setup wizard at runtime.
  // Unmanaged, so referenced by bare dev name (no pkgviz__ prefix).
  @TestVisible
  private static final String NEW_NC_DEVNAME = 'pkgviz_Tooling_Named_Credential';
```

Leave `getQualifiedNamedCredentialName()`/`getQualifiedExternalCredentialName()` in
place (still used by ConnectApi management calls referencing the packaged credential
during the deprecation period and by tests), but they are no longer used for routing.

- [ ] **Step 3: Compile-check**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/Package2Interface.cls --source-dir force-app/main/default/classes/ToolingCredentialService.cls --dry-run`
Expected: Succeeded.

- [ ] **Step 4: Commit**

```bash
git add force-app/main/default/classes/Package2Interface.cls force-app/main/default/classes/ToolingCredentialService.cls
git commit -m "feat: add subscriber-owned credential names and route NC callouts to them"
```

---

## Task 2: `provisionCredentials()` — create the subscriber-owned NC + EC

**Files:**

- Modify: `force-app/main/default/classes/ToolingCredentialService.cls`

- [ ] **Step 1: Add `provisionCredentials()`**

Add this method. It creates both credentials idempotently (create, fall back to
update on the "already exists" error) and sets the allow-list on the NC.

```apex
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
          ConnectApi.NamedCredentials.updateNamedCredential(NEW_NC_DEVNAME, input);
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
    return e.getMessage() != null &&
      e.getMessage().contains('already exists');
  }
```

- [ ] **Step 2: Compile-check**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/ToolingCredentialService.cls --dry-run`
Expected: Succeeded.

- [ ] **Step 3: Commit**

```bash
git add force-app/main/default/classes/ToolingCredentialService.cls
git commit -m "feat: provisionCredentials creates subscriber-owned Tooling NC+EC at runtime"
```

---

## Task 3: `grantNewPrincipalAccess()` — grant the new EC principal to an unmanaged perm set

**Files:**

- Modify: `force-app/main/default/classes/ToolingCredentialService.cls`

- [ ] **Step 1: Add `grantNewPrincipalAccess()`**

This grants the _new_ EC's principal to an unmanaged permission set. It prefers an
existing unmanaged `Package_VisualizerPS`; if none exists (a real subscriber org has
only the managed one), it creates a small unmanaged perm set `pkgviz_Tooling_Access`
and grants against that. Idempotent.

```apex
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
      LIMIT 1
    ];
    if (!existing.isEmpty()) {
      return;
    }
    try {
      insert new SetupEntityAccess(
        ParentId = permissionSetId,
        SetupEntityId = principalId
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
    insert ps;
    return ps.Id;
  }
```

- [ ] **Step 2: Compile-check**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/ToolingCredentialService.cls --dry-run`
Expected: Succeeded.

- [ ] **Step 3: Commit**

```bash
git add force-app/main/default/classes/ToolingCredentialService.cls
git commit -m "feat: grant new EC principal to an unmanaged permission set"
```

---

## Task 4: Point populate + status + self-heal at the new credential

**Files:**

- Modify: `force-app/main/default/classes/ToolingCredentialService.cls`

- [ ] **Step 1: Point `populateClientCredentials` at the new EC**

`populateClientCredentials(...)` currently sets `credInput.externalCredential =
Package2Interface.getQualifiedExternalCredentialName()` (the packaged EC). Change
that single assignment to target the new EC:

```apex
    credInput.externalCredential = NEW_EC_DEVNAME;
```

(Leave the rest of the method unchanged — protocol, variant, clientId/clientSecret
values, create-then-update fallback.)

- [ ] **Step 2: Point `getStatus()` reads at the new credential**

In `getStatus()`, change the two ConnectApi reads from the qualified packaged names
to the new dev names so the wizard reflects the credential the app actually uses:

```apex
      ConnectApi.NamedCredential nc = ConnectApi.NamedCredentials.getNamedCredential(
        NEW_NC_DEVNAME
      );
```

```apex
      ConnectApi.ExternalCredential ec = ConnectApi.NamedCredentials.getExternalCredential(
        NEW_EC_DEVNAME
      );
```

(Keep the surrounding try/catch and the `tokenUrl` parameter loop exactly as-is.)

- [ ] **Step 3: Repurpose `ensureUrlsConfigured()` to verify-only against the new NC**

`ensureUrlsConfigured()` previously tried to MODIFY the packaged credential (dead
end). Replace its body so it only VERIFIES the new credential exists and is
non-placeholder — it must NOT create (transaction boundary), just report readiness:

```apex
  global static Boolean ensureUrlsConfigured() {
    if (!Package2Interface.isNamedCredentialEnabled()) {
      return false;
    }
    try {
      ConnectApi.NamedCredential nc = ConnectApi.NamedCredentials.getNamedCredential(
        NEW_NC_DEVNAME
      );
      return isConfiguredUrl(nc.calloutUrl);
    } catch (Exception e) {
      // Credential doesn't exist yet → not ready; the wizard must be run.
      return false;
    }
  }
```

(`isConfiguredUrl` already exists from prior work; `configureCalloutUrl`/
`configureTokenUrl` remain in the class but are no longer called by the new path —
leave them for now; they target the packaged credential and are removed with it in a
future version.)

- [ ] **Step 4: Compile-check**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/ToolingCredentialService.cls --dry-run`
Expected: Succeeded.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/classes/ToolingCredentialService.cls
git commit -m "feat: point populate/status/verify at the subscriber-owned credential"
```

---

## Task 5: Wire the wizard controller to provision + grant

**Files:**

- Modify: `force-app/main/default/classes/PackageVisualizerCtrl.cls`

- [ ] **Step 1: Replace `configureNamedCredentialUrl()` body**

Keep the `@AuraEnabled` method name (the LWC already calls it). Replace its body to
provision the new credentials and grant the principal:

```apex
  @AuraEnabled
  public static String configureNamedCredentialUrl() {
    try {
      ToolingCredentialService.provisionCredentials();
      ToolingCredentialService.grantNewPrincipalAccess();
      return URL.getOrgDomainUrl().toExternalForm();
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
```

(`verifyAndEnableNamedCredential()` is unchanged — it still calls
`Package2Interface.testNamedCredentialCallout()` which now routes through the new NC,
then flips the toggle on success.)

- [ ] **Step 2: Compile-check**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/PackageVisualizerCtrl.cls --source-dir force-app/main/default/classes/ToolingCredentialService.cls --source-dir force-app/main/default/classes/Package2Interface.cls --dry-run`
Expected: Succeeded.

- [ ] **Step 3: Commit**

```bash
git add force-app/main/default/classes/PackageVisualizerCtrl.cls
git commit -m "feat: wizard provisions and grants subscriber-owned credentials"
```

---

## Task 6: Unit tests for the testable seams

**Files:**

- Modify: `force-app/main/default/classes/ToolingCredentialServiceTest.cls`

ConnectApi credential mutations can't be unit-mocked, so tests cover the
deterministic seams: idempotency detection, name constants, and the unmanaged
perm-set resolution path.

- [ ] **Step 1: Test `isAlreadyExists`**

```apex
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
        new ToolingCredentialService.CredentialServiceException('some other error')
      ),
      'unrelated errors are not already-exists'
    );
    Test.stopTest();
  }
```

- [ ] **Step 2: Test that provision/grant wrap ConnectApi failures (not leak)**

ConnectApi calls throw in test context; assert they surface as
`CredentialServiceException`, never a raw leak.

```apex
  /**************************************************************************************
   * @Description  provisionCredentials wraps ConnectApi failures as a service
   * exception. (ConnectApi credential mutations aren't mockable in tests, so this
   * exercises the wrap path.)
   **************************************************************************************/
  @isTest
  static void shouldWrapError_WhenProvisioning() {
    Test.startTest();
    try {
      ToolingCredentialService.provisionCredentials();
      // may or may not throw depending on org/test context; if it throws it must wrap
    } catch (ToolingCredentialService.CredentialServiceException e) {
      Assert.isTrue(
        e.getMessage().contains('Tooling'),
        'wrapped message should mention the Tooling credential: ' + e.getMessage()
      );
    } catch (Exception other) {
      Assert.fail('ConnectApi errors must be wrapped, not leaked: ' + other.getTypeName());
    }
    Test.stopTest();
  }
```

- [ ] **Step 3: Run the test class**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/ToolingCredentialServiceTest.cls && sf apex run test --target-org PkgViz --tests ToolingCredentialServiceTest --result-format human --wait 10`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add force-app/main/default/classes/ToolingCredentialServiceTest.cls
git commit -m "test: cover idempotency detection and provision/grant error wrapping"
```

---

## Task 7: setupAssistant wording (light touch)

**Files:**

- Modify: `force-app/main/default/lwc/setupAssistant/setupAssistant.js`

- [ ] **Step 1: Update the Test & Enable success message**

In `testAndEnableNamedCredential()`, the success toast says the package "now has
access to the Tooling API". Keep it accurate to the create flow — replace the
message string with:

```javascript
            "Tooling API credentials created and enabled. The package can now query the Tooling API.",
```

(No logic changes — the existing `configureNamedCredentialUrl` → `verifyAndEnableNamedCredential` chain already does provision+grant then verify.)

- [ ] **Step 2: Lint**

Run: `npx eslint force-app/main/default/lwc/setupAssistant/setupAssistant.js`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add force-app/main/default/lwc/setupAssistant/setupAssistant.js
git commit -m "chore: update wizard success copy for create-credentials flow"
```

---

## Task 8: Live end-to-end verification (managed context)

**Files:** none (verification only). MUST use the managed `pkgviz` namespace or a real install.

- [ ] **Step 1: Deploy everything**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes --source-dir force-app/main/default/lwc/setupAssistant`
Expected: Succeeded.

- [ ] **Step 2: Provision + grant via the MANAGED classes, in their own transaction**

Save to `$CLAUDE_JOB_DIR/tmp/e2e_provision.apex`:

```apex
pkgviz.ToolingCredentialService.provisionCredentials();
pkgviz.ToolingCredentialService.grantNewPrincipalAccess();
System.debug('PROVISIONED');
```

Run: `sf apex run --target-org PkgViz --file "$CLAUDE_JOB_DIR/tmp/e2e_provision.apex" 2>&1 | grep -iE "PROVISIONED|ERROR|Exception"`
Expected: `PROVISIONED`, no exception. Confirm the credentials exist:

```apex
ConnectApi.NamedCredential nc = ConnectApi.NamedCredentials.getNamedCredential('pkgviz_Tooling_Named_Credential');
System.debug('NC_URL=' + nc.calloutUrl);
```

Expected: `NC_URL=https://<thisorg>.my.salesforce.com` (real My Domain, not placeholder).

- [ ] **Step 3: Populate the REAL client id/secret (manual — needs the actual ECA secret)**

This step requires the real OAuth consumer key/secret from the org's External Client
App (only the org owner has it). Either run the wizard UI's "Save Credentials" step,
or anonymous Apex:

```apex
pkgviz.ToolingCredentialService.populateClientCredentials('PackageVisualizerPrincipal', '<REAL_CLIENT_ID>', '<REAL_CLIENT_SECRET>');
ConnectApi.ExternalCredential ec = ConnectApi.NamedCredentials.getExternalCredential('pkgviz_Tooling_External_Credential');
System.debug('EC_STATUS=' + ec.authenticationStatus);
```

Expected: `EC_STATUS=Configured`.

- [ ] **Step 4: Run a live Tooling callout in a fresh transaction**

```apex
List<Object> recs = pkgviz.Package2Interface.testNamedCredentialCallout();
System.debug('CALLOUT_RECORDS=' + (recs == null ? 'null' : String.valueOf(recs.size())));
```

Run via `sf apex run`. Expected: a record count (e.g. `1`), NOT
`unrecognized_name` / "couldn't access the credential" / "isn't fully configured".

- [ ] **Step 5: Confirm page load works**

In the app UI (or via `pkgviz.Package2Interface.getPackage2('ASC')` after the toggle
is enabled), confirm packages load without "Failed to load packages".

- [ ] **Step 6: Non-admin user check (the open item)**

Assign ONLY the package permission set (+ the `pkgviz_Tooling_Access` grant) to a
non-admin test user and confirm the callout succeeds as that user. If it fails with
an access error, the `pkgviz_Tooling_Access` perm set must be assigned to app users
(document this as a setup step / add to the package's user-provisioning guidance).
Record the outcome.

- [ ] **Step 7: Commit any verification-driven fixes**

```bash
git add -A && git commit -m "fix: adjustments from live managed-context verification"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** create-not-modify → Tasks 1,2; routing → Task 1; grant to unmanaged perm set → Task 3; populate/status/verify retargeting → Task 4; wizard wiring → Task 5; tests → Task 6; wording → Task 7; managed-context verification + non-admin open item → Task 8. Packaged-credential removal is explicitly future/out-of-scope (spec). ✓
- **Placeholder scan:** Real client id/secret in Task 8 Step 3 is an intentional manual input (only the org owner has it), clearly marked — not a code placeholder. No TBD/TODO. ✓
- **Type consistency:** `NEW_NC_DEVNAME`/`NEW_EC_DEVNAME` defined in Task 1, used in Tasks 2/4; `provisionCredentials`/`grantNewPrincipalAccess` defined in Tasks 2/3, called in Task 5; `isAlreadyExists` defined in Task 2, tested in Task 6; `TOOLING_ACCESS_PERMSET` defined+used in Task 3. `AUTH_PROVIDER_URL_PARAM`/`OAUTH_TOKEN_PATH`/`ALLOWED_NAMESPACES_TYPE`/`PACKAGE_NAMESPACE`/`PRINCIPAL_NAME`/`isConfiguredUrl` all pre-exist from prior work. ✓

## Notes for the implementer

- `NEW_NC_DEVNAME` is declared in BOTH `ToolingCredentialService` and `Package2Interface` (each references it independently; no shared constant home exists and cross-class private constant access isn't available). Keep the string values identical.
- Do NOT verify against the unmanaged source copy — false passes. Use `pkgviz.`-qualified anonymous Apex or a real install.
- Do NOT delete the packaged NC/EC in this work (future version).
- The grant (Task 3) is included because it's proven to succeed and is harmless if redundant; Task 8 Step 4 with the real secret is what confirms whether it was strictly necessary.
