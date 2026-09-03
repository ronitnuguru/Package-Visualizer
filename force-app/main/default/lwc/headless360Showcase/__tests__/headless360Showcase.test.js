import { createElement } from "lwc";
import Headless360Showcase from "c/headless360Showcase";
import AgentScriptCoachModal from "c/agentScriptCoachModal";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";

jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const HEADLESS_360_HELP_URL =
  "https://developer.salesforce.com/developer-centers/headless-360";
const SLACK_CONNECTION_HELP_URL =
  "https://slack.com/help/articles/30754346665747-Connect-Salesforce-and-Slack";
const CUSTOM_MCP_SERVER_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html";
const SLACKBOT_MCP_HELP_URL =
  "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP#add-an-mcp-server";
const PROMPT_TEMPLATE_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/prompt-builder.html";
const FLOW_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/flows.html";
const STANDARD_SERVER_HELP_URL =
  "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/servers-reference.html";
const READY_AGENT_CONFIGURATION = {
  botId: "0Xx000000000001AAA",
  label: "Package Visualizer Agent",
  developerName: "Package_Visualizer_Agent",
  state: "READY",
  message: "Package Visualizer is configured to use Package Visualizer Agent."
};
const mockOpenAgentScriptCoachModal = AgentScriptCoachModal.open;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe("c-headless-360-showcase", () => {
  let originalWindowOpen;
  let openedTab;

  beforeEach(() => {
    openedTab = { location: {} };
    originalWindowOpen = window.open;
    window.open = jest.fn(() => openedTab);
    getAgentforceConfiguration.mockResolvedValue(READY_AGENT_CONFIGURATION);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    window.open = originalWindowOpen;
    jest.clearAllMocks();
  });

  it("renders the Salesforce-branded Headless 360 Showcase with client tabs", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    const card = element.shadowRoot.querySelector("lightning-card");
    const headerIcon = element.shadowRoot.querySelector(".card_header_icon");
    const clientTabset = element.shadowRoot.querySelector("lightning-tabset");
    const tabs = Array.from(clientTabset.children);

    expect(card.querySelector('[slot="title"]').textContent).toContain(
      "Headless 360 Showcase"
    );
    expect(headerIcon.iconName).toBe("utility:salesforce1");
    expect(headerIcon.className).toContain("card_header_icon");
    expect(tabs.map((tab) => tab.label)).toEqual(["Slack"]);
    expect(tabs.map((tab) => tab.iconName)).toEqual(["standard:slack"]);
  });

  it("renders the three Slack setup steps and asset category tabs", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    const steps = Array.from(
      element.shadowRoot.querySelectorAll('[data-id$="-step"]')
    );
    expect(steps.map((step) => step.dataset.id)).toEqual([
      "slack-connection-step",
      "custom-mcp-server-step",
      "slackbot-mcp-step"
    ]);
    const infoMarkers = Array.from(
      element.shadowRoot.querySelectorAll("lightning-icon")
    ).filter((icon) => icon.iconName === "utility:info_alt");
    expect(infoMarkers).toHaveLength(3);
    expect(
      infoMarkers.every((marker) => marker.classList.contains("icon-style"))
    ).toBe(true);
    expect(
      element.shadowRoot.querySelectorAll(".slds-icon_container")
    ).toHaveLength(3);
    expect(steps[0].textContent).toContain("Connect Salesforce and Slack");
    expect(steps[0].textContent).toContain(
      "Connect your Slack workspace to this Salesforce org, then approve and activate the connection."
    );
    expect(steps[1].textContent).toContain(
      "Create and Curate a Custom MCP Server"
    );
    expect(steps[1].textContent).toContain(
      "Create a Custom Salesforce Hosted MCP Server and add a combination of server assets and tools that Slackbot can use."
    );
    expect(steps[2].textContent).toContain(
      "Connect the Custom MCP Server to Slackbot"
    );
    expect(steps[2].textContent).toContain(
      "In Slack administration, add the Salesforce MCP Server, review its tools, and assign member or workspace access."
    );

    const toolTabset = element.shadowRoot.querySelector(
      '[data-id="mcp-tool-tabs"]'
    );
    const toolTabs = Array.from(toolTabset.querySelectorAll("lightning-tab"));
    expect(toolTabset.variant).toBe("scoped");
    expect(toolTabs.map((tab) => tab.label)).toEqual([
      "Apex",
      "Agents",
      "Prompt Templates",
      "Flows",
      "Salesforce Hosted MCP Servers"
    ]);
  });

  it("lists the nine packaged Apex actions in two informational columns", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    const apexTools = element.shadowRoot.querySelector(
      '[data-id="apex-tools"]'
    );

    expect(apexTools.data.map((tool) => tool.apiName)).toEqual([
      "pkgviz__AgentforcePackagePortfolioAction",
      "pkgviz__AgentforcePackageDetailAction",
      "pkgviz__AgentforcePackageBuildDiagnosisAction",
      "pkgviz__AgentforcePackageBuildComparisonAction",
      "pkgviz__AgentforcePushRequestAnalysisAction",
      "pkgviz__AgentforcePushJobDiagnosisAction",
      "pkgviz__AgentforcePushRequestComparisonAction",
      "pkgviz__AgentforceSubscriberSupportAction",
      "pkgviz__AgentforcePackageVersionReadinessAction"
    ]);
    expect(apexTools.columns).toEqual([
      expect.objectContaining({ label: "Apex Action", fieldName: "apiName" }),
      expect.objectContaining({ label: "Purpose", fieldName: "description" })
    ]);
    expect(element.shadowRoot.textContent).not.toContain(
      "Add the Apex Actions that suit this Custom MCP Server's purpose."
    );
  });

  it("shows the selected AgentScript in the AgentExchange accordion pattern", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    await flushPromises();

    const agentScript = element.shadowRoot.querySelector(
      '[data-id="configured-agent-script"]'
    );
    expect(agentScript).not.toBeNull();
    expect(agentScript.activeSectionName).toEqual(["package-visualizer-agent"]);
    expect(agentScript.textContent).toContain(
      "Package Visualizer Agent (Employee)"
    );
    expect(
      element.shadowRoot.querySelector('[data-id="agent-script-preview"]')
        .textContent
    ).toContain("system:");
    expect(
      element.shadowRoot.querySelector('[data-id="generate-agent-script"]')
        .label
    ).toBe("Generate");
    expect(
      element.shadowRoot.querySelector('[data-id="agent-setup-guidance"]')
    ).toBeNull();
  });

  it("keeps the AgentScript accordion open initially and allows it to collapse", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    await flushPromises();

    const agentScript = element.shadowRoot.querySelector(
      '[data-id="configured-agent-script"]'
    );
    expect(agentScript.activeSectionName).toEqual(["package-visualizer-agent"]);

    agentScript.dispatchEvent(
      new CustomEvent("sectiontoggle", { detail: { openSections: [] } })
    );
    await flushPromises();

    expect(agentScript.activeSectionName).toEqual([]);
  });

  it("opens AgentScript generation with the shared AgentExchange script", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    await flushPromises();

    element.shadowRoot
      .querySelector('[data-id="generate-agent-script"]')
      .click();

    expect(mockOpenAgentScriptCoachModal).toHaveBeenCalledWith(
      expect.objectContaining({
        scriptId: "package-visualizer-agent",
        scriptBody: expect.stringContaining("system:"),
        scriptHash: expect.any(String)
      })
    );
  });

  it("opens Agentforce Studio from the AgentScript action group", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    await flushPromises();

    const studioButton = element.shadowRoot.querySelector(
      '[data-id="navigate-agentforce-studio"]'
    );
    expect(studioButton.iconName).toBe("utility:agent_astro");
    expect(studioButton.tooltip).toBe("Navigate to Agentforce Studio");

    studioButton.click();
    expect(window.open).toHaveBeenLastCalledWith("", "_blank");
    expect(openedTab.location.href).toBe(
      `${window.location.origin}/lightning/n/standard-AgentforceStudio?c__nav=agents`
    );
  });

  it("guides users to AgentScripts when no active agent is configured", async () => {
    getAgentforceConfiguration.mockResolvedValue({
      botId: null,
      label: null,
      developerName: null,
      state: "UNCONFIGURED",
      message: "Select an active Agentforce Employee Agent."
    });
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    await flushPromises();

    const guidance = element.shadowRoot.querySelector(
      '[data-id="agent-setup-guidance"]'
    );
    expect(guidance.textContent).toContain("AgentScripts");
    expect(guidance.textContent).toContain("Active Employee Agent");
    expect(
      element.shadowRoot.querySelector('[data-id="configured-agent-script"]')
    ).toBeNull();
  });

  it("provides Learn More empty states for un-packaged asset categories", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    const promptTemplates = element.shadowRoot.querySelector(
      '[data-id="prompt-template-assets-unavailable"]'
    );
    const flows = element.shadowRoot.querySelector(
      '[data-id="flow-assets-unavailable"]'
    );
    const hostedServers = element.shadowRoot.querySelector(
      '[data-id="salesforce-hosted-mcp-server-assets-unavailable"]'
    );

    expect(promptTemplates.tagName).toBe("LIGHTNING-EMPTY-STATE");
    expect(promptTemplates.title).toBe("Server asset not available...");
    expect(promptTemplates.textContent).toContain(
      "No packaged Prompt Templates are available to add to this Custom MCP Server."
    );
    expect(flows.tagName).toBe("LIGHTNING-EMPTY-STATE");
    expect(flows.title).toBe("Server asset not available...");
    expect(flows.textContent).toContain(
      "No packaged Flows are available to add to this Custom MCP Server."
    );
    expect(hostedServers.tagName).toBe("LIGHTNING-EMPTY-STATE");
    expect(hostedServers.title).toBe("Server asset not available...");
    expect(hostedServers.textContent).toContain(
      "No packaged Salesforce Hosted MCP Servers are available to add to this Custom MCP Server."
    );
    [
      "prompt-template-assets-help",
      "flow-assets-help",
      "salesforce-hosted-mcp-server-assets-help"
    ].forEach((dataId) => {
      expect(
        element.shadowRoot.querySelector(`[data-id="${dataId}"]`).label
      ).toBe("Learn More");
    });
  });

  it("provides accessible Setup and Help actions for each applicable step", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    const slackSetup = element.shadowRoot.querySelector(
      '[data-id="slack-workspaces-setup"]'
    );
    const slackHelp = element.shadowRoot.querySelector(
      '[data-id="slack-connection-help"]'
    );
    const mcpSetup = element.shadowRoot.querySelector(
      '[data-id="custom-mcp-servers-setup"]'
    );
    const mcpHelp = element.shadowRoot.querySelector(
      '[data-id="custom-mcp-servers-help"]'
    );
    const slackbotHelp = element.shadowRoot.querySelector(
      '[data-id="slackbot-mcp-help"]'
    );

    expect(slackSetup.iconName).toBe("utility:setup");
    expect(slackSetup.alternativeText).toBe("Open Slack Setup");
    expect(slackSetup.title).toBe("Open Slack Setup");
    expect(slackHelp.iconName).toBe("utility:help_doc_ext");
    expect(slackHelp.variant).toBe("brand");
    expect(slackHelp.alternativeText).toBe(
      "Open Connect Salesforce and Slack documentation"
    );
    expect(slackHelp.title).toBe(
      "Open Connect Salesforce and Slack documentation"
    );
    expect(mcpSetup.alternativeText).toBe("Open Custom MCP Servers Setup");
    expect(mcpSetup.title).toBe("Open Custom MCP Servers Setup");
    expect(mcpHelp.alternativeText).toBe(
      "Open Custom MCP Servers documentation"
    );
    expect(mcpHelp.title).toBe("Open Custom MCP Servers documentation");
    expect(slackbotHelp.alternativeText).toBe(
      "Open Slackbot MCP documentation"
    );
    expect(slackbotHelp.title).toBe("Open Slackbot MCP documentation");
    expect(
      element.shadowRoot.querySelector('[data-id="slackbot-mcp-setup"]')
    ).toBeNull();
  });

  it("opens Salesforce Setup destinations in new tabs", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    element.shadowRoot
      .querySelector('[data-id="slack-workspaces-setup"]')
      .click();
    expect(window.open).toHaveBeenLastCalledWith("", "_blank");
    expect(openedTab.location.href).toBe(
      `${window.location.origin}/lightning/setup/SlackWorkspaces/home`
    );

    openedTab = { location: {} };
    window.open.mockReturnValue(openedTab);
    element.shadowRoot
      .querySelector('[data-id="custom-mcp-servers-setup"]')
      .click();
    expect(window.open).toHaveBeenLastCalledWith("", "_blank");
    expect(openedTab.location.href).toBe(
      `${window.location.origin}/lightning/setup/McpServer/home`
    );
  });

  it("opens each help article in a new tab", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    element.shadowRoot
      .querySelector('[data-id="headless-360-showcase-help"]')
      .click();
    expect(window.open).toHaveBeenLastCalledWith(
      HEADLESS_360_HELP_URL,
      "_blank"
    );

    element.shadowRoot
      .querySelector('[data-id="slack-connection-help"]')
      .click();
    expect(window.open).toHaveBeenLastCalledWith(
      SLACK_CONNECTION_HELP_URL,
      "_blank"
    );

    element.shadowRoot
      .querySelector('[data-id="custom-mcp-servers-help"]')
      .click();
    expect(window.open).toHaveBeenLastCalledWith(
      CUSTOM_MCP_SERVER_HELP_URL,
      "_blank"
    );

    element.shadowRoot.querySelector('[data-id="slackbot-mcp-help"]').click();
    expect(window.open).toHaveBeenLastCalledWith(
      SLACKBOT_MCP_HELP_URL,
      "_blank"
    );

    element.shadowRoot
      .querySelector('[data-id="prompt-template-assets-help"]')
      .click();
    expect(window.open).toHaveBeenLastCalledWith(
      PROMPT_TEMPLATE_HELP_URL,
      "_blank"
    );

    element.shadowRoot.querySelector('[data-id="flow-assets-help"]').click();
    expect(window.open).toHaveBeenLastCalledWith(FLOW_HELP_URL, "_blank");

    element.shadowRoot
      .querySelector('[data-id="salesforce-hosted-mcp-server-assets-help"]')
      .click();
    expect(window.open).toHaveBeenLastCalledWith(
      STANDARD_SERVER_HELP_URL,
      "_blank"
    );
  });
});
