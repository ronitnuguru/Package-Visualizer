import { createElement } from "@lwc/engine-dom";
import AgentforceConversationActions from "c/agentforceConversationActions";
import { execute, open } from "lightning/accApi";
import getAgentforceConfiguration from "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";
import AgentforceExtensionInstallModal from "c/agentforceExtensionInstallModal";

jest.mock(
  "@salesforce/apex/AgentforceConversationConfigController.getAgentforceConfiguration",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const BOT_ID = "0Xx000000000001AAA";
const KICKOFF = "Analyze the selected package context.";
const READY_EXTENSION = {
  state: "READY",
  message: "The Agentforce extension is ready.",
  configuredSubscriberPackageId: "033000000000001AAA",
  configuredSubscriberPackageVersionId: "04t000000000001AAA",
  installedSubscriberPackageId: "033000000000001AAA",
  installedSubscriberPackageVersionId: "04t000000000001AAA",
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
};

function createContextAction(overrides = {}) {
  const element = createElement("c-agentforce-conversation-actions", {
    is: AgentforceConversationActions
  });
  element.displayMode = "contextAction";
  element.utterance = KICKOFF;
  element.alternativeText = "Chat with Agentforce";
  Object.assign(element, overrides);
  document.body.appendChild(element);
  return element;
}

describe("c-agentforce-conversation-actions", () => {
  beforeEach(() => {
    getExtensionStatus.mockResolvedValue(READY_EXTENSION);
    getAgentforceConfiguration.mockResolvedValue({
      botId: BOT_ID,
      label: "Package Visualizer Agent",
      developerName: "Package_Visualizer_Agent",
      state: "READY",
      message: "Ready"
    });
    open.mockResolvedValue();
    execute.mockResolvedValue();
    AgentforceExtensionInstallModal.open.mockResolvedValue();
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders the default border-filled context icon", async () => {
    const element = createContextAction();
    await flushPromises();

    const button = element.shadowRoot.querySelector(
      '[data-id="context-action"]'
    );

    expect(button.iconName).toBe("utility:agent_astro");
    expect(button.variant).toBe("border-filled");
    expect(button.alternativeText).toBe("Chat with Agentforce");
    expect(button.tooltip).toBe("Chat with Agentforce");
    expect(button.disabled).toBe(false);
  });

  it("uses the caller-provided context icon variant", async () => {
    const element = createContextAction({ variant: "brand" });
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="context-action"]').variant
    ).toBe("brand");
  });

  it("renders Generate and Agentforce as direct button-group children", async () => {
    const element = createContextAction({ showModelsGenerate: true });
    await flushPromises();

    const group = element.shadowRoot.querySelector("lightning-button-group");
    const generate = group.querySelector('[data-id="generate"]');
    const agent = group.querySelector('[data-id="context-action"]');

    expect(generate.parentElement).toBe(group);
    expect(agent.parentElement).toBe(group);
  });

  it("dispatches the Models API action independently", async () => {
    const handler = jest.fn();
    const element = createContextAction({ showModelsGenerate: true });
    element.addEventListener("modelsgenerate", handler);
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="generate"]').click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it("opens the configured agent before executing the parent utterance", async () => {
    const conversationOpenHandler = jest.fn();
    const element = createContextAction();
    element.addEventListener("conversationopen", conversationOpenHandler);
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="context-action"]').click();
    await flushPromises();

    expect(open).toHaveBeenCalledWith(BOT_ID);
    expect(conversationOpenHandler).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(KICKOFF, BOT_ID);
    expect(open.mock.invocationCallOrder[0]).toBeLessThan(
      execute.mock.invocationCallOrder[0]
    );
  });

  it("honors domain disabled state and missing utterances", async () => {
    const disabledElement = createContextAction({ disabled: true });
    await flushPromises();

    expect(
      disabledElement.shadowRoot.querySelector('[data-id="context-action"]')
        .disabled
    ).toBe(true);

    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    const emptyElement = createContextAction({ utterance: "" });
    await flushPromises();

    expect(
      emptyElement.shadowRoot.querySelector('[data-id="context-action"]')
        .disabled
    ).toBe(true);
  });

  it("disables the launcher when configuration is stale", async () => {
    getAgentforceConfiguration.mockResolvedValue({
      botId: BOT_ID,
      state: "STALE",
      message: "Select another active Employee Agent."
    });

    const element = createContextAction();
    await flushPromises();

    const button = element.shadowRoot.querySelector(
      '[data-id="context-action"]'
    );
    expect(button.disabled).toBe(true);
    expect(button.tooltip).toBe("Select another active Employee Agent.");
    expect(
      element.shadowRoot.querySelector('[data-id="configuration-guidance"]')
    ).toBeNull();
  });

  it("remains safely disabled when Agentforce configuration is unavailable", async () => {
    getAgentforceConfiguration.mockRejectedValue(
      new Error("Configuration service unavailable")
    );

    const element = createContextAction();
    await flushPromises();

    const button = element.shadowRoot.querySelector(
      '[data-id="context-action"]'
    );
    expect(button.disabled).toBe(true);
    expect(button.tooltip).toBe(
      "Agentforce configuration is unavailable. Review it in Setup Assistant."
    );
    expect(open).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("opens the install modal when the extension is not installed even if Bot configuration is stale", async () => {
    const extensionStatus = {
      ...READY_EXTENSION,
      state: "NOT_INSTALLED",
      message: "Install the Agentforce extension.",
      installedSubscriberPackageId: null,
      installedSubscriberPackageVersionId: null
    };
    getExtensionStatus.mockResolvedValue(extensionStatus);
    getAgentforceConfiguration.mockResolvedValue({
      botId: null,
      state: "STALE",
      message: "Select another active Employee Agent."
    });

    const element = createContextAction();
    await flushPromises();
    const button = element.shadowRoot.querySelector(
      '[data-id="context-action"]'
    );

    expect(button.disabled).toBe(false);
    button.click();
    await flushPromises();

    expect(AgentforceExtensionInstallModal.open).toHaveBeenCalledWith({
      size: "small",
      status: extensionStatus
    });
    expect(open).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("continues the conversation when an extension update is available", async () => {
    const extensionStatus = {
      ...READY_EXTENSION,
      state: "UPDATE_REQUIRED",
      message: "Update the Agentforce extension.",
      installedSubscriberPackageVersionId: "04t000000000002AAA"
    };
    getExtensionStatus.mockResolvedValue(extensionStatus);

    const element = createContextAction();
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="context-action"]').click();
    await flushPromises();

    expect(AgentforceExtensionInstallModal.open).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(BOT_ID);
    expect(execute).toHaveBeenCalledWith(KICKOFF, BOT_ID);
  });

  it.each(["MISCONFIGURED", "UNAVAILABLE"])(
    "disables the launcher when extension status is %s",
    async (state) => {
      getExtensionStatus.mockResolvedValue({
        ...READY_EXTENSION,
        state,
        message: "The extension status cannot be resolved."
      });

      const element = createContextAction();
      await flushPromises();

      expect(
        element.shadowRoot.querySelector('[data-id="context-action"]').disabled
      ).toBe(true);
      expect(
        element.shadowRoot.querySelector('[data-id="context-action"]').tooltip
      ).toBe("The extension status cannot be resolved.");
      expect(AgentforceExtensionInstallModal.open).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
    }
  );

  it("treats an extension-status failure as unavailable instead of installable", async () => {
    getExtensionStatus.mockRejectedValue(new Error("Tooling unavailable"));

    const element = createContextAction();
    await flushPromises();
    const button = element.shadowRoot.querySelector(
      '[data-id="context-action"]'
    );

    expect(button.disabled).toBe(true);
    expect(button.tooltip).toContain(
      "could not verify the Agentforce extension status"
    );
    button.click();
    await flushPromises();

    expect(AgentforceExtensionInstallModal.open).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("locks duplicate clicks while open is pending", async () => {
    let resolveOpen;
    open.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOpen = resolve;
        })
    );
    const element = createContextAction();
    await flushPromises();
    const button = element.shadowRoot.querySelector(
      '[data-id="context-action"]'
    );

    button.click();
    button.click();

    expect(open).toHaveBeenCalledTimes(1);
    resolveOpen();
    await flushPromises();
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("locks duplicate clicks while the install modal is pending", async () => {
    getExtensionStatus.mockResolvedValue({
      ...READY_EXTENSION,
      state: "NOT_INSTALLED",
      installedSubscriberPackageId: null,
      installedSubscriberPackageVersionId: null
    });
    let resolveModal;
    AgentforceExtensionInstallModal.open.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveModal = resolve;
        })
    );
    const element = createContextAction();
    await flushPromises();
    const button = element.shadowRoot.querySelector(
      '[data-id="context-action"]'
    );

    button.click();
    button.click();
    await Promise.resolve();

    expect(AgentforceExtensionInstallModal.open).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(true);
    resolveModal();
    await flushPromises();
    expect(button.disabled).toBe(false);
  });

  it("shows a permission-focused toast when ACC rejects the request", async () => {
    open.mockRejectedValue(new Error("Access denied"));
    const toastHandler = jest.fn();
    const conversationOpenHandler = jest.fn();
    const element = createContextAction();
    element.addEventListener("lightning__showtoast", toastHandler);
    element.addEventListener("conversationopen", conversationOpenHandler);
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="context-action"]').click();
    await flushPromises();

    expect(toastHandler).toHaveBeenCalledTimes(1);
    expect(conversationOpenHandler).not.toHaveBeenCalled();
    expect(toastHandler.mock.calls[0][0].detail.message).toContain(
      "access to the configured Agentforce Employee Agent"
    );
  });

  it("uses the explicit bot and expanded setup-test utterance", async () => {
    const element = createElement("c-agentforce-conversation-actions", {
      is: AgentforceConversationActions
    });
    element.displayMode = "setupTest";
    element.botId = BOT_ID;
    document.body.appendChild(element);

    element.shadowRoot.querySelector('[data-id="test-panel"]').click();
    await flushPromises();

    expect(getAgentforceConfiguration).not.toHaveBeenCalled();
    expect(getExtensionStatus).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(BOT_ID);
    expect(execute).toHaveBeenCalledWith(
      "Describe the package portfolio, failed package build, push-request, failed push-job, subscriber-support, and package-version readiness tasks you can perform, including the identifier each task requires.",
      BOT_ID
    );
  });

  it("renders responsive setup controls with equivalent accessible labels", () => {
    const element = createElement("c-agentforce-conversation-actions", {
      is: AgentforceConversationActions
    });
    element.displayMode = "setupTest";
    element.botId = BOT_ID;
    document.body.appendChild(element);

    const fullButton = element.shadowRoot.querySelector(
      '[data-id="test-panel"]'
    );
    const compactButton = element.shadowRoot.querySelector(
      '[data-id="test-panel-compact"]'
    );

    expect(fullButton.classList).toContain("slds-show_large");
    expect(compactButton.classList).toContain("slds-hide_large");
    expect(compactButton.alternativeText).toBe("Test in Panel");
    expect(compactButton.title).toBe("Test in Panel");
  });
});
