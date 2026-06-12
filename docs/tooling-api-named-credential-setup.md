# Tooling API Authentication Setup (Subscriber Guide)

Package Visualizer calls your org's Tooling and REST APIs to read Package2,
Package2Version, PackageSubscriber, and PushUpgrade data. Historically it
authenticated with the running user's session. As of this release it can use a
managed **Named Credential** backed by an **External Credential** with the
**OAuth 2.0 Client Credentials** flow — the Salesforce-recommended pattern for
packaged integrations.

This is **opt-in**. Both new and existing installs keep working with the
session-based method until an admin completes the steps below in the Setup
wizard. Nothing is configured automatically at install — the wizard sets the
callout endpoint, the client credentials, and the permission grant, then enables
the Named Credential only after a verified test callout.

## What ships in the package

- **Named Credential** `Package_Visualizer_Named_Credential` (developer-controlled)
- **External Credential** `Package_Visualizer_External_Credential` (OAuth, Client Credentials with Client Secret)
- No new permission set — the credential's principal-access grant is applied at
  runtime onto the **existing** core `Package Visualizer Permission` permission set
  (`Package_VisualizerPS`) that your users already have. The grant is **not** in
  any permission set metadata (see maintainer notes).
- A **Package Visualizer Setup** page (the migration tool that walks through the rest)

OAuth client id/secret are **never** packaged. You supply them post-install.

## One-time setup

1. **Create an External Client App** (Setup → External Client App Manager → New).

   - Enable OAuth, add the **Client Credentials** flow.
   - Assign the **`api`** scope **on the app**. (Salesforce does not accept a
     `scope` parameter on the Client Credentials token request — scopes are
     governed by the app's configured scopes. The External Credential must
     therefore have **no** `Scope` parameter.)
   - Designate a **run-as user** that has Tooling API access (a dedicated
     integration user or an admin). All packaged Tooling API callouts run as
     this user.
   - After saving, copy the **Consumer Key** (Client ID) and **Consumer Secret**
     (Client Secret).

2. **Set the External Credential's token URL to your My Domain.** In Setup →
   Named Credentials → **Package Visualizer External Credential**, ensure the
   identity/token URL is `https://<your-my-domain>.my.salesforce.com/services/oauth2/token`.
   `login.salesforce.com` and `test.salesforce.com` are **not** supported for the
   Client Credentials flow. This value is per-org and can't be set
   programmatically, so it's the one credential field you set by hand.

3. **(No extra permission set to assign.)** Principal access is granted onto the
   core **Package Visualizer Permission** set your users already have, by the
   Setup wizard in the next step. Just make sure the admin running the wizard has
   that permission set.

4. **Open the Package Visualizer Setup page** (App Launcher → ISV Tools Setup)
   and run the wizard:
   - **Step 1 — Set the callout endpoint.** One click; points the Named
     Credential at your My Domain automatically.
   - **Step 2** — confirm your External Client App and token URL from above.
   - **Step 3 — Save the client credentials.** Paste the Client ID and Client
     Secret. They are stored encrypted; the secret is never displayed again.
   - **Step 4 — Test & Enable.** Runs a live Tooling API callout through the
     Named Credential. On success, Package Visualizer switches over org-wide.

If the test fails, Package Visualizer stays on the session method and the error
is shown — fix the External Client App / run-as user permissions and retry.

## Upgrades

Upgrading the package does **not** overwrite your saved client credentials — the
encrypted token is retained and callouts keep working.

**Existing customers (upgrades, not fresh installs).** Upgrading to the version
that introduces this feature simply adds the credential metadata (Named
Credential + External Credential). Nothing is configured or enabled
automatically — the migration is **opt-in** and your `Use_Named_Credential__c`
toggle stays `false`, so nothing changes until an admin runs the Setup wizard.
You don't need the principal-access grant until you choose to migrate; the wizard
applies it for you at that point (see the maintainer note below). Until then,
Package Visualizer keeps using the session-based method exactly as before.

