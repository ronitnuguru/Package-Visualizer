import { createElement } from "@lwc/engine-dom";
import Package1VersionDetails from "c/package1VersionDetails";

describe("c-package1-version-details Agentforce integration", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("does not render the unsupported release-intelligence launcher", () => {
    const packageVersionId = "04t000000000001AAA";
    const element = createElement("c-package1-version-details", {
      is: Package1VersionDetails
    });
    element.versionId = packageVersionId;
    element.packageVersionNumber = "1.2.0";

    document.body.appendChild(element);

    expect(
      element.shadowRoot.querySelector("c-agentforce-conversation-actions")
    ).toBeNull();
  });
});
