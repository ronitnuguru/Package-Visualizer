import { createElement } from "@lwc/engine-dom";
import PackagePushJobDetail from "c/packagePushJobDetail";
import getPushJobPackageSubscriber from "@salesforce/apex/PushUpgradesCtrl.getPushJobPackageSubscriber";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

jest.mock(
  "@salesforce/apex/PushUpgradesCtrl.getPushJobPackageSubscriber",
  () => {
    const {
      createApexTestWireAdapter
    } = require("@salesforce/wire-service-jest-util");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const PUSH_JOB_ID = "0DX000000000001AAA";
const PUSH_REQUEST_ID = "0DV000000000001AAA";
const PACKAGE_VERSION_ID = "04t000000000001AAA";
const PACKAGE_ID = "033000000000001AAA";

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function getGenerateButton(element) {
  const actions = element.shadowRoot.querySelector(
    "c-agentforce-conversation-actions"
  );
  return actions?.shadowRoot.querySelector('[data-id="generate"]');
}

function failedPushJob(errors = [pushError()]) {
  return {
    Id: PUSH_JOB_ID,
    PackagePushRequestId: PUSH_REQUEST_ID,
    SubscriberOrganizationKey: "00D000000000001AAA",
    Status: "Failed",
    DurationSeconds: 60,
    StartTime: "2026-07-27T16:55:00.000Z",
    EndTime: "2026-07-27T16:56:00.000Z",
    SystemModstamp: "2026-07-27T16:56:01.000Z",
    PackagePushErrors: {
      records: errors
    }
  };
}

function pushError() {
  return {
    Id: "0Yx000000000001AAA",
    ErrorTitle: "Package install failed",
    ErrorMessage: "Apex test failure",
    ErrorType: "ApexTestFailure",
    ErrorDetails: "ExampleTest.shouldPass",
    ErrorSeverity: "Error"
  };
}

function createDetail(pushJobDetails = failedPushJob()) {
  const element = createElement("c-package-push-job-detail", {
    is: PackagePushJobDetail
  });
  element.pushJobDetails = pushJobDetails;
  element.subscriberPackageId = PACKAGE_ID;
  element.targetPackageVersionId = PACKAGE_VERSION_ID;
  document.body.appendChild(element);
  return element;
}

describe("c-package-push-job-detail Agentforce conversation launcher", () => {
  beforeEach(() => {
    getExtensionStatus.mockResolvedValue({
      state: "READY",
      message: "The extension is ready."
    });
    invokePromptAndUserModelsGenAi.mockResolvedValue(
      JSON.stringify({ summary: "Generated" })
    );
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ message: "Instance not found" })
    });
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders Generate and the Agentforce conversation icon independently", () => {
    const element = createDetail();

    expect(getGenerateButton(element)).not.toBeUndefined();

    const actions = element.shadowRoot.querySelector(
      "c-agentforce-conversation-actions"
    );
    expect(actions).not.toBeNull();
    expect(actions.displayMode).toBe("contextAction");
    expect(actions.showModelsGenerate).toBe(true);
    expect(actions.alternativeText).toBe("Chat with Agentforce");
    expect(actions.utterance).toContain(`PackagePushJob ID ${PUSH_JOB_ID}`);
    expect(actions.utterance).toContain(PACKAGE_VERSION_ID);
    expect(actions.utterance).toContain("0Yx000000000001AAA");
  });

  it("keeps the Agentforce icon after the one-shot Generate card opens", async () => {
    const element = createDetail();

    getGenerateButton(element).click();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-agentforce-conversation-actions")
    ).not.toBeNull();
    expect(getGenerateButton(element)).toBeNull();
  });

  it("adds subscriber enrichment to the sanitized push-job context", async () => {
    const element = createDetail();
    getPushJobPackageSubscriber.emit({
      orgName: "Acme",
      orgType: "Production",
      instanceName: "NA99",
      orgStatus: "Active",
      installedStatus: "Installed",
      metadataPackageVersionId: "04t000000000000AAA"
    });
    await flushPromises();

    const actions = element.shadowRoot.querySelector(
      "c-agentforce-conversation-actions"
    );
    expect(actions.utterance).toContain('"orgName":"Acme"');
    expect(actions.utterance).toContain(
      '"installedVersionId":"04t000000000000AAA"'
    );
  });

  it("guards an empty PackagePushErrors record list", () => {
    const element = createDetail(failedPushJob([]));

    expect(getGenerateButton(element)).toBeUndefined();
    expect(
      element.shadowRoot.querySelector("c-agentforce-conversation-actions")
    ).toBeNull();
  });
});
