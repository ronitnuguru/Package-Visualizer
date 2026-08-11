import { createElement } from "lwc";
import { mockNavigate } from "lightning/navigation";
import InAppGuidanceCard from "c/inAppGuidanceCard";
import AgentScriptCoachModal from "c/agentScriptCoachModal";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";
import getNamespacePermSetId from "@salesforce/apex/PackageVisualizerCtrl.getNamespacePermSetId";

jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.getNamespacePermSetId",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const mockOpenAgentScriptCoachModal = AgentScriptCoachModal.open;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const EXTENSION_STATUS = {
  state: "READY",
  message: "The extension is installed at version 1.7.0-1.",
  configuredSubscriberPackageId: "033000000000001AAA",
  configuredSubscriberPackageVersionId: "04t000000000001AAA",
  installedSubscriberPackageId: "033000000000001AAA",
  installedSubscriberPackageVersionId: "04t000000000001AAA",
  targetVersionLabel: "1.7.0-1",
  directInstallUrl: "/packaging/installPackage.apexp?p0=04t000000000001AAA",
  extensionLabel: "Package Visualizer Agentforce Extension",
  description: "Adds optional Agentforce package intelligence.",
  iconName: "standard:agent_astro",
  permissionSetLabel: "Package_Visualizer_Agentforce_Extension_Permissions",
  namespacePrefix: "pkgviz"
};

function createCard(status, hideInAppGuidance) {
  const element = createElement("c-in-app-guidance-card", {
    is: InAppGuidanceCard
  });
  if (status) {
    element.extensionStatus = status;
  }
  if (hideInAppGuidance !== undefined) {
    element.hideInAppGuidance = hideInAppGuidance;
  }
  document.body.appendChild(element);
  return element;
}

function findButton(element, label) {
  return Array.from(
    element.shadowRoot.querySelectorAll("lightning-button")
  ).find((button) => button.label === label);
}

