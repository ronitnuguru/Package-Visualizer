# [CLAUDE.md](http://CLAUDE.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Global behavioral guidelines live in `~/.claude/CLAUDE.md`.

## Project Overview

Package Visualizer is a **managed 2GP Salesforce package** (`pkgviz` namespace) that provides DevHub management tooling for ISVs. It surfaces Package2, Package2Version, PackageSubscriber, and PushUpgrade data via the Tooling API and REST API.

## Commands

```bash
# Lint LWC components
npm run lint

# Format code
npm run prettier
npm run prettier:verify       # check without writing

# Create a package version (from DevHub-connected CLI)
sf package version create --package "Package Visualizer" --wait 20 --installation-key-bypass --code-coverage --definition-file config/project-scratch-def.json --target-dev-hub "PkgViz"

# Promote a package version to Released
sf package version promote --package "<Package Version Alias>" --target-dev-hub "PkgViz"

# Deploy to scratch org
sf project deploy start

# Run Apex tests in org
sf apex run test --test-level RunLocalTests --wait 10
sf apex run test -n PackageInterfaceTest -w 10   # single test class
```

## Architecture

### Apex Layer (3-tier pattern)

1. **Controller** — `PackageVisualizerCtrl` is the single `@AuraEnabled` surface for all LWC components. Methods use `continuation=true` for long-running callouts. `PushUpgradesCtrl` handles push upgrade orchestration separately.
2. **Interface** — `Package2Interface` and `PushUpgradesInterface` encapsulate all HTTP callouts. They use `submitQuery()` to hit the Tooling API and raw `HttpRequest` for REST endpoints.
3. **Wrappers** — `ObjectWrappers` contains 15+ inner classes for JSON serialization/deserialization of Tooling API responses.

### Package Versioning Workflow

Version numbers follow the format `major.minor.patch-build`. **Never bump the patch segment** — only major or minor are incremented manually. The build number and the `04t` package version ID are managed automatically by Salesforce CLI after `sf package version create` runs.

Version bumps are handled by the `sf-2gp-bump-package-version` skill.

## Skills

- **Apex development:** Use the `/generating-apex` skill when writing or modifying Apex classes.
- **Apex tests:** Use the `/generating-apex-test` skill when writing Apex test classes.

## LWC Conventions

- **SLDS base components only:** Always use Lightning base components (`lightning-button`, `lightning-datatable`, `lightning-card`, etc.). Never write custom CSS or override SLDS styles. If a layout need can't be met with a base component, use SLDS utility classes only.
- **Reuse before creating:** Check existing components in `force-app/main/default/lwc/` before building a new one. The codebase has shared UI primitives (e.g., `emptyIllustrationWithButton`, `warningModal`, `iconCheckBox`) — prefer extending or composing these.
- **Apex import split:** Components import from `@salesforce/apex/...` for cacheable methods and from `@salesforce/apexContinuation/...` for continuation-decorated methods. Match the import path to the Apex annotation — they are not interchangeable.
- **Imperative async/await IIFE pattern:** Detail and form components invoke Apex inside `(async () => { await someApex(...).then(...).catch(...); })()` blocks rather than using `@wire`. This is the dominant pattern for any call that needs continuation or sequencing.
- **Error handling:** Apex calls are never wrapped in try/catch. Errors are caught with `.catch()` on the promise chain and surfaced as a `ShowToastEvent` with `{title, message, variant}`. Reuse existing variants (`error`, `warning`, `success`) rather than inventing new ones.
- **Computed getters over watchers:** UI state is derived via `get someState()` accessors (visibility flags, variants, formatted strings). Avoid adding `@track` plumbing or watchers when a getter on existing reactive properties suffices.