## Reverting

If you need to fall back to the session-based method, an admin can clear the
**Use Named Credential** flag on the **Integration Settings** custom setting
(org defaults).

## Notes for ISV maintainers

- **⚠️ Custom setting visibility before packaging.** `Integration_Settings__c`
  must ship as **Protected** so subscribers can't flip `Use_Named_Credential__c`
  and bypass the migration verification step. However, Protected custom settings
  **cannot be deployed directly to a production/DevHub org** — only to
  developer/sandbox/scratch orgs. The committed source therefore keeps it
  **Public** for day-to-day DevHub deploys. **Set `<visibility>` back to
  `Protected` before running `sf package version create`** (and revert to Public
  afterward if you redeploy to the DevHub directly).
- The exact Client Credentials External Credential metadata shape was validated
  against a live org. The key parameters: `Oauth`/`AuthProtocolVariant`/
  `ClientCredentialsClientSecret`, an `AuthProviderUrl` pointing at the token
  endpoint, and a `NamedPrincipal`. See
  `force-app/main/default/externalCredentials/`.
- `ConnectApi.NamedCredentials.createCredential` populates the principal with
  `clientId` (encrypted=false) and `clientSecret` (encrypted=true). See
  `ToolingCredentialService.populateClientCredentials`.
- **External Credential principal access is granted at runtime, not in package
  metadata.** Shipping the grant declaratively as a permission set
  `<externalCredentialPrincipalAccesses>` block fails `sf package version create`
  with **`(2) Package_Visualizer_Integration: invalid cross reference id`** — the
  external credential principal isn't resolvable in the namespaced packaging build
  context. This is a known 2GP limitation, not a metadata-syntax problem, so
  namespace-qualifying the reference does **not** reliably fix it.

  Instead, there is **no dedicated integration permission set** at all. The grant
  is applied at runtime by `ToolingCredentialService.grantPrincipalAccess()` onto
  the existing core permission set **`Package_VisualizerPS`** — every app user
  already has it, and the whole app runs on Tooling API callouts, so it's the
  natural home and saves admins an extra assignment. That method looks up the
  permission set Id and the principal Id (via
  `ConnectApi.NamedCredentials.getExternalCredential(...).principals`, since the
  principal can't be queried with SOQL) and inserts a `SetupEntityAccess` row
  linking the two. It is **idempotent** (no-op when the grant already exists), so
  it's safe to call repeatedly.

- **The Setup wizard is the only place that configures the credential — there is
  no post-install script.** `grantPrincipalAccess()` is called from
  `PackageVisualizerCtrl.configureNamedCredentialUrl()`, the first (separate,
  committed) Apex transaction of the wizard's **Test & Enable** step. It runs as
  the **real admin**, so the ConnectApi lookup is synchronous and the
  `SetupEntityAccess` DML succeeds; because it commits before
  `verifyAndEnableNamedCredential()` runs the test callout, the grant is in effect
  in time.

  We deliberately do **not** do this in a post-install (`InstallHandler`) script.
  At install time the External Credential is an empty shell (no client id/secret,
  per-org token URL not yet set), so the grant would be premature — callouts
  can't work until the admin finishes the wizard anyway. On top of that, a
  post-install script runs as the package **ghost user**, where callouts are
  async-only, `with sharing` helper classes may be uninvokable (which can block
  install), and `SetupEntityAccess` DML is unreliable. Doing it in the admin-run
  wizard avoids all of that and applies the grant exactly when the credential is
  actually being set up.

  Net effect for maintainers: no integration permission set and no post-install
  script ship at all; there is **no `<externalCredentialPrincipalAccesses>` block
  and no namespace-qualified reference to toggle** before packaging;
  `sf package version create` no longer trips over the principal cross-reference;
  and every customer (new or upgrading) gets the grant onto `Package_VisualizerPS`
  the moment they complete the Setup wizard.
