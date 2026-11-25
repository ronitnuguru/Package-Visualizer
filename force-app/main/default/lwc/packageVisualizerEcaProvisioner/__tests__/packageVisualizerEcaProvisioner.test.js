import { createElement } from "lwc";
import { getRecord } from "lightning/uiRecordApi";
import PackageVisualizerEcaProvisioner from "c/packageVisualizerEcaProvisioner";
import getLocalEcaState from "@salesforce/apex/PackageVisualizerEcaController.getState";
import createLocalEca from "@salesforce/apex/PackageVisualizerEcaController.createLocalEca";
jest.mock(
  "@salesforce/apex/PackageVisualizerEcaController.getState",
  () => ({
    default: jest.fn().mockResolvedValue({ exists: false, configured: false })
  }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/PackageVisualizerEcaController.createLocalEca",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock("@salesforce/userPermission/ViewSetup", () => ({ default: true }), {
  virtual: true
});
async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-visualizer-eca-provisioner local ECA creation", () => {
  const userId = "005000000000002AAA";
  const otherUserId = "005000000000003AAA";
  function emitUser(
    id = userId,
    username = "integration@example.com",
    email = "integration-contact@example.com"
  ) {
    getRecord.emit({
      id,
      apiName: "User",
      fields: { Username: { value: username }, Email: { value: email } }
    });
  }
  async function pickUser(element, id = userId) {
    element.shadowRoot
      .querySelector('[data-id="eca-run-as"]')
      .dispatchEvent(new CustomEvent("change", { detail: { recordId: id } }));
    await flushPromises();
  }
  beforeEach(() => {
    getLocalEcaState.mockResolvedValue({ exists: false, configured: false });
    createLocalEca.mockReset();
  });
  afterEach(() => {
    document.body.replaceChildren();
    jest.clearAllMocks();
  });
  it("renders a custom card header with actions and the user fields in its body", async () => {
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    const card = element.shadowRoot.querySelector("lightning-card");
    expect(card.querySelector('[slot="title"]').textContent).toContain(
      "External Client App Setup"
    );
    expect(card.querySelector("lightning-icon").iconName).toBe(
      "standard:connected_apps"
    );
    const actions = card.querySelector(
      'lightning-button-group[slot="actions"]'
    );
    expect(
      actions.querySelector('[data-id="create-local-eca"]')
    ).not.toBeNull();
    expect(actions.querySelector('[data-id="refresh-local-eca"]')).toBeNull();
    expect(actions.querySelector('[data-id="local-eca-setup"]')).not.toBeNull();
    expect(
      card.querySelector(".slds-card__body lightning-record-picker")
    ).not.toBeNull();
    expect(card.querySelector(".slds-card__body lightning-input").type).toBe(
      "email"
    );
    expect(getLocalEcaState).toHaveBeenCalledTimes(1);
  });
  it("owns loading and reports refreshed status to its host", async () => {
    let finish;
    getLocalEcaState.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    const change = jest.fn();
    element.addEventListener("provisioningchange", change);
    document.body.appendChild(element);
    await flushPromises();
    const spinner = element.shadowRoot.querySelector("lightning-spinner");
    expect(spinner.variant).toBe("brand");
    expect(spinner.size).toBe("medium");
    expect(
      element.shadowRoot.querySelector('[data-id="eca-run-as"]')
    ).toBeNull();
    await element.refresh();
    expect(getLocalEcaState).toHaveBeenCalledTimes(1);
    finish({ exists: true, configured: true, appId: "0xIRh0000000wQb" });
    await flushPromises();
    expect(change.mock.calls[0][0].detail).toEqual({
      configured: true,
      appId: "0xIRh0000000wQb"
    });
    getLocalEcaState.mockRejectedValue({
      body: { message: "Session expired" }
    });
    await element.refresh();
    await flushPromises();
    expect(change.mock.calls[1][0].detail.configured).toBe(false);
    expect(element.shadowRoot.textContent).toContain("Session expired");
    expect(element.shadowRoot.querySelector("lightning-spinner")).toBeNull();
  });
  it("creates with an explicit Run As user and prevents duplicate submissions", async () => {
    let finish;
    createLocalEca.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    const change = jest.fn();
    element.addEventListener("provisioningchange", change);
    document.body.appendChild(element);
    await flushPromises();
    await pickUser(element);
    emitUser();
    element.shadowRoot.querySelector(
      '[data-id="eca-contact-email"]'
    ).reportValidity = jest.fn(() => true);
    await flushPromises();
    const button = element.shadowRoot.querySelector(
      '[data-id="create-local-eca"]'
    );
    button.click();
    button.click();
    expect(createLocalEca).toHaveBeenCalledTimes(1);
    expect(createLocalEca).toHaveBeenCalledWith({
      runAsUsername: "integration@example.com",
      contactEmail: "integration-contact@example.com"
    });
    finish({
      exists: true,
      configured: true,
      message: "Local ECA configured."
    });
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]')
    ).toBeNull();
    const notice = element.shadowRoot.querySelector(
      '[data-id="eca-configured-notification"]'
    );
    expect(notice).not.toBeNull();
    expect(notice.querySelector("lightning-formatted-text").value).toBe(
      "Local ECA configured."
    );
    expect(change.mock.calls[1][0].detail.configured).toBe(true);
  });
  it("refreshes after partial failure and does not offer another create", async () => {
    createLocalEca.mockRejectedValue({
      body: { message: "Metadata request failed" }
    });
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    await pickUser(element);
    emitUser();
    element.shadowRoot.querySelector(
      '[data-id="eca-contact-email"]'
    ).reportValidity = jest.fn(() => true);
    getLocalEcaState.mockResolvedValue({
      exists: true,
      configured: false,
      message: "Review partial app in Setup"
    });
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="create-local-eca"]').click();
    await flushPromises();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]')
    ).toBeNull();
    expect(element.shadowRoot.textContent).toContain("Metadata request failed");
    expect(element.shadowRoot.textContent).toContain(
      "Review partial app in Setup"
    );
  });
  it("does not offer Create when metadata state cannot be read", async () => {
    getLocalEcaState.mockRejectedValue({
      body: { message: "Metadata access denied" }
    });
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]')
    ).toBeNull();
    expect(element.shadowRoot.textContent).toContain("Metadata access denied");
    expect(createLocalEca).not.toHaveBeenCalled();
  });
  it("uses an active User picker and fills an empty email from the selected user", async () => {
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    const picker = element.shadowRoot.querySelector(
      'lightning-record-picker[data-id="eca-run-as"]'
    );
    expect(picker.objectApiName).toBe("User");
    expect(picker.filter.criteria).toEqual([
      { fieldPath: "IsActive", operator: "eq", value: true }
    ]);
    expect(picker.matchingInfo.additionalFields).toEqual([
      { fieldPath: "Username" }
    ]);
    expect(element.shadowRoot.textContent).not.toContain(
      "Create a local Package Visualizer Tooling app"
    );
    await pickUser(element);
    emitUser();
    await flushPromises();
    const email = element.shadowRoot.querySelector(
      '[data-id="eca-contact-email"]'
    );
    expect(email.type).toBe("email");
    expect(email.value).toBe("integration-contact@example.com");
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]').disabled
    ).toBe(false);
  });
  it("preserves a contact email entered before user details arrive", async () => {
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    await pickUser(element);
    const email = element.shadowRoot.querySelector(
      '[data-id="eca-contact-email"]'
    );
    email.value = "another-contact@example.com";
    email.dispatchEvent(new CustomEvent("change"));
    emitUser();
    await flushPromises();
    expect(email.value).toBe("another-contact@example.com");
  });
  it("preserves a populated email when a different user is chosen", async () => {
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    await pickUser(element);
    emitUser();
    await flushPromises();
    await pickUser(element, otherUserId);
    emitUser(otherUserId, "other@example.com", "other-contact@example.com");
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="eca-contact-email"]').value
    ).toBe("integration-contact@example.com");
  });
  it("ignores stale user data and disables Create after the selection is cleared", async () => {
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    await pickUser(element);
    await pickUser(element, otherUserId);
    emitUser();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="eca-contact-email"]').value
    ).toBe("");
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]').disabled
    ).toBe(true);
    emitUser(otherUserId);
    await flushPromises();
    await pickUser(element, null);
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]').disabled
    ).toBe(true);
    emitUser(otherUserId);
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]').disabled
    ).toBe(true);
  });
  it("blocks Create when selected user details cannot be loaded", async () => {
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    await pickUser(element);
    getRecord.error();
    await flushPromises();
    expect(
      element.shadowRoot.querySelector('[data-id="create-local-eca"]').disabled
    ).toBe(true);
    expect(element.shadowRoot.textContent).toContain(
      "Unable to load user details"
    );
  });
});

