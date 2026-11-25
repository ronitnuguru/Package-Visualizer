import { createElement } from "lwc";
import SetupAssistantCustomMcpServers from "c/setupAssistantCustomMcpServers";
import getState from "@salesforce/apex/PackageVisualizerMcpController.getProvisioningState";

jest.mock(
  "@salesforce/apex/PackageVisualizerMcpController.getProvisioningState",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
const find = (element, id) =>
  element.shadowRoot.querySelector(`[data-id="${id}"]`);
function mount() {
  const element = createElement("c-setup-assistant-custom-mcp-servers", {
    is: SetupAssistantCustomMcpServers
  });
  document.body.appendChild(element);
  return element;
}
beforeEach(() => {
  getState.mockResolvedValue({ canSave: false, issues: [] });
});
afterEach(() => {
  document.body.replaceChildren();
  jest.clearAllMocks();
});

it("shows the client guide without the legacy server-selection panel or edit action", async () => {
  const element = mount();
  await flush();
  expect(find(element, "custom-mcp-client-guidance")).not.toBeNull();
  expect(find(element, "toggle-mcp-guidance").ariaExpanded).toBe("true");
  expect(find(element, "custom-mcp-selection-card-wrapper")).toBeNull();
  expect(find(element, "edit-mcp-server")).toBeNull();
  expect(element.shadowRoot.querySelector("lightning-combobox")).toBeNull();
});

it("forwards provisioning readiness without emitting legacy selection events", async () => {
  const element = mount();
  const status = jest.fn();
  const selection = jest.fn();
  element.addEventListener("provisioningstatuschange", status);
  element.addEventListener("configurationchange", selection);
  await flush();
  const guide = find(element, "custom-mcp-client-guidance");
  guide.dispatchEvent(
    new CustomEvent("provisioningstatuschange", { detail: { ready: true } })
  );
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { ready: true } })
  );
  guide.dispatchEvent(
    new CustomEvent("provisioningstatuschange", { detail: { ready: false } })
  );
  expect(status).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { ready: false } })
  );
  expect(selection).not.toHaveBeenCalled();
});

it("collapses the guide and prevents collapse during a server mutation", async () => {
  const element = mount();
  await flush();
  const guide = find(element, "custom-mcp-client-guidance");
  const toggle = find(element, "toggle-mcp-guidance");
  guide.dispatchEvent(
    new CustomEvent("provisioningbusychange", { detail: { busy: true } })
  );
  await flush();
  expect(toggle.disabled).toBe(true);
  toggle.click();
  await flush();
  expect(find(element, "custom-mcp-client-guidance")).not.toBeNull();
  guide.dispatchEvent(
    new CustomEvent("provisioningbusychange", { detail: { busy: false } })
  );
  await flush();
  expect(toggle.disabled).toBe(false);
  toggle.click();
  await flush();
  expect(toggle.ariaExpanded).toBe("false");
  expect(find(element, "custom-mcp-client-guidance")).toBeNull();
  toggle.click();
  await flush();
  expect(find(element, "custom-mcp-client-guidance")).not.toBeNull();
});
