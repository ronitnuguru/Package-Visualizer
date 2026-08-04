import { createElement } from "lwc";
import GenAiResponseCard from "c/genAiResponseCard";
import invokeGenAiPromptTemplate from "@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";

jest.mock(
  "@salesforce/apexContinuation/PackageVisualizerCtrl.invokeGenAiPromptTemplate",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AgentforceExtensionStatusController.getStatus",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe("c-gen-ai-response-card", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("delegates extension resolution after a generation failure", async () => {
    getExtensionStatus.mockResolvedValue({
      state: "READY",
      message: "The extension is ready."
    });
    invokeGenAiPromptTemplate.mockRejectedValue({
      body: { message: "Models API is unavailable." }
    });
    const element = createElement("c-gen-ai-response-card", {
      is: GenAiResponseCard
    });

    document.body.appendChild(element);
    await flushPromises();
    await flushPromises();

    const prompt = element.shadowRoot.querySelector(
      "c-agentforce-extension-install-prompt"
    );
    expect(prompt).not.toBeNull();
    expect(
      element.shadowRoot.querySelector(
        'lightning-button[label="Install Managed Package"]'
      )
    ).toBeNull();
  });
});
