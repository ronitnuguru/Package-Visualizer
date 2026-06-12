# App Analytics ECA Migration Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instrument the `pkgviz` managed package so it logs two App Analytics Custom Interactions — `MIGRATED_TO_ECA` (once, when a subscriber flips to the OAuth/ECA path) and `USING_LEGACY_SESSION_ID` (once per org ever, when a callout runs on the legacy session-id path) — producing a clean migrated/not-migrated partition in Package Usage Logs.

**Architecture:** A packaged compile-time enum (`PackageVisualizerInteractions`) supplies the two labels. A thin, exception-swallowing wrapper (`AppAnalyticsLogger`) isolates the `IsvPartners.AppAnalytics.logCustomInteraction()` API behind one testable surface. The migration-completion event is logged in `PackageVisualizerCtrl.verifyAndEnableNamedCredential()`; the legacy-usage event is logged from the single legacy chokepoint `Package2Interface.applyAuth()`, guarded by a new persistent Checkbox field `Integration_Settings__c.Legacy_Usage_Logged__c` so it fires at most once per org. Both interactions carry `UserInfo.getOrganizationId()` as a (tokenized) correlation id. Total volume: at most two records per org over its lifetime.

**Tech Stack:** Salesforce Apex (API v66.0), 2GP managed package (`pkgviz` namespace), `IsvPartners.AppAnalytics` Custom Interactions API, hierarchy Custom Setting, `sf` CLI.

**Spec:** `docs/superpowers/specs/2026-06-12-app-analytics-eca-migration-tracking-design.md`

---

## File Structure

| File | Responsibility | New/Modified |
| --- | --- | --- |
| `force-app/main/default/classes/PackageVisualizerInteractions.cls` (+ `.cls-meta.xml`) | Packaged enum: the 2 interaction labels | **New** |
| `force-app/main/default/classes/AppAnalyticsLogger.cls` (+ `.cls-meta.xml`) | Single guarded surface over `IsvPartners.AppAnalytics`; never throws | **New** |
| `force-app/main/default/classes/AppAnalyticsLoggerTest.cls` (+ `.cls-meta.xml`) | Tests the guard/no-throw behavior | **New** |
| `force-app/main/default/objects/Integration_Settings__c/fields/Legacy_Usage_Logged__c.field-meta.xml` | Persistent "legacy already logged" marker | **New** |
| `force-app/main/default/classes/Package2Interface.cls` | Add `logLegacyUsageOnce()`; call it from `applyAuth()` legacy branch | **Modify** (`:873`, add helper near `:744`) |
| `force-app/main/default/classes/PackageVisualizerCtrl.cls` | Log `MIGRATED_TO_ECA` in `verifyAndEnableNamedCredential()` | **Modify** (`:1198`) |
| `force-app/main/default/classes/PackageInterfaceTest.cls` | Assert legacy-usage logs once and sets the flag | **Modify** |
| `force-app/main/default/classes/PackageVisualizerCtrlAdditionalTest.cls` | Assert migration path invokes logger without throwing | **Modify** |

---

## Task 0: Verify `IsvPartners.AppAnalytics` compiles (spike — do this FIRST)

This is the highest-risk unknown. `IsvPartners.AppAnalytics.logCustomInteraction()` is referenced nowhere in the codebase today. We must confirm the static reference compiles in this project's deploy target before building on it. If it does not compile, switch every later task to the **dynamic fallback** noted at the end of this task.

**Files:**
- Create (throwaway): `force-app/main/default/classes/AppAnalyticsSpike.cls` + `.cls-meta.xml`

- [ ] **Step 1: Write a throwaway probe class**

Create `force-app/main/default/classes/AppAnalyticsSpike.cls`:

```apex
public with sharing class AppAnalyticsSpike {
    public enum ProbeLabels { PROBE }
    public static void probe() {
        IsvPartners.AppAnalytics.logCustomInteraction(
            ProbeLabels.PROBE,
            UserInfo.getOrganizationId()
        );
    }
}
```

