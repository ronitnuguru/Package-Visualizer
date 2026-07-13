import { createElement } from "lwc";
import PackageVersionCreateRequestsView from "c/packageVersionCreateRequestsView";
import getPackage2VersionCreateRequestList from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestList";

const REQUESTS = [
  {
    Id: "08c000000000001AAA",
    Status: "Success",
    Package2Id: "0Ho000000000001AAA",
    Package2VersionId: "05i000000000001AAA",
    Branch: "main",
    Tag: "v1.0",
    CreatedByName: "Test User",
    CreatedDate: "2024-01-01T00:00:00.000+0000",
    SystemModstamp: "2024-01-01T00:00:00.000+0000"
  },
  {
    Id: "08c000000000002AAA",
    Status: "Error",
    Package2Id: "0Ho000000000001AAA",
    Package2VersionId: null,
    Branch: "feature",
    Tag: null,
    CreatedByName: "Test User",
    CreatedDate: "2024-01-02T00:00:00.000+0000",
    SystemModstamp: "2024-01-02T00:00:00.000+0000"
  }
];

jest.mock(
  "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestList",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-version-create-requests-view", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders a datatable with the returned create requests", async () => {
    getPackage2VersionCreateRequestList.mockResolvedValue(
      JSON.parse(JSON.stringify(REQUESTS))
    );
    const element = createElement("c-package-version-create-requests-view", {
      is: PackageVersionCreateRequestsView
    });
    element.packageId = "0Ho000000000001AAA";
    document.body.appendChild(element);
    await flush();

    const datatable = element.shadowRoot.querySelector("lightning-datatable");
    expect(datatable).not.toBeNull();
    expect(datatable.data.length).toBe(2);
    // Confirms the scoping filter is passed to Apex.
    const callArg = getPackage2VersionCreateRequestList.mock.calls[0][0];
    expect(callArg.filterWrapper[0]).toEqual({
      fieldName: "Package2Id",
      value: "0Ho000000000001AAA",
      dataType: "STRING"
    });
  });

  it("shows the empty state when there are no create requests", async () => {
    getPackage2VersionCreateRequestList.mockResolvedValue([]);
    const element = createElement("c-package-version-create-requests-view", {
      is: PackageVersionCreateRequestsView
    });
    element.packageId = "0Ho000000000001AAA";
    document.body.appendChild(element);
    await flush();

    const emptyState = element.shadowRoot.querySelector(
      "lightning-empty-state"
    );
    expect(emptyState).not.toBeNull();
    const datatable = element.shadowRoot.querySelector("lightning-datatable");
    expect(datatable).toBeNull();
  });
});