describe("c-in-app-guidance-card package installation", () => {
  beforeEach(() => {
    getExtensionStatus.mockResolvedValue({ ...EXTENSION_STATUS });
    getNamespacePermSetId.mockResolvedValue("0PS000000000001AAA");
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("loads registry-managed status when used standalone", async () => {
    const element = createCard();
    await flushPromises();

    expect(getExtensionStatus).toHaveBeenCalledTimes(1);
    const installedButton = findButton(element, "Installed");
    expect(installedButton).not.toBeNull();
    expect(installedButton.disabled).toBe(true);
    expect(
      element.shadowRoot.querySelector('[data-id="extension-description"]')
        .textContent
    ).toBe(EXTENSION_STATUS.description);
    expect(
      element.shadowRoot.querySelector('[data-id="extension-icon"]').iconName
    ).toBe(EXTENSION_STATUS.iconName);
  });

  it("uses injected status without loading it again and navigates to its install URL", async () => {
    const status = {
      ...EXTENSION_STATUS,
      state: "NOT_INSTALLED",
      message: "Install the extension.",
      installedSubscriberPackageId: null,
      installedSubscriberPackageVersionId: null
    };
    const element = createCard(status);
    await flushPromises();

    expect(getExtensionStatus).not.toHaveBeenCalled();
    findButton(element, "Install").click();
    expect(mockNavigate).toHaveBeenCalledWith({
      type: "standard__webPage",
      attributes: { url: status.directInstallUrl },
      state: { target: "_blank" }
    });
  });

  it("offers Upgrade when the registry target differs from the installed version", async () => {
    const element = createCard({
      ...EXTENSION_STATUS,
      state: "UPDATE_REQUIRED",
      message: "Update the extension to version 1.7.0-1.",
      installedSubscriberPackageVersionId: "04t000000000002AAA"
    });
    await flushPromises();

    expect(findButton(element, "Upgrade")).not.toBeNull();
    expect(findButton(element, "Install")).toBeUndefined();
  });

  it.each(["MISCONFIGURED", "UNAVAILABLE"])(
    "shows safe %s guidance without an install action",
    async (state) => {
      const message = "Package Visualizer could not verify the extension.";
      const element = createCard({ ...EXTENSION_STATUS, state, message });
      await flushPromises();

      expect(findButton(element, "Install")).toBeUndefined();
      expect(findButton(element, "Upgrade")).toBeUndefined();
      expect(findButton(element, "Installed")).toBeUndefined();
      expect(
        element.shadowRoot.querySelector('[data-id="extension-status-message"]')
          .textContent
      ).toBe(message);
      expect(findButton(element, "Provision Permission Sets")).toBeUndefined();
    }
  );

  it("shows a provisioning action when the extension status requires Package Visualizer Permission", async () => {
    const element = createCard({
      ...EXTENSION_STATUS,
      state: "PERMISSION_REQUIRED",
      message:
        "Package Visualizer Permission is required to verify the Agentforce extension status."
    });
    await flushPromises();

    expect(findButton(element, "Provision Permission Sets")).not.toBeNull();
  });

  it("opens the core permission set assignments from the provisioning action", async () => {
    const originalWindowOpen = window.open;
    const openTab = { closed: false, location: {} };
    window.open = jest.fn(() => openTab);
    const element = createCard({
      ...EXTENSION_STATUS,
      state: "PERMISSION_REQUIRED",
      message:
        "Package Visualizer Permission is required to verify the Agentforce extension status."
    });
    await flushPromises();

    findButton(element, "Provision Permission Sets").click();
    await flushPromises();

    expect(getNamespacePermSetId).toHaveBeenCalledWith({
      label: "Package_VisualizerPS",
      namespace: "pkgviz"
    });
    expect(openTab.location.href).toBe(
      `${window.location.origin}/lightning/setup/PermSets/0PS000000000001AAA/PermissionSetAssignment/home`
    );
    window.open = originalWindowOpen;
  });

  it.each(["READY", "UPDATE_REQUIRED"])(
    "shows the registry-managed permission action when the extension state is %s",
    async (state) => {
      const element = createCard({ ...EXTENSION_STATUS, state });
      await flushPromises();

      const permissionAction = element.shadowRoot.querySelector(
        '[data-id="permission-action"]'
      );
      expect(permissionAction).not.toBeNull();
      expect(permissionAction.iconName).toBe("action:manage_perm_sets");
    }
  );

  it("passes the generated deterministic Coach artifacts to the modal", async () => {
    const element = createCard(EXTENSION_STATUS);
    await flushPromises();

    findButton(element, "Generate").click();

    expect(mockOpenAgentScriptCoachModal).toHaveBeenCalledWith(
      expect.objectContaining({
        scriptId: "package-visualizer-agent",
        scriptBody: expect.stringContaining(
          'target: "apex://pkgviz__AgentforcePackagePortfolioAction"'
        ),
        scriptHash: expect.any(String),
        scriptManifest: expect.objectContaining({
          scriptId: "package-visualizer-agent"
        }),
        coachingEvidence: expect.objectContaining({
          scriptId: "package-visualizer-agent"
        }),
        publicChatSummary: expect.objectContaining({
          name: "Package Visualizer Agent"
        })
      })
    );
    const [{ scriptBody, scriptManifest, coachingEvidence }] =
      mockOpenAgentScriptCoachModal.mock.calls[0];
    expect(scriptBody).not.toMatch(/apex:\/\/(?!pkgviz__)/);
    expect(scriptManifest.actions).toHaveLength(9);
    expect(
      scriptManifest.actions.every(({ target }) =>
        target.startsWith("apex://pkgviz__")
      )
    ).toBe(true);
    expect(
      coachingEvidence.actionFlags.every(({ target }) =>
        target.startsWith("apex://pkgviz__")
      )
    ).toBe(true);
  });

  it("shows In-App Guidance by default", async () => {
    const element = createCard(EXTENSION_STATUS);
    await flushPromises();

    const actionIcons = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button-icon")
    );
    expect(
      actionIcons.find((button) => button.iconName === "utility:prompt")
    ).not.toBeUndefined();
    expect(
      element.shadowRoot.querySelector('[data-id="navigate-agentforce-studio"]')
    ).toBeNull();
  });

  it("shows Agentforce Studio navigation when In-App Guidance is hidden", async () => {
    const element = createCard(EXTENSION_STATUS, true);
    await flushPromises();

    const studioButton = element.shadowRoot.querySelector(
      '[data-id="navigate-agentforce-studio"]'
    );
    expect(studioButton).not.toBeNull();
    expect(studioButton.iconName).toBe("utility:agent_astro");
    expect(studioButton.tooltip).toBe("Navigate to Agentforce Studio");
    expect(
      Array.from(
        element.shadowRoot.querySelectorAll("lightning-button-icon")
      ).find((button) => button.iconName === "utility:prompt")
    ).toBeUndefined();

    studioButton.click();

    expect(mockNavigate).toHaveBeenCalledWith({
      type: "standard__webPage",
      attributes: {
        url: "/lightning/n/standard-AgentforceStudio?c__nav=agents"
      }
    });
  });
});
