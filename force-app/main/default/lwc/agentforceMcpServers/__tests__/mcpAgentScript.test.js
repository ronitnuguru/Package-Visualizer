import {
  buildToolActionBlock,
  buildMcpSubagentBlock
} from "../mcpAgentScript.js";

// ---------------------------------------------------------------------------
// DeepWiki sample server — mirrors the REAL platform AgentScript output.
//
// Each tool description carries verbatim leading whitespace on lines 2+ (the
// blank line, the `Args:` header, and the parameter lines) exactly as Apex
// delivers it. Only the first description line is indented by the generator.
// ---------------------------------------------------------------------------

const ASK_QUESTION_DESC = [
  "Ask any question about a GitHub repository and get an AI-powered, context-grounded response.",
  "                      ",
  "              Args:",
  "                  repoName: GitHub repository or list of repositories (max 10) in owner/repo format",
  "                  question: The question to ask about the repository"
].join("\n");

const READ_WIKI_CONTENTS_DESC = [
  "View documentation about a GitHub repository.",
  "                      ",
  "              Args:",
  '                  repoName: GitHub repository in owner/repo format (e.g. "facebook/react")'
].join("\n");

const READ_WIKI_STRUCTURE_DESC = [
  "Get a list of documentation topics for a GitHub repository.",
  "                      ",
  "              Args:",
  '                  repoName: GitHub repository in owner/repo format (e.g. "facebook/react")'
].join("\n");

const repoName = { name: "repoName", type: "string", isRequired: true };
const question = { name: "question", type: "string", isRequired: true };
const result = { name: "result", type: "string", isRequired: true };

const TOOL_ASK_QUESTION = {
  name: "ask_question",
  description: ASK_QUESTION_DESC,
  developerName: "a03e6bc51a04135009c34ba31664837d4",
  masterLabel: "ask_question - DeepWikiAgentExchange",
  operationName: "mcptoolx5fx5faskx5fquestion",
  isWired: true,
  inputs: [repoName, question],
  outputs: [result]
};

const TOOL_READ_WIKI_CONTENTS = {
  name: "read_wiki_contents",
  description: READ_WIKI_CONTENTS_DESC,
  developerName: "a7c219cf2c38f39fab681fad2522dfe8a",
  masterLabel: "read_wiki_contents - DeepWikiAgentExchange",
  operationName: "mcptoolx5fx5freadx5fwikix5fcontents",
  isWired: true,
  inputs: [repoName],
  outputs: [result]
};

const TOOL_READ_WIKI_STRUCTURE = {
  name: "read_wiki_structure",
  description: READ_WIKI_STRUCTURE_DESC,
  developerName: "aa031583691bb3a808b7f47a10d5bffca",
  masterLabel: "read_wiki_structure - DeepWikiAgentExchange",
  operationName: "mcptoolx5fx5freadx5fwikix5fstructure",
  isWired: true,
  inputs: [repoName],
  outputs: [result]
};

function deepWikiServer(overrides = {}) {
  return {
    id: "srv-deepwiki",
    label: "DeepWikiAgentExchange",
    serverName: "DeepWiki",
    serverVersion: "1.0.0",
    protocolVersion: "2024-11-05",
    description: "Ask questions about indexed GitHub repositories.",
    namedCredential: "DeepWiki_NC",
    status: "Active",
    isActive: true,
    toolCount: 3,
    setupUrl: "/lightning/setup/MCP",
    schemaParseFailed: false,
    hasTools: true,
    tools: [
      TOOL_ASK_QUESTION,
      TOOL_READ_WIKI_CONTENTS,
      TOOL_READ_WIKI_STRUCTURE
    ],
    ...overrides
  };
}

