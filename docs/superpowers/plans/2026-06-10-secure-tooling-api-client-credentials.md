# Secure Tooling API via OAuth Client Credentials — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the OAuth Client Credentials Tooling-API path work in subscriber orgs by setting the External Credential's token URL (`AuthProviderUrl`) to the subscriber's own My Domain at setup time, and surface callout failures instead of swallowing them — while keeping the legacy VF-session path as a default-off fallback.

**Architecture:** The runtime auth dispatch (`Package2Interface.applyAuth`/`getApiHost` + the `Integration_Settings__c.Use_Named_Credential__c` toggle) is unchanged; both paths stay wired. Three localized changes: (1) `ToolingCredentialService` also sets the External Credential `AuthProviderUrl` to `<myDomain>/services/oauth2/token` via `ConnectApi.NamedCredentials.updateExternalCredential`; (2) `Package2Interface` raises a typed exception on non-200 responses on the Named Credential path; (3) the `setupAssistant` wizard reports token-URL status and runs the combined config.

**Tech Stack:** Salesforce Apex, ConnectApi.NamedCredentials, LWC (SLDS base components), Apex `HttpCalloutMock` tests. 2GP managed package, namespace `pkgviz`. Target org alias: `PkgViz`.

---

## Pre-flight: Confirmed Facts (do not re-derive)

These were verified live against org `PkgViz` (`pkgvisualizerlwc2020.my.salesforce.com`) before this plan was written:

- **Defect A confirmed.** The packaged External Credential `pkgviz__Package_Visualizer_External_Credential` has `AuthProviderUrl = https://loopback.placeholder.com` in a real org. For the Client Credentials flow this IS the OAuth token endpoint, so token acquisition fails.
- **Verified ConnectApi shape and `updateExternalCredential` behavior** — see Task 0 (✅ DONE) below for the full, live-verified findings. Headline: `updateExternalCredential` is a full-state replace, so `configureTokenUrl()` MUST set `authenticationProtocolVariant` (a property) and re-supply `input.principals`, or the named principal and its stored OAuth secret are destroyed. Task 1's code already incorporates this.

## File Structure

| File                                                                                                     | Responsibility                                                                           | Action |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| `force-app/main/default/classes/ToolingCredentialService.cls`                                            | Owns all ConnectApi credential reads/writes. Add token-URL configuration + status field. | Modify |
| `force-app/main/default/classes/Package2Interface.cls`                                                   | Owns Tooling/REST callouts + auth dispatch. Add typed failure on NC path.                | Modify |
| `force-app/main/default/classes/PackageVisualizerCtrl.cls`                                               | `@AuraEnabled` surface for the wizard. Call combined URL config.                         | Modify |
| `force-app/main/default/lwc/setupAssistant/setupAssistant.js`                                            | Wizard controller. Show token-URL status.                                                | Modify |
| `force-app/main/default/classes/PackageInterfaceTest.cls` (or existing test class for Package2Interface) | Apex tests for callout failure surfacing.                                                | Modify |
| `force-app/main/default/classes/ToolingCredentialServiceTest.cls` (existing, if present)                 | Tests for token-URL config.                                                              | Modify |

---

## Task 0: ✅ DONE — `updateExternalCredential` behavior verified live

This spike was run against `PkgViz` before implementation. **Findings (these are now load-bearing facts — Task 1 code below already incorporates them):**