describe("ECA Setup navigation", () => {
  let originalWindowOpen;
  let openTab;
  beforeEach(() => {
    originalWindowOpen = window.open;
    openTab = { closed: false, location: {} };
    window.open = jest.fn(() => openTab);
  });
  afterEach(() => {
    document.body.replaceChildren();
    window.open = originalWindowOpen;
    jest.clearAllMocks();
  });
  it("opens the current ECA detail page in a new tab after refresh", async () => {
    getLocalEcaState.mockResolvedValue({ exists: false, configured: false });
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    const setup = element.shadowRoot.querySelector(
      '[data-id="local-eca-setup"]'
    );
    expect(setup.tooltip).toBe("External Client App Setup");
    expect(setup.alternativeText).toBe("External Client App Setup");
    setup.click();
    expect(openTab.location.href).toBe(
      `${window.location.origin}/lightning/setup/ManageExternalClientApplication/home`
    );

    async function expectAppLink(appId) {
      getLocalEcaState.mockResolvedValue({
        exists: true,
        configured: true,
        appId
      });
      await element.refresh();
      await flushPromises();
      element.shadowRoot.querySelector('[data-id="local-eca-setup"]').click();
      expect(window.open).toHaveBeenLastCalledWith("", "_blank");
      expect(openTab.location.href).toBe(
        `${
          window.location.origin
        }/lightning/setup/ManageExternalClientApplication/${appId.slice(
          0,
          15
        )}/detail`
      );
    }
    await expectAppLink("0xIRh0000000wQbEAM");
    await expectAppLink("0xIRh0000000wQcEAM");
  });

  it("keeps Setup available when an existing ECA ID is unavailable", async () => {
    getLocalEcaState.mockResolvedValue({ exists: true, configured: true });
    const element = createElement("c-package-visualizer-eca-provisioner", {
      is: PackageVisualizerEcaProvisioner
    });
    document.body.appendChild(element);
    await flushPromises();
    element.shadowRoot.querySelector('[data-id="local-eca-setup"]').click();
    expect(openTab.location.href).toBe(
      `${window.location.origin}/lightning/setup/ManageExternalClientApplication/home`
    );
  });
});
