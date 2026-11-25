import { createElement } from "lwc";
import Provisioner from "c/packageVisualizerMcpProvisioner";
import getState from "@salesforce/apex/PackageVisualizerMcpController.getProvisioningState";
import createServer from "@salesforce/apex/PackageVisualizerMcpController.createServer";
jest.mock(
  "@salesforce/apex/PackageVisualizerMcpController.getProvisioningState",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/PackageVisualizerMcpController.createServer",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
const absent = {
  loaded: true,
  canCreate: true,
  active: false,
  issues: [],
  assets: []
};
const existing = {
  loaded: true,
  canCreate: false,
  serverId: "server",
  serverUrl: "https://example.com/mcp",
  active: false,
  issues: [],
  assets: [
    {
      id: "one",
      kind: "MCP_TOOL",
      name: "generated_tool",
      label: "Tool One",
      description: "Actual administrator description",
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    {
      id: "prompt",
      kind: "MCP_PROMPT",
      name: "AdminPrompt",
      label: "Admin Prompt",
      annotations: null
    },
    { id: "other", kind: "MCP_RESOURCE", name: "Resource" }
  ]
};
const flush = async () => {
  await Array.from({ length: 15 }).reduce(
    (pending) => pending.then(() => Promise.resolve()),
    Promise.resolve()
  );
};
function mount(props = {}) {
  const element = createElement("c-package-visualizer-mcp-provisioner", {
    is: Provisioner
  });
  Object.assign(element, props);
  document.body.appendChild(element);
  return element;
}
function find(element, id) {
  return element.shadowRoot.querySelector(`[data-id="${id}"]`);
}
beforeEach(() => {
  getState.mockReset().mockResolvedValue(existing);
  createServer.mockReset();
});
afterEach(() => {
  document.body.replaceChildren();
  jest.restoreAllMocks();
});
it("renders actual assets read-only with native status and annotations", async () => {
  const e = mount();
  await flush();
  expect(find(e, "server-status").label).toBe("Inactive");
  expect(e.shadowRoot.textContent).toContain(
    "Actual administrator description"
  );
  expect(e.shadowRoot.textContent).toContain("Tool One");
  expect(e.shadowRoot.textContent).not.toContain("generated_tool");
  expect(
    [...e.shadowRoot.querySelectorAll("lightning-tab")].map((tab) => tab.label)
  ).toEqual(["Tools", "Prompts"]);
  for (const id of [
    "create-server",
    "manage-tools",
    "activate",
    "deactivate",
    "save-tools",
    "cancel-tools",
    "provisioning-footer"
  ])
    expect(find(e, id)).toBeNull();
  expect(e.shadowRoot.querySelector("lightning-input")).toBeNull();
  expect(createServer).not.toHaveBeenCalled();
  const badges = [...e.shadowRoot.querySelectorAll("lightning-badge")];
  expect(badges.find((b) => b.label === "Read Only").className).toContain(
    "slds-theme_inverse"
  );
  expect(badges.find((b) => b.label === "Idempotent").className).toContain(
    "slds-theme_inverse"
  );
  expect(find(e, "provisioning-actions").lastElementChild.dataset.id).toBe(
    "refresh"
  );
});
it("creates immediately in one click and reports the verified inactive result", async () => {
  getState.mockResolvedValue(absent);
  createServer.mockResolvedValue(existing);
  const e = mount();
  const changed = jest.fn();
  e.addEventListener("provisioningchange", changed);
  await flush();
  expect(find(e, "create-server").variant).toBe("brand");
  find(e, "create-server").click();
  await flush();
  expect(createServer).toHaveBeenCalledTimes(1);
  expect(changed).toHaveBeenCalledWith(
    expect.objectContaining({ detail: { serverId: "server", active: false } })
  );
  expect(find(e, "create-server")).toBeNull();
});
it("hides actions and assets while loading with a brand medium spinner", async () => {
  let resolve;
  getState.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    })
  );
  const e = mount();
  await flush();
  expect(find(e, "provisioning-actions")).toBeNull();
  expect(find(e, "asset-tabs")).toBeNull();
  const spinner = e.shadowRoot.querySelector("lightning-spinner");
  expect(spinner.variant).toBe("brand");
  expect(spinner.size).toBe("medium");
  resolve(existing);
  await flush();
  expect(find(e, "asset-tabs")).not.toBeNull();
});
it("prevents duplicate creation clicks while the request is pending", async () => {
  getState.mockResolvedValue(absent);
  let resolve;
  createServer.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    })
  );
  const e = mount();
  await flush();
  const button = find(e, "create-server");
  button.click();
  button.click();
  await flush();
  expect(createServer).toHaveBeenCalledTimes(1);
  resolve(existing);
  await flush();
});
it("reloads after a partial failure and never offers to overwrite the existing server", async () => {
  getState.mockResolvedValueOnce(absent).mockResolvedValue(existing);
  createServer.mockRejectedValue({
    body: { message: "Population failed; review in Setup." }
  });
  const e = mount();
  await flush();
  find(e, "create-server").click();
  await flush();
  expect(e.shadowRoot.textContent).toContain("Population failed");
  expect(find(e, "view-in-setup")).not.toBeNull();
  expect(find(e, "create-server")).toBeNull();
  expect(createServer).toHaveBeenCalledTimes(1);
});
it("refreshes external changes without making a write", async () => {
  const e = mount();
  await flush();
  getState.mockResolvedValue({ ...existing, active: true, assets: [] });
  await e.refresh();
  await flush();
  expect(find(e, "server-status").label).toBe("Active");
  expect(e.shadowRoot.textContent).toContain("No tools are configured");
  expect(createServer).not.toHaveBeenCalled();
});
it("restores a cached read without loading again", async () => {
  const e = mount({ initialSnapshot: { state: existing, error: undefined } });
  await flush();
  expect(getState).not.toHaveBeenCalled();
  expect(find(e, "server-status").label).toBe("Inactive");
});
it("shares a host-provided pending load", async () => {
  const e = mount({ initialLoad: Promise.resolve(existing) });
  await flush();
  expect(getState).not.toHaveBeenCalled();
  expect(find(e, "asset-tabs")).not.toBeNull();
});
it("shows access errors without offering Create for an unknown state", async () => {
  getState.mockResolvedValue({
    loaded: false,
    canCreate: false,
    issues: ["Check credential access"],
    assets: []
  });
  const e = mount();
  await flush();
  expect(e.shadowRoot.textContent).toContain("Check credential access");
  expect(find(e, "create-server")).toBeNull();
  expect(find(e, "refresh")).not.toBeNull();
});
it("navigates to the exact Setup page with the dynamic server ID", async () => {
  const tab = { location: {} };
  const open = jest.spyOn(window, "open").mockReturnValue(tab);
  getState.mockResolvedValue({ ...existing, serverId: "1g1Rh000000018zIAA" });
  const e = mount();
  await flush();
  find(e, "view-in-setup").click();
  expect(open).toHaveBeenCalledWith("", "_blank");
  expect(tab.location.href).toBe(
    `${window.location.origin}/lightning/setup/McpServer/1g1Rh000000018zIAA/view?setup__source=PLATFORM_CUSTOM_MCP_SERVER`
  );
});
it("uses the refreshed server ID for Setup navigation", async () => {
  const tab = { location: {} };
  const open = jest.spyOn(window, "open").mockReturnValue(tab);
  const e = mount();
  await flush();
  getState.mockResolvedValue({ ...existing, serverId: "1g1Rh0000000190IAA" });
  await e.refresh();
  await flush();
  find(e, "view-in-setup").click();
  expect(open).toHaveBeenCalledWith("", "_blank");
  expect(tab.location.href).toBe(
    `${window.location.origin}/lightning/setup/McpServer/1g1Rh0000000190IAA/view?setup__source=PLATFORM_CUSTOM_MCP_SERVER`
  );
});
it("copies the observed server URL", async () => {
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText }
  });
  const e = mount();
  await flush();
  find(e, "copy-server-url").click();
  await flush();
  expect(writeText).toHaveBeenCalledWith(existing.serverUrl);
});
it("uses the destructive badge only when the observed annotation says so", async () => {
  getState.mockResolvedValue({
    ...existing,
    assets: [
      {
        id: "danger",
        kind: "MCP_TOOL",
        name: "Danger",
        annotations: { readOnlyHint: false, destructiveHint: true }
      }
    ]
  });
  const e = mount();
  await flush();
  const badges = [...e.shadowRoot.querySelectorAll("lightning-badge")];
  expect(badges.find((b) => b.label === "Destructive").className).toContain(
    "slds-theme_error"
  );
  expect(badges.find((b) => b.label === "Changes Data").className).toContain(
    "slds-theme_inverse"
  );
});