1. **`updateExternalCredential` is a FULL-STATE REPLACE.** Anything not re-supplied is deleted. Supplying only the `AuthProviderUrl` param **wipes the named principal AND its stored client id/secret** (verified: principals went 1→0, status `Configured`→`NotConfigured`). This is the same "drops what you don't re-supply" hazard the codebase documents for the Named Credential allow-list — but here it is **destructive to the OAuth secret**. Task 1's method MUST re-supply `input.principals`.
2. **The OAuth protocol variant is a PROPERTY, not a parameter.** Setting `input.parameters` with an `AuthProtocolVariant` param fails to compile (`AuthProtocolVariant` is not a valid `ExternalCredentialParameterType`). It must be set as `input.authenticationProtocolVariant = ConnectApi.CredentialAuthenticationProtocolVariant.ClientCredentialsClientSecret`. Omitting the variant makes the update reject `AuthProviderUrl` with: _"The authentication protocol 'Oauth' doesn't support the following external credential parameter type(s): AuthProviderUrl."_
3. **Verified valid enum values:**
   - `ConnectApi.ExternalCredentialParameterType`: only `AuthProviderUrl`, `SigningCertificate`, `JwtBodyClaim`, `JwtHeaderClaim`.
   - `ConnectApi.CredentialAuthenticationProtocolVariant`: `ClientCredentialsClientSecret`, `JwtBearer` (NOT `ClientCredentials`, NOT `AuthorizationCode`).
   - `ConnectApi.CredentialPrincipalType`: `NamedPrincipal`, `PerUserPrincipal`.
4. **Verified input shapes:**
   - `ConnectApi.ExternalCredentialInput`: `.developerName`, `.masterLabel`, `.authenticationProtocol`, `.authenticationProtocolVariant`, `.parameters`, `.principals`. (No `.externalCredentialParameters`, no `.description`.)
   - `ConnectApi.ExternalCredentialParameterInput`: `.parameterName`, `.parameterType`, `.parameterValue`. (No `.parameterGroup`.)
   - `ConnectApi.ExternalCredentialPrincipalInput`: `.principalName`, `.principalType`, `.sequenceNumber`. (No `.description`, no `.parameterGroup`.)
