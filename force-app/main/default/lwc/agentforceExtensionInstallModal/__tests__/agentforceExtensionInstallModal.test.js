import { createElement } from "@lwc/engine-dom";
import AgentforceExtensionInstallModal from "c/agentforceExtensionInstallModal";

const STATUS = {
  state: "NOT_INSTALLED",
  message: "Install the extension to use Agentforce intelligence.",
  directInstallUrl: "/packaging/installPackage.apexp?p0=04t000000000001AAA",
  extensionLabel: "Package Visualizer Agentforce Extension",
  targetVersionLabel: "1.7.0-1"
};

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function createModal(status) {
  const element = createElement("c-agentforce-extension-install-modal", {
    is: AgentforceExtensionInstallModal
  });
  element.status = status;
  document.body.appendChild(element);
  return element;
}

describe("c-agentforce-extension-install-modal", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("frames a missing extension as an installation task", async () => {
    const element = createModal(STATUS);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("lightning-modal-header").label
    ).toBe("Install Agentforce extension");
    expect(
      element.shadowRoot.querySelector("c-agentforce-extension-install-prompt")
        .status
    ).toEqual(STATUS);
    expect(
      element.shadowRoot.querySelector('[data-id="close-action"]').label
    ).toBe("Close");
  });

  it("frames a mismatched extension as an update task", async () => {
    const element = createModal({ ...STATUS, state: "UPDATE_REQUIRED" });
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("lightning-modal-header").label
    ).toBe("Update Agentforce extension");
  });
});
