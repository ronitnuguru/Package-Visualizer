# Secure Tooling API Access via OAuth Client Credentials — Design

**Date:** 2026-06-10
**Status:** Approved for planning
**Package:** Package Visualizer (2GP managed, namespace `pkgviz`)

## Problem

Package Visualizer runs inside a subscriber's DevHub org and must call **that same
org's** Tooling API (`Package2`, `Package2Version`, `PackageSubscriber`) and the
REST API (`PackagePushRequest`). These Tooling objects are unreachable via plain
Apex SOQL, so an authenticated **self-callout** is unavoidable.

Two authentication paths exist today:

1. **Legacy (insecure):** `SessionCreator.page` renders `{!$Api.Session_ID}`; Apex
   scrapes it and sends `Authorization: Bearer <sid>`. This is an AppExchange
   security-review red flag (a VF page whose only purpose is to surface a session
   id), uses a full-power unscoped token, and silently fails in async/scheduled/
   batch Apex — exactly where push-upgrade orchestration runs.
2. **Modern (intended secure path):** packaged Named Credential + External
   Credential using OAuth **Client Credentials**, configured at runtime by
   `ToolingCredentialService`. This is the path we are hardening. It currently does
   not work reliably.

A toggle (`Integration_Settings__c.Use_Named_Credential__c`) routes between them.

## Goal

Make the OAuth Client Credentials path work correctly and securely in subscriber
orgs at scale, and make the subscriber-admin setup as close to zero-touch as
possible around the single unavoidable manual step (pasting the OAuth consumer
key/secret).

**Both auth paths remain in the package.** The legacy VF session path is retained
as a default-off fallback until the Client Credentials path is confirmed working in
real subscriber orgs. Removing the legacy path is explicitly **out of scope** for
this change and will be a later version once the new pattern is proven.

## Root-Cause Diagnosis

Grounded in the current code (to be confirmed with a live token-callout trace
before implementation):

### Defect A — External Credential token URL never set (primary suspect)

For the Client Credentials flow, the External Credential's `AuthProviderUrl`
parameter **is the OAuth token endpoint**. The packaged metadata ships it as a
placeholder:

```
externalCredentials/Package_Visualizer_External_Credential.externalCredential-meta.xml
  <parameterName>AuthProviderUrl</parameterName>
  <parameterValue>https://loopback.placeholder.com</parameterValue>
```

`ToolingCredentialService.configureCalloutUrl()` updates only the **Named
Credential's** `calloutUrl` (the API data host). Nothing updates the External
Credential's `AuthProviderUrl`. At runtime the platform therefore attempts the
token exchange against `https://loopback.placeholder.com` instead of the
subscriber's own `https://<mydomain>.my.salesforce.com/services/oauth2/token`, so
token acquisition fails and every callout is unauthorized.

### Defect B — Failures swallowed, presented as empty data

`Package2Interface.submitQuery()` returns parsed records only on HTTP 200. On 401
it reads the body and discards it; on any other status it returns an empty list. An
auth failure renders in the UI as "no packages found" rather than an error, which
is why the failure mode was ambiguous and hard to diagnose.

## Architecture

The runtime auth dispatch (`applyAuth()`, `getApiHost()`, the `Use_Named_Credential__c`
toggle) is **unchanged** — both paths stay wired. The fix is localized:

