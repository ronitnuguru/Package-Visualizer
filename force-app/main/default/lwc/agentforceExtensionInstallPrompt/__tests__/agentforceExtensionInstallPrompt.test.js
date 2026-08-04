import { createElement } from "@lwc/engine-dom";
import { mockNavigate } from "lightning/navigation";
import AgentforceExtensionInstallPrompt from "c/agentforceExtensionInstallPrompt";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const BASE_STATUS = {
  state: "NOT_INSTALLED",
  message: "Install the extension to use Agentforce intelligence.",
  configuredSubscriberPackageId: "033000000000001AAA",
  configuredSubscriberPackageVersionId: "04t000000000001AAA",
  installedSubscriberPackageId: null,
  installedSubscriberPackageVersionId: null,
  targetVersionLabel: "1.7.0-1",
  directInstallUrl: "/packaging/installPackage.apexp?p0=04t000000000001AAA",
  extensionLabel: "Package Visualizer Agentforce Extension",
  description: "Adds optional Agentforce intelligence.",
  iconName: "standard:agent_astro",
  permissionSetLabel: "Package_Visualizer_Agentforce_Extension_Permissions",
  namespacePrefix: "pkgviz"
};

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function createPrompt(status) {
  const element = createElement("c-agentforce-extension-install-prompt", {
    is: AgentforceExtensionInstallPrompt
  });
  if (status) {
    element.status = status;
  } else {
    element.autoLoad = true;
  }
  document.body.appendChild(element);
  return element;
}

describe("c-agentforce-extension-install-prompt", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("replaces caller content with the package illustration when not ready", async () => {
    const element = createPrompt({
      ...BASE_STATUS,
      state: "UPDATE_REQUIRED"
    });
    await flushPromises();

    const illustration = element.shadowRoot.querySelector(
      '[data-id="extension-illustration"]'
    );
    expect(illustration).not.toBeNull();
    expect(illustration.title).toBe(
      "Package Visualizer Agentforce Extension update available"
    );
    expect(
      element.shadowRoot.querySelector('[data-id="illustrated-content"]')
    ).toBeNull();
  });

  it("offers the latest extension when it is not installed", async () => {
    const element = createPrompt(BASE_STATUS);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="extension-illustration"]')
        .title
    ).toBe("Package Visualizer Agentforce Extension");
    expect(
      element.shadowRoot.querySelector('[data-id="state-message"]').textContent
    ).toContain("Install the extension");
    expect(
      element.shadowRoot.querySelector('[data-id="extension-illustration"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="primary-action"]').label
    ).toBe("Install");
    expect(getExtensionStatus).not.toHaveBeenCalled();
  });

  it("offers an update when the installed version differs", async () => {
    const element = createPrompt({
      ...BASE_STATUS,
      state: "UPDATE_REQUIRED",
      message: "Update to version 1.7.0-1 to continue.",
      installedSubscriberPackageId: "033000000000001AAA",
      installedSubscriberPackageVersionId: "04t000000000002AAA"
    });
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="extension-illustration"]')
        .title
    ).toBe("Package Visualizer Agentforce Extension update available");
    expect(
      element.shadowRoot.querySelector('[data-id="primary-action"]').label
    ).toBe("Upgrade");
  });

  it("renders caller content without an installation action when ready", async () => {
    const element = createPrompt({
      ...BASE_STATUS,
      state: "READY",
      message: "The extension is ready.",
      installedSubscriberPackageId: "033000000000001AAA",
      installedSubscriberPackageVersionId: "04t000000000001AAA"
    });
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="ready-content"]')
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="primary-action"]')
    ).toBeNull();
  });

  it.each(["MISCONFIGURED", "UNAVAILABLE"])(
    "shows the safe %s message without suggesting installation",
    async (state) => {
      const element = createPrompt({
        ...BASE_STATUS,
        state,
        message: "Package Visualizer could not verify the extension status."
      });
      await flushPromises();

      expect(
        element.shadowRoot.querySelector('[data-id="state-message"]')
          .textContent
      ).toContain("could not verify");
      expect(
        element.shadowRoot.querySelector('[data-id="primary-action"]')
      ).toBeNull();
    }
  );

  it("loads shared status when a caller does not provide it", async () => {
    getExtensionStatus.mockResolvedValue(BASE_STATUS);

    const element = createPrompt();
    await flushPromises();

    expect(getExtensionStatus).toHaveBeenCalledTimes(1);
    expect(
      element.shadowRoot.querySelector('[data-id="primary-action"]').label
    ).toBe("Install");
  });

  it("treats status lookup failures as unavailable", async () => {
    getExtensionStatus.mockRejectedValue(new Error("Tooling failed"));

    const element = createPrompt();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="state-message"]').textContent
    ).toContain("could not verify");
    expect(
      element.shadowRoot.querySelector('[data-id="primary-action"]')
    ).toBeNull();
  });

  it("renders only the registry-managed install action", async () => {
    const element = createPrompt(BASE_STATUS);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector('[data-id="listing-action"]')
    ).toBeNull();
    expect(
      element.shadowRoot.querySelector('[data-id="help-action"]')
    ).toBeNull();

    element.shadowRoot.querySelector('[data-id="primary-action"]').click();

    expect(mockNavigate.mock.calls).toEqual([
      [
        {
          type: "standard__webPage",
          attributes: {
            url: `${window.location.origin}${BASE_STATUS.directInstallUrl}`
          }
        }
      ]
    ]);
  });
});
