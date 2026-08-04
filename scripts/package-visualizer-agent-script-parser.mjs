import { createHash } from "node:crypto";

const REQUIRED_BLOCKS = new Set([
  "system",
  "config",
  "variables",
  "start_agent"
]);
const TOP_LEVEL_BLOCK =
  /^(system|config|variables|language):$|^(start_agent|subagent) ([a-zA-Z][a-zA-Z0-9_]*):$/;
const IDENTIFIER = "[a-zA-Z][a-zA-Z0-9_]*";

export function normalizeAgentScriptSource(source) {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function indentation(line) {
  return line.length - line.trimStart().length;
}

function valueOf(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  if (trimmed === "True") return true;
  if (trimmed === "False") return false;
  return trimmed;
}

function duplicate(kind, name) {
  throw new Error(`Duplicate ${kind} identifier: ${name}`);
}

function blockEnd(lines, start) {
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].trim() && indentation(lines[index]) === 0) return index;
  }
  return lines.length;
}

function findNestedBlockEnd(lines, start, level) {
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].trim() && indentation(lines[index]) <= level) return index;
  }
  return lines.length;
}

function property(lines, start, end, level, name) {
  const matcher = new RegExp(`^ {${level}}${name}:\\s*(.+)$`);
  for (let index = start; index < end; index += 1) {
    const match = lines[index].match(matcher);
    if (match) return valueOf(match[1]);
  }
  return null;
}

function canonicalInstructions(lines, start, end, level = 8) {
  const instructions = [];
  for (let index = start; index < end; index += 1) {
    const match = lines[index].match(
      new RegExp(`^ {${level}}instructions:\\s*(\\||->)?\\s*$`)
    );
    if (!match) continue;
    const instructionEnd = findNestedBlockEnd(lines, index, level);
    for (
      let lineIndex = index + 1;
      lineIndex < instructionEnd;
      lineIndex += 1
    ) {
      const text = lines[lineIndex].trim();
      if (text) instructions.push(text.replace(/^\|\s?/, ""));
    }
    index = instructionEnd - 1;
  }
  return instructions.join(" ").replace(/\s+/g, " ").trim();
}

function parseDeclarations(
  lines,
  start,
  end,
  level,
  required,
  declarationKind
) {
  const declarations = [];
  const declaration = new RegExp(
    `^ {${level}}(${IDENTIFIER}):\\s*(string|boolean|number|integer)\\s*$`
  );
  for (let index = start; index < end; index += 1) {
    const match = lines[index].match(declaration);
    if (!match) continue;
    if (declarations.some(({ name }) => name === match[1])) {
      duplicate(declarationKind, match[1]);
    }
    declarations.push({
      name: match[1],
      type: match[2],
      ...(required === undefined ? {} : { required: false })
    });
    const declarationEnd = findNestedBlockEnd(lines, index, level);
    if (required !== undefined) {
      const requiredValue = property(
        lines,
        index + 1,
        declarationEnd,
        level + 4,
        "is_required"
      );
      declarations.at(-1).required = requiredValue === true;
    }
    index = declarationEnd - 1;
  }
  return declarations;
}

