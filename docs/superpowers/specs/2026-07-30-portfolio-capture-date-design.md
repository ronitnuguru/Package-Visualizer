# Portfolio Capture Date — AgentScript-Only Design

## Goal

Make the portfolio summary's capture timestamp easy to read without changing
the Apex action contract.

## Decision

Keep the existing `capturedAt` ISO-8601 UTC value in the portfolio JSON. The
`package_portfolio` AgentScript response renders only its calendar-date portion
as `Data captured Month D, YYYY.`

The agent must derive the displayed date from the `YYYY-MM-DD` portion of
`capturedAt`, use English month names, and omit the time, UTC marker, and every
time-zone conversion.

## Scope

- Update the portfolio response instruction in `Package_Visualizer_Agent.agent`.
- Update the Agent Spec to record the date-only presentation rule.
- Remove the un-deployed local Apex and Apex-test experiment for
  `capturedAtDisplay`.

No action inputs, outputs, Apex production behavior, or Apex tests change.

## Verification

1. Validate the AgentScript authoring bundle.
2. Preview the draft with live actions using the PackageSplitView kickoff.
3. Confirm the Data coverage section says `Data captured Month D, YYYY.` and
   does not expose the raw ISO timestamp, time, or a timezone.

## Risk

Date formatting is model-generated rather than code-generated. The instruction
limits it to the explicit `YYYY-MM-DD` UTC date already returned by the action;
the live preview is the acceptance check.
