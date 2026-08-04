import { createElement } from "lwc";
import SetupAssistantTableauNext from "c/setupAssistantTableauNext";

const SCRATCH_ORG_WORKFLOW_URL =
  "https://developer.salesforce.com/docs/analytics/tableau-next-isv-dev/guide/tn-scratch-org-workflow.html";
const DEPLOY_ASSETS_URL =
  "https://developer.salesforce.com/docs/analytics/tableau-next-isv-dev/guide/tn-deploy-assets-using-cli.html";

describe("c-setup-assistant-tableau-next", () => {
  let element;

  beforeEach(() => {
    element = createElement("c-setup-assistant-tableau-next", {
      is: SetupAssistantTableauNext
    });
    document.body.appendChild(element);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.restoreAllMocks();
  });

  it("renders the Tableau Next setup tabs", () => {
    const tabLabels = Array.from(
      element.shadowRoot.querySelectorAll("lightning-tab")
    ).map((tab) => tab.label);

    expect(tabLabels).toEqual([
      "Manageability Rules",
      "Developer Environments",
      "Scratch Orgs",
      "Developer & Demo Orgs"
    ]);
  });

  it("initializes the scratch org builder with the composite Tableau Next preset", () => {
    const builder = element.shadowRoot.querySelector(
      "c-scratch-def-file-build-card"
    );

    expect(builder).not.toBeNull();
    expect(builder.templateKey).toBe("tableauNext");
    expect(builder.autoConfirmSettings).toBe(true);
  });

  it("leaves the Developer and Demo Orgs tab empty", () => {
    const developerDemoTab = element.shadowRoot.querySelector(
      '[data-id="developer-demo-orgs"]'
    );

    expect(developerDemoTab).not.toBeNull();
    expect(developerDemoTab.textContent.trim()).toBe("");
  });

  it("opens the Tableau Next scratch org workflow", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const button = element.shadowRoot.querySelector(
      '[data-id="scratch-org-workflow"]'
    );

    expect(button.alternativeText).toBe(
      "Open Tableau Next scratch org workflow"
    );
    button.click();

    expect(openSpy).toHaveBeenCalledWith(
      SCRATCH_ORG_WORKFLOW_URL,
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("opens the Tableau Next CLI deployment guide", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const button = element.shadowRoot.querySelector(
      '[data-id="deploy-assets-guide"]'
    );

    expect(button.alternativeText).toBe(
      "Open Tableau Next CLI deployment guide"
    );
    button.click();

    expect(openSpy).toHaveBeenCalledWith(
      DEPLOY_ASSETS_URL,
      "_blank",
      "noopener,noreferrer"
    );
  });
});
