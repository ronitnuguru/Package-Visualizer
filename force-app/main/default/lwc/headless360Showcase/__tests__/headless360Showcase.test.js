import { createElement } from "lwc";
import Headless360Showcase from "c/headless360Showcase";
import getProvisioningState from "@salesforce/apex/PackageVisualizerMcpController.getProvisioningState";
import createServer from "@salesforce/apex/PackageVisualizerMcpController.createServer";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";

jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PackageVisualizerMcpController.createServer",
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
jest.mock(
  "@salesforce/apex/PackageVisualizerMcpController.getProvisioningState",
  () => ({
    default: jest
      .fn()
      .mockResolvedValue({ loaded: false, canCreate: false, issues: [] })
  }),
  { virtual: true }
);

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
      expect(server.querySelector("lightning-tabset")).toBeNull();
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

    expect(steps[1].querySelector("lightning-tabset")).toBeNull();
    expect(
      steps[1].querySelector("c-package-visualizer-mcp-provisioner")
    ).not.toBeNull();
  });

  it("mounts one provisioner in the selected client guide and forwards its changes", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    const changed = jest.fn();
    element.addEventListener("provisioningchange", changed);
    document.body.appendChild(element);
    await flushPromises();
    expect(getProvisioningState).toHaveBeenCalledTimes(1);
    expect(getAgentforceConfiguration).not.toHaveBeenCalled();
    for (const client of ["slack", "claude", "chatgpt", "cursor"]) {
      element.shadowRoot.querySelector(`[data-tab="${client}"]`).click();
      // Each tab must render before verifying its mounted child.
      // eslint-disable-next-line no-await-in-loop
      await flushPromises();
      expect(
        element.shadowRoot.querySelectorAll(
          "c-package-visualizer-mcp-provisioner"
        )
      ).toHaveLength(1);
      const panel = element.shadowRoot.querySelector(
        client === "slack"
          ? '[data-id="custom-mcp-server-step"]'
          : `[data-id="${client}-custom-mcp-server"]`
      );
      const child = panel.querySelector("c-package-visualizer-mcp-provisioner");
      expect(child).not.toBeNull();
      child.dispatchEvent(
        new CustomEvent("provisioningchange", {
          detail: { serverId: "server", active: false }
        })
      );
    }
    expect(changed).toHaveBeenCalledTimes(4);
    expect(changed.mock.calls[0][0].detail).toEqual({
      serverId: "server",
      active: false
    });
  });

  it("keeps the active guide mounted while provisioning is in progress", async () => {
    const element = createElement("c-headless-360-showcase", {
      is: Headless360Showcase
    });
    document.body.appendChild(element);
    await flushPromises();
    const child = element.shadowRoot.querySelector(
      "c-package-visualizer-mcp-provisioner"
    );
    child.dispatchEvent(
      new CustomEvent("provisioningbusychange", { detail: { busy: true } })
    );
    await flushPromises();
    expect(
      [...element.shadowRoot.querySelectorAll('[role="tab"]')].every(
        (tab) => tab.disabled
      )
    ).toBe(true);
    element.shadowRoot
      .querySelector('[data-tab="claude"]')
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
    await flushPromises();
    expect(
      element.shadowRoot.querySelector("c-package-visualizer-mcp-provisioner")
    ).toBe(child);
    child.dispatchEvent(
      new CustomEvent("provisioningbusychange", { detail: { busy: false } })
    );
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-tab="claude"]').disabled
    ).toBe(false);
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

it("removes setup and download actions from all curation steps while retaining help", () => {
  const element = createElement("c-headless-360-showcase", {
    is: Headless360Showcase
  });
  document.body.appendChild(element);
  for (const prefix of ["", "claude-", "chatgpt-", "cursor-"]) {
    expect(
      element.shadowRoot.querySelector(
        `[data-id="${prefix}custom-mcp-servers-setup"]`
      )
    ).toBeNull();
    expect(
      element.shadowRoot.querySelector(
        `[data-id="${prefix}custom-mcp-servers-download"]`
      )
    ).toBeNull();
    expect(
      element.shadowRoot.querySelector(
        `[data-id="${prefix}custom-mcp-servers-help"]`
      )
    ).not.toBeNull();
  }
});

