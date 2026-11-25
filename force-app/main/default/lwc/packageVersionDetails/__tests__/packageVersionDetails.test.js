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
    const inputs = [...element.shadowRoot.querySelectorAll("lightning-input")];
    expect(inputs.find(input => input.label === "Total Metadata Files")).toBeUndefined();
    expect(inputs.find(input => input.label === "Total Metadata Size")).toBeUndefined();
    expect(action).not.toBeNull();
    expect(action.displayMode).toBe("contextAction");
    expect(action.alternativeText).toBe("Chat with Agentforce");
    expect(action.utterance).toContain(
      `SubscriberPackageVersion ID ${packageVersionId}`
    );
    expect(action.utterance).toContain("invoke Get Package Version Readiness");
  });
  it("shows zero, false, large values and missing fields accurately", () => {
    const element = createElement("c-package-version-details", {
      is: PackageVersionDetails
    });
    element.packageVersionNumber = "1.0.0-1";
    element.packageContainsPsld = true;
    element.packageHasVpi = false;
    element.packageTotalNumberOfMetadataFiles = 0;
    element.packageTotalSizeOfMetadataFiles = 3000000000;
    document.body.appendChild(element);

    const inputs = [...element.shadowRoot.querySelectorAll("lightning-input")];
    const field = label => inputs.find(input => input.label === label);
    expect(field("Contains PSLD").checked).toBe(true);
    expect(field("Has VPI").checked).toBe(false);
    expect(field("Snapshot Name")).toBeUndefined();
    expect(field("Total Metadata Files").value).toBe("0");
    expect(field("Total Metadata Size").value).toBe(new Intl.NumberFormat().format(3000000000));
  });

  it("shows a zero metadata size", () => {
    const element = createElement("c-package-version-details", {
      is: PackageVersionDetails
    });
    element.packageVersionNumber = "1.0.0-1";
    element.packageTotalSizeOfMetadataFiles = 0;
    document.body.appendChild(element);

    const size = [...element.shadowRoot.querySelectorAll("lightning-input")]
      .find(input => input.label === "Total Metadata Size");
    expect(size.value).toBe("0");
  });

  it("shows the snapshot name when supplied", () => {
    const element = createElement("c-package-version-details", {
      is: PackageVersionDetails
    });
    element.packageVersionNumber = "1.0.0-1";
    element.packageSnapshotName = "release-snapshot";
    document.body.appendChild(element);

    const snapshot = [...element.shadowRoot.querySelectorAll("lightning-input")]
      .find(input => input.label === "Snapshot Name");
    expect(snapshot.value).toBe("release-snapshot");
  });

});
