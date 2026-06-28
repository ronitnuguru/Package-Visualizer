import { createElement } from "lwc";
import { publish } from "lightning/messageService";
import PACKAGEMESSAGECHANNEL from "@salesforce/messageChannel/PackageMessageChannel__c";
import PackageSplitView from "c/packageSplitView";
import get2GPPackageList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageList";

// Two-package fixture so "select the second one, then refresh" is meaningful.
const PACKAGES = [
  {
    id: "0Ho000000000001AAA",
    name: "Alpha Package",
    namespacePrefix: "alpha",
    description: "First package",
    containerOptions: "Managed",
    subscriberPackageID: "033000000000001AAA"
  },
  {
    id: "0Ho000000000002AAA",
    name: "Package Visualizer",
    namespacePrefix: "pkgviz",
    description: "Second package",
    containerOptions: "Managed",
    subscriberPackageID: "033000000000002AAA"
  }
];

jest.mock(
  "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageList",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.ensureToolingUrlsConfigured",
  () => ({ default: jest.fn(() => Promise.resolve(true)) }),
  { virtual: true }
);

// Resolve all pending microtasks (the continuation IIFE chains a few awaits).
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-split-view refresh persistence", () => {
  beforeEach(() => {
    get2GPPackageList.mockResolvedValue(JSON.parse(JSON.stringify(PACKAGES)));
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  function getHeaderName(element) {
    const header = element.shadowRoot.querySelector("c-package-header");
    return header ? header.name : undefined;
  }

  it("keeps the selected package in the detail pane after Refresh List", async () => {
    const element = createElement("c-package-split-view", {
      is: PackageSplitView
    });
    document.body.appendChild(element);
    await flush();

    // Select the second package (index 1) via the child's packagechange event.
    const listItems = element.shadowRoot.querySelectorAll(
      "c-package-list-view"
    );
    listItems[1].dispatchEvent(new CustomEvent("packagechange", { detail: 1 }));
    await flush();
    expect(getHeaderName(element)).toBe("Package Visualizer");

    // Click Refresh List.
    const refreshBtn = element.shadowRoot.querySelector(
      'button[title="Refresh List"]'
    );
    refreshBtn.click();
    await flush();

    // BUG: detail pane jumps back to the first package after refresh.
    expect(getHeaderName(element)).toBe("Package Visualizer");
  });

  it("re-publishes the restored package name so the list highlight re-syncs after refresh", async () => {
    const element = createElement("c-package-split-view", {
      is: PackageSplitView
    });
    document.body.appendChild(element);
    await flush();

    const listItems = element.shadowRoot.querySelectorAll(
      "c-package-list-view"
    );
    listItems[1].dispatchEvent(new CustomEvent("packagechange", { detail: 1 }));
    await flush();

    publish.mockClear();

    const refreshBtn = element.shadowRoot.querySelector(
      'button[title="Refresh List"]'
    );
    refreshBtn.click();
    await flush();

    // The highlight is driven by PackageMessageChannel. After refresh the parent
    // must re-announce the restored selection so the rebuilt list re-highlights it.
    // (MessageContext is undefined under the jest wire stub, so assert on the
    // channel + payload rather than the context argument.)
    const republished = publish.mock.calls.some(
      ([, channel, payload]) =>
        channel === PACKAGEMESSAGECHANNEL &&
        payload &&
        payload.currentPackageName === "Package Visualizer"
    );
    expect(republished).toBe(true);
  });
});
