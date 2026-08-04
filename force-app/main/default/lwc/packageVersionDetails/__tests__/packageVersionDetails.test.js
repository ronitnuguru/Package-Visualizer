import { createElement } from "@lwc/engine-dom";
import PackageVersionDetails from "c/packageVersionDetails";

describe("c-package-version-details Agentforce integration", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders package-version readiness in the non-edit controls", () => {
    const packageVersionId = "04t000000000001AAA";
    const element = createElement("c-package-version-details", {
      is: PackageVersionDetails
    });
    element.packageSubscriberVersionId = packageVersionId;
    element.packageVersionNumber = "1.2.0-1";
    element.packageType = "Managed";

    document.body.appendChild(element);

    const action = element.shadowRoot.querySelector(
      "c-agentforce-conversation-actions"
    );
    expect(action).not.toBeNull();
    expect(action.displayMode).toBe("contextAction");
    expect(action.alternativeText).toBe("Chat with Agentforce");
    expect(action.utterance).toContain(
      `SubscriberPackageVersion ID ${packageVersionId}`
    );
    expect(action.utterance).toContain("invoke Get Package Version Readiness");
  });
});