5. **Re-supplying `input.principals` PRESERVES the stored client secret** (verified: after a token-URL update that re-supplied the principal, status stayed `Configured` and a subsequent callout's auth was intact). So wizard ordering is NOT fragile — the token-URL update is safe to run before or after `populateClientCredentials`.
6. The packaged principal is `PackageVisualizerPrincipal` / `NamedPrincipal` / `sequenceNumber = 1`. EC master label is exactly `Package Visualizer External Credential`.

**Org state:** left restored to original (`AuthProviderUrl=https://loopback.placeholder.com`, principal present, `Configured`). No further spike action needed.

---

## Task 1: `ToolingCredentialService` — set the External Credential token URL

**Files:**

- Modify: `force-app/main/default/classes/ToolingCredentialService.cls`
- Test: `force-app/main/default/classes/ToolingCredentialServiceTest.cls` (existing; if absent, create following the existing Tooling test patterns in the repo)

- [ ] **Step 1: Add the `tokenUrl` field to the status DTO**

In `ToolingCredentialService.cls`, in the `IntegrationStatus` inner class (currently ends after `principalName`), add:

```apex
    @AuraEnabled
    global String tokenUrl;
```

- [ ] **Step 2: Populate `tokenUrl` in `getStatus()`**

In `getStatus()`, inside the existing `try` that reads the External Credential (the block that sets `status.externalCredentialStatus`), add a read of the `AuthProviderUrl` parameter. Replace the existing EC try/catch block with:

```apex
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
```

- [ ] **Step 3: Add the token-URL parameter-name constant**

Near the other `@TestVisible private static final String` constants at the top of the class (after `ALLOWED_NAMESPACES_TYPE`), add:

```apex
  // ConnectApi parameter name of the External Credential's OAuth token endpoint.
  // For the Client Credentials flow this is the URL the platform POSTs to in order
  // to mint the bearer token. Ships as a placeholder and is set per-subscriber at
  // setup time to the org's own My Domain token endpoint.
  @TestVisible
  private static final String AUTH_PROVIDER_URL_PARAM = 'AuthProviderUrl';
  // Path appended to the org My Domain to form the OAuth token endpoint.
  @TestVisible
  private static final String OAUTH_TOKEN_PATH = '/services/oauth2/token';
```

- [ ] **Step 4: Add the `EXTERNAL_CREDENTIAL_LABEL` and principal constants**

Near `NAMED_CREDENTIAL_LABEL` / the other constants, add:

```apex
  // Must match the <label> in the packaged External Credential metadata —
  // updateExternalCredential requires masterLabel in the payload.
  @TestVisible
  private static final String EXTERNAL_CREDENTIAL_LABEL = 'Package Visualizer External Credential';
```

Note: `PRINCIPAL_NAME` (`'PackageVisualizerPrincipal'`) already exists on this class and is reused below for the principal re-supply.

- [ ] **Step 5: Add `configureTokenUrl()` (verified shape — re-supplies principal to avoid wiping the secret)**

Add after `configureCalloutUrl()`. **Critical (verified in Task 0):** `updateExternalCredential` is a full-state replace. You MUST set `authenticationProtocolVariant` (a property, not a param) AND re-supply `input.principals`, or the named principal and its stored client id/secret are destroyed.

```apex
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
    String tokenUrl =
      URL.getOrgDomainUrl().toExternalForm() + OAUTH_TOKEN_PATH;
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
```

- [ ] **Step 6: Verify it compiles against the org**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/ToolingCredentialService.cls --dry-run`
Expected: deploy succeeds (no compile errors).

- [ ] **Step 7: Commit**

```bash
git add force-app/main/default/classes/ToolingCredentialService.cls
git commit -m "feat: set External Credential token URL to subscriber My Domain at setup"
```

---

## Task 2: `Package2Interface` — surface callout failures on the Named Credential path

**Files:**

- Modify: `force-app/main/default/classes/Package2Interface.cls`
- Test: existing Package2Interface test class (search: `grep -rl "Package2Interface" force-app/main/default/classes/*Test.cls`)

- [ ] **Step 1: Write the failing test for a 401 on the NC path**

In the Package2Interface test class, add (uses an `HttpCalloutMock` returning 401; forces the NC path via the existing `@TestVisible useNamedCredentialOverride`):

```apex
@IsTest
static void submitQuery_namedCredentialPath_non200_throws() {
  Package2Interface.useNamedCredentialOverride = true;
  Test.setMock(HttpCalloutMock.class, new StaticHttpMock(401, '{"error":"invalid_grant"}'));
  Test.startTest();
  Boolean threw = false;
  try {
    Package2Interface.submitQuery('SELECT Id FROM Package2 LIMIT 1');
  } catch (Package2Interface.ToolingCalloutException e) {
    threw = true;
    System.assert(e.getMessage().contains('401'), 'message should include status: ' + e.getMessage());
  }
  Test.stopTest();
  System.assertEquals(true, threw, 'non-200 on the NC path must throw');
  Package2Interface.useNamedCredentialOverride = null;
}
```

If a reusable `StaticHttpMock` does not already exist in the test class, add this helper to the test class:

```apex
private class StaticHttpMock implements HttpCalloutMock {
  Integer code;
  String body;
  StaticHttpMock(Integer code, String body) {
    this.code = code;
    this.body = body;
  }
  public HttpResponse respond(HttpRequest req) {
    HttpResponse res = new HttpResponse();
    res.setStatusCode(code);
    res.setBody(body);
    return res;
  }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `sf apex run test --target-org PkgViz --tests <TestClass>.submitQuery_namedCredentialPath_non200_throws --result-format human --wait 10`
Expected: FAIL — either `ToolingCalloutException` type does not exist (compile) or the call returns an empty list instead of throwing.

- [ ] **Step 3: Add the typed exception**

In `Package2Interface.cls`, add a nested exception class near the top of the class body:

```apex
/**
 * @Description Thrown when a Tooling/REST callout on the Named Credential path
 * returns a non-200 status, carrying the HTTP status and response body so the
 * UI can show a specific cause instead of an empty result.
 */ global class ToolingCalloutException extends Exception {
}
```

- [ ] **Step 4: Make `submitQuery()` throw on non-200 (NC path only)**

Replace the response-handling tail of `submitQuery()` (currently the `if (res.getStatusCode() == 200) {...}` block through the `if (res.getStatusCode() == 401) {...}` block and the final `return records;`) with:

```apex
    if (res.getStatusCode() == 200) {
      String result = res.getBody();
      Map<String, Object> m = (Map<String, Object>) JSON.deserializeUntyped(
        result
      );
      if (m.containsKey('records')) {
        records = (List<Object>) m.get('records');
      }
      return records;
    }
    // On the Named Credential path, surface failures so the UI shows a real cause
    // rather than an empty list. The legacy session path keeps its prior behavior.
    if (useNamedCredential()) {
      throw new ToolingCalloutException(
        'Tooling API callout failed (HTTP ' +
          res.getStatusCode() +
          '): ' +
          res.getBody()
      );
    }
    return records;
```

- [ ] **Step 5: Mirror the failure surfacing in `testNamedCredentialCallout()`**

`testNamedCredentialCallout()` currently returns `null` on non-200. Leave its `null`-on-failure contract intact (the controller already maps `null` to an error), but make the message richer by changing the `return null;` line to capture context. Replace the `if (res.getStatusCode() == 200) {...} return null;` block with:

```apex
      if (res.getStatusCode() == 200) {
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
          res.getBody()
        );
        return body.containsKey('records')
          ? (List<Object>) body.get('records')
          : new List<Object>();
      }
      throw new ToolingCalloutException(
        'Test callout failed (HTTP ' +
          res.getStatusCode() +
          '): ' +
          res.getBody()
      );
