import { createElement } from "lwc";
import SetupAssistantHeadlessToolkit from "c/setupAssistantHeadlessToolkit";
import { TEMPLATES, buildFeaturePill } from "c/scratchOrgConfig";
import getJourneyUrl from "@salesforce/apex/HeadlessJourneyLauncherController.getJourneyUrl";
import createJourneyTrustedUrl from "@salesforce/apex/HeadlessJourneyLauncherController.createJourneyTrustedUrl";

jest.mock("@salesforce/apex/HeadlessJourneyLauncherController.getJourneyUrl", () => {
  const { createApexTestWireAdapter } = require("@salesforce/wire-service-jest-util");
  return { default: createApexTestWireAdapter(jest.fn()) };
}, { virtual: true });

jest.mock("@salesforce/apex/HeadlessJourneyLauncherController.createJourneyTrustedUrl", () => ({ default: jest.fn() }), { virtual: true });
jest.mock("@salesforce/userPermission/CustomizeApplication", () => ({ default: true }), { virtual: true });
jest.mock("@salesforce/userPermission/ModifyAllData", () => ({ default: true }), { virtual: true });

const journeyUrl = "https://subscriber--pkgviz.my.salesforce.app/app/c__HeadlessJourney";

function mount() {
  const element = createElement("c-setup-assistant-headless-toolkit", {
    is: SetupAssistantHeadlessToolkit
  });
  document.body.appendChild(element);
  return element.shadowRoot;
}