describe("mcpAgentScript — buildToolActionBlock", () => {
  const server = deepWikiServer();
  const askBlock = buildToolActionBlock(server, TOOL_ASK_QUESTION);
  const contentsBlock = buildToolActionBlock(server, TOOL_READ_WIKI_CONTENTS);

  it("keys the action block on the developerName UUID, not the tool name", () => {
    expect(askBlock).toContain("        a03e6bc51a04135009c34ba31664837d4:");
    expect(askBlock).not.toContain("        ask_question:");
  });

  it("emits source as the developerName UUID", () => {
    expect(askBlock).toContain('source: "a03e6bc51a04135009c34ba31664837d4"');
  });

  it("emits target as mcpTool://<operationName>", () => {
    expect(askBlock).toContain(
      'target: "mcpTool://mcptoolx5fx5faskx5fquestion"'
    );
  });

  it("emits the masterLabel verbatim as the label", () => {
    expect(askBlock).toContain('label: "ask_question - DeepWikiAgentExchange"');
  });

  it("sets include_in_progress_indicator to False", () => {
    expect(askBlock).toContain("include_in_progress_indicator: False");
  });

  it("sets require_user_confirmation to False", () => {
    expect(askBlock).toContain("require_user_confirmation: False");
  });

  it("marks inputs as is_user_input: False", () => {
    expect(askBlock).toContain("is_user_input: False");
  });

  it("marks outputs as is_displayable: False and filter_from_agent: False", () => {
    expect(askBlock).toContain("is_displayable: False");
    expect(askBlock).toContain("filter_from_agent: False");
  });

  it("never emits complex_data_type_name", () => {
    expect(askBlock).not.toContain("complex_data_type_name");
    expect(contentsBlock).not.toContain("complex_data_type_name");
  });

  it("never emits TODO comments", () => {
    expect(askBlock).not.toContain("# TODO");
  });

  it("includes both repoName and question inputs for ask_question", () => {
    expect(askBlock).toContain('"repoName": string');
    expect(askBlock).toContain('"question": string');
  });

  it("renders the multi-line description with the first line at the 16-space block indent", () => {
    expect(askBlock).toContain(
      "                Ask any question about a GitHub repository and get an AI-powered, context-grounded response."
    );
  });

  it("re-indents EVERY description content line into the block scalar (>= 16 spaces)", () => {
    // Regression guard: a `description: |` block scalar terminates at the first
    // line indented less than its content indent. Raw tool docstrings carry an
    // `Args:` header and param lines at small/zero indent — if emitted verbatim
    // they would break the parse. Assert no description-body line under-indents.
    const lines = askBlock.split("\n");
    const start = lines.findIndex((l) => l.trim() === "description: |");
    expect(start).toBeGreaterThanOrEqual(0);
    // Walk the block body until the next 12-space action field (e.g. `label:`).
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^ {12}\S/.test(line)) {
        break; // reached `label:` — block scalar ended
      }
      if (line.trim() === "") {
        continue; // blank lines are valid inside a block scalar
      }
      // Every non-blank body line must be indented at least 16 spaces.
      expect(line.length - line.trimStart().length).toBeGreaterThanOrEqual(16);
    }
  });

  it("indents the action key at 8 spaces, fields at 12", () => {
    expect(askBlock.startsWith("        a03e6bc5")).toBe(true);
    expect(askBlock).toContain("\n            description: |");
    expect(askBlock).toContain("\n            label:");
  });

  it("uses near-empty description: | blocks on inputs and outputs", () => {
    // 20-space `description: |` followed by a 30-space whitespace-only line.
    expect(askBlock).toContain(
      "                    description: |\n" + " ".repeat(30)
    );
  });
});

