# Package Visualizer HXL pilot — API 68.0

Work in progress. This directory contains the typed Apex foundation for a Slackbot HXL pilot that lists active second-generation managed and unlocked packages and retrieves package details. It is isolated from the existing base package source for a later Headless extension.

## Current implementation

- `HxlListPackagesAction`: ten packages per page, ordered by name and Package2 ID, with a continuation cursor.
- `HxlGetPackageDetailsAction`: package information resolved by exact `0Ho` Package2 ID, `033` Subscriber Package ID, or package name; ambiguous names return candidates instead of choosing arbitrarily.
- `HxlPackageReadService`: requires Package Visualizer access and the configured named credential, combines repeated list requests, and batches detail requests.
- `HxlPackageToolingGateway`: the sole HXL caller of the strict `Package2Interface.submitQuery` transport; owns bounded Package2 query construction.
- `HxlPackageResultMapper`: converts Tooling records to typed list and detail results.
- Typed list/detail result classes expose data for the Slackbot MCP renderers.
- `HxlPackageReadServiceTest`: HTTP-mocked coverage for pagination, validation, bulk requests, permission/configuration failures, and upstream errors.
- `hxlListPackagesResponse` and `hxlListPackages`: the list action's typed MCP response and result-envelope Lightning Types.
- `hxlGetPackageDetailsResponse` and `hxlGetPackageDetails`: the detail action's typed MCP response and result-envelope Lightning Types.
- `hxlListPackagesWidget`: a bordered, paginated package table with Name, Package Type, Subscriber Package ID, and Created Date columns.
- `playground/hxlListPackages.data.json`: a local fixture containing the 39 active Package2 records currently returned by `PkgViz`, allowing the Playground's ten-row pagination to be exercised across multiple pages.
- `hxlGetPackageDetailsWidget`: a package-detail widget with a return-to-list message action.

### Subscriber Management

- `HxlListSubscribersAction`: ten subscribers per page, filtered by 033 package ID or 04t version ID, ordered by SystemModstamp DESC, with continuation cursor.
- `HxlGetSubscriberDetailsAction`: subscriber organization information by OrgKey with two-column layout (metadata + custom upgrade settings).
- `HxlSubscriberReadService`: validates filters (033/04t), builds PackageSubscriber queries, calculates base64-encoded pagination cursors.
- `HxlSubscriberResultMapper`: converts Tooling PackageSubscriber records to typed list and detail results.
- `HxlPackageToolingGateway.readSubscriberPage` / `readSubscriberDetail`: new entity-specific query methods added alongside the existing Package2/Package2Version methods.
- Typed result classes (`HxlSubscriberListResult`, `HxlSubscriberDetailResult`) expose data for Slackbot MCP renderers.
- `HxlSubscriberReadServiceTest`: HTTP-mocked coverage for pagination, filter validation, orgKey lookup, permission/configuration failures, and upstream errors. **Not yet run against a live org** — see API version note below.
- `hxlListSubscribersResponse` and `hxlListSubscribers`: the list action's typed MCP response and result-envelope Lightning Types.
- `hxlGetSubscriberDetailsResponse` and `hxlGetSubscriberDetails`: the detail action's typed MCP response and result-envelope Lightning Types.
- `hxlListSubscribersWidget`: a bordered, paginated subscriber table with Organization Name (clickable), Package Version ID, Status, Type, Instance, and Last Modified Date columns, sorted newest first.
- `hxlGetSubscriberDetailsWidget`: a subscriber-detail card with icon + org name header, two-column layout (left: org type/status/instance/key/parent org, right: boolean indicators for restriction/custom-upgrade settings with a conditional custom upgrade type), and a return-to-list button.
- "View Subscribers" buttons added to `hxlGetPackageDetails` and `hxlGetPackageVersionDetails` widgets, sending the 033 or 04t ID respectively.
- `playground/hxlListSubscribers.data.json` and `playground/hxlGetSubscriberDetails.data.json`: local fixtures for exercising both widgets in the Playground.

Every new Apex metadata file uses API **68.0**. Existing base components retain their current versions.

## Remaining work

1. Add the pilot's two read-only tools and their UI resources to a dedicated Headless MCP server after its creation, then connect Slackbot; leave `PackageVisualizerMCP` unchanged.
2. Describe the deployed actions and confirm that the tool API names match the generated `hxlListPackages` and `hxlGetPackageDetails` Lightning Type bundles.
3. Compile, run Apex tests, deploy to an API 68.0-capable org, and verify list-to-detail interaction in Slackbot. No Codex, ChatGPT, Claude, or Agentforce surface is configured in this release.

Metadata Experts is available in Codex through the local Salesforce proxy. The required `discoverUiComponents` and `getUiComponentSchemas` calls completed for the tile blocks used by both widgets. See [Codex setup](CODEX-MCP-SETUP.md).

The current `PkgViz` target reported a maximum supported API version of **67.0**. The new Apex tests have **not run**, and no API 68.0 deployment has been completed. Local syntax/format checks are not a substitute for Salesforce compilation and test execution.
