import { createElement } from "@lwc/engine-dom";
import PackagePushJobView from "c/packagePushJobView";
import getPackageVersionPushJobs from "@salesforce/apexContinuation/PushUpgradesCtrl.getPackageVersionPushJobs";

jest.mock(
  "@salesforce/apexContinuation/PushUpgradesCtrl.getPackageVersionPushJobs",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PushUpgradesCtrl.updatePackagePushRequest",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PushUpgradesCtrl.getPackagePushJobChartData",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe("c-package-push-job-view Agentforce integration", () => {
  beforeEach(() => {
    getPackageVersionPushJobs.mockResolvedValue([]);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders direct push-request analysis in the selected request actions", async () => {
    const element = createElement("c-package-push-job-view", {
      is: PackagePushJobView
    });
    element.pushId = "0DV000000000001AAA";
    element.pushPackageVersionId = "04t000000000001AAA";
    element.pushStatus = "Created";
    document.body.appendChild(element);
    await flushPromises();

    const action = element.shadowRoot.querySelector(
      "c-agentforce-conversation-actions"
    );
    expect(action).not.toBeNull();
    expect(action.alternativeText).toBe("Chat with Agentforce");
    expect(action.utterance).toContain(
      "PackagePushRequest ID 0DV000000000001AAA"
    );
    expect(action.utterance).toContain("invoke Analyze Push Request Context");
  });
});