function parseActions(lines, start, end, owner) {
  const actions = [];
  const action = new RegExp(`^ {8}(${IDENTIFIER}):\\s*$`);
  for (let index = start; index < end; index += 1) {
    const match = lines[index].match(action);
    if (!match) continue;
    const actionEnd = findNestedBlockEnd(lines, index, 8);
    const actionName = match[1];
    if (actions.some(({ name }) => name === actionName))
      duplicate(`action for ${owner}`, actionName);
    const inputsIndex = lines.findIndex(
      (line, lineIndex) =>
        lineIndex > index &&
        lineIndex < actionEnd &&
        line === "            inputs:"
    );
    const outputsIndex = lines.findIndex(
      (line, lineIndex) =>
        lineIndex > index &&
        lineIndex < actionEnd &&
        line === "            outputs:"
    );
    const inputsEnd =
      inputsIndex === -1 ? -1 : findNestedBlockEnd(lines, inputsIndex, 12);
    const outputsEnd =
      outputsIndex === -1 ? -1 : findNestedBlockEnd(lines, outputsIndex, 12);
    actions.push({
      name: actionName,
      owner,
      label: property(lines, index + 1, actionEnd, 12, "label"),
      description: property(lines, index + 1, actionEnd, 12, "description"),
      target: property(lines, index + 1, actionEnd, 12, "target"),
      inputs:
        inputsIndex === -1
          ? []
          : parseDeclarations(
              lines,
              inputsIndex + 1,
              inputsEnd,
              16,
              true,
              "input"
            ),
      outputs:
        outputsIndex === -1
          ? []
          : parseDeclarations(
              lines,
              outputsIndex + 1,
              outputsEnd,
              16,
              undefined,
              "output"
            ),
      availableWhen: findAvailableWhen(lines, index + 1, actionEnd)
    });
    index = actionEnd - 1;
  }
  return actions;
}

function findAvailableWhen(lines, start, end) {
  for (let index = start; index < end; index += 1) {
    const match = lines[index].trim().match(/^available when\s+(.+)$/);
    if (match) return match[1];
  }
  return null;
}

function parseRoutingEdges(lines, start, end, source) {
  const edges = [];
  const transition = new RegExp(
    `^ {12}(${IDENTIFIER}): @utils\\.transition to @subagent\\.(${IDENTIFIER})$`
  );
  for (let index = start; index < end; index += 1) {
    const match = lines[index].match(transition);
    if (!match) continue;
    const edgeEnd = findNestedBlockEnd(lines, index, 12);
    edges.push({
      name: match[1],
      source,
      target: match[2],
      description: property(lines, index + 1, edgeEnd, 16, "description"),
      availableWhen: findAvailableWhen(lines, index + 1, edgeEnd)
    });
    index = edgeEnd - 1;
  }
  return edges;
}

function parseAgent(lines, start, end) {
  const header = lines[start].match(
    /^(start_agent|subagent) ([a-zA-Z][a-zA-Z0-9_]*):$/
  );
  const [, kind, name] = header;
  const actions = [];
  const routingEdges = [];
  for (let index = start + 1; index < end; index += 1) {
    if (lines[index] !== "    actions:") continue;
    const actionsEnd = findNestedBlockEnd(lines, index, 4);
    for (const parsedAction of parseActions(
      lines,
      index + 1,
      actionsEnd,
      name
    )) {
      if (
        actions.some(({ name: actionName }) => actionName === parsedAction.name)
      ) {
        duplicate(`action for ${name}`, parsedAction.name);
      }
      actions.push(parsedAction);
    }
    index = actionsEnd - 1;
  }
  for (let index = start + 1; index < end; index += 1) {
    if (lines[index] !== "        actions:") continue;
    const routingEnd = findNestedBlockEnd(lines, index, 8);
    for (const parsedEdge of parseRoutingEdges(
      lines,
      index + 1,
      routingEnd,
      name
    )) {
      if (
        routingEdges.some(({ name: edgeName }) => edgeName === parsedEdge.name)
      ) {
        duplicate(`routing transition for ${name}`, parsedEdge.name);
      }
      routingEdges.push(parsedEdge);
    }
    index = routingEnd - 1;
  }
  return {
    kind,
    name,
    label: property(lines, start + 1, end, 4, "label"),
    description: property(lines, start + 1, end, 4, "description"),
    reasoningMode: lines
      .slice(start, end)
      .some((line) => line === "        instructions: ->")
      ? "workflow"
      : lines
          .slice(start, end)
          .some((line) => line === "        instructions: |")
      ? "narrative"
      : null,
    instructions: canonicalInstructions(lines, start + 1, end),
    actions,
    routingEdges,
    source: lines.slice(start, end).join("\n")
  };
}

