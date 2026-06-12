# App Analytics: ECA Migration Tracking via Custom Interactions

**Date:** 2026-06-12
**Status:** REVISED during implementation — see revision note below
**Package:** `pkgviz` (Package-Visualizer, managed 2GP)

---

## ⚠️ Revision note (2026-06-12, during implementation)

The original two-label design below is **superseded**. The `USING_LEGACY_SESSION_ID`
label was **dropped** because its persistence guard could not work:
`Package2Interface.applyAuth()` (the only legacy session-id chokepoint) is called
immediately before `Http().send()` in the same transaction at every call site, so the
guard's `upsert` (DML-before-callout) throws `You have uncommitted work pending` and
breaks every legacy callout in production. The `Integration_Settings__c.Legacy_Usage_Logged__c`
field was also dropped.

**Final shipped design: `MIGRATED_TO_ECA` only.** Logged once in
`PackageVisualizerCtrl.verifyAndEnableNamedCredential()` after `setNamedCredentialEnabled(true)`,
with `UserInfo.getOrganizationId()` correlation. Report logic: App Analytics natively stamps
`subscriber_org_id` + package version on every record, so **active subscriber orgs without a
`MIGRATED_TO_ECA` record are treated as not-yet-migrated.** No separate legacy label needed.
The `AppAnalyticsLogger` wrapper and the enum (now a single value) are unchanged from below.

---

## Context

The package recently shipped a migration path that moves subscribers off the legacy
Visualforce **session-id** authentication onto the Tooling API **External Client App
(ECA) / OAuth Client Credentials** path. The migration state is a single org-default
flag: `Integration_Settings__c.Use_Named_Credential__c` (`true` = migrated to ECA,
`false` = still on session-id).

Now that the migration capability exists, we need to **measure adoption**: which
subscriber orgs have successfully migrated, and which are still actively running on
session-id. The package has App Analytics support (it already surfaces
`AppAnalyticsEnabled` as a Tooling field) but contains **zero**
`IsvPartners.AppAnalytics.logCustomInteraction()` instrumentation today.

**Intended outcome:** a report that cleanly partitions active subscriber orgs into
"migrated" vs "not migrated" — without log bloat. This is the *first* use of Custom
Interactions in the package; broader feature instrumentation is explicitly deferred to
a later pass.

### Key architectural fact

Custom Interactions only emit useful data when they run **inside the managed package,
in a subscriber org**, and the interaction enum must be **packaged compile-time
metadata** in `pkgviz`. Therefore all instrumentation lives in the **Package-Visualizer
(managed) project** — *not* the unmanaged Agentforce extension project. Data appears in
*our* App Analytics Package Usage Logs only after subscribers upgrade to the instrumented
version.

---

## Design

### Two interaction labels — both fire at most once per state, never in a loop

| Label | When it fires | Frequency |
| --- | --- | --- |
| `MIGRATED_TO_ECA` | The moment the toggle flips `false → true` in `verifyAndEnableNamedCredential()` | Once per org (toggle only flips once) |
| `USING_LEGACY_SESSION_ID` | First time a callout runs while the toggle is still `false` | **Once per org, ever** (persistent guard) |

Both carry `UserInfo.getOrganizationId()` as the correlation identifier (hashed/tokenized
before storage). This keeps total Custom Interaction volume to **at most two records per
org over its entire lifetime**, regardless of how heavily the package is used — directly
satisfying the "no bloat, clean partition" requirement.

#### Why this partitions cleanly

| Org appears in… | Interpretation |
| --- | --- |
| `MIGRATED_TO_ECA` | ✅ Migrated (and when) |
| `USING_LEGACY_SESSION_ID` only | ❌ Active, still on session-id (the outreach list) |
| both (legacy → later migrated) | ✅ Migrated — full conversion story captured |
| neither, but active in native logs | Migrated before instrumentation shipped, or never hit a callout |

We explicitly rejected a per-transaction `ECA_PATH_USED` / `LEGACY_SESSION_ID_USED`
firing: the auth path is deterministic from one flag, so per-callout logging adds no
information and bloats the logs.

### Components

#### 1. New packaged enum — `PackageVisualizerInteractions`

