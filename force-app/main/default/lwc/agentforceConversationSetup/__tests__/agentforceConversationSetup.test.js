import { createElement } from "@lwc/engine-dom";
import AgentforceConversationSetup from "c/agentforceConversationSetup";
import getActiveEmployeeAgents from "@salesforce/apex/AgentforceConversationConfigController.getActiveEmployeeAgents";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";
import saveAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.saveAgentforceConfiguration";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.getActiveEmployeeAgents",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.saveAgentforceConfiguration",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const BOT_ID = "0Xx000000000001AAA";
const SECOND_BOT_ID = "0Xx000000000002AAA";
const EXTENSION_STATUS = {
  state: "NOT_INSTALLED",
  message: "Install the extension to use Agentforce features.",
  configuredSubscriberPackageId: "033000000000001AAA",
  configuredSubscriberPackageVersionId: "04t000000000001AAA",
  targetVersionLabel: "1.7.0-1",
  directInstallUrl: "/packaging/installPackage.apexp?p0=04t000000000001AAA",
  extensionLabel: "Package Visualizer Agentforce Extension",
  description: "Adds optional Agentforce intelligence.",
  iconName: "standard:agent_astro",
  permissionSetLabel: "Package_Visualizer_Agentforce_Extension_Permissions",
  namespacePrefix: "pkgviz"
};
const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

function createSetup() {
  const element = createElement("c-agentforce-conversation-setup", {
    is: AgentforceConversationSetup
  });
  document.body.appendChild(element);
  return element;
}