Create `force-app/main/default/classes/AppAnalyticsSpike.cls-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

- [ ] **Step 2: Attempt deploy to the dev/scratch org**

Run: `sf project deploy start --source-dir force-app/main/default/classes/AppAnalyticsSpike.cls --target-org <your-scratch-or-dev-org>`

Expected (success path): `Deploy Succeeded`. This confirms the static `IsvPartners.AppAnalytics` reference compiles. **Record the result.**

Expected (failure path): a compile error like `Invalid type: IsvPartners.AppAnalytics` or `Method does not exist or incorrect signature`. If so, the static API is not available in this build context — proceed with the **dynamic fallback** (below) in Task 2.

- [ ] **Step 3: Delete the probe**

Run: `rm force-app/main/default/classes/AppAnalyticsSpike.cls force-app/main/default/classes/AppAnalyticsSpike.cls-meta.xml`

If it was deployed, also delete from org:
Run: `sf project delete source --metadata ApexClass:AppAnalyticsSpike --target-org <org> --no-prompt`

- [ ] **Step 4: Record outcome — no commit (spike is throwaway)**

Write the outcome (compiles / does-not-compile) into the plan's checkbox here as a comment for the next tasks. Do not commit the probe.

**Dynamic fallback (only if Step 2 failed):** replace the static call in `AppAnalyticsLogger` (Task 2) with a `System.Type`-based dynamic invocation, OR gate the call behind `Type.forName('IsvPartners', 'AppAnalytics')` and invoke via a `Callable`. If even `Type.forName` returns null in the build org, the instrumentation can only be exercised in a packaging org — in that case keep the static reference but compile-isolate it and note that local deploys require the namespace. **Document which path was taken before proceeding.**

---

## Task 1: Packaged enum `PackageVisualizerInteractions`

**Files:**
- Create: `force-app/main/default/classes/PackageVisualizerInteractions.cls`
- Create: `force-app/main/default/classes/PackageVisualizerInteractions.cls-meta.xml`

- [ ] **Step 1: Create the enum class**

Create `force-app/main/default/classes/PackageVisualizerInteractions.cls`:

```apex
/**************************************************************************************
 * @Description  App Analytics Custom Interaction labels for the package. Packaged,
 * compile-time enum values required by IsvPartners.AppAnalytics.logCustomInteraction().
 * Business-level labels per Salesforce best practice. Keep additions meaningful —
 * each value becomes an analytics label in Package Usage Logs.
 *
 *   MIGRATED_TO_ECA          Logged once when a subscriber org flips from the legacy
 *                            session-id auth path to the OAuth / External Client App path.
 *   USING_LEGACY_SESSION_ID  Logged once per org (ever) the first time a callout runs
 *                            while still on the legacy session-id path.
 **************************************************************************************/
public enum PackageVisualizerInteractions {
    MIGRATED_TO_ECA,
    USING_LEGACY_SESSION_ID
}
```

- [ ] **Step 2: Create the meta file**

Create `force-app/main/default/classes/PackageVisualizerInteractions.cls-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

- [ ] **Step 3: Deploy to verify it compiles**

Run: `sf project deploy start --source-dir force-app/main/default/classes/PackageVisualizerInteractions.cls --target-org <org>`
Expected: `Deploy Succeeded`.

- [ ] **Step 4: Commit**

```bash
git add force-app/main/default/classes/PackageVisualizerInteractions.cls force-app/main/default/classes/PackageVisualizerInteractions.cls-meta.xml
git commit -m "feat: add PackageVisualizerInteractions enum for App Analytics custom interactions"
```

---

## Task 2: `AppAnalyticsLogger` wrapper + its test (TDD)

**Files:**
- Create: `force-app/main/default/classes/AppAnalyticsLogger.cls` + `.cls-meta.xml`
- Test: `force-app/main/default/classes/AppAnalyticsLoggerTest.cls` + `.cls-meta.xml`

> If Task 0 produced the **dynamic fallback**, replace the body of `log()` below with the dynamic invocation decided in Task 0; the test below is unchanged because it only exercises the `disableForTest` guard and the no-throw contract.

- [ ] **Step 1: Write the failing test**

Create `force-app/main/default/classes/AppAnalyticsLoggerTest.cls`:

