import { createElement } from "lwc";
import Headless360Showcase from "c/headless360Showcase";
import AgentScriptCoachModal from "c/agentScriptCoachModal";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";
import { MCP_SERVER_DEFINITION } from "../mcpServerDefinition";

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

  it("renders the Salesforce-branded Headless Toolkit Showcase with client tabs", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    const headerIcon = element.shadowRoot.querySelector(".card_header_icon");
    const tabs = Array.from(
      element.shadowRoot.querySelectorAll('[role="tab"]')
    );

    expect(headerIcon.parentElement.textContent).toContain(
      "Headless Toolkit Showcase"
    );
    expect(headerIcon.iconName).toBe("utility:salesforce1");
    expect(headerIcon.className).toContain("card_header_icon");
    expect(tabs.map((tab) => tab.textContent.trim())).toEqual([
      "Slack",
      "Claude",
      "ChatGPT",
      "Cursor"
    ]);
    expect(tabs[0].querySelector("lightning-icon").iconName).toBe(
      "standard:slack"
    );
    expect(tabs[1].querySelector("svg")).not.toBeNull();
    expect(tabs[2].querySelector("svg")).not.toBeNull();
  });

  it("switches client tabs with the keyboard", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    const tabs = element.shadowRoot.querySelectorAll('[role="tab"]');
    tabs[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );
    await Promise.resolve();
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].parentElement.classList.contains("slds-is-active")).toBe(
      true
    );
    expect(tabs[0].parentElement.classList.contains("slds-is-active")).toBe(
      false
    );
    expect(
      element.shadowRoot.querySelector('[data-id="claude-setup-content"]')
        .parentElement.hidden
    ).toBe(false);
  });

  it("shows the Cursor panel when Cursor is selected", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    element.shadowRoot.querySelector('[data-tab="cursor"]').click();
    await Promise.resolve();
    const cursorPanel = element.shadowRoot.querySelector(
      '[data-id="cursor-setup-content"]'
    ).parentElement;
    const chatgptPanel = element.shadowRoot.querySelector(
      '[data-id="chatgpt-setup-content"]'
    ).parentElement;
    expect(cursorPanel.hidden).toBe(false);
    expect(chatgptPanel.hidden).toBe(true);
    expect(cursorPanel.textContent).toContain("Configure Cursor");
  });

  it("downloads the static MCP definition from all three client sections", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    const definition = new DOMParser().parseFromString(
      MCP_SERVER_DEFINITION,
      "text/xml"
    );
    expect(definition.querySelector("parsererror")).toBeNull();
    expect(definition.querySelector("masterLabel").textContent).toBe(
      "Package Visualizer Custom MCP Server"
    );
    expect(definition.querySelectorAll("tools")).toHaveLength(8);
    const originalCreateUrl = URL.createObjectURL;
    const originalRevokeUrl = URL.revokeObjectURL;
    const createUrl = (URL.createObjectURL = jest
      .fn()
      .mockReturnValue("blob:test"));
    const revokeUrl = (URL.revokeObjectURL = jest.fn());
    const link = element.shadowRoot.querySelector(
      '[data-id="mcp-definition-download-link"]'
    );
    const click = jest.spyOn(link, "click").mockImplementation(() => {});
    jest.useFakeTimers();
    ["", "claude-", "chatgpt-", "cursor-"].forEach((prefix) => {
      element.shadowRoot
        .querySelector(`[data-id="${prefix}custom-mcp-servers-download"]`)
        .click();
    });
    expect(createUrl).toHaveBeenCalledTimes(4);
    expect(createUrl.mock.calls[0][0].type).toBe("application/octet-stream");
    expect(link.download).toBe(
      "PackageVisualizerCustomMcpServer.mcpServerDefinition-meta.xml"
    );
    expect(click).toHaveBeenCalledTimes(4);
    jest.runAllTimers();
    expect(revokeUrl).toHaveBeenCalledTimes(4);
    jest.useRealTimers();
    URL.createObjectURL = originalCreateUrl;
    URL.revokeObjectURL = originalRevokeUrl;
  });

  it("shows org setup guidance and documentation for Claude and ChatGPT", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    ["claude", "chatgpt", "cursor"].forEach((client) => {
      const section = element.shadowRoot.querySelector(
        `[data-id="${client}-setup-content"]`
      );
      expect(section.textContent).toContain(
        "Create an External Client App (ECA)"
      );
      expect(section.textContent).not.toContain("Set up Your Org");
      section.querySelector(`[data-id="${client}-eca-setup"]`).click();
      expect(openedTab.location.href).toBe(
        `${window.location.origin}/lightning/setup/ManageExternalClientApplication/home`
      );
      expect(section.textContent).toContain("mcp_api");
      expect(section.textContent).toContain("refresh_token");
      expect(section.textContent).toContain(
        client === "claude"
          ? "https://claude.ai/api/mcp/auth_callback"
          : client === "cursor"
          ? "http://localhost:8787/callback"
          : "ChatGPT's Advanced settings"
      );
      const help = section.querySelector(
        `[data-id="${client}-org-setup-help"]`
      );
      const security = section.querySelector(
        `[data-id="${client}-eca-security-help"]`
      );
      expect(security.iconName).toBe("utility:policy");
      expect(security.tooltip).toBe("Enhance Security for Production");
      security.click();
      expect(window.open).toHaveBeenLastCalledWith(
        "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html#enhance-security-for-production",
        "_blank"
      );
      expect(help.variant).toBe("brand");
      help.click();
      expect(window.open).toHaveBeenLastCalledWith(
        "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html",
        "_blank"
      );
      const configure = section.querySelector(
        `[data-id="${client}-configure"]`
      );
      expect(configure.textContent).toContain(
        client === "claude"
          ? "Configure Claude"
          : client === "cursor"
          ? "Configure Cursor"
          : "Configure ChatGPT"
      );
      configure.querySelector("lightning-button-icon").click();
      expect(window.open).toHaveBeenLastCalledWith(
        `https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/${client}.html`,
        "_blank"
      );
      const server = section.querySelector(
        `[data-id="${client}-custom-mcp-server"]`
      );
      expect(server.textContent).toContain(
        "Create and Curate a Custom MCP Server"
      );
      expect(
        server.querySelector(`[data-id="${client}-apex-tools"]`).data
      ).toHaveLength(8);
      const tabs = server.querySelectorAll("lightning-tab");
      expect(Array.from(tabs, (tab) => tab.label)).toEqual([
        "Apex",
        "Salesforce Hosted MCP Servers"
      ]);
    });
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
    const slackPanel = element.shadowRoot.querySelector(
      '[aria-labelledby^="slack-tab"]'
    );
    const infoMarkers = Array.from(
      slackPanel.querySelectorAll("lightning-icon")
    ).filter((icon) => icon.iconName === "utility:info_alt");
    expect(infoMarkers).toHaveLength(3);
    expect(
      infoMarkers.every((marker) => marker.classList.contains("icon-style"))
    ).toBe(true);
    expect(slackPanel.querySelectorAll(".slds-icon_container")).toHaveLength(3);
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
      "Salesforce Hosted MCP Servers"
    ]);
  });

  it("lists the eight push upgrade Apex actions in two informational columns", () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);

    const apexTools = element.shadowRoot.querySelector(
      '[data-id="apex-tools"]'
    );

    expect(apexTools.data.map((tool) => tool.apiName)).toEqual([
      "pkgviz__HeadlessPlanPushAction",
      "pkgviz__HeadlessExecutePushAction",
      "pkgviz__HeadlessPushStatusAction",
      "pkgviz__HeadlessCancelPushAction",
      "pkgviz__HeadlessResolvePushTargetAction",
      "pkgviz__HeadlessPreviewPushAction",
      "pkgviz__HeadlessFindPushRunsAction",
      "pkgviz__AgentforcePushRequestAnalysisAction"
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
    expect(slackSetup.tooltip).toBe("Manage Slack Connection");
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
    expect(mcpSetup.tooltip).toBe("Manage Custom MCP Servers");
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
  });
});