New file `force-app/main/default/classes/PackageVisualizerInteractions.cls`:

```apex
public enum PackageVisualizerInteractions {
    MIGRATED_TO_ECA,
    USING_LEGACY_SESSION_ID
}
```

Compile-time, packaged metadata — required by the Custom Interactions API. Business-level
labels per Salesforce best practice.

#### 2. New logging wrapper — `AppAnalyticsLogger`

New file `force-app/main/default/classes/AppAnalyticsLogger.cls`. Isolates the
`IsvPartners.AppAnalytics` API behind one testable surface and guards against contexts
where the API is unavailable (the API/namespace does not exist in local/scratch orgs and
the call would otherwise cause compile or runtime issues). Pattern:

```apex
public with sharing class AppAnalyticsLogger {
    @TestVisible private static Boolean disableForTest = false;

    public static void log(PackageVisualizerInteractions label, Id correlationId) {
        if (disableForTest) return;
        try {
            IsvPartners.AppAnalytics.logCustomInteraction(label, correlationId);
        } catch (Exception e) {
            // Analytics must never break a callout. Swallow (optionally System.debug
            // with APP_ANALYTICS_* style marker for FINE-level local diagnosis).
        }
    }
}
```

> **Open implementation detail to resolve during build:** whether `IsvPartners.AppAnalytics`
> resolves at compile time in this project. If the type is not available in the local
> build, the call may need to be invoked dynamically or the class compiled only in the
> packaging org. The implementation plan must verify this against a real build before
> committing the static reference. This is the single highest-risk item.

#### 3. New field — `Integration_Settings__c.Legacy_Usage_Logged__c`

Checkbox (Boolean), default `false`, on the existing protected hierarchy custom setting.
Persistent "already logged legacy usage" marker so `USING_LEGACY_SESSION_ID` fires
exactly once per org. Lives on the same record we already read `Use_Named_Credential__c`
from — one query, existing upsert pattern.

### Logging point 1 — migration completion

`PackageVisualizerCtrl.verifyAndEnableNamedCredential()` (`PackageVisualizerCtrl.cls:1195`):

```apex
Package2Interface.testNamedCredentialCallout();
Package2Interface.setNamedCredentialEnabled(true);
AppAnalyticsLogger.log(
    PackageVisualizerInteractions.MIGRATED_TO_ECA,
    UserInfo.getOrganizationId()
);                                  // <-- new line, before `return 'success';`
return 'success';
```

Inherently one-time — no guard needed (the toggle only flips to `true` once).

### Logging point 2 — legacy liveness

`Package2Interface.applyAuth(HttpRequest req)` (`Package2Interface.cls:873`) is the single
chokepoint every legacy callout passes through. In the existing
`if (!useNamedCredential())` branch (line 874), after setting the session-id header:

```apex
public static void applyAuth(HttpRequest req) {
    if (!useNamedCredential()) {
        req.setHeader('Authorization', 'Bearer ' + getSessionId());
        logLegacyUsageOnce();   // <-- new
    }
}
```

New private helper in `Package2Interface`:

```apex
@TestVisible
private static void logLegacyUsageOnce() {
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    if (settings != null && settings.Legacy_Usage_Logged__c == true) {
        return;                              // already logged — fast exit, no DML
    }
    AppAnalyticsLogger.log(
        PackageVisualizerInteractions.USING_LEGACY_SESSION_ID,
        UserInfo.getOrganizationId()
    );
    if (settings == null || settings.Id == null) {
        settings = (settings == null) ? new Integration_Settings__c() : settings;
        settings.SetupOwnerId = UserInfo.getOrganizationId();
    }
    settings.Legacy_Usage_Logged__c = true;
    upsert settings;                          // one-time DML, then never again
}
```

Runs *before* `Http().send()`, so the DML is safe (no uncommitted-work-pending error).
After the first legacy callout sets the flag, every subsequent transaction fast-exits on
the boolean check.

---

## Data flow