```

Note: this changes `testNamedCredentialCallout()` from returning `null` to throwing on failure. Task 3 Step 1 updates the controller to match.

- [ ] **Step 6: Run the test to verify it passes**

Run: `sf apex run test --target-org PkgViz --tests <TestClass>.submitQuery_namedCredentialPath_non200_throws --result-format human --wait 10`
Expected: PASS.

- [ ] **Step 7: Add a test that the legacy path still returns empty (not throws) on non-200**

```apex
@IsTest
static void submitQuery_legacyPath_non200_returnsEmpty() {
  Package2Interface.useNamedCredentialOverride = false;
  Test.setMock(HttpCalloutMock.class, new StaticHttpMock(500, 'err'));
  Test.startTest();
  List<Object> result = Package2Interface.submitQuery('SELECT Id FROM Package2 LIMIT 1');
  Test.stopTest();
  System.assertEquals(0, result.size(), 'legacy path returns empty on non-200');
  Package2Interface.useNamedCredentialOverride = null;
}
```

Run the same test command targeting this method. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add force-app/main/default/classes/Package2Interface.cls force-app/main/default/classes/<TestClass>.cls
git commit -m "feat: surface Tooling callout failures on Named Credential path"
```

---

## Task 3: `PackageVisualizerCtrl` — run combined URL config in the wizard

**Files:**

- Modify: `force-app/main/default/classes/PackageVisualizerCtrl.cls`

- [ ] **Step 1: Call `configureTokenUrl()` inside `configureNamedCredentialUrl()`**

Replace the body of `configureNamedCredentialUrl()` (lines ~1136-1144) with:

```apex
  @AuraEnabled
  public static String configureNamedCredentialUrl() {
    try {
      String url = ToolingCredentialService.configureCalloutUrl();
      ToolingCredentialService.configureTokenUrl();
      ToolingCredentialService.grantPrincipalAccess();
      return url;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
```

- [ ] **Step 2: Update `verifyAndEnableNamedCredential()` for the new throw contract**

`testNamedCredentialCallout()` now throws on failure (Task 2 Step 5) instead of returning `null`. The existing `catch (Exception e)` already wraps non-AuraHandled exceptions into an `AuraHandledException`, so the method works as-is, but tighten the message. Replace the body of `verifyAndEnableNamedCredential()` (lines ~1175-1190) with:

```apex
  @AuraEnabled
  public static String verifyAndEnableNamedCredential() {
    try {
      List<Object> records = Package2Interface.testNamedCredentialCallout();
      Package2Interface.setNamedCredentialEnabled(true);
      return 'success';
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Test callout failed. Verify the External Client App, client credentials, token URL, and run-as user. Details: ' +
        e.getMessage()
      );
    }
  }
```

- [ ] **Step 3: Verify it compiles**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default/classes/PackageVisualizerCtrl.cls --dry-run`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add force-app/main/default/classes/PackageVisualizerCtrl.cls
git commit -m "feat: configure token URL during wizard Test & Enable step"
```

---

## Task 4: `setupAssistant` LWC — show token-URL status

**Files:**

- Modify: `force-app/main/default/lwc/setupAssistant/setupAssistant.js`

- [ ] **Step 1: Add a getter exposing the token URL status**

After the existing `get isToolingCredentialConfigured()` getter (ends ~line 79), add:

```javascript
  get isTokenUrlConfigured() {
    return (
      this.integrationStatus &&
      this.integrationStatus.tokenUrl &&
      !this.integrationStatus.tokenUrl.includes("loopback.placeholder.com")
    );
  }

  get tokenUrlDisplay() {
    return this.integrationStatus && this.integrationStatus.tokenUrl
      ? this.integrationStatus.tokenUrl
      : "Not configured";
  }
```

- [ ] **Step 2: Fix the success-message typos in `testAndEnableNamedCredential()`**

In `testAndEnableNamedCredential()`, the success toast message currently reads "The packaage now has access to Tooling API". Replace that message string with:

```javascript
            "Test callout succeeded. The package now has access to the Tooling API.",
```

- [ ] **Step 3: Surface the token-URL status in the template**

In `setupAssistant.html`, find the block that renders the External Credential / Named Credential status (near where `integrationStatus.namedCredentialUrl` or `isToolingCredentialConfigured` is referenced). Add a read-only status line beside the existing Named Credential URL line:

```html
<div class="slds-form-element slds-m-bottom_small">
  <span class="slds-form-element__label">OAuth Token URL</span>
  <div class="slds-form-element__control">
    <lightning-input
      type="text"
      variant="label-hidden"
      value="{tokenUrlDisplay}"
      readonly
    ></lightning-input>
  </div>
</div>
```

(If the existing markup uses a different display primitive for the My Domain / NC URL line, match that primitive instead of `lightning-input` to stay consistent — reuse the surrounding pattern.)

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new errors for `setupAssistant`.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/lwc/setupAssistant/setupAssistant.js force-app/main/default/lwc/setupAssistant/setupAssistant.html
git commit -m "feat: show OAuth token URL status in setup wizard"
```

---

## Task 5: Full deploy + live end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Deploy all changes to `PkgViz`**

Run: `sf project deploy start --target-org PkgViz --source-dir force-app/main/default`
Expected: succeeds.

- [ ] **Step 2: Run the affected Apex tests**

Run: `sf apex run test --target-org PkgViz --tests <Package2InterfaceTest> <ToolingCredentialServiceTest> --result-format human --code-coverage --wait 10`
Expected: all pass; coverage on the changed classes does not drop below the package threshold (75%).

- [ ] **Step 3: Drive the wizard config from anonymous Apex and confirm the token URL is set**

Save to `$CLAUDE_JOB_DIR/tmp/verify_e2e.apex`:

```apex
String calloutUrl = ToolingCredentialService.configureCalloutUrl();
String tokenUrl = ToolingCredentialService.configureTokenUrl();
System.debug('CALLOUT URL: ' + calloutUrl);
System.debug('TOKEN URL: ' + tokenUrl);
ToolingCredentialService.IntegrationStatus s = ToolingCredentialService.getStatus();
System.debug('STATUS tokenUrl: ' + s.tokenUrl);
System.assert(!s.tokenUrl.contains('loopback.placeholder.com'), 'token URL must no longer be the placeholder');
```

Run: `sf apex run --target-org PkgViz --file "$CLAUDE_JOB_DIR/tmp/verify_e2e.apex" 2>&1 | grep -iE "CALLOUT URL|TOKEN URL|STATUS|error|System.AssertException"`
Expected: `TOKEN URL: https://pkgvisualizerlwc2020.my.salesforce.com/services/oauth2/token`, `STATUS tokenUrl:` matching, no assertion failure.

