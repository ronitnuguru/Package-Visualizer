import { AGENT_SCRIPTS } from "c/agentScriptCatalog";

describe("c-agent-script-catalog", () => {
  it("exports the Package Visualizer AgentScript for all consuming LWCs", () => {
    expect(AGENT_SCRIPTS).toHaveLength(1);
    expect(AGENT_SCRIPTS[0]).toMatchObject({
      id: "package-visualizer-agent",
      label: "Package Visualizer Agent (Employee)",
      body: expect.stringContaining("system:")
    });
  });
});
