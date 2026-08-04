import { createElement } from "lwc";
import { mockNavigate } from "lightning/navigation";
import PackageSubscriberDetail from "c/packageSubscriberDetail";
import isLMA from "@salesforce/apex/PackageVisualizerCtrl.isLMA";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.isLMA",
  () => {
    const {
      createApexTestWireAdapter
    } = require("@salesforce/wire-service-jest-util");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

jest.mock(
  "@salesforce/customPermission/Package_Visualizer_Push_Upgrade",
  () => ({ default: false }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-subscriber-detail subscriber console navigation", () => {
  beforeEach(() => {
    getExtensionStatus.mockResolvedValue({
      state: "READY",
      message: "The extension is ready."
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("opens the subscriber console relative to the installing org", async () => {
    const orgKey = "00D000000000001AAA";
    const element = createElement(
      "c-package-subscriber-detail-navigation-test",
      {
        is: PackageSubscriberDetail
      }
    );
    element.orgKey = orgKey;
    element.packageType = "Managed";
    document.body.appendChild(element);

    isLMA.emit(true);
    await flush();

    const loginButton = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button-icon")
    ).find((button) => button.tooltip === "Log Into Subscriber Console");
    expect(loginButton).not.toBeUndefined();

    loginButton.click();
    await flush();

    expect(mockNavigate).toHaveBeenCalledWith({
      type: "standard__webPage",
      attributes: {
        url: `/partnerbt/lmo/subOrgLogin.apexp?directLoginOrgId=${orgKey}`
      }
    });
  });

  it("renders a subscriber-support conversation beside Generate", async () => {
    const element = createElement("c-package-subscriber-detail-test", {
      is: PackageSubscriberDetail
    });
    element.packageSubscriberId = "0Ci000000000001AAA";
    element.metadataPackageId = "033000000000001AAA";
    element.metadataPackageVersionId = "04t000000000001AAA";
    element.orgKey = "00D000000000001AAA";
    element.orgName = "Acme";
    element.packageType = "Managed";
    document.body.appendChild(element);
    await flush();

    const action = element.shadowRoot.querySelector(
      "c-agentforce-conversation-actions"
    );
    expect(action).not.toBeNull();
    expect(action.showModelsGenerate).toBe(true);
    expect(action.alternativeText).toBe("Chat with Agentforce");
    expect(action.utterance).toContain(
      "PackageSubscriber ID 0Ci000000000001AAA"
    );
  });
});