1. **Set both URLs at setup time** to the subscriber's My Domain:
   - Named Credential `calloutUrl` → `https://<mydomain>.my.salesforce.com`
     (already implemented).
   - External Credential `AuthProviderUrl` → `https://<mydomain>.my.salesforce.com/services/oauth2/token`
     (**new — this is Defect A's fix**).
2. **Surface callout failures** as typed errors carrying HTTP status + endpoint
   context, instead of silently returning empty (Defect B's fix).
3. **Tighten the setup wizard** to a guided, mostly-automated flow with actionable
   per-step status.

Run-as identity: the subscriber admin designates **any existing user** with Tooling/
API access and the package permission set as the ECA's run-as user. No licensing
assumption; the wizard validates the choice at test time.

## Components & Changes

### Apex

- **`ToolingCredentialService`**

  - Extend the runtime configuration so it also sets the External Credential's
    `AuthProviderUrl` to `<myDomain>/services/oauth2/token`. Implement via
    `ConnectApi.NamedCredentials.updateExternalCredential` (or extend
    `configureCalloutUrl` into a combined `configureUrls()` that sets both the NC
    callout URL and the EC token URL). Preserve the `AuthProtocolVariant`
    (`ClientCredentialsClientSecret`), the `NamedPrincipal` parameter, and any
    platform-managed parameters using the same "re-supply only what would be
    dropped" technique already used for `AllowedManagedPackageNamespaces` on the
    Named Credential.
  - `getStatus()` reports whether the token URL is configured (so the wizard can
    show it as a discrete checklist item).

- **`Package2Interface`**

  - `submitQuery()` (and `testNamedCredentialCallout()`): on non-200, throw a typed
    exception including HTTP status, endpoint, and response body — only on the
    **Named Credential path**. The legacy path's behavior is left unchanged to
    avoid altering the fallback.
  - No changes to `applyAuth()`, `getApiHost()`, `getSessionId()`,
    `SessionCreator.page`, or the toggle — the fallback stays intact.

- **`PushUpgradesInterface`** — no mechanism change; inherits the corrected token
  URL through the shared auth path.

### LWC — `setupAssistant`

Tighten the Tooling API Configuration tab to a guided flow:

1. **Auto-discover My Domain** and set **both** URLs (NC callout + EC token) in one
   action — no typing.
2. **Guided ECA creation** — inline, copy-pasteable instructions and deep links to
   create the External Client App with the Client Credentials flow enabled and a
   run-as user selected. (The package cannot create the ECA on the admin's behalf.)
3. **One paste** — consumer key + secret → `populateClientCredentials`
   (platform-encrypted, never packaged).
4. **Auto-grant** principal access (existing `SetupEntityAccess` logic).
5. **One-click Test & Enable** — runs a real Tooling callout via
   `testNamedCredentialCallout()`. On success, flips `Use_Named_Credential__c = true`.
   On failure, shows a specific cause (token URL, principal, or run-as perms) —
   never a generic "no data".

Follow existing LWC conventions: SLDS base components only, imperative
async/await IIFE calls, `.catch → ShowToastEvent` error surfacing, computed getters
for UI state.

### Metadata

- No deletions. `SessionCreator.page`, `Integration_Settings__c`, and the toggle all
  remain.
- The External Credential metadata keeps its placeholder `AuthProviderUrl` (set at
  runtime per subscriber).

## Error Handling

- Typed Apex exception (`AuraHandledException` for LWC-facing calls) carrying HTTP
  status + endpoint, surfaced as a toast via the existing `.catch → ShowToastEvent`
  pattern, reusing the `error` / `warning` / `success` variants.
- Setup-step failures map to specific remediation messages (token URL not set,
  principal not granted, run-as user lacks Tooling access, ECA misconfigured).

## Testing

- **Apex unit tests** (`/generating-apex-test`): mock the token exchange and the
  Tooling callout; cover 200 / 401 / 403 / 5xx; assert the EC `AuthProviderUrl` is
  set to `<myDomain>/services/oauth2/token`; assert non-200 on the NC path raises a
  typed error; assert the legacy fallback path is unchanged.
- **Live verification**: in a scratch/subscriber org, run the wizard end-to-end and
  trace the token callout to confirm Defect A is resolved; run
  `testNamedCredentialCallout()` and confirm HTTP 200 with real records.
- **Regression**: confirm the legacy session path still functions when the toggle is
  off.

## Out of Scope

- Removing the legacy VF session path (later version, after confirmation).
- Authorization Code, JWT, or any second auth model.
- New custom objects or schema.
- Push-upgrade business-logic changes.

## Open Questions / To Confirm Before Build

- Confirm Defect A with a live token-callout trace (systematic-debugging discipline)
  before writing the fix.
- Confirm the exact ConnectApi surface for updating an External Credential's
  `AuthProviderUrl` on a managed-package-owned credential (parameter-preservation
  behavior mirrors the Named Credential case but must be verified against the live
  ConnectApi response).
