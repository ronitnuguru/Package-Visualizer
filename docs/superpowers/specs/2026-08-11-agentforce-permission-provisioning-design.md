# Agentforce Permission Provisioning

## Goal

When the Agentforce extension status cannot be loaded because the current user
lacks Package Visualizer Apex access, replace the generic verification failure
with clear permission guidance and a **Provision Permission Sets** action.

## Scope

The change applies to the Agentforce extension card shown in the Setup
Assistant's AgentExchange Showcase. It does not change extension installation,
upgrade, or general Tooling API failure behavior.

## Design

The client-side status load will classify an Apex access-denied response as a
new `PERMISSION_REQUIRED` state. The state supplies a user-facing message that
Package Visualizer Permission is required to verify the extension status. Other
errors remain `UNAVAILABLE` and continue to show the existing retry-later
message.

The extension card will render a brand **Provision Permission Sets** button for
`PERMISSION_REQUIRED`. Its click handler will reuse the established
permission-set navigation flow: synchronously open a blank tab, resolve the
managed `pkgviz__Package_VisualizerPS` record Id through
`PackageVisualizerCtrl.getNamespacePermSetId`, and navigate the tab to that
permission set's Manage Assignments page. If resolution fails, the handler will
send the tab to the Permission Sets list, matching the existing fallback.

## Error Classification

The implementation will use the Aura/LWC error payload to identify only Apex
class-access failures (for example, an insufficient-access error naming the
status controller). It will not infer a missing permission set from arbitrary
callout, registry, or network errors. That keeps an administrator from being
sent to permission assignments when the underlying issue is temporary Tooling
availability.

## Tests

Add Jest coverage that verifies:

- the access-denied rejection produces `PERMISSION_REQUIRED` and the new button;
- clicking the button resolves `Package_VisualizerPS` in the `pkgviz` namespace
  and opens its Manage Assignments URL; and
- a non-permission rejection remains `UNAVAILABLE` and has no provisioning
  action.

Existing installed, update, and unavailable-state tests remain unchanged except
where the new state affects shared status fixtures.
