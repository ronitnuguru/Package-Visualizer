import { createElement } from "lwc";
import PackageVersionCreateRequestDetail from "c/packageVersionCreateRequestDetail";
import getPackage2VersionCreateRequestList from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestList";
import getPackage2VersionCreateRequestErrorList from "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestErrorList";
import invokePromptAndUserModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi";
import getPackageVersionById from "@salesforce/apex/PackageVisualizerCtrl.getPackageVersionById";

jest.mock(
  "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestList",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apexContinuation/PackageVisualizerCtrl.getPackage2VersionCreateRequestErrorList",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.invokePromptAndUserModelsGenAi",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/PackageVisualizerCtrl.getPackageVersionById",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-version-create-request-detail", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("fetches and renders error messages when status is Error", async () => {
    getPackage2VersionCreateRequestErrorList.mockResolvedValue([
      { Id: "08d000000000001AAA", Message: "Verification failed: coverage" }
    ]);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000002AAA";
    element.status = "Error";
    document.body.appendChild(element);
    await flush();

    expect(getPackage2VersionCreateRequestErrorList).toHaveBeenCalledWith({
      requestId: "08c000000000002AAA"
    });
    const notification = element.shadowRoot.querySelector(
      ".slds-scoped-notification"
    );
    expect(notification).not.toBeNull();
    expect(notification.textContent).toContain("Verification failed: coverage");
  });

  it("renders multiple errors as bullets in a single scoped notification", async () => {
    getPackage2VersionCreateRequestErrorList.mockResolvedValue([
      { Id: "08d000000000001AAA", Message: "First failure" },
      { Id: "08d000000000002AAA", Message: "Second failure" },
      { Id: "08d000000000003AAA", Message: "Third failure" }
    ]);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000009AAA";
    element.status = "Error";
    document.body.appendChild(element);
    await flush();

    const notifications = element.shadowRoot.querySelectorAll(
      ".slds-scoped-notification"
    );
    expect(notifications.length).toBe(1);

    const bullets = notifications[0].querySelectorAll("li");
    expect(bullets.length).toBe(3);
    expect(bullets[0].textContent).toContain("First failure");
    expect(bullets[1].textContent).toContain("Second failure");
    expect(bullets[2].textContent).toContain("Third failure");
  });

  it("does not query for errors when status is Success", async () => {
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000001AAA";
    element.status = "Success";
    element.package2VersionId = "05i000000000001AAA";
    document.body.appendChild(element);
    await flush();

    expect(getPackage2VersionCreateRequestErrorList).not.toHaveBeenCalled();
    const notification = element.shadowRoot.querySelector(
      ".slds-scoped-notification"
    );
    expect(notification).toBeNull();
  });

  it("renders eight steps with an in-flight status matched to its picklist value", async () => {
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000003AAA";
    // Real API picklist value (no spaces) — the bug was matching on the label.
    element.status = "VerifyingMetadata";
    document.body.appendChild(element);
    await flush();

    const indicator = element.shadowRoot.querySelector(
      "lightning-progress-indicator"
    );
    expect(indicator).not.toBeNull();
    expect(indicator.currentStep).toBe("VerifyingMetadata");

    const steps = element.shadowRoot.querySelectorAll(
      "lightning-progress-step"
    );
    // 7 build phases + the terminal step.
    expect(steps.length).toBe(8);
    const terminalStep = steps[steps.length - 1];
    expect(terminalStep.value).toBe("Completed");
    // While in-flight the terminal step reads "Completed".
    expect(terminalStep.label).toBe("Completed");
  });

  it("labels the terminal step Success and marks it current without error", async () => {
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000004AAA";
    element.status = "Success";
    document.body.appendChild(element);
    await flush();

    const indicator = element.shadowRoot.querySelector(
      "lightning-progress-indicator"
    );
    expect(indicator.currentStep).toBe("Completed");

    const steps = element.shadowRoot.querySelectorAll(
      "lightning-progress-step"
    );
    expect(steps[steps.length - 1].label).toBe("Success");
  });

  it("hides the progress path when the request errored", async () => {
    getPackage2VersionCreateRequestErrorList.mockResolvedValue([]);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000005AAA";
    element.status = "Error";
    document.body.appendChild(element);
    await flush();

    const indicator = element.shadowRoot.querySelector(
      "lightning-progress-indicator"
    );
    expect(indicator).toBeNull();
    const steps = element.shadowRoot.querySelectorAll(
      "lightning-progress-step"
    );
    expect(steps.length).toBe(0);
  });

  it("re-fetches the request by Id and reflects the new status on Refresh", async () => {
    getPackage2VersionCreateRequestList.mockResolvedValue([
      {
        Id: "08c000000000006AAA",
        Status: "Success",
        Package2VersionId: "05i000000000006AAA"
      }
    ]);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000006AAA";
    element.status = "VerifyingMetadata";
    document.body.appendChild(element);
    await flush();

    const indicator = element.shadowRoot.querySelector(
      "lightning-progress-indicator"
    );
    expect(indicator.currentStep).toBe("VerifyingMetadata");

    const refreshButton = element.shadowRoot.querySelector("lightning-button");
    refreshButton.click();
    await flush();

    expect(getPackage2VersionCreateRequestList).toHaveBeenCalledWith({
      filterWrapper: [
        { fieldName: "Id", value: "08c000000000006AAA", dataType: "STRING" }
      ],
      sortedBy: null,
      sortDirection: null,
      requestLimit: "1",
      requestOffset: "0"
    });
    expect(indicator.currentStep).toBe("Completed");
  });

  it("offers Generate only when the request errored", async () => {
    getPackage2VersionCreateRequestErrorList.mockResolvedValue([
      { Id: "08d000000000010AAA", Message: "Coverage too low" }
    ]);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000010AAA";
    element.status = "Error";
    document.body.appendChild(element);
    await flush();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const labels = Array.from(buttons).map((b) => b.label);
    expect(labels).toContain("Generate");
  });

  it("does not offer Generate on a successful request", async () => {
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000011AAA";
    element.status = "Success";
    document.body.appendChild(element);
    await flush();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const labels = Array.from(buttons).map((b) => b.label);
    expect(labels).not.toContain("Generate");
  });

  it("calls the Models API and renders the Agentforce card on Generate", async () => {
    getPackage2VersionCreateRequestErrorList.mockResolvedValue([
      { Id: "08d000000000012AAA", Message: "Dependency not found" }
    ]);
    invokePromptAndUserModelsGenAi.mockResolvedValue(
      JSON.stringify({
        severity: "High",
        estimatedResolutionTime: "30 minutes",
        summary: "A required dependency could not be resolved.",
        rootCause: "The dependent package version is not promoted.",
        debuggingSteps: ["Check the dependency", "Promote it", "Retry"],
        preventativeMeasures: ["Pin dependency versions"]
      })
    );
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000012AAA";
    element.status = "Error";
    element.skipValidation = false;
    document.body.appendChild(element);
    await flush();

    const generateButton = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).find((b) => b.label === "Generate");
    generateButton.click();
    await flush();

    expect(invokePromptAndUserModelsGenAi).toHaveBeenCalledTimes(1);
    const callArgs = invokePromptAndUserModelsGenAi.mock.calls[0][0];
    expect(callArgs.className).toBe("AgentGenAiController");
    expect(callArgs.methodName).toBe("createChatGeneration");
    // The user prompt carries this request's context and error messages.
    const userPrompt = JSON.parse(callArgs.userPrompt);
    expect(userPrompt.createRequestContext.createRequestId).toBe(
      "08c000000000012AAA"
    );
    expect(userPrompt.errors).toContain("Dependency not found");

    const card = element.shadowRoot.querySelector("lightning-card");
    expect(card).not.toBeNull();
    const badge = element.shadowRoot.querySelector("lightning-badge");
    expect(badge.label).toBe("High");
    expect(element.shadowRoot.textContent).toContain(
      "A required dependency could not be resolved."
    );

    // Generate is hidden once the card is shown.
    const labelsAfter = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).map((b) => b.label);
    expect(labelsAfter).not.toContain("Generate");
  });

  it("shows the install empty state when the Models API returns nothing", async () => {
    getPackage2VersionCreateRequestErrorList.mockResolvedValue([
      { Id: "08d000000000013AAA", Message: "Metadata failed to compile" }
    ]);
    invokePromptAndUserModelsGenAi.mockResolvedValue(undefined);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000013AAA";
    element.status = "Error";
    document.body.appendChild(element);
    await flush();

    Array.from(element.shadowRoot.querySelectorAll("lightning-button"))
      .find((b) => b.label === "Generate")
      .click();
    await flush();

    const emptyState = element.shadowRoot.querySelector(
      "lightning-empty-state"
    );
    expect(emptyState).not.toBeNull();
  });

  // A well-formed PackageVersionWrapper the details child can render without its
  // connectedCallback throwing on the version-number split.
  const versionWrapper = {
    id: "05i000000000020AAA",
    package2Id: "0Ho000000000020AAA",
    name: "My Package",
    versionNumber: "1.2.3-4",
    subscriberPackageVersionId: "04t000000000020AAA",
    packageType: "Managed"
  };

  it("offers View Package Version only when Success and a 05i is present", async () => {
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000020AAA";
    element.status = "Success";
    element.package2VersionId = "05i000000000020AAA";
    document.body.appendChild(element);
    await flush();

    const labels = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).map((b) => b.label);
    expect(labels).toContain("View Package Version");
  });

  it("hides View Package Version when Success but no 05i is present", async () => {
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000021AAA";
    element.status = "Success";
    document.body.appendChild(element);
    await flush();

    const labels = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).map((b) => b.label);
    expect(labels).not.toContain("View Package Version");
  });

  it("hides View Package Version while the build is in flight", async () => {
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000022AAA";
    element.status = "VerifyingMetadata";
    element.package2VersionId = "05i000000000022AAA";
    document.body.appendChild(element);
    await flush();

    const labels = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).map((b) => b.label);
    expect(labels).not.toContain("View Package Version");
  });

  it("fetches by 05i and renders the version details card on click", async () => {
    getPackageVersionById.mockResolvedValue(versionWrapper);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000023AAA";
    element.status = "Success";
    element.package2VersionId = "05i000000000020AAA";
    document.body.appendChild(element);
    await flush();

    Array.from(element.shadowRoot.querySelectorAll("lightning-button"))
      .find((b) => b.label === "View Package Version")
      .click();
    await flush();

    expect(getPackageVersionById).toHaveBeenCalledWith({
      package2VersionId: "05i000000000020AAA"
    });
    const child = element.shadowRoot.querySelector("c-package-version-details");
    expect(child).not.toBeNull();
    expect(child.packageName).toBe("My Package");
    expect(child.packageVersionNumber).toBe("1.2.3-4");
    expect(child.packageType).toBe("Managed");
  });

  it("does not render the child and does not crash when no version is returned", async () => {
    getPackageVersionById.mockResolvedValue(null);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000024AAA";
    element.status = "Success";
    element.package2VersionId = "05i000000000024AAA";
    document.body.appendChild(element);
    await flush();

    Array.from(element.shadowRoot.querySelectorAll("lightning-button"))
      .find((b) => b.label === "View Package Version")
      .click();
    await flush();

    expect(getPackageVersionById).toHaveBeenCalledTimes(1);
    const child = element.shadowRoot.querySelector("c-package-version-details");
    expect(child).toBeNull();
  });

  it("hides Refresh on a successful request but keeps it while in flight", async () => {
    const success = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    success.requestId = "08c000000000027AAA";
    success.status = "Success";
    success.package2VersionId = "05i000000000027AAA";
    document.body.appendChild(success);
    await flush();
    const successLabels = Array.from(
      success.shadowRoot.querySelectorAll("lightning-button")
    ).map((b) => b.label);
    expect(successLabels).not.toContain("Refresh");

    const inFlight = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    inFlight.requestId = "08c000000000028AAA";
    inFlight.status = "VerifyingMetadata";
    document.body.appendChild(inFlight);
    await flush();
    const inFlightLabels = Array.from(
      inFlight.shadowRoot.querySelectorAll("lightning-button")
    ).map((b) => b.label);
    expect(inFlightLabels).toContain("Refresh");
  });

  it("hides the entire footer once the version details card is shown", async () => {
    getPackageVersionById.mockResolvedValue(versionWrapper);
    const element = createElement("c-package-version-create-request-detail", {
      is: PackageVersionCreateRequestDetail
    });
    element.requestId = "08c000000000029AAA";
    element.status = "Success";
    element.package2VersionId = "05i000000000020AAA";
    document.body.appendChild(element);
    await flush();

    expect(
      element.shadowRoot.querySelector(".slds-card__footer")
    ).not.toBeNull();

    Array.from(element.shadowRoot.querySelectorAll("lightning-button"))
      .find((b) => b.label === "View Package Version")
      .click();
    await flush();

    expect(
      element.shadowRoot.querySelector("c-package-version-details")
    ).not.toBeNull();
    // Footer (and every footer button) is gone once the card is delivered.
    expect(element.shadowRoot.querySelector(".slds-card__footer")).toBeNull();
    const labels = Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).map((b) => b.label);
    expect(labels).not.toContain("View Package Version");
    expect(labels).not.toContain("Refresh");
  });
});