describe("Headless Toolkit", () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  it("renders its environment tabs and selects the hosted MCP scratch preset", () => {
    const root = mount();
    const tabs = [...root.querySelectorAll("lightning-tab")];
    expect(tabs.map((tab) => tab.label)).toEqual([
      "Manageability Rules",
      "Developer Environments",
      "Scratch Orgs",
      "Developer & Demo Orgs"
    ]);
    const builder = root.querySelector(
      "c-scratch-def-file-build-card"
    );
    expect(builder.templateKey).toBe("headlessToolkit");
    expect(builder.autoConfirmSettings).toBe(true);
    expect(TEMPLATES.headlessToolkit.features).toContain("SalesforceHostedMCP");
  });

  it("opens the same app in a new tab when embedding fails", async () => {
    const root = mount();
    getJourneyUrl.emit(journeyUrl);
    await Promise.resolve();

    const embed = root.querySelector("lightning-ui-embedding");
    expect(embed.src).toBe(journeyUrl);
    embed.dispatchEvent(new CustomEvent("sf-embedding.component.error"));
    await Promise.resolve();

    expect(root.querySelector("lightning-ui-embedding")).toBeNull();
    expect(root.querySelector("lightning-spinner")).toBeNull();
    const actions = root.querySelector('lightning-button-group[slot="actions"]');
    expect(actions.querySelector("lightning-button").label).toBe("Create Trusted URL");
    const [setupButton, refreshButton, openButton] = actions.querySelectorAll("lightning-button-icon");
    const newTab = { location: { href: "" }, opener: window };
    const open = jest.spyOn(window, "open").mockImplementation(() => newTab);
    expect(setupButton.tooltip).toBe("Open Trusted URLs Setup");
    setupButton.click();
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(newTab.location.href).toBe(window.location.origin + "/lightning/setup/SecurityCspTrustedSite/home");
    expect(newTab.opener).toBeNull();
    expect(refreshButton.iconName).toBe("utility:refresh");
    expect(refreshButton.alternativeText).toBe("Refresh");
    expect(openButton.iconName).toBe("utility:new_window");
    openButton.click();
    expect(open).toHaveBeenCalledWith(journeyUrl, "_blank", "noopener,noreferrer");
    const setup = root.querySelector('[aria-label="Component Requirements for Embedded UI"]');
    expect(setup.textContent).toContain(new URL(journeyUrl).origin);
    expect(setup.textContent).toContain("frame-src (iframe content)");
  });

  it("creates the Trusted URL only after an admin clicks and asks them to reload", async () => {
    const root = mount();
    createJourneyTrustedUrl.mockResolvedValueOnce(undefined);
    getJourneyUrl.emit(journeyUrl);
    await Promise.resolve();
    root.querySelector("lightning-ui-embedding").dispatchEvent(new CustomEvent("sf-embedding.component.error"));
    await Promise.resolve();
    expect(createJourneyTrustedUrl).not.toHaveBeenCalled();

    const button = root.querySelector("lightning-button");
    button.click();
    button.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(createJourneyTrustedUrl).toHaveBeenCalledTimes(1);
    expect(createJourneyTrustedUrl).toHaveBeenCalledWith();
    expect(root.querySelector('[role="status"]').textContent).toContain("Select Refresh");
    expect(root.querySelector("lightning-button").disabled).toBe(true);
  });

  it("leaves the embedded app in place when it becomes ready", async () => {
    const root = mount();
    expect(root.querySelector("lightning-spinner").variant).toBe("brand");
    getJourneyUrl.emit(journeyUrl);
    await Promise.resolve();
    const embed = root.querySelector("lightning-ui-embedding");
    expect(root.querySelector("lightning-spinner").size).toBe("medium");
    expect(root.querySelector('lightning-button-group[slot="actions"]')).toBeNull();

    embed.dispatchEvent(new CustomEvent("sf-embedding.component.ready"));
    await Promise.resolve();

    expect(root.querySelector("lightning-ui-embedding")).toBe(embed);
    expect(root.querySelector("lightning-spinner")).toBeNull();
    expect(root.querySelector('lightning-button-group[slot="actions"]')).toBeNull();
  });

  it("shows recovery actions if the embed silently fails to become ready", async () => {
    jest.useFakeTimers();
    const root = mount();
    getJourneyUrl.emit(journeyUrl);
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    expect(root.querySelector("lightning-spinner")).toBeNull();
    expect(root.querySelector("lightning-ui-embedding")).toBeNull();
    expect(root.querySelector('lightning-button-group[slot="actions"]')).not.toBeNull();
  });

  it("remounts the journey on refresh without reloading the page", async () => {
    const root = mount();
    getJourneyUrl.emit(journeyUrl);
    await Promise.resolve();
    const firstEmbed = root.querySelector("lightning-ui-embedding");
    firstEmbed.dispatchEvent(new CustomEvent("sf-embedding.component.error"));
    await Promise.resolve();
    root.querySelectorAll('lightning-button-group[slot="actions"] lightning-button-icon')[1].click();
    await Promise.resolve();
    const retriedEmbed = root.querySelector("lightning-ui-embedding");
    expect(retriedEmbed).not.toBeNull();
    expect(retriedEmbed).not.toBe(firstEmbed);
    expect(root.querySelector("lightning-spinner")).not.toBeNull();
    retriedEmbed.dispatchEvent(new CustomEvent("sf-embedding.component.ready"));
    await Promise.resolve();
    expect(root.querySelector("lightning-spinner")).toBeNull();
    expect(root.querySelector('lightning-button-group[slot="actions"]')).toBeNull();
  });

  it("shows the access message when the launcher finds no accessible app", async () => {
    const root = mount();
    getJourneyUrl.emit(null);
    await Promise.resolve();

    expect(root.textContent).toContain("Check app access in Setup");
    expect(root.querySelector("lightning-ui-embedding")).toBeNull();
    expect(root.querySelector("lightning-button-icon")).toBeNull();
  });
  it("links features to their documented anchors without the legacy prefix", () => {
    expect(buildFeaturePill("SalesforceHostedMCP").href).toBe(
      "https://developer.salesforce.com/docs/platform/sfdx-dev/guide/sfdx-dev-scratch-orgs-def-file-config-values.html#salesforcehostedmcp"
    );
    expect(buildFeaturePill("salesforcehostedmcp").href).toBe(
      buildFeaturePill("SalesforceHostedMCP").href
    );
    expect(buildFeaturePill("EnableSetPasswordInApi").href).toBe(
      "https://developer.salesforce.com/docs/platform/sfdx-dev/guide/sfdx-dev-scratch-orgs-def-file-config-values.html#enablesetpasswordinapi"
    );
  });
});
