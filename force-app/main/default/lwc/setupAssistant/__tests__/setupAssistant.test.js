import { createElement } from "lwc";
import SetupAssistant from "c/setupAssistant";
import getIntegrationStatus from "@salesforce/apex/PackageVisualizerCtrl.getIntegrationStatus";

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.getIntegrationStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

[
  "getProfileId",
  "getNamespacePermSetId",
  "configureNamedCredentialUrl",
  "populateClientCredentials",
  "verifyAndEnableNamedCredential"
].forEach((methodName) => {
  jest.mock(
    `@salesforce/apex/PackageVisualizerCtrl.${methodName}`,
    () => ({ default: jest.fn() }),
    { virtual: true }
  );
});

[
  "getActiveEmployeeAgents",
  "getAgentforceConfiguration",
  "saveAgentforceConfiguration"
].forEach((methodName) => {
  jest.mock(
    `@salesforce/apex/AgentforceConversationConfigController.${methodName}`,
    () => ({ default: jest.fn().mockResolvedValue([]) }),
    { virtual: true }
  );
});

["getOrgDetails", "isPboOrg"].forEach((methodName) => {
  jest.mock(
    `@salesforce/apex/PackageVisualizerCtrl.${methodName}`,
    () => {
      const {
        createApexTestWireAdapter
      } = require("@salesforce/wire-service-jest-util");
      return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
  );
});

jest.mock(
  "@salesforce/customPermission/Package_Visualizer_Core",
  () => ({ default: false }),
  { virtual: true }
);
jest.mock(
  "@salesforce/customPermission/Package_Visualizer_Push_Upgrade",
  () => ({ default: false }),
  { virtual: true }
);
jest.mock("@salesforce/userPermission/ViewSetup", () => ({ default: true }), {
  virtual: true
});

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-setup-assistant Agentforce Conversation marker", () => {
  beforeEach(() => {
    getIntegrationStatus.mockResolvedValue({});
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("uses the default marker until the saved Agentforce configuration is ready", async () => {
    const element = createElement("c-setup-assistant", {
      is: SetupAssistant
    });
    document.body.appendChild(element);
    await flushPromises();

    const conversationSetup = element.shadowRoot.querySelector(
      "c-agentforce-conversation-setup"
    );

    expect(
      element.shadowRoot.querySelector(
        '[data-id="agentforce-conversation-marker-default"]'
      )
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector(
        '[data-id="agentforce-conversation-marker-success"]'
      )
    ).toBeNull();

    conversationSetup.dispatchEvent(
      new CustomEvent("configurationchange", {
        detail: { configured: true }
      })
    );
    await flushPromises();

    expect(
      element.shadowRoot.querySelector(
        '[data-id="agentforce-conversation-marker-default"]'
      )
    ).toBeNull();
    const successMarker = element.shadowRoot.querySelector(
      '[data-id="agentforce-conversation-marker-success"]'
    );
    expect(successMarker).not.toBeNull();
    expect(successMarker.querySelector("lightning-icon").iconName).toBe(
      "utility:success"
    );
  });
});

describe("c-setup-assistant Provision Access to Developers", () => {
  let openTab;
  let originalWindowOpen;

  beforeEach(() => {
    getIntegrationStatus.mockResolvedValue({});
    openTab = { closed: false, location: {} };
    originalWindowOpen = window.open;
    window.open = jest.fn(() => openTab);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    window.open = originalWindowOpen;
    jest.clearAllMocks();
  });

  it("opens the Setup Users page", async () => {
    const element = createElement("c-setup-assistant", {
      is: SetupAssistant
    });
    element.packageTypes = "2GP and Unlocked Packages";
    document.body.appendChild(element);
    await flushPromises();

    element.shadowRoot.querySelector('[data-id="new-users-setup"]').click();

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(openTab.location.href).toBe(
      `${window.location.origin}/lightning/setup/ManageUsers/home`
    );
  });

  it("opens the Setup Permission Sets page", async () => {
    const element = createElement("c-setup-assistant", {
      is: SetupAssistant
    });
    element.packageTypes = "2GP and Unlocked Packages";
    document.body.appendChild(element);
    await flushPromises();

    element.shadowRoot
      .querySelector('[data-id="new-permission-sets-setup"]')
      .click();

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(openTab.location.href).toBe(
      `${window.location.origin}/lightning/setup/PermSets/home`
    );
  });
});
