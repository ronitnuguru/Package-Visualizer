import { createElement } from "lwc";
import AgentforceMcpServers from "c/agentforceMcpServers";
import getMcpServers from "@salesforce/apexContinuation/PackageVisualizerCtrl.getMcpServers";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

jest.mock(
  "@salesforce/apexContinuation/PackageVisualizerCtrl.getMcpServers",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
const READY_STATUS = { state: "READY", message: "The extension is ready." };

async function createComponent() {
  const element = createElement("c-agentforce-mcp-servers", {
    is: AgentforceMcpServers
  });
  document.body.appendChild(element);
  await flushPromises();
  await flushPromises();
  return element;
}

describe("c-agentforce-mcp-servers extension fallback", () => {
  beforeEach(() => {
    getExtensionStatus.mockResolvedValue(READY_STATUS);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("reports an installed extension with no configured servers", async () => {
    getMcpServers.mockResolvedValue([]);

    const element = await createComponent();

    const prompt = element.shadowRoot.querySelector(
      "c-agentforce-extension-install-prompt"
    );
    expect(prompt).not.toBeNull();
    expect(getMcpServers).toHaveBeenCalledTimes(1);
    expect(
      element.shadowRoot.querySelector(
        'lightning-button[label="Install Managed Package"]'
      )
    ).toBeNull();
  });

  it("preserves a Tooling error instead of claiming the package is absent", async () => {
    getMcpServers.mockRejectedValue({
      body: { message: "Tooling API is unavailable." }
    });
    const toastHandler = jest.fn();
    const element = createElement("c-agentforce-mcp-servers", {
      is: AgentforceMcpServers
    });
    element.addEventListener("lightning__showtoast", toastHandler);
    document.body.appendChild(element);
    await flushPromises();
    await flushPromises();

    const prompt = element.shadowRoot.querySelector(
      "c-agentforce-extension-install-prompt"
    );
    expect(prompt).not.toBeNull();
    expect(toastHandler).toHaveBeenCalledTimes(1);
    expect(toastHandler.mock.calls[0][0].detail.message).toBe(
      "Tooling API is unavailable."
    );
  });
});