```apex
@isTest
private class AppAnalyticsLoggerTest {
    // With the test guard ON, log() must be a complete no-op and must not throw,
    // regardless of whether the IsvPartners namespace is available in this org.
    @isTest
    static void log_isNoOpAndNeverThrows_whenDisabledForTest() {
        AppAnalyticsLogger.disableForTest = true;
        Test.startTest();
        // Should not throw even though no real analytics call is made.
        AppAnalyticsLogger.log(
            PackageVisualizerInteractions.MIGRATED_TO_ECA,
            UserInfo.getOrganizationId()
        );
        Test.stopTest();
        System.assert(true, 'log() returned without throwing under disableForTest');
    }

    // With the guard OFF, log() still must never propagate an exception to callers
    // (analytics must not break auth/callouts). In a test context the underlying
    // API call is unavailable/ignored; log() must swallow any resulting exception.
    @isTest
    static void log_neverThrows_whenEnabled() {
        AppAnalyticsLogger.disableForTest = false;
        Test.startTest();
        AppAnalyticsLogger.log(
            PackageVisualizerInteractions.USING_LEGACY_SESSION_ID,
            UserInfo.getOrganizationId()
        );
        Test.stopTest();
        System.assert(true, 'log() swallowed any API exception and returned');
    }
}
```

Create `force-app/main/default/classes/AppAnalyticsLoggerTest.cls-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `sf project deploy start --source-dir force-app/main/default/classes/AppAnalyticsLoggerTest.cls --target-org <org>`
Expected: deploy FAILS with `Invalid type: AppAnalyticsLogger` (class does not exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `force-app/main/default/classes/AppAnalyticsLogger.cls`:

```apex
/**************************************************************************************
 * @Description  Single guarded surface over the App Analytics Custom Interactions
 * API. Analytics must NEVER break auth or a callout, so every failure is swallowed.
 * disableForTest lets unit tests exercise call sites without invoking the real API
 * (which is unavailable outside a subscriber org).
 **************************************************************************************/
public with sharing class AppAnalyticsLogger {

    // Set true in tests to make log() a no-op. Production code never sets this.
    @TestVisible
    private static Boolean disableForTest = false;

    /**
     * @Description  Logs a Custom Interaction with an org-id correlation token.
     * Swallows all exceptions — analytics failures must not surface to callers.
     * @param label          The packaged interaction label.
     * @param correlationId  Identifier hashed/tokenized by App Analytics before storage.
     */
    public static void log(PackageVisualizerInteractions label, Id correlationId) {
        if (disableForTest) {
            return;
        }
        try {
            IsvPartners.AppAnalytics.logCustomInteraction(label, correlationId);
        } catch (Exception e) {
            // Intentionally swallowed. App Analytics also silently ignores
            // over-limit calls; we mirror that contract so callouts never break.
            System.debug(LoggingLevel.FINE, 'APP_ANALYTICS_WARN logCustomInteraction skipped: ' + e.getMessage());
        }
    }
}
```

Create `force-app/main/default/classes/AppAnalyticsLogger.cls-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

- [ ] **Step 4: Deploy and run the test to verify it passes**

Run: `sf project deploy start --source-dir force-app/main/default/classes/AppAnalyticsLogger.cls force-app/main/default/classes/AppAnalyticsLoggerTest.cls --target-org <org>`
Expected: `Deploy Succeeded`.

Run: `sf apex run test -n AppAnalyticsLoggerTest -w 10 --result-format human --target-org <org>`
Expected: both methods PASS.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/classes/AppAnalyticsLogger.cls force-app/main/default/classes/AppAnalyticsLogger.cls-meta.xml force-app/main/default/classes/AppAnalyticsLoggerTest.cls force-app/main/default/classes/AppAnalyticsLoggerTest.cls-meta.xml
git commit -m "feat: add AppAnalyticsLogger guarded wrapper for custom interactions"
```

---

## Task 3: New field `Integration_Settings__c.Legacy_Usage_Logged__c`

**Files:**
- Create: `force-app/main/default/objects/Integration_Settings__c/fields/Legacy_Usage_Logged__c.field-meta.xml`

- [ ] **Step 1: Create the field metadata** (mirrors the existing `Use_Named_Credential__c.field-meta.xml` shape)

Create `force-app/main/default/objects/Integration_Settings__c/fields/Legacy_Usage_Logged__c.field-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Legacy_Usage_Logged__c</fullName>
    <defaultValue>false</defaultValue>
    <description>Set true after the package logs the USING_LEGACY_SESSION_ID App Analytics custom interaction once for this org, so the interaction fires at most once per org (no per-transaction log bloat). Never reset by the package.</description>
    <externalId>false</externalId>
    <label>Legacy Usage Logged</label>
    <trackTrending>false</trackTrending>
    <type>Checkbox</type>