describe("c-agentforce-conversation-setup", () => {
  beforeEach(() => {
    getActiveEmployeeAgents.mockResolvedValue([
      {
        botId: BOT_ID,
        label: "ISV Release Agent",
        developerName: "ISV_Release_Agent"
      },
      {
        botId: SECOND_BOT_ID,
        label: "Subscriber Agent",
        developerName: "Subscriber_Agent"
      }
    ]);
    getAgentforceConfiguration.mockResolvedValue({
      botId: BOT_ID,
      label: "ISV Release Agent",
      developerName: "ISV_Release_Agent",
      state: "READY",
      message: "Package Visualizer is configured."
    });
    saveAgentforceConfiguration.mockResolvedValue({
      botId: BOT_ID,
      state: "READY"
    });
    getExtensionStatus.mockResolvedValue({ ...EXTENSION_STATUS });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("loads active agents and preselects the configured agent", async () => {
    const configurationHandler = jest.fn();
    const element = createElement("c-agentforce-conversation-setup", {
      is: AgentforceConversationSetup
    });
    element.addEventListener("configurationchange", configurationHandler);
    document.body.appendChild(element);
    await flushPromises();

    const combobox = element.shadowRoot.querySelector(
      '[data-id="agent-select"]'
    );
    expect(combobox.options).toEqual([
      {
        label: "ISV Release Agent (ISV_Release_Agent)",
        value: BOT_ID
      },
      {
        label: "Subscriber Agent (Subscriber_Agent)",
        value: SECOND_BOT_ID
      }
    ]);
    expect(combobox.value).toBe(BOT_ID);
    expect(combobox.disabled).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="edit-agent"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="save-agent"]')
    ).toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="configuration-state"]').label
    ).toBe("READY");
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: { configured: true }
      })
    );
  });

  it("groups setup actions and opens only the Showcase when the extension is not installed", async () => {
    const element = createSetup();
    await flushPromises();

    const actionGroup = element.shadowRoot.querySelector(
      'lightning-button-group[slot="actions"]'
    );
    expect(actionGroup).not.toBeNull();
    const actions = Array.from(
      actionGroup.querySelectorAll("lightning-button-icon")
    );
    expect(actions.map((action) => action.dataset.id)).toEqual([
      "edit-agent",
      "toggle-agentforce"
    ]);
    expect(
      element.shadowRoot.querySelector('[data-id="refresh-agentforce"]')
    ).toBeNull();
    expect(actions.every((action) => action.variant === undefined)).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="agentforce-setup-body"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="agent-select"]')
    ).not.toBeNull();
    const showcase = element.shadowRoot.querySelector("c-in-app-guidance-card");
    expect(showcase).not.toBeNull();
    expect(showcase.extensionStatus).toEqual(EXTENSION_STATUS);
    expect(showcase.hideInAppGuidance).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="toggle-agentforce"]').iconName
    ).toBe("utility:chevrondown");
  });

  it.each(["READY", "UPDATE_REQUIRED", "MISCONFIGURED", "UNAVAILABLE"])(
    "starts collapsed when extension state is %s",
    async (state) => {
      getExtensionStatus.mockResolvedValue({ ...EXTENSION_STATUS, state });

      const element = createSetup();
      await flushPromises();

      expect(
        element.shadowRoot.querySelector('[data-id="agentforce-setup-body"]')
      ).not.toBeNull();
      expect(
        element.shadowRoot.querySelector('[data-id="agent-select"]')
      ).not.toBeNull();
      expect(
        element.shadowRoot.querySelector("c-in-app-guidance-card")
      ).toBeNull();
      const toggle = element.shadowRoot.querySelector(
        '[data-id="toggle-agentforce"]'
      );
      expect(toggle.iconName).toBe("utility:chevronright");
      expect(toggle.ariaExpanded).toBe("false");
    }
  );

  it("starts expanded and passes permission-required status when extension access is denied", async () => {
    getExtensionStatus.mockRejectedValue({
      body: {
        message:
          "You do not have access to the Apex class named: pkgviz.AgentforceExtensionStatusController"
      }
    });

    const element = createSetup();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-in-app-guidance-card")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="toggle-agentforce"]').iconName
    ).toBe("utility:chevrondown");
    expect(
      element.shadowRoot.querySelector('[data-id="toggle-agentforce"]')
        .ariaExpanded
    ).toBe("true");
    expect(
      element.shadowRoot.querySelector("c-in-app-guidance-card").extensionStatus
    ).toEqual(
      expect.objectContaining({
        state: "PERMISSION_REQUIRED",
        message:
          "Package Visualizer Permission is required to verify the Agentforce extension status."
      })
    );
  });

  it("keeps Edit independent from disclosure and toggles only with the chevron", async () => {
    getExtensionStatus.mockResolvedValue({
      ...EXTENSION_STATUS,
      state: "READY"
    });
    const element = createSetup();
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="edit-agent"]').click();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="agentforce-setup-body"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector("c-in-app-guidance-card")
    ).toBeNull();

    element.shadowRoot.querySelector('[data-id="toggle-agentforce"]').click();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector("c-in-app-guidance-card")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="toggle-agentforce"]').iconName
    ).toBe("utility:chevrondown");
  });

  it("shows footer actions while editing and returns to view mode after save", async () => {
    saveAgentforceConfiguration.mockResolvedValue({
      botId: SECOND_BOT_ID,
      label: "Subscriber Agent",
      developerName: "Subscriber_Agent",
      state: "READY",
      message: "Package Visualizer is configured to use Subscriber Agent."
    });
    const element = createSetup();
    const configurationHandler = jest.fn();
    element.addEventListener("configurationchange", configurationHandler);
    await flushPromises();
    configurationHandler.mockClear();
    element.shadowRoot.querySelector('[data-id="edit-agent"]').click();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="edit-agent"]')
    ).toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="agent-select"]').disabled
    ).toBe(false);
    expect(
      element.shadowRoot.querySelector('[data-id="save-agent"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="clear-agent"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="cancel-agent"]')
    ).not.toBeNull();
    const footerGroup = element.shadowRoot.querySelector(
      '[data-id="footer-actions"]'
    );
    expect(footerGroup).not.toBeNull();
    const footerActions = Array.from(
      footerGroup.querySelectorAll("lightning-button")
    );
    expect(footerActions.map((action) => action.dataset.id)).toEqual([
      "clear-agent",
      "cancel-agent",
      "save-agent"
    ]);
    expect(footerActions.map((action) => action.variant)).toEqual([
      undefined,
      undefined,
      "brand"
    ]);

    element.shadowRoot
      .querySelector('[data-id="agent-select"]')
      .dispatchEvent(
        new CustomEvent("change", { detail: { value: SECOND_BOT_ID } })
      );

    element.shadowRoot.querySelector('[data-id="save-agent"]').click();
    await flushPromises();

    expect(saveAgentforceConfiguration).toHaveBeenCalledWith({
      botId: SECOND_BOT_ID
    });
    expect(getAgentforceConfiguration).toHaveBeenCalledTimes(1);
    expect(
      element.shadowRoot.querySelector('[data-id="configuration-message"]')
        .value
    ).toBe("Package Visualizer is configured to use Subscriber Agent.");
    expect(
      element.shadowRoot.querySelector('[data-id="agent-select"]').value
    ).toBe(SECOND_BOT_ID);
    expect(
      element.shadowRoot.querySelector('[data-id="edit-agent"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="save-agent"]')
    ).toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="agent-select"]').disabled
    ).toBe(true);
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: { configured: true }
      })
    );
  });

  it("clears the org-wide configuration and returns to view mode", async () => {
    saveAgentforceConfiguration.mockResolvedValue({
      botId: null,
      state: "UNCONFIGURED",
      message: "Select an active Agentforce Employee Agent."
    });
    const element = createSetup();
    const configurationHandler = jest.fn();
    element.addEventListener("configurationchange", configurationHandler);
    await flushPromises();
    configurationHandler.mockClear();

    element.shadowRoot.querySelector('[data-id="edit-agent"]').click();
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="clear-agent"]').click();
    await flushPromises();

    expect(saveAgentforceConfiguration).toHaveBeenCalledWith({ botId: null });
    expect(
      element.shadowRoot.querySelector('[data-id="edit-agent"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="clear-agent"]')
    ).toBeNull();
    expect(configurationHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: { configured: false }
      })
    );
  });

  it("cancels edits and restores the persisted selection", async () => {
    const element = createSetup();
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="edit-agent"]').click();
    element.shadowRoot
      .querySelector('[data-id="agent-select"]')
      .dispatchEvent(
        new CustomEvent("change", { detail: { value: SECOND_BOT_ID } })
      );
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="cancel-agent"]').click();
    await flushPromises();

    expect(saveAgentforceConfiguration).not.toHaveBeenCalled();
    expect(
      element.shadowRoot.querySelector('[data-id="agent-select"]').value
    ).toBe(BOT_ID);
    expect(
      element.shadowRoot.querySelector('[data-id="agent-select"]').disabled
    ).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="edit-agent"]')
    ).not.toBeNull();
  });

  it("shows stale configuration and requires a replacement selection", async () => {
    getAgentforceConfiguration.mockResolvedValue({
      botId: BOT_ID,
      state: "STALE",
      message: "The configured agent is no longer active."
    });

    const element = createSetup();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="configuration-state"]').label
    ).toBe("STALE");
    expect(
      element.shadowRoot.querySelector('[data-id="configuration-message"]')
        .value
    ).toContain("no longer active");
    expect(
      element.shadowRoot.querySelector('[data-id="agent-select"]').value
    ).toBe("");
  });

  it("passes the current selection to the setup panel test action", async () => {
    const element = createSetup();
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="edit-agent"]').click();
    await flushPromises();
    element.shadowRoot
      .querySelector('[data-id="agent-select"]')
      .dispatchEvent(
        new CustomEvent("change", { detail: { value: SECOND_BOT_ID } })
      );
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-agentforce-conversation-actions")
        .botId
    ).toBe(SECOND_BOT_ID);
  });

  it("places the agent selector and panel test together with help text", async () => {
    const element = createSetup();
    await flushPromises();

    const selectionRow = element.shadowRoot.querySelector(
      '[data-id="agent-selection-row"]'
    );
    const selectorColumn = selectionRow.querySelector(
      '[data-id="agent-selection-column"]'
    );
    const actionColumn = selectionRow.querySelector(
      '[data-id="agent-action-column"]'
    );
    expect(
      selectionRow.querySelector('[data-id="agent-select"]')
    ).not.toBeNull();
    expect(
      selectionRow.querySelector("c-agentforce-conversation-actions")
    ).not.toBeNull();
    expect(selectionRow.querySelector("lightning-helptext").content).toBe(
      "Intended users must also have Salesforce access to the selected Employee Agent. The test opens the native desktop Agentforce panel; confirm its response there."
    );
    expect(selectorColumn.classList).toContain("slds-size_10-of-12");
    expect(selectorColumn.classList).toContain("slds-large-size_2-of-3");
    expect(actionColumn.classList).toContain("slds-size_2-of-12");
    expect(actionColumn.classList).toContain("slds-large-size_1-of-3");
  });
});