function parseVariables(lines, start, end) {
  const variables = [];
  const variable = new RegExp(
    `^ {4}(${IDENTIFIER}):\\s*(?:(mutable|immutable)\\s+)?(string|boolean|number|integer)(?:\\s*=.*)?$`
  );
  for (let index = start + 1; index < end; index += 1) {
    const match = lines[index].match(variable);
    if (!match) continue;
    if (variables.some(({ name }) => name === match[1]))
      duplicate("variable", match[1]);
    const variableEnd = findNestedBlockEnd(lines, index, 4);
    variables.push({
      name: match[1],
      kind: match[2] || "immutable",
      type: match[3],
      visibility:
        property(lines, index + 1, variableEnd, 8, "visibility") || "agent"
    });
    index = variableEnd - 1;
  }
  return variables;
}

function validateStructure(lines) {
  const blocks = [];
  const seenRequired = new Set();
  const seenSingleton = new Set();
  const identifiers = new Set();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (line.includes("\t")) {
      throw new Error(`Invalid indentation at line ${index + 1}`);
    }
    const rootMatch = line.match(TOP_LEVEL_BLOCK);
    if (rootMatch) {
      if (indentation(line) !== 0) {
        throw new Error(`Invalid top-level boundary at line ${index + 1}`);
      }
      const type = rootMatch[1] || rootMatch[2];
      const name = rootMatch[3] || type;
      if (type !== "subagent") {
        if (seenSingleton.has(type)) duplicate("block", type);
        seenSingleton.add(type);
      }
      if (type === "start_agent" || type === "subagent") {
        if (identifiers.has(name)) duplicate("agent", name);
        identifiers.add(name);
      }
      if (REQUIRED_BLOCKS.has(type)) seenRequired.add(type);
      blocks.push({ type, name, start: index, end: blockEnd(lines, index) });
      continue;
    }
    if (indentation(line) === 0) {
      throw new Error(
        `Invalid top-level boundary at line ${index + 1}: ${line}`
      );
    }
    if (
      /^(system|config|variables|language):$|^(start_agent|subagent) /.test(
        line.trim()
      )
    ) {
      throw new Error(`Invalid top-level boundary at line ${index + 1}`);
    }
  }
  for (const required of REQUIRED_BLOCKS) {
    if (!seenRequired.has(required))
      throw new Error(`Missing required block: ${required}`);
  }
  return blocks;
}

function publicSummary(manifest) {
  return {
    name: manifest.overview.label,
    label: manifest.overview.label,
    purpose: manifest.overview.description,
    agents: [manifest.overview.startAgent, ...manifest.subagents].map(
      (agent) => ({
        name: agent.name,
        label: agent.label,
        purpose: agent.description
      })
    ),
    actions: manifest.actions.map((action) => ({
      name: action.name,
      label: action.label,
      description: action.description
    }))
  };
}

function coachingEvidence(manifest, systemInstructions, startAgent, subagents) {
  return {
    schemaVersion: manifest.schemaVersion,
    scriptId: manifest.scriptId,
    scriptHash: manifest.scriptHash,
    identity: {
      developerName: manifest.overview.developerName,
      agentType: manifest.overview.agentType
    },
    instructions: [
      { kind: "system", owner: "system", text: systemInstructions },
      {
        kind: "startAgent",
        owner: startAgent.name,
        text: startAgent.instructions
      },
      ...subagents.map((agent) => ({
        kind: "subagent",
        owner: agent.name,
        text: agent.instructions
      }))
    ],
    routingEdges: manifest.routingEdges.map(
      ({ name, source, target, availableWhen }) => ({
        name,
        source,
        target,
        availableWhen
      })
    ),
    actionFlags: manifest.actions.map(
      ({ name, owner, target, inputs, outputs, availableWhen }) => ({
        name,
        owner,
        target,
        hasInputs: inputs.length > 0,
        hasOutputs: outputs.length > 0,
        hasAvailabilityRule: availableWhen !== null
      })
    ),
    variableFlags: manifest.variables.map(
      ({ name, type, kind, visibility }) => ({
        name,
        type,
        kind,
        visibility
      })
    )
  };
}