</CustomField>
```

- [ ] **Step 2: Deploy the field**

> Note: `Integration_Settings__c.object-meta.xml` is `Protected`. Per the in-file caveat (`:7-10`), Protected custom settings cannot deploy to a production/DevHub org — only to scratch/package builds. If deploying to a direct prod/DevHub org for testing, temporarily flip `<visibility>` to `Public`, then REVERT to `Protected` before `sf package version create`. For a scratch org, deploy as-is.

Run: `sf project deploy start --source-dir "force-app/main/default/objects/Integration_Settings__c/fields/Legacy_Usage_Logged__c.field-meta.xml" --target-org <org>`
Expected: `Deploy Succeeded`.

- [ ] **Step 3: Verify the field is queryable**

Run: `sf data query -q "SELECT Use_Named_Credential__c, Legacy_Usage_Logged__c FROM Integration_Settings__c" --target-org <org>`
Expected: query succeeds (0 or more rows), proving the field exists.

- [ ] **Step 4: Commit**

```bash
git add "force-app/main/default/objects/Integration_Settings__c/fields/Legacy_Usage_Logged__c.field-meta.xml"
git commit -m "feat: add Legacy_Usage_Logged__c marker field to Integration_Settings__c"
```

---

## Task 4: Log legacy usage once in `Package2Interface` (TDD)

**Files:**
- Modify: `force-app/main/default/classes/Package2Interface.cls` (add `logLegacyUsageOnce()` near `:744`; call it in `applyAuth()` at `:873`)
- Test: `force-app/main/default/classes/PackageInterfaceTest.cls` (add a method)

- [ ] **Step 1: Write the failing test**

Add this method to `force-app/main/default/classes/PackageInterfaceTest.cls` (inside the existing `@isTest private class PackageInterfaceTest { ... }`):

```apex
@isTest
static void logLegacyUsageOnce_logsOnceAndSetsFlag() {
    // Arrange: ensure legacy path (toggle off) and flag not yet set.
    AppAnalyticsLogger.disableForTest = true; // no real analytics call in tests
    Package2Interface.useNamedCredentialOverride = false;
    Integration_Settings__c s = Integration_Settings__c.getOrgDefaults();
    if (s.Id == null) {
        s.SetupOwnerId = UserInfo.getOrganizationId();
    }
    s.Use_Named_Credential__c = false;
    s.Legacy_Usage_Logged__c = false;
    upsert s;

    Test.startTest();
    // First legacy callout path: applyAuth -> logLegacyUsageOnce sets the flag.
    HttpRequest req1 = new HttpRequest();
    Package2Interface.applyAuth(req1);
    Integration_Settings__c afterFirst = Integration_Settings__c.getOrgDefaults();
    System.assertEquals(true, afterFirst.Legacy_Usage_Logged__c,
        'First legacy callout should set Legacy_Usage_Logged__c = true');

    Integer dmlBefore = Limits.getDmlStatements();
    // Second legacy callout: must fast-exit, no further DML upsert.
    HttpRequest req2 = new HttpRequest();
    Package2Interface.applyAuth(req2);
    Integer dmlAfter = Limits.getDmlStatements();
    Test.stopTest();

    System.assertEquals(dmlBefore, dmlAfter,
        'Second legacy callout must not upsert again (logged-once guard)');
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `sf project deploy start --source-dir force-app/main/default/classes/PackageInterfaceTest.cls --target-org <org>`
Then: `sf apex run test -n PackageInterfaceTest -w 10 --result-format human --target-org <org>`
Expected: `logLegacyUsageOnce_logsOnceAndSetsFlag` FAILS — `applyAuth` does not yet set the flag (assertion on `afterFirst.Legacy_Usage_Logged__c` fails), or compile fails because `logLegacyUsageOnce` not referenced yet (the test calls `applyAuth`, so it will be an assertion failure, not compile).

- [ ] **Step 3: Add the helper and wire it into `applyAuth`**

In `force-app/main/default/classes/Package2Interface.cls`, modify `applyAuth` (currently at `:873-877`):

```apex
  global static void applyAuth(HttpRequest req) {
    if (!useNamedCredential()) {
      req.setHeader('Authorization', 'Bearer ' + getSessionId());
      logLegacyUsageOnce();
    }
  }

  /**************************************************************************************
   * @Description  Logs the USING_LEGACY_SESSION_ID App Analytics custom interaction
   * at most ONCE per org. Reads the org-default Integration Settings; if the marker
   * is already set, fast-exits with no DML. Otherwise logs the interaction (org-id
   * correlation token) and persists the marker so it never fires again. Runs before
   * Http().send(), so the upsert is safe (no uncommitted-work error).
   **************************************************************************************/
  @TestVisible
  private static void logLegacyUsageOnce() {
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    if (settings != null && settings.Legacy_Usage_Logged__c == true) {
      return;
    }
    AppAnalyticsLogger.log(
      PackageVisualizerInteractions.USING_LEGACY_SESSION_ID,
      UserInfo.getOrganizationId()
    );
    if (settings == null) {
      settings = new Integration_Settings__c();
    }
    if (settings.Id == null) {
      settings.SetupOwnerId = UserInfo.getOrganizationId();
    }
    settings.Legacy_Usage_Logged__c = true;
    upsert settings;
  }
```

- [ ] **Step 4: Deploy and run the test to verify it passes**

Run: `sf project deploy start --source-dir force-app/main/default/classes/Package2Interface.cls force-app/main/default/classes/PackageInterfaceTest.cls --target-org <org>`
Expected: `Deploy Succeeded`.

Run: `sf apex run test -n PackageInterfaceTest -w 10 --result-format human --target-org <org>`
Expected: all PASS, including `logLegacyUsageOnce_logsOnceAndSetsFlag`.

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/classes/Package2Interface.cls force-app/main/default/classes/PackageInterfaceTest.cls
git commit -m "feat: log USING_LEGACY_SESSION_ID once per org in applyAuth legacy path"
```

---

## Task 5: Log migration completion in `PackageVisualizerCtrl` (TDD)

**Files:**
- Modify: `force-app/main/default/classes/PackageVisualizerCtrl.cls` (`verifyAndEnableNamedCredential`, `:1195-1208`)
- Test: `force-app/main/default/classes/PackageVisualizerCtrlAdditionalTest.cls` (add a method)

- [ ] **Step 1: Write the failing test**

Add to `force-app/main/default/classes/PackageVisualizerCtrlAdditionalTest.cls` (inside the existing test class). This asserts the migration path flips the toggle and completes without throwing (logger guarded off so no real API call):

```apex
@isTest
static void verifyAndEnableNamedCredential_logsMigrationAndEnablesToggle() {
    AppAnalyticsLogger.disableForTest = true; // no real analytics call in tests
    // Mock the test callout so testNamedCredentialCallout() returns 200.
    Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());

    Test.startTest();
    String result = PackageVisualizerCtrl.verifyAndEnableNamedCredential();
    Test.stopTest();

    System.assertEquals('success', result, 'Migration verify should succeed');
    Integration_Settings__c s = Integration_Settings__c.getOrgDefaults();
    System.assertEquals(true, s.Use_Named_Credential__c,
        'Toggle should be enabled after successful verify');
}
```

> If `ToolingAPICalloutMock` does not by default return HTTP 200 with a `records` body for the `SELECT Id FROM ApexClass LIMIT 1` test query, check the existing mock (`force-app/main/default/classes/ToolingAPICalloutMock.cls`) and use whichever constructor/flag the existing `verifyAndEnableNamedCredential` / `testNamedCredentialCallout` tests already use. Reuse the established mock setup pattern from `PackageInterfaceTest` rather than inventing a new one.

- [ ] **Step 2: Run the test to verify it fails (or is red against current behavior)**

Run: `sf project deploy start --source-dir force-app/main/default/classes/PackageVisualizerCtrlAdditionalTest.cls --target-org <org>`
Then: `sf apex run test -n PackageVisualizerCtrlAdditionalTest -w 10 --result-format human --target-org <org>`
Expected: the new test currently PASSES for the toggle assertion (migration already flips the toggle), but the migration-logging line does not yet exist. Treat this as the "characterization" baseline — proceed to add the log call, and the test remains green. (No behavior the test asserts is broken; the log call is additive and must not change the `success`/toggle outcome.)

- [ ] **Step 3: Add the migration log call**

In `force-app/main/default/classes/PackageVisualizerCtrl.cls`, modify `verifyAndEnableNamedCredential` (`:1195-1208`) so the body becomes:

```apex
  @AuraEnabled
  public static String verifyAndEnableNamedCredential() {
    try {
      Package2Interface.testNamedCredentialCallout();
      Package2Interface.setNamedCredentialEnabled(true);
      AppAnalyticsLogger.log(
        PackageVisualizerInteractions.MIGRATED_TO_ECA,
        UserInfo.getOrganizationId()
      );
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

- [ ] **Step 4: Deploy and run the test to verify it passes**

Run: `sf project deploy start --source-dir force-app/main/default/classes/PackageVisualizerCtrl.cls force-app/main/default/classes/PackageVisualizerCtrlAdditionalTest.cls --target-org <org>`
Expected: `Deploy Succeeded`.

Run: `sf apex run test -n PackageVisualizerCtrlAdditionalTest -w 10 --result-format human --target-org <org>`
Expected: `verifyAndEnableNamedCredential_logsMigrationAndEnablesToggle` PASSES (`success`, toggle true, no throw).

- [ ] **Step 5: Commit**

```bash
git add force-app/main/default/classes/PackageVisualizerCtrl.cls force-app/main/default/classes/PackageVisualizerCtrlAdditionalTest.cls
git commit -m "feat: log MIGRATED_TO_ECA custom interaction on successful migration verify"
```

---

## Task 6: Full local verification

**Files:** none (verification only)

- [ ] **Step 1: Run all local tests**

Run: `sf apex run test --test-level RunLocalTests --wait 10 --result-format human --target-org <org>`
Expected: all tests PASS; no regressions in `PackageInterfaceTest`, `PackageVisualizerCtrlAdditionalTest`, `AppAnalyticsLoggerTest`.

- [ ] **Step 2: Manual legacy-usage smoke test**

In the scratch/dev org, with `Use_Named_Credential__c = false`:
Run: `sf data query -q "SELECT Use_Named_Credential__c, Legacy_Usage_Logged__c FROM Integration_Settings__c" --target-org <org>`
Then trigger any package list load through the app (or invoke a method that calls `applyAuth`).
Run the same query again.
Expected: `Legacy_Usage_Logged__c` transitions to `true`. A second load does not change it.

- [ ] **Step 3: Manual migration smoke test**

Run the setup wizard's "Test & Confirm" step (or invoke `verifyAndEnableNamedCredential` via `sf apex run` with a mocked/valid ECA).
Expected: `Use_Named_Credential__c` becomes `true`, no exception surfaces in the UI.

- [ ] **Step 4: (Optional) FINE-log confirmation**

Set Apex log level to `FINE`, repeat a legacy callout, and inspect the debug log for the `APP_ANALYTICS_WARN` marker only if the API genuinely failed — in a real subscriber org the call succeeds silently and no warning appears. (Package Usage Logs are not available in Developer Edition; full end-to-end log verification requires a packaged version installed in a real subscriber org — out of scope for local verification.)

- [ ] **Step 5: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "test: verify App Analytics ECA migration tracking end-to-end (local)"
```

---

## Post-implementation (not tasks — informational)

- Cut a new package version (`sf-2gp-bump-package-version` skill) so subscribers receive the instrumentation. Custom Interaction data only appears in App Analytics **after** subscribers upgrade and use the package.
- Read side: query App Analytics Package Usage Logs — `log_record_type = CustomInteraction`, `custom_entity_type = CustomInteractionLabel`, group by `custom_entity` (`MIGRATED_TO_ECA` vs `USING_LEGACY_SESSION_ID`) joined to `subscriber_org_id` to build the migrated/not-migrated report.
- Revert `Integration_Settings__c` visibility to `Protected` before `sf package version create` if it was flipped to `Public` for direct-org testing.
