import { createElement } from "lwc";
import SetupAssistantCustomMcpServers from "c/setupAssistantCustomMcpServers";
import getCustomMcpServerSetupState from "@salesforce/apex/AgentforceConversationConfigController.getCustomMcpServerSetupState";
import saveCustomMcpServerConfiguration from "@salesforce/apex/AgentforceConversationConfigController.saveCustomMcpServerConfiguration";

jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.getCustomMcpServerSetupState",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.saveCustomMcpServerConfiguration",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const FIRST_SERVER_ID = "1g1000000000001AAA";
const SECOND_SERVER_ID = "1g1000000000002AAA";
const OPTIONS = [
  { id: FIRST_SERVER_ID, developerName: "Alpha_Server" },
  { id: SECOND_SERVER_ID, developerName: "Zulu_Server" }
];
const UNCONFIGURED = {
  options: OPTIONS,
  configuration: {
    mcpServerDefinitionId: null,
    developerName: null,
    state: "UNCONFIGURED",
    message: "Select a Custom MCP Server to configure client setup."
  }
};
const READY = {
  options: OPTIONS,
  configuration: {
    mcpServerDefinitionId: FIRST_SERVER_ID,
    developerName: "Alpha_Server",
    state: "READY",
    message: "Headless 360 is configured to use Alpha_Server."
  }
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

function createSetup(configurationHandler, toastHandler) {
  const element = createElement("c-setup-assistant-custom-mcp-servers", {
    is: SetupAssistantCustomMcpServers
  });
  if (configurationHandler) {
    element.addEventListener("configurationchange", configurationHandler);
  }
  if (toastHandler) {
    element.addEventListener("lightning__showtoast", toastHandler);
  }
  document.body.appendChild(element);
  return element;
}

describe("c-setup-assistant-custom-mcp-servers", () => {
  beforeEach(() => {
    getCustomMcpServerSetupState.mockResolvedValue(UNCONFIGURED);
    saveCustomMcpServerConfiguration.mockResolvedValue(
      UNCONFIGURED.configuration
    );
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("shows loading and expands client setup for an unconfigured server", async () => {
    let resolveSetupState;
    getCustomMcpServerSetupState.mockReturnValue(
      new Promise((resolve) => {
        resolveSetupState = resolve;
      })
    );
    const configurationHandler = jest.fn();
    const element = createSetup(configurationHandler);

    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();

    resolveSetupState(UNCONFIGURED);
    await flushPromises();

    const wrapper = element.shadowRoot.querySelector(
      '[data-id="custom-mcp-servers-wrapper"]'
    );
    const selectionCard = element.shadowRoot.querySelector(
      '[data-id="custom-mcp-selection-card"]'
    );
    const combobox = element.shadowRoot.querySelector(
      '[data-id="mcp-server-select"]'
    );
    const viewInSetupButton = element.shadowRoot.querySelector(
      '[data-id="view-mcp-server-in-setup"]'
    );
    expect(wrapper.className).toContain("slds-border_top");
    expect(wrapper.className).toContain("slds-box_xx-small");
    expect(selectionCard.querySelector('[slot="title"]')).toBeNull();
    expect(
      selectionCard.querySelector('[data-id="configuration-state"]').label
    ).toBe("UNCONFIGURED");
    expect(combobox.options).toEqual([
      { label: "Alpha_Server", value: FIRST_SERVER_ID },
      { label: "Zulu_Server", value: SECOND_SERVER_ID }
    ]);
    expect(combobox.value).toBe("");
    expect(combobox.disabled).toBe(true);
    expect(viewInSetupButton.disabled).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="custom-mcp-client-guidance"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="toggle-mcp-guidance"]')
        .ariaExpanded
    ).toBe("true");
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { configured: false } })
    );
  });

  it("renders a ready configuration expanded with accessible Headless 360 Showcase disclosure", async () => {
    getCustomMcpServerSetupState.mockResolvedValue(READY);
    const configurationHandler = jest.fn();
    const element = createSetup(configurationHandler);
    await flushPromises();

    const card = element.shadowRoot.querySelector(
      '[data-id="custom-mcp-servers-card"]'
    );
    const title = card.querySelector('h3[slot="title"]');
    const titleIcon = title.querySelector("lightning-icon");
    const toggle = element.shadowRoot.querySelector(
      '[data-id="toggle-mcp-guidance"]'
    );
    const viewInSetupButton = element.shadowRoot.querySelector(
      '[data-id="view-mcp-server-in-setup"]'
    );
    const showcase = element.shadowRoot.querySelector(
      "c-headless-360-showcase"
    );

    expect(title.textContent).toContain("Custom MCP Servers Setup");
    expect(titleIcon.iconName).toBe("standard:mcp_server");
    expect(titleIcon.className).toContain("slds-m-right_small");
    expect(toggle.iconName).toBe("utility:chevrondown");
    expect(toggle.ariaExpanded).toBe("true");
    expect(toggle.ariaControls).toMatch(/^custom-mcp-client-guidance/);
    expect(showcase).not.toBeNull();
    const selectionCard = element.shadowRoot.querySelector(
      '[data-id="custom-mcp-selection-card-wrapper"]'
    );
    expect(
      showcase.compareDocumentPosition(selectionCard) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(viewInSetupButton.label).toBe("View in Setup");
    expect(viewInSetupButton.iconName).toBe("utility:setup");
    expect(viewInSetupButton.variant).toBe("brand-outline");
    expect(viewInSetupButton.disabled).toBe(false);
    const newTab = { location: {} };
    const originalWindowOpen = window.open;
    window.open = jest.fn(() => newTab);
    try {
      viewInSetupButton.click();
      expect(window.open).toHaveBeenCalledWith("", "_blank");
      expect(newTab.location.href).toBe(
        `${window.location.origin}/lightning/setup/McpServer/${FIRST_SERVER_ID}/view?setup__source=PLATFORM_CUSTOM_MCP_SERVER`
      );
    } finally {
      window.open = originalWindowOpen;
    }
    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').value
    ).toBe(FIRST_SERVER_ID);
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { configured: true } })
    );
  });

  it("enters edit mode and saves a changed server", async () => {
    const savedConfiguration = {
      mcpServerDefinitionId: SECOND_SERVER_ID,
      developerName: "Zulu_Server",
      state: "READY",
      message: "Headless 360 is configured to use Zulu_Server."
    };
    saveCustomMcpServerConfiguration.mockResolvedValue(savedConfiguration);
    const configurationHandler = jest.fn();
    const toastHandler = jest.fn();
    const element = createSetup(configurationHandler, toastHandler);
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="edit-mcp-server"]').click();
    await flushPromises();

    const footerActions = Array.from(
      element.shadowRoot.querySelectorAll(
        '[data-id="mcp-footer-actions"] lightning-button'
      )
    );
    expect(footerActions.map((action) => action.dataset.id)).toEqual([
      "clear-mcp-server",
      "cancel-mcp-server",
      "save-mcp-server"
    ]);
    expect(
      element.shadowRoot.querySelector('[data-id="save-mcp-server"]').disabled
    ).toBe(true);

    element.shadowRoot
      .querySelector('[data-id="mcp-server-select"]')
      .dispatchEvent(
        new CustomEvent("change", { detail: { value: SECOND_SERVER_ID } })
      );
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="save-mcp-server"]').disabled
    ).toBe(false);

    element.shadowRoot.querySelector('[data-id="save-mcp-server"]').click();
    await flushPromises();

    expect(saveCustomMcpServerConfiguration).toHaveBeenCalledWith({
      mcpServerDefinitionId: SECOND_SERVER_ID
    });
    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').value
    ).toBe(SECOND_SERVER_ID);
    expect(
      element.shadowRoot.querySelector('[data-id="edit-mcp-server"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="custom-mcp-client-guidance"]')
    ).not.toBeNull();
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { configured: true } })
    );
    expect(toastHandler.mock.calls[0][0].detail).toMatchObject({
      title: "Success",
      variant: "success"
    });
  });

  it("cancels edits and restores the persisted ready selection", async () => {
    getCustomMcpServerSetupState.mockResolvedValue(READY);
    const element = createSetup();
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="edit-mcp-server"]').click();
    element.shadowRoot
      .querySelector('[data-id="mcp-server-select"]')
      .dispatchEvent(
        new CustomEvent("change", { detail: { value: SECOND_SERVER_ID } })
      );
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="cancel-mcp-server"]').click();
    await flushPromises();

    expect(saveCustomMcpServerConfiguration).not.toHaveBeenCalled();
    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').value
    ).toBe(FIRST_SERVER_ID);
    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').disabled
    ).toBe(true);
  });

  it("disables conflicting actions while a save is pending", async () => {
    getCustomMcpServerSetupState.mockResolvedValue(READY);
    let resolveSave;
    saveCustomMcpServerConfiguration.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );
    const element = createSetup();
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="edit-mcp-server"]').click();
    element.shadowRoot
      .querySelector('[data-id="mcp-server-select"]')
      .dispatchEvent(
        new CustomEvent("change", { detail: { value: SECOND_SERVER_ID } })
      );
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="save-mcp-server"]').click();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').disabled
    ).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="clear-mcp-server"]').disabled
    ).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="cancel-mcp-server"]').disabled
    ).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="save-mcp-server"]').disabled
    ).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="toggle-mcp-guidance"]')
        .disabled
    ).toBe(true);

    resolveSave({
      mcpServerDefinitionId: SECOND_SERVER_ID,
      developerName: "Zulu_Server",
      state: "READY",
      message: "Headless 360 is configured to use Zulu_Server."
    });
    await flushPromises();
  });

  it("clears the persisted server and expands client guidance", async () => {
    getCustomMcpServerSetupState.mockResolvedValue(READY);
    saveCustomMcpServerConfiguration.mockResolvedValue(
      UNCONFIGURED.configuration
    );
    const configurationHandler = jest.fn();
    const element = createSetup(configurationHandler);
    await flushPromises();
    configurationHandler.mockClear();

    element.shadowRoot.querySelector('[data-id="edit-mcp-server"]').click();
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="clear-mcp-server"]').click();
    await flushPromises();

    expect(saveCustomMcpServerConfiguration).toHaveBeenCalledWith({
      mcpServerDefinitionId: null
    });
    expect(
      element.shadowRoot.querySelector('[data-id="custom-mcp-client-guidance"]')
    ).not.toBeNull();
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { configured: false } })
    );
  });

  it("renders stale and empty states without treating them as configured", async () => {
    getCustomMcpServerSetupState.mockResolvedValue({
      options: [],
      configuration: {
        mcpServerDefinitionId: FIRST_SERVER_ID,
        developerName: null,
        state: "STALE",
        message: "The configured Custom MCP Server is no longer available."
      }
    });
    const configurationHandler = jest.fn();
    const element = createSetup(configurationHandler);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="configuration-state"]').label
    ).toBe("STALE");
    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').value
    ).toBe("");
    expect(
      element.shadowRoot.querySelector('[data-id="empty-options-guidance"]')
        .textContent
    ).toContain("No Custom MCP Servers");
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { configured: false } })
    );
  });

  it("renders unavailable discovery and reports the failure", async () => {
    getCustomMcpServerSetupState.mockResolvedValue({
      options: [],
      configuration: {
        mcpServerDefinitionId: null,
        developerName: null,
        state: "UNAVAILABLE",
        message: "Custom MCP Server discovery is unavailable."
      }
    });
    const configurationHandler = jest.fn();
    const toastHandler = jest.fn();
    const element = createSetup(configurationHandler, toastHandler);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="configuration-state"]').label
    ).toBe("UNAVAILABLE");
    expect(
      element.shadowRoot.querySelector('[data-id="edit-mcp-server"]').disabled
    ).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="toggle-mcp-guidance"]')
        .disabled
    ).toBe(true);
    expect(toastHandler.mock.calls[0][0].detail).toMatchObject({
      title: "Unable to load Custom MCP Servers",
      variant: "error"
    });
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { configured: false } })
    );
  });

  it("preserves the persisted selection and edit mode after a failed save", async () => {
    getCustomMcpServerSetupState.mockResolvedValue(READY);
    saveCustomMcpServerConfiguration.mockRejectedValue({
      body: { message: "Unable to validate the selected Custom MCP Server." }
    });
    const toastHandler = jest.fn();
    const element = createSetup(null, toastHandler);
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="edit-mcp-server"]').click();
    element.shadowRoot
      .querySelector('[data-id="mcp-server-select"]')
      .dispatchEvent(
        new CustomEvent("change", { detail: { value: SECOND_SERVER_ID } })
      );
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="save-mcp-server"]').click();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').value
    ).toBe(SECOND_SERVER_ID);
    expect(
      element.shadowRoot.querySelector('[data-id="save-mcp-server"]')
    ).not.toBeNull();
    expect(toastHandler.mock.calls[0][0].detail).toMatchObject({
      title: "Unable to save Custom MCP Server",
      variant: "error"
    });

    element.shadowRoot.querySelector('[data-id="cancel-mcp-server"]').click();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="mcp-server-select"]').value
    ).toBe(FIRST_SERVER_ID);
  });

  it("toggles the client guidance independently of editing", async () => {
    getCustomMcpServerSetupState.mockResolvedValue(READY);
    const element = createSetup();
    await flushPromises();

    const toggle = element.shadowRoot.querySelector(
      '[data-id="toggle-mcp-guidance"]'
    );
    toggle.click();
    await flushPromises();

    expect(toggle.iconName).toBe("utility:chevronright");
    expect(toggle.ariaExpanded).toBe("false");
    expect(
      element.shadowRoot.querySelector('[data-id="custom-mcp-client-guidance"]')
    ).toBeNull();
  });
});
