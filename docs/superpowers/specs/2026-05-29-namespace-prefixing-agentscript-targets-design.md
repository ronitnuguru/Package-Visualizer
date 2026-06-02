# Namespace-prefixing for AgentScript targets

**Date:** 2026-05-29
**Skill:** `sf-2gp-distributing-agentscripts`
**Status:** Approved

## Problem

When an ISV distributes an Agentforce AgentScript, the action `target:` values must be
namespaced so they resolve inside an installed managed package (or a test org where the
namespaced metadata is already present). Authors currently hand-edit these, which is
error-prone. The skill should prefix them automatically and safely.

`pkgviz` is only the example namespace used while building/testing the skill. The skill is
generic for any ISV — the namespace comes from `sfdx-project.json` or user input.

## Scope

Prefix the namespace before the target value for the three ISV-owned action schemes:

| Scheme                                                     | Prefixed? |
| ---------------------------------------------------------- | --------- |
| `apex://`                                                  | yes       |
| `flow://`                                                  | yes       |
| `generatePromptResponse://`                                | yes       |
| `standardInvocableAction://`, `model://`, any other scheme | never     |

## Detection rule (per target value)

Given `target: "<scheme>://<value>"` for a prefixable `<scheme>`:

- **Bare** — `<value>` contains no `__` separator → rewrite to `<scheme>://<namespace>__<value>`.
  - `apex://AdoptionLookup` → `apex://pkgviz__AdoptionLookup`
- **Already namespaced** — `<value>` contains `__` (e.g. `pkgviz__Foo`, `EmployeeCopilot__Bar`)
  → **do not touch**. Collect it and report it back so the skill can alert the user and ask
  whether it should be replaced.
  - Only rewritten when the user explicitly confirms (`--replace-existing`), which swaps the
    existing `xx__` prefix for `<namespace>__`.
- **Idempotent** — re-running never double-prefixes a value that already has `__`.

The `__NS__` placeholder convention is dropped. We do not assume a placeholder; we add
`<namespace>__` to bare values.

## User interaction flow (new workflow step)

After embedding the `.agent` (or as a standalone "add namespace" run), the skill asks, in order:

1. **Is the referenced metadata in this project?** If yes, check the conventional folders for
   each prefixable target and report presence/absence (missing is not an error — note it may
   live elsewhere or in another package):
   - `apex://<Name>` → `force-app/main/default/classes/<Name>.cls`
   - `flow://<Name>` → `force-app/main/default/flows/<Name>.flow-meta.xml`
   - `generatePromptResponse://<Name>` →
     `force-app/main/default/genAiPromptTemplates/<Name>.genAiPromptTemplate-meta.xml`
2. **Which namespace prefix?** Default: the `namespace` value from `sfdx-project.json`. Or the
   user types a custom prefix.
3. **Where to apply the prefix — AiAuthoringBundle or the LWC?**
   - **AiAuthoringBundle** (`--mode bundle`): rewrite the `.agent` source in place, so it deploys
     to a test org where the namespaced targets are already installed.
   - **LWC** (`--mode lwc`): prefix targets only in the embedded `agentScriptsData.js` body — the
     copy-paste text subscribers receive. The `.agent` source is untouched.
4. **If already-namespaced targets were found**, alert the user and ask whether to replace them.

## Implementation — extend `scripts/embed-agent.js`

New flags (all backward-compatible; omitting `--namespace` preserves current behavior exactly):

```bash
node embed-agent.js \
  --in <path-to-.agent> \
  --out force-app/.../lwc/<NAME>/agentScriptsData.js \
  --namespace <ns> \
  --mode lwc | bundle \
  [--replace-existing]
```

New function `prefixTargets(text, namespace, replaceExisting)`:

- Matches `target:` lines whose value uses a prefixable scheme.
- Bare value → prepend `<namespace>__`.
- Already-namespaced value → leave as-is and add to a `skipped` report array; if
  `replaceExisting`, swap the leading `xx__` for `<namespace>__`.
- Returns `{ text, prefixed: [...], skipped: [...] }`.

Mode behavior:

- `--mode lwc` (default): run `prefixTargets` on the raw text, then escape and embed into
  `agentScriptsData.js`. Source `.agent` untouched. Order preserved: prefix → escape → embed.
- `--mode bundle`: run `prefixTargets` on the raw text and write it back to the `.agent` source
  in place. No embedding. Byte-for-byte preserved except the intentionally-changed target values.

stdout report: count prefixed, list skipped (already-namespaced) values, and output path.

The existing `escapeForTemplateLiteral` and brace-balanced array parsing are unchanged.

## Verification

- `node --check` on `agentScriptsData.js` passes (lwc mode).
- Round-trip: embedded body is byte-equal to the (prefixed) text — i.e. byte-equal to the source
  **except the intentionally-changed target values**.
- Bare-target fixture: both targets gain `<namespace>__`.
- Already-namespaced fixture: nothing prefixed; all reported; `standardInvocableAction://`
  untouched.
- Idempotency: a second run prefixes nothing.
- No `@salesforce/apex` imports leak into the LWC (unchanged guarantee).

## Out of scope

- Deploying the agent into a subscriber org.
- Validating that the referenced Apex/Flow/prompt metadata is correct — only presence is checked.
- Modifying any scheme other than the three listed.
