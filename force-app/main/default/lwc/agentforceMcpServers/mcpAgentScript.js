/**
 * mcpAgentScript
 * ----------------------------------------------------------------------------
 * Pure data-in / string-out helper that renders PLATFORM-FAITHFUL Agent Script
 * for a discovered MCP (Model Context Protocol) server and its tools.
 *
 * The output reproduces the EXACT block the Salesforce platform generates for
 * MCP tool actions: the action key is the tool's `developerName` (a UUID), the
 * `source` is that same UUID, and the `target` is `mcpTool://<operationName>`.
 * Indentation is whitespace-sensitive (4-space steps) and matches the real
 * platform output byte-for-byte, including its trailing-whitespace blank lines
 * and near-empty `description: |` blocks on inputs / outputs.
 *
 * Booleans are capitalized (`True` / `False`). No Apex, no LWC lifecycle, no
 * imports. Self-contained: data in, string out.
 */

// ---------------------------------------------------------------------------
// Indentation constants (spaces). The action block sits under a subagent's
// `actions:` key, which is itself at 4 spaces — so the action key is at 8.
// ---------------------------------------------------------------------------
const I8 = " ".repeat(8); // action key
const I12 = " ".repeat(12); // action-level fields (description/label/source/...)
const I16 = " ".repeat(16); // description first line / "<param>": <type>
const I20 = " ".repeat(20); // input/output field lines
const I30 = " ".repeat(30); // 30-space near-empty description body line
const BLANK16 = " ".repeat(16); // trailing-whitespace blank line (after target / inputs)

/**
 * Build the single Level-1 action block for ONE MCP tool.
 *
 * The returned string starts at the `<developerName>:` key (indented 8 spaces
 * so it sits under a subagent's `actions:` at 4 spaces). Used both for per-tool
 * copy and when assembling the full subagent in {@link buildMcpSubagentBlock}.
 *
 * @param {Object} server server descriptor (see {@link buildMcpSubagentBlock}).
 * @param {Object} tool tool descriptor of shape:
 *   { name, description, developerName, masterLabel, operationName, isWired,
 *     inputs: [{name, type, isRequired}], outputs: [{name, type, isRequired}] }
 * @returns {string} the action block for this tool (no trailing newline).
 */
export function buildToolActionBlock(server, tool) {
  const lines = [];

  // action key = developerName (UUID), NOT the tool name.
  lines.push(`${I8}${tool.developerName}:`);

  // description: | block — first line indented 16, subsequent lines verbatim.
  lines.push(`${I12}description: |`);
  for (const line of descriptionBodyLines(tool.description)) {
    lines.push(line);
  }

  lines.push(`${I12}label: "${esc(tool.masterLabel)}"`);
  lines.push(`${I12}require_user_confirmation: False`);
  lines.push(`${I12}include_in_progress_indicator: False`);
  lines.push(`${I12}source: "${esc(tool.developerName)}"`);
  lines.push(`${I12}target: "mcpTool://${esc(tool.operationName)}"`);

  // Platform emits a 16-space trailing-whitespace blank line after target.
  lines.push(BLANK16);

  const inputs = toolInputs(tool);
  const outputs = toolOutputs(tool);

  if (inputs.length > 0) {
    lines.push(`${I12}inputs:`);
    for (const input of inputs) {
      lines.push(`${I16}"${input.name}": ${jsType(input.type)}`);
      lines.push(`${I20}description: |`);
      lines.push(I30);
      lines.push(`${I20}label: "string"`);
      lines.push(`${I20}is_required: ${boolToken(input.isRequired)}`);
      lines.push(`${I20}is_user_input: False`);
    }
    // Trailing 16-space blank line after the inputs block.
    lines.push(BLANK16);
  } else {
    // No inputs: the platform emits a second 16-space blank line in place of
    // the inputs section (two blank lines total between target and outputs).
    lines.push(BLANK16);
  }

  if (outputs.length > 0) {
    lines.push(`${I12}outputs:`);
    for (const output of outputs) {
      lines.push(`${I16}"${output.name}": ${jsType(output.type)}`);
      lines.push(`${I20}description: |`);
      lines.push(I30);
      lines.push(`${I20}label: "string"`);
      lines.push(`${I20}is_displayable: False`);
      lines.push(`${I20}filter_from_agent: False`);
    }
  }

  return lines.join("\n");
}

/**
 * Render the FULL Agent Script `subagent` block for an MCP server.
 *
 * Mirrors the subagent / reasoning / actions conventions in
 * `agentScriptsData.js` (4-space indents, `instructions: ->` with `|` bullets,
 * a `return_to_router` transition). Each tool is rendered as a Level-1 action
 * via {@link buildToolActionBlock}, keyed by its `developerName`.
 *
 * @param {Object} server server descriptor of shape:
 *   { id, label, serverName, serverVersion, protocolVersion, description,
 *     namedCredential, status, isActive, toolCount, setupUrl,
 *     schemaParseFailed, hasTools,
 *     tools: [ <tool objects as in buildToolActionBlock> ] }
 * @returns {string} a single subagent block (or a fallback comment string).
 */
