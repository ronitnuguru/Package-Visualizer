# Runtime-Created Subscriber-Owned Credentials — Design

**Date:** 2026-06-10
**Status:** Approved for planning
**Package:** Package Visualizer (2GP managed, namespace `pkgviz`)
**Supersedes the credential-configuration approach in:** `2026-06-10-secure-tooling-api-client-credentials-design.md`

## Problem

The previous design shipped a packaged Named Credential + External Credential with a
placeholder URL (`https://loopback.placeholder.com`) and rewrote that URL to the
subscriber's My Domain at runtime via `ConnectApi.NamedCredentials.updateNamedCredential`.

**This is impossible in a managed-installed org** and was the cause of every reported
failure ("Failed to load packages / unrecognized_name", "named credential null",
"CANNOT_MODIFY_MANAGED_OBJECT"). Proven empirically against `PkgViz` via the managed
(`pkgviz__`) classes:

```
Cannot modify managed object: entity=NamedCredentialParameter,
component=0pvRh0000000DTV, field=ParameterValue, state=installed:
newValue='https://...my.salesforce.com', oldValue='https://loopback.placeholder.com'
```

A packaged credential's URL parameter is a **managed component** (`state=installed`).
The platform forbids Apex from modifying it. The cryptic `named credential "null"`
message is the platform's wrapper around this same restriction. The entire
"ship-placeholder-then-rewrite" premise cannot work in a subscriber org; it only
appeared to work because earlier verification ran against the **unmanaged source**
copy of the classes, not the managed copy the wizard actually executes.

## Key Discovery (the basis for this design)

The managed-component lock blocks **modify**, not **create**. Verified live against
`PkgViz` using the managed namespace context:

- `ConnectApi.NamedCredentials.createExternalCredential(...)` → **OK**
- `ConnectApi.NamedCredentials.createNamedCredential(...)` → **OK** (URL set directly
  to the real My Domain)
- `updateNamedCredential(...)` on that **newly created** credential to add the
  `AllowedManagedPackageNamespaces = pkgviz` allow-list → **OK**

A credential the package _creates_ at runtime is **subscriber-owned and unmanaged**,
so its URL and parameters are freely settable. This sidesteps the managed lock
entirely.

## Goal

Make the OAuth Client Credentials Tooling-API self-callout work in real
managed-installed subscriber orgs by **creating** a fresh subscriber-owned Named
Credential + External Credential at setup time (pointed at the running org's My
Domain), instead of trying to modify the packaged, locked credential.

## Architecture

### Credential strategy: create, don't modify

The setup wizard's "Test & Enable" step creates two subscriber-owned, unmanaged
credentials with fixed developer names:

- Named Credential: `pkgviz_Tooling_Named_Credential`
- External Credential: `pkgviz_Tooling_External_Credential`

(Underscore-style names with the `pkgviz_` prefix — NOT the `pkgviz__` managed
namespace prefix. These are subscriber-owned, so they carry no managed namespace.)

Properties set at creation:

- NC `calloutUrl` = `URL.getOrgDomainUrl().toExternalForm()` (the real My Domain).
- NC `generateAuthorizationHeader = true`, linked to the new EC.
- NC `AllowedManagedPackageNamespaces = pkgviz` so `pkgviz` Apex may call through it.
- EC `authenticationProtocol = Oauth`,
  `authenticationProtocolVariant = ClientCredentialsClientSecret`.
