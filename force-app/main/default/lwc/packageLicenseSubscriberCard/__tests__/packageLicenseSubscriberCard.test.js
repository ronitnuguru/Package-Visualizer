import { createElement } from "lwc";
import { getRecord } from "lightning/uiRecordApi";
import PackageLicenseSubscriberCard from "c/packageLicenseSubscriberCard";
import checkPackageSubscriberEnabled from "@salesforce/apex/PackageVisualizerCtrl.checkPackageSubscriberEnabled";
import get2GPPackageVersionSubscriberList from "@salesforce/apex/PackageVisualizerCtrl.get2GPPackageVersionSubscriberList";

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
  "@salesforce/apex/PackageVisualizerCtrl.checkPackageSubscriberEnabled",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.get2GPPackageVersionSubscriberList",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-license-subscriber-card subscriber console navigation", () => {
  let consoleError;

  beforeEach(() => {
    // The base lightning-tab Jest stub renders every tab body. This component
    // lazily initializes inactive-tab collections, so suppress those known
    // template-iteration warnings while exercising the header action.
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    consoleError.mockRestore();
    jest.clearAllMocks();
  });

  it("opens the subscriber console relative to the installing org", async () => {
    const orgKey = "00D000000000001AAA";
    checkPackageSubscriberEnabled.mockResolvedValue(true);
    get2GPPackageVersionSubscriberList.mockResolvedValue([
      {
        orgKey,
        orgName: "Acme Subscriber"
      }
    ]);

    const element = createElement("c-package-license-subscriber-card", {
      is: PackageLicenseSubscriberCard
    });
    element.recordId = "a0B000000000001AAA";
    document.body.appendChild(element);

    getRecord.emit({
      fields: {
        sfLma__Subscriber_Org_ID__c: { value: orgKey },
        sfLma__Package_Version__r: {
          value: {
            fields: {
              sfLma__Version_ID__c: { value: "04t000000000001AAA" }
            }
          }
        },
        sfLma__License_Status__c: { value: "Active" },
        sfLma__Licensed_Seats__c: { value: 10 },
        sfLma__Expiration_Date__c: { value: null },
        sfLma__Seats__c: { value: 10 },
        sfLma__Used_Licenses__c: { value: 2 },
        Name: { value: "LIC-0001" }
      }
    });
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
