# Implementation Notes — MCP Server Offering

One lesson per entry. Update in place; delete what turns out wrong.

## MCP servers = ExternalServiceRegistration WHERE RegistrationProviderType='ModelContextProtocol'

The `Schema` field holds a JSON doc (`serverDescriptor.serverInfo`, `tools[]` with
`inputSchema`/`outputSchema`, `resources[]`) and `operations[]` lists active tool ops.
Sample: `force-app/main/default/externalServiceRegistrations/DeepWikiAgentExchange…`.

## MCP tools = GenAiFunction records, minted per-org POST-install

`invocationTargetType=mcpTool`, `invocationTarget=<org-minted 1XO id>`,
`MasterLabel="<tool> - <Server>"`. Created when the subscriber configures the server, so
their IDs can't be packaged — discover live. We do NOT query/package them.

## Packageability (Salesforce metadata coverage report, v66)

`ExternalServiceRegistration` → `managedPackaging:true`, `toolingApi:true` (packageable
AND live-queryable). `GenAiFunction` → `managedPackaging:true`, `toolingApi:false`.
Query the coverage JSON: `https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report?version=66`
then read `types.<Name>.channels` (NOT `channels.managedPackaging2gp` — that key doesn't exist).

## Reuse the existing Tooling plumbing — do not rebuild

`Package2Interface.submitQuery(soql)` (Package2Interface.cls:660) GETs
`/services/data/v61.0/tooling/query?q=…`, auth via `applyAuth()`. Deserialize with
`(Wrapper)JSON.deserialize(JSON.serialize(record), Wrapper.class)` in a loop. For the
`Schema` JSON-in-a-string field, map scalars from the untyped record map and parse
`Schema` separately — deserializing the whole record into the wrapper fails.

## mcpTool AgentScript generation rules — RESOLVED (proven via `sf agent validate`)

The v1 best-guess was wrong. Real platform rules (from user's pasted output + live
`GenAiFunctionDefinition` query, validated COMPLETED/0-errors):

- action key AND `source:` = GenAiFunction **DeveloperName** (UUID), NOT the tool name.
- `label:` = GenAiFunction **MasterLabel** verbatim (`ask_question - DeepWikiAgentExchange`).
- `target:` = `mcpTool://` + `('mcptool__' + toolName).replace('_','x5f')`. The ESR
  `Schema` JSON does NOT contain `operations[]` (only serverDescriptor/tools/resources),
  so the operation name is DERIVED, not read. e.g. ask_question → `mcptoolx5fx5faskx5fquestion`.
- `description: |` block; `include_in_progress_indicator: False`; inputs `is_user_input: False`;
  outputs `is_displayable: False`; NO `complex_data_type_name`.
- Generation needs a SECOND Tooling query: `SELECT DeveloperName, MasterLabel, Description,
InvocationTargetType FROM GenAiFunctionDefinition WHERE InvocationTargetType='mcpTool'`
  (it IS Tooling-queryable despite coverage `toolingApi:false`). Correlate to server by
  the MasterLabel suffix after the last `" - "`.
- **BLOCK-SCALAR BUG (fixed + regression-tested):** a `description: |` block terminates at
  the first line indented less than its content indent. Raw tool docstrings carry `Args:`
  at column 0 — emitting them verbatim breaks the parse. `descriptionBodyLines()` now
  prefixes the 16-space block indent to EVERY non-blank line. Locked by the
  "re-indents EVERY description content line" Jest test.

## DeepWiki ESR Named Credential — RESOLVED (public, no-auth)

Retrieved the real NC+EC from the org: endpoint `https://mcp.deepwiki.com/mcp`,
`authenticationProtocol: Custom` / `NoAuthentication`. Both are in the repo
(`namedCredentials/`, `externalCredentials/`), `managedPackaging:true`, work on install
with no subscriber auth step.

## fetching-salesforce-docs runtime

Invoke the extractor with the isolated venv python directly:
`$HOME/.claude/.fetching-salesforce-docs-runtime/venv/bin/python <skill>/scripts/extract_salesforce_doc.py --url "<url>" --pretty`.
The Agentforce guide base is `developer.salesforce.com/docs/ai/agentforce/guide/`; Agent
Script reference slugs are `ascript-ref-tools`, `ascript-lang`, `ascript-blocks`,
`ascript-reference`. The text extractor strips code blocks — use a Playwright
`eval_on_selector_all("pre, code", ...)` pass to read code samples.