export function buildMcpSubagentBlock(server) {
  const tools = Array.isArray(server.tools) ? server.tools : [];

  if (server.hasTools === false || tools.length === 0) {
    return `# No tools accepted yet for ${server.label}. Add tools during MCP server setup.`;
  }

  const subagentName = sanitizeSubagentName(server.serverName);
  const lines = [];

  lines.push(`subagent ${subagentName}:`);
  lines.push(`    label: "${esc(server.serverName)}"`);
  lines.push(`    description: "${esc(oneLine(server.description))}"`);
  lines.push(`    reasoning:`);
  lines.push(`        instructions: ->`);
  lines.push(
    `            | Use these ${esc(server.serverName)} tools to help the user:`
  );
  for (const tool of tools) {
    lines.push(
      `            | - ${esc(tool.name)}: {!@actions.${tool.developerName}}`
    );
  }
  lines.push(
    `            | Pass parameters exactly as the user provides them. Never invent values.`
  );
  lines.push(`        actions:`);
  for (const tool of tools) {
    lines.push(
      `            ${tool.developerName}: @actions.${tool.developerName}`
    );
    for (const input of toolInputs(tool)) {
      lines.push(`                with ${input.name} = ...`);
    }
  }
  lines.push(
    `            return_to_router: @utils.transition to @subagent.agent_router`
  );
  lines.push(
    `                description: "Return to the main router when the user wants help with something else."`
  );

  lines.push(`    actions:`);
  tools.forEach((tool, idx) => {
    lines.push(buildToolActionBlock(server, tool));
    // Blank line between Level-1 action blocks (not after the last one).
    if (idx < tools.length - 1) {
      lines.push(``);
    }
  });

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toolInputs(tool) {
  return Array.isArray(tool.inputs) ? tool.inputs : [];
}

function toolOutputs(tool) {
  return Array.isArray(tool.outputs) ? tool.outputs : [];
}

/**
 * Build the body lines of an action-level `description: |` block.
 *
 * Agent Script `|` block scalars are whitespace-sensitive: EVERY content line
 * must be indented at least to the block's content indent (16 spaces here). A
 * line indented less — e.g. an `Args:` header that arrives at column 0 from a
 * raw tool docstring — would terminate the block scalar and break the parse.
 * So we prefix every non-empty line with the 16-space block indent, preserving
 * each line's own relative indentation (a docstring's 4-space param lines land
 * at 20). Blank lines stay empty, which is valid inside a block scalar.
 *
 * @param {string} description raw tool description (may be multi-line).
 * @returns {string[]} indented body lines (no `description: |` header).
 */
function descriptionBodyLines(description) {
  const text = String(description == null ? "" : description);
  return text.split("\n").map((line) => {
    // A blank/whitespace-only line is emitted empty — block scalars allow it.
    if (line.trim() === "") {
      return "";
    }
    // Prefix the block indent, keeping the line's relative indentation intact.
    return `${I16}${line}`;
  });
}

/**
 * Map an MCP / JSON-schema type to the Agent Script scalar token.
 * @param {string} t
 * @returns {string}
 */
function jsType(t) {
  switch (t) {
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "integer":
    case "number":
      return "number";
    default:
      return "string";
  }
}

/**
 * Convert a JS boolean to the capitalized Agent Script token.
 * @param {boolean} v
 * @returns {string} "True" or "False"
 */
function boolToken(v) {
  return v ? "True" : "False";
}

/**
 * Escape double-quotes for safe interpolation inside an Agent Script "..." value.
 * @param {string} v
 * @returns {string}
 */
function esc(v) {
  return String(v == null ? "" : v).replace(/"/g, '\\"');
}

/**
 * Collapse all newlines (and surrounding whitespace) to single spaces so a
 * value renders on one line.
 * @param {string} v
 * @returns {string}
 */
function oneLine(v) {
  return String(v == null ? "" : v)
    .replace(/\s*[\r\n]+\s*/g, " ")
    .trim();
}

/**
 * Sanitize a server name into a valid subagent identifier and append "_MCP".
 * Strips non-alphanumerics and ensures the name starts with a letter.
 * e.g. "DeepWiki" -> "DeepWiki_MCP"
 * @param {string} serverName
 * @returns {string}
 */
function sanitizeSubagentName(serverName) {
  let cleaned = String(serverName == null ? "" : serverName).replace(
    /[^a-zA-Z0-9]/g,
    ""
  );
  if (cleaned.length === 0 || !/^[a-zA-Z]/.test(cleaned)) {
    cleaned = `Mcp${cleaned}`;
  }
  return `${cleaned}_MCP`;
}