const dashboardState = {
  serverId: "server",
  serverUrl: "https://example.com",
  loaded: true,
  canCreate: false,
  active: false,
  issues: [],
  assets: []
};
const flushDashboard = async () => {
  await Array.from({ length: 15 }).reduce(
    (pending) => pending.then(() => Promise.resolve()),
    Promise.resolve()
  );
};
it("shares the initial in-flight request and caches the read-only view across tabs", async () => {
  document.body.replaceChildren();
  getProvisioningState.mockClear();
  let resolve;
  getProvisioningState.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    })
  );
  const e = createElement("c-headless-360-showcase", {
    is: Headless360Showcase
  });
  document.body.appendChild(e);
  await flushDashboard();
  e.shadowRoot.querySelector('[data-tab="claude"]').click();
  await flushDashboard();
  expect(getProvisioningState).toHaveBeenCalledTimes(1);
  resolve(dashboardState);
  await flushDashboard();
  e.shadowRoot.querySelector('[data-tab="cursor"]').click();
  await flushDashboard();
  const child = e.shadowRoot.querySelector(
    "c-package-visualizer-mcp-provisioner"
  );
  expect(
    child.shadowRoot.querySelector('[data-id="server-status"]').label
  ).toBe("Inactive");
  expect(getProvisioningState).toHaveBeenCalledTimes(1);
});
it("shares an explicit refresh across tabs and displays Setup changes", async () => {
  document.body.replaceChildren();
  getProvisioningState.mockClear().mockResolvedValue(dashboardState);
  const e = createElement("c-headless-360-showcase", {
    is: Headless360Showcase
  });
  document.body.appendChild(e);
  await flushDashboard();
  let resolve;
  getProvisioningState.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    })
  );
  e.shadowRoot
    .querySelector("c-package-visualizer-mcp-provisioner")
    .shadowRoot.querySelector('[data-id="refresh"]')
    .click();
  await flushDashboard();
  e.shadowRoot.querySelector('[data-tab="chatgpt"]').click();
  await flushDashboard();
  expect(getProvisioningState).toHaveBeenCalledTimes(2);
  resolve({ ...dashboardState, active: true });
  await flushDashboard();
  expect(
    e.shadowRoot
      .querySelector("c-package-visualizer-mcp-provisioner")
      .shadowRoot.querySelector('[data-id="server-status"]').label
  ).toBe("Active");
});
it("shares newly created state with the next tab", async () => {
  document.body.replaceChildren();
  getProvisioningState.mockClear().mockResolvedValue({
    loaded: true,
    canCreate: true,
    assets: [],
    issues: []
  });
  createServer.mockResolvedValue(dashboardState);
  const e = createElement("c-headless-360-showcase", {
    is: Headless360Showcase
  });
  document.body.appendChild(e);
  await flushDashboard();
  e.shadowRoot
    .querySelector("c-package-visualizer-mcp-provisioner")
    .shadowRoot.querySelector('[data-id="create-server"]')
    .click();
  await flushDashboard();
  e.shadowRoot.querySelector('[data-tab="claude"]').click();
  await flushDashboard();
  expect(
    e.shadowRoot
      .querySelector("c-package-visualizer-mcp-provisioner")
      .shadowRoot.querySelector('[data-id="server-status"]').label
  ).toBe("Inactive");
  expect(getProvisioningState).toHaveBeenCalledTimes(1);
});
describe("server creation status", () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.clearAllMocks();
  });
  it.each([
    ["inactive existing server", dashboardState, undefined, true],
    [
      "active existing server",
      { ...dashboardState, active: true },
      undefined,
      true
    ],
    ["absent server", { loaded: true, canCreate: true }, undefined, false],
    [
      "unverified response",
      { ...dashboardState, loaded: false },
      undefined,
      false
    ],
    ["read failed", undefined, "Unable to refresh", false],
    [
      "verified recovery with warning",
      dashboardState,
      "Population failed",
      true
    ],
    [
      "prerequisite error",
      { ...dashboardState, issues: ["Credential unavailable"] },
      undefined,
      false
    ]
  ])(
    "reports provisioned status for %s",
    async (_label, state, error, ready) => {
      getProvisioningState.mockResolvedValue({ loaded: false });
      const e = createElement("c-headless-360-showcase", {
        is: Headless360Showcase
      });
      const listener = jest.fn();
      e.addEventListener("provisioningstatuschange", listener);
      document.body.appendChild(e);
      await flushDashboard();
      const child = e.shadowRoot.querySelector(
        "c-package-visualizer-mcp-provisioner"
      );
      child.dispatchEvent(
        new CustomEvent("provisioningsnapshot", { detail: { state, error } })
      );
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: { ready } })
      );
    }
  );
});

it("marks a partially created server as created after recovery while retaining the warning", async () => {
  document.body.replaceChildren();
  getProvisioningState
    .mockReset()
    .mockResolvedValueOnce({
      loaded: true,
      canCreate: true,
      issues: [],
      assets: []
    })
    .mockResolvedValue(dashboardState);
  createServer
    .mockReset()
    .mockRejectedValue({
      body: { message: "Population failed; review in Setup." }
    });
  const e = createElement("c-headless-360-showcase", {
    is: Headless360Showcase
  });
  const listener = jest.fn();
  e.addEventListener("provisioningstatuschange", listener);
  document.body.appendChild(e);
  await flushDashboard();
  const child = e.shadowRoot.querySelector(
    "c-package-visualizer-mcp-provisioner"
  );
  child.shadowRoot.querySelector('[data-id="create-server"]').click();
  await flushDashboard();
  expect(child.shadowRoot.textContent).toContain(
    "Population failed; review in Setup."
  );
  expect(
    child.shadowRoot.querySelector('[data-id="server-status"]').label
  ).toBe("Inactive");
  expect(
    child.shadowRoot.querySelector('[data-id="view-in-setup"]')
  ).not.toBeNull();
  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { ready: true } })
  );
  expect(createServer).toHaveBeenCalledTimes(1);
});