function buildArtifacts(source) {
  const normalizedSource = normalizeAgentScriptSource(source);
  const lines = normalizedSource.split("\n");
  const blocks = validateStructure(lines);
  const byType = (type) => blocks.filter((block) => block.type === type);
  const configBlock = byType("config")[0];
  const systemBlock = byType("system")[0];
  const variableBlock = byType("variables")[0];
  const startBlock = byType("start_agent")[0];
  const startAgent = parseAgent(lines, startBlock.start, startBlock.end);
  const subagents = byType("subagent").map((block) =>
    parseAgent(lines, block.start, block.end)
  );
  const agents = [startAgent, ...subagents];
  const agentsByName = new Map(agents.map((agent) => [agent.name, agent]));
  const actions = agents.flatMap((agent) => agent.actions);
  const routingEdges = agents.flatMap((agent) => agent.routingEdges);

  for (const edge of routingEdges) {
    if (!agentsByName.has(edge.target)) {
      throw new Error(`Unresolved routing target: ${edge.target}`);
    }
  }
  for (const agent of agents) {
    for (const match of agent.instructions.matchAll(
      /run @actions\.([a-zA-Z][a-zA-Z0-9_]*)/g
    )) {
      if (!agent.actions.some(({ name }) => name === match[1])) {
        throw new Error(
          `Unresolved action reference for ${agent.name}: ${match[1]}`
        );
      }
    }
  }

  const config = {};
  for (let index = configBlock.start + 1; index < configBlock.end; index += 1) {
    const match = lines[index].match(/^ {4}([a-zA-Z][a-zA-Z0-9_]*):\s*(.+)$/);
    if (match) {
      if (Object.hasOwn(config, match[1])) duplicate("config", match[1]);
      config[match[1]] = valueOf(match[2]);
    }
  }
  const sourceBlocks = Object.fromEntries(
    blocks
      .filter(
        (block) => block.type !== "start_agent" && block.type !== "subagent"
      )
      .map((block) => [
        block.type,
        lines.slice(block.start, block.end).join("\n")
      ])
  );
  sourceBlocks.startAgent = {
    name: startAgent.name,
    source: startAgent.source
  };
  sourceBlocks.subagents = subagents.map(({ name, source: blockSource }) => ({
    name,
    source: blockSource
  }));

  const manifest = {
    schemaVersion: 1,
    scriptId: String(config.developer_name || startAgent.name)
      .replace(/_/g, "-")
      .toLowerCase(),
    scriptHash: createHash("sha256").update(normalizedSource).digest("hex"),
    overview: {
      developerName: config.developer_name || null,
      label: config.agent_label || null,
      description: config.description || null,
      agentType: config.agent_type || null,
      startAgent: {
        name: startAgent.name,
        label: startAgent.label,
        description: startAgent.description,
        reasoningMode: startAgent.reasoningMode
      }
    },
    subagents: subagents.map(({ name, label, description, reasoningMode }) => ({
      name,
      label,
      description,
      reasoningMode
    })),
    actions,
    variables: parseVariables(lines, variableBlock.start, variableBlock.end),
    routingEdges,
    sourceBlocks
  };
  return {
    manifest,
    coachingEvidence: coachingEvidence(
      manifest,
      canonicalInstructions(lines, systemBlock.start + 1, systemBlock.end, 4),
      startAgent,
      subagents
    ),
    publicChatSummary: publicSummary(manifest)
  };
}

export function parseAgentScript(source) {
  return buildArtifacts(source).manifest;
}

export function buildAgentScriptArtifacts(source) {
  return buildArtifacts(source);
}