- EC `AuthProviderUrl` = `<myDomain>/services/oauth2/token`.
- EC named principal `PackageVisualizerPrincipal` (re-supplied; client id/secret
  populated via `createCredential`/`updateCredential` from the admin's input).

Creation is **idempotent**: if a credential with the fixed name already exists,
reconfigure/reuse it rather than failing or duplicating.

### Routing change

`Package2Interface.getApiHost()` returns `callout:pkgviz_Tooling_Named_Credential`
(the fixed subscriber-owned name) when the Named Credential path is enabled —
instead of the packaged `callout:pkgviz__Package_Visualizer_Named_Credential`. The
name is a constant; no namespace qualification is applied (subscriber-owned
credentials are unmanaged).

### Transaction boundary (hard constraint)

ConnectApi credential writes and an HTTP callout **cannot share a transaction**
(`You have uncommitted work pending` — verified). Therefore:

- **Creation/configuration** happens only in the wizard's "Test & Enable" step
  (its own `@AuraEnabled`, user-initiated transaction).
- The **on-load existence check** (the `ensureToolingUrlsConfigured` hook already
  wired into `packageSplitView.js`) only _verifies_ the credential exists and is
  usable; if missing/unconfigured it surfaces a clear "run Setup" message. It does
  NOT create (creation in the load path would either need its own pre-callout
  transaction or risk the uncommitted-work error). Creation stays in the wizard.

### Principal access

No `SetupEntityAccess` grant is required. Verified: the Tooling callout authorizes
through the Named Credential's `AllowedManagedPackageNamespaces = pkgviz` allow-list
(38 packages returned with zero external-credential principal grants in the org).
The old `grantPrincipalAccess()` runtime DML (which hit `CANNOT_MODIFY_MANAGED_OBJECT`
on the managed perm set) is dropped from the new path.

**Open item to verify during implementation:** the allow-list authorizes the
`pkgviz` _namespace_. Confirm a **non-admin** subscriber user (with only the package
permission set) can complete the callout. If a low-privilege user cannot, add a
grant against a _subscriber-owned_ (unmanaged) permission set — which, unlike the
managed packaged perm set, accepts `SetupEntityAccess` DML. This is the one
end-to-end path not yet empirically closed.

## Components & Changes

### Apex — `ToolingCredentialService`

- New `provisionCredentials()`: creates (or reconfigures, idempotently) the
  subscriber-owned NC + EC with the properties above, using `createNamedCredential`
  / `createExternalCredential`, falling back to `updateNamedCredential` /
  `updateExternalCredential` when they already exist. Sets the allow-list. Returns
  status.
- `populateClientCredentials(...)`: unchanged in mechanism, but targets the new EC
  (`pkgviz_Tooling_External_Credential`).
- `getStatus()`: reports on the new subscriber-owned credential (exists? URL? EC
  status?) rather than the packaged one.
- New constants for the fixed subscriber-owned dev names; keep the existing
  packaged-credential constants only for the (future) cleanup/removal path.
- `ensureUrlsConfigured()` (self-heal hook): repurpose to verify the
  subscriber-owned credential exists and is non-placeholder; create-if-missing is
  NOT done here (transaction boundary) — it returns false so the UI can prompt
  "run Setup".
- Remove the `grantPrincipalAccess()` call from the new path (keep the method only
  if still referenced by the legacy path; otherwise remove).

### Apex — `Package2Interface`

- `getApiHost()` / `getQualifiedNamedCredentialName()`: route to the fixed
  subscriber-owned NC name `pkgviz_Tooling_Named_Credential` (no namespace prefix)
  on the Named Credential path. Legacy session path unchanged.

### Apex — `PackageVisualizerCtrl`

- `configureNamedCredentialUrl()` → replace with a call to `provisionCredentials()`
  (create instead of modify). Keep the `@AuraEnabled` surface the wizard calls.
- `ensureToolingUrlsConfigured()`: returns whether the subscriber-owned credential
  is present + usable (no creation).

### Metadata

- Packaged `Package_Visualizer_Named_Credential` / `Package_Visualizer_External_Credential`:
  **stop using**, mark for removal in a future package version (leave installed but
  unused for now — harmless). Do not delete in this change.
- `SessionCreator.page` + legacy toggle: unchanged (legacy fallback retained).

### LWC — `setupAssistant`

- Wording/status reflects "create credentials" rather than "configure URL".
- Token-URL / NC-URL status getters read the new subscriber-owned credential.

## Error Handling

- `provisionCredentials()` wraps ConnectApi failures in `CredentialServiceException`
  with actionable text (which step failed: NC create, EC create, allow-list,
  credential populate).
- The on-load check surfaces a specific "Tooling API not set up — open Setup
  Assistant" message instead of the raw TLS/`null` errors.

## Testing

- Apex: unit-test the testable seams (name resolution, status DTO, the
  create-vs-update idempotency branch selection). ConnectApi credential mutations
  are not unit-mockable — verify those live.
- Live verification against a **managed-installed** org (the bug only reproduces in
  the managed context — the unmanaged source copy gives false passes):
  1. Run the wizard's create step → confirm `pkgviz_Tooling_Named_Credential` +
     `pkgviz_Tooling_External_Credential` exist with the real My Domain URL and the
     `pkgviz` allow-list.
  2. Populate client id/secret → confirm EC status `Configured`.
  3. Run a Tooling callout via the managed `pkgviz.Package2Interface` → confirm
     records returned (not the placeholder TLS error).
  4. Confirm the page loads packages end-to-end.
  5. **Non-admin user check** (the open item): confirm a user with only the package
     perm set can complete the callout; add an unmanaged-perm-set grant if not.

## Out of Scope

- Deleting the packaged NC/EC (future package version).
- The legacy VF-session path (retained as default-off fallback).
- The Bug A "self-heal by modifying the packaged credential" approach (abandoned —
  it cannot work; replaced by create-at-setup + verify-on-load).

## Risks / Open Items

- **Non-admin callout authorization** — the one path not yet empirically closed (see
  Principal access). Must verify in a managed org with a low-privilege user.
- **Naming collision** — fixed dev names could in theory collide with a
  subscriber's existing credential; mitigated by the `pkgviz_` prefix and idempotent
  reuse. Acceptable risk.
- **Verification context** — ALL live verification must use the managed (`pkgviz__`)
  classes / a real install. Testing against the unmanaged source copy produces false
  passes (this is exactly how the original bug escaped detection).
