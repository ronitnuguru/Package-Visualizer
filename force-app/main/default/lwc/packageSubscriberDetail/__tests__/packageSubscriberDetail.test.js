import { createElement } from "lwc";
import PackageSubscriberDetail from "c/packageSubscriberDetail";
import isLMA from "@salesforce/apex/PackageVisualizerCtrl.isLMA";

const mockNavigate = jest.fn();

jest.mock(
  "lightning/navigation",
  () => {
    const Navigate = Symbol("Navigate");
    const NavigationMixin = (Base) =>
      class extends Base {
        [Navigate](pageReference) {
          mockNavigate(pageReference);
        }
      };
    NavigationMixin.Navigate = Navigate;
    return { NavigationMixin };
  },
  { virtual: true }
);

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

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-subscriber-detail subscriber console navigation", () => {
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

    expect(mockNavigate).toHaveBeenCalledWith({
      type: "standard__webPage",
      attributes: {
        url: `/partnerbt/lmo/subOrgLogin.apexp?directLoginOrgId=${orgKey}`
      }
    });
  });
});