- [ ] **Step 4: Confirm the live token exchange now works (the real Defect A fix)**

This requires that client credentials are populated on the principal (the `PkgViz` org may already have them from prior testing; if not, this step confirms the failure is now a _credentials_ error, not a _token URL_ error). Save to `$CLAUDE_JOB_DIR/tmp/verify_callout.apex`:

```apex
try {
  List<Object> recs = Package2Interface.testNamedCredentialCallout();
  System.debug('CALLOUT RECORDS: ' + (recs == null ? 'null' : String.valueOf(recs.size())));
} catch (Exception e) {
  System.debug('CALLOUT ERR: ' + e.getMessage());
}
```

Run: `sf apex run --target-org PkgViz --file "$CLAUDE_JOB_DIR/tmp/verify_callout.apex" 2>&1 | grep -iE "CALLOUT RECORDS|CALLOUT ERR"`
Expected: either `CALLOUT RECORDS: <n>` (full success — Defect A fixed end-to-end) OR a `CALLOUT ERR` whose message references the **token endpoint / client credentials** (not `loopback.placeholder.com`). Seeing `loopback.placeholder.com` in the error means the token URL did not take — re-check Task 1.

- [ ] **Step 5: Confirm the legacy fallback is untouched**

Run: `sf apex run --target-org PkgViz --file -` with:

```apex
System.debug('TOGGLE: ' + Package2Interface.isNamedCredentialEnabled());
```

Expected: toggle reads its prior value; no exception. (The fallback path code was not modified.)

- [ ] **Step 6: Final commit (if any verification-driven fixes were made)**

```bash
git add -A
git commit -m "fix: adjustments from live Tooling API end-to-end verification"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** Defect A → Tasks 0,1,3,5. Defect B → Task 2. Wizard token-URL status → Task 4. "Both paths remain" → no deletions in any task; Task 2 Step 7 + Task 5 Step 5 assert the legacy path is unchanged. Run-as user "admin picks existing" → no code constraint added; surfaced via the richer error in Task 3 Step 2. ✓
- **Placeholder scan:** No TBD/TODO. The one genuine unknown (`updateExternalCredential` preservation behavior) is handled by an explicit spike (Task 0) that feeds Task 1, not left vague. ✓
- **Type consistency:** `ToolingCalloutException` defined in Task 2 Step 3, used in Steps 4/5. `configureTokenUrl()` defined in Task 1 Step 4, called in Task 3 Step 1 and Task 5 Step 3. `tokenUrl` field defined in Task 1 Step 1, read in Task 4 Step 1. `EXTERNAL_CREDENTIAL_LABEL`/`AUTH_PROVIDER_URL_PARAM`/`OAUTH_TOKEN_PATH` constants defined in Task 1 Steps 3/5, used in Steps 2/4. ✓

## Notes for the implementer

- Replace `<TestClass>` / `<Package2InterfaceTest>` / `<ToolingCredentialServiceTest>` with the real class names found via `grep -rl "Package2Interface" force-app/main/default/classes/*Test.cls` and the equivalent for `ToolingCredentialService`. Memory note: a class named `PackageInterfaceTest` is referenced in the project CLAUDE.md.
- ConnectApi mutation methods (`updateExternalCredential`) generally cannot be exercised in Apex unit tests — do not attempt to unit-test `configureTokenUrl()` against a live ConnectApi call. Its verification is the live anonymous-Apex run in Task 5 Step 3. Unit tests cover the testable seams (`Package2Interface` callout surfacing) only.
- Do not bump the package version as part of this work; that is a separate step handled by the `sf-2gp-bump-package-version` skill once verified.