describe("mcpAgentScript — buildMcpSubagentBlock", () => {
  const block = buildMcpSubagentBlock(deepWikiServer());

  it("declares the sanitized subagent name", () => {
    expect(block).toContain("subagent DeepWiki_MCP:");
  });

  it("contains all three developerName action keys", () => {
    expect(block).toContain("        a03e6bc51a04135009c34ba31664837d4:");
    expect(block).toContain("        a7c219cf2c38f39fab681fad2522dfe8a:");
    expect(block).toContain("        aa031583691bb3a808b7f47a10d5bffca:");
  });

  it("keys the Level-2 reasoning invocations on the developerName", () => {
    expect(block).toContain(
      "            a03e6bc51a04135009c34ba31664837d4: @actions.a03e6bc51a04135009c34ba31664837d4"
    );
  });

  it("emits with-lines for both ask_question inputs in the reasoning block", () => {
    const askInvocation = block.split("\n").reduce(
      (acc, line) => {
        if (
          line.trim() ===
          "a03e6bc51a04135009c34ba31664837d4: @actions.a03e6bc51a04135009c34ba31664837d4"
        ) {
          acc.capturing = true;
          acc.lines = [];
          return acc;
        }
        if (acc.capturing) {
          if (line.includes("with ")) {
            acc.lines.push(line.trim());
          } else {
            acc.capturing = false;
          }
        }
        return acc;
      },
      { capturing: false, lines: [] }
    ).lines;

    expect(askInvocation).toContain("with repoName = ...");
    expect(askInvocation).toContain("with question = ...");
  });

  it("includes the return_to_router transition", () => {
    expect(block).toContain(
      "return_to_router: @utils.transition to @subagent.agent_router"
    );
  });

  it("never emits complex_data_type_name anywhere", () => {
    expect(block).not.toContain("complex_data_type_name");
  });

  it("never emits TODO comments", () => {
    expect(block).not.toContain("# TODO");
  });

  it("capitalizes booleans throughout", () => {
    expect(block).toContain("is_required: True");
    expect(block).toContain("is_user_input: False");
    expect(block).toContain("require_user_confirmation: False");
    expect(block).toContain("filter_from_agent: False");
    expect(block).not.toMatch(/is_required: (true|false)/);
  });

  it("uses 4-space indentation for subagent-level keys", () => {
    expect(block).toContain('\n    label: "DeepWiki"');
    expect(block).toContain("\n    reasoning:");
    expect(block).toContain("\n    actions:");
  });
});

describe("mcpAgentScript — edge cases", () => {
  it("returns the fallback comment when hasTools is false", () => {
    const block = buildMcpSubagentBlock(deepWikiServer({ hasTools: false }));
    expect(block).toBe(
      "# No tools accepted yet for DeepWikiAgentExchange. Add tools during MCP server setup."
    );
  });

  it("returns the fallback comment when there are no tools", () => {
    const block = buildMcpSubagentBlock(
      deepWikiServer({ tools: [], hasTools: true })
    );
    expect(block).toBe(
      "# No tools accepted yet for DeepWikiAgentExchange. Add tools during MCP server setup."
    );
  });

  it("omits the inputs block for a tool with zero inputs", () => {
    const tool = {
      name: "ping",
      description: "Health check.",
      developerName: "deadbeefdeadbeefdeadbeefdeadbeef",
      masterLabel: "ping - DeepWikiAgentExchange",
      operationName: "mcptoolx5fx5fping",
      isWired: true,
      inputs: [],
      outputs: [result]
    };
    const block = buildToolActionBlock(deepWikiServer(), tool);
    expect(block).not.toContain("inputs:");
    expect(block).toContain("outputs:");
  });

  it("omits the outputs block for a tool with zero outputs", () => {
    const tool = {
      name: "trigger",
      description: "Trigger something.",
      developerName: "cafecafecafecafecafecafecafecafe",
      masterLabel: "trigger - DeepWikiAgentExchange",
      operationName: "mcptoolx5fx5ftrigger",
      isWired: true,
      inputs: [repoName],
      outputs: []
    };
    const block = buildToolActionBlock(deepWikiServer(), tool);
    expect(block).toContain("inputs:");
    expect(block).not.toContain("outputs:");
  });

  it("maps non-string types to scalar tokens", () => {
    const tool = {
      name: "compute",
      description: "Compute.",
      developerName: "11111111111111111111111111111111",
      masterLabel: "compute - DeepWikiAgentExchange",
      operationName: "mcptoolx5fx5fcompute",
      isWired: true,
      inputs: [
        { name: "count", type: "integer", isRequired: true },
        { name: "flag", type: "boolean", isRequired: false },
        { name: "blob", type: "object", isRequired: false }
      ],
      outputs: [{ name: "ratio", type: "number", isRequired: true }]
    };
    const block = buildToolActionBlock(deepWikiServer(), tool);
    expect(block).toContain('"count": number');
    expect(block).toContain('"flag": boolean');
    expect(block).toContain('"blob": string'); // object -> string
    expect(block).toContain('"ratio": number');
  });

  it("sanitizes a non-identifier-safe server name", () => {
    const block = buildMcpSubagentBlock(
      deepWikiServer({ serverName: "9 Deep-Wiki!" })
    );
    expect(block).toContain("subagent Mcp9DeepWiki_MCP:");
  });
});