```text
Subscriber clicks "Test & Confirm" (setupAssistant)
   → verifyAndEnableNamedCredential()
       → setNamedCredentialEnabled(true)
       → AppAnalyticsLogger.log(MIGRATED_TO_ECA, orgId)   → Package Usage Log

Any Tooling/REST callout while toggle == false
   → applyAuth() legacy branch
       → logLegacyUsageOnce()
           → if not yet logged: log(USING_LEGACY_SESSION_ID, orgId) + set flag
                                                              → Package Usage Log (once)
```

Read side (your DevHub / LMA): query App Analytics Package Usage Logs with
`log_record_type = CustomInteraction`, `custom_entity_type = CustomInteractionLabel`, and
group by `custom_entity` (`MIGRATED_TO_ECA` vs `USING_LEGACY_SESSION_ID`) joined to
`subscriber_org_id` to build the migrated/not-migrated partition.

---

## Error handling

- `AppAnalyticsLogger.log` **never throws** — analytics failures must not break auth or
  callouts. All exceptions swallowed (the API itself silently ignores over-limit calls).
- 50-interactions-per-request limit is a non-issue: max 2 logs per org *ever*, and the two
  labels fire in different transactions.
- The legacy-usage DML is guarded so it executes at most once per org; the read piggybacks
  on `getOrgDefaults()` (no new SOQL hotspot — `applyAuth` already runs in a callout
  context, and the cached settings lookup is cheap).

---

## Testing

- **`AppAnalyticsLoggerTest`** — assert `log()` is a no-op when `disableForTest = true`
  and never throws. (The API can't be meaningfully exercised in a non-subscriber test
  context; verify the guard path.)
- **`PackageInterfaceTest`** (extend existing) — with toggle off, call a method that hits
  `applyAuth`; assert `Legacy_Usage_Logged__c` flips to `true` and a *second* call does not
  re-upsert (use `disableForTest` so no real API call, assert the field state + DML guard
  via `Limits.getDmlStatements()` delta or a flag check).
- **`PackageVisualizerCtrlAdditionalTest`** (extend existing) — mock the test callout,
  call `verifyAndEnableNamedCredential()`, assert `Use_Named_Credential__c == true` and the
  logger was invoked (via `disableForTest` spy or by asserting no exception with logging
  enabled in a guarded path).
- **Local debug verification** — set Apex log level `FINE`, look for `APP_ANALYTICS_FINE` /
  `APP_ANALYTICS_WARN` / `APP_ANALYTICS_ERROR` markers to confirm processing (per Salesforce
  docs; usage logs are not available in Developer Edition).

### End-to-end verification (post-deploy)

1. Deploy to a scratch/dev org; confirm both classes compile and the field deploys.
2. Run `sf apex run test --test-level RunLocalTests`.
3. With toggle `false`, trigger any package list load; confirm `Legacy_Usage_Logged__c`
   becomes `true` and stays `true` after a second load.
4. Run the setup wizard's Test & Confirm; confirm toggle flips and no exception is thrown.
5. Cut a new package version; after a subscriber upgrades and uses the package, verify
   `MIGRATED_TO_ECA` / `USING_LEGACY_SESSION_ID` rows appear in App Analytics Package Usage
   Logs.

---

## Out of scope (deferred)

- Feature-adoption / milestone instrumentation (push upgrades, trials, version promotion,
  setup completion) — a later pass once this pattern is proven.
- Subscriber Snapshots work — informational only; no code change here.
- Any instrumentation in the unmanaged Agentforce extension project.

---

## Files touched

| File | Change |
| --- | --- |
| `classes/PackageVisualizerInteractions.cls` (+ `-meta.xml`) | **New** — packaged enum, 2 values |
| `classes/AppAnalyticsLogger.cls` (+ `-meta.xml`) | **New** — guarded logging wrapper |
| `classes/Package2Interface.cls` | Add `logLegacyUsageOnce()` + one call in `applyAuth` |
| `classes/PackageVisualizerCtrl.cls` | One `AppAnalyticsLogger.log` call in `verifyAndEnableNamedCredential` |
| `objects/Integration_Settings__c/fields/Legacy_Usage_Logged__c.field-meta.xml` | **New** — Checkbox field |
| `classes/AppAnalyticsLoggerTest.cls`, `PackageInterfaceTest.cls`, `PackageVisualizerCtrlAdditionalTest.cls` | New + extended tests |
