import { createElement } from "lwc";
import ScratchSettingsExpression from "c/scratchSettingsExpression";

// Let every pending microtask/render tick settle.
const flushRenders = async () => {
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

describe("c-scratch-settings-expression", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("mounts in the unconfirmed (edit) state by default", async () => {
    const element = createElement("c-scratch-settings-expression", {
      is: ScratchSettingsExpression
    });
    document.body.appendChild(element);
    await flushRenders();

    const toggle = element.shadowRoot.querySelector(
      "lightning-button-stateful"
    );
    expect(toggle.selected).toBe(false);
  });

  it("confirm() auto-confirms once all rows are mounted and emits merged settings", async () => {
    const element = createElement("c-scratch-settings-expression", {
      is: ScratchSettingsExpression
    });
    const confirmSpy = jest.fn();
    const returnSpy = jest.fn();
    element.addEventListener("confirm", (e) => confirmSpy(e.detail));
    element.addEventListener("return", (e) => returnSpy(e.detail));
    document.body.appendChild(element);
    await flushRenders();

    // Act — request auto-confirm the way the parent card does on launch.
    element.confirm();
    await flushRenders();

    // Assert — the toggle flipped to confirmed and the parent received both events.
    const toggle = element.shadowRoot.querySelector(
      "lightning-button-stateful"
    );
    expect(toggle.selected).toBe(true);
    expect(confirmSpy).toHaveBeenCalledWith(true);
    expect(returnSpy).toHaveBeenCalledTimes(1);
    // Default seed settings should be present in the merged payload.
    const merged = returnSpy.mock.calls[0][0];
    expect(Object.keys(merged)).toEqual(
      expect.arrayContaining(["lightningExperienceSettings", "mobileSettings"])
    );
  });

  it("waits for a template-applied row before auto-confirming", async () => {
    const element = createElement("c-scratch-settings-expression", {
      is: ScratchSettingsExpression
    });
    const returnSpy = jest.fn();
    element.addEventListener("return", (e) => returnSpy(e.detail));
    document.body.appendChild(element);
    await flushRenders();

    // Act — apply a template setting, then request auto-confirm in the same tick (as the card does).
    element.applySettings({ einsteinGptSettings: {} });
    element.confirm();
    await flushRenders();

    // Assert — the template setting made it into the confirmed payload.
    expect(returnSpy).toHaveBeenCalledTimes(1);
    const merged = returnSpy.mock.calls[0][0];
    expect(Object.keys(merged)).toContain("einsteinGptSettings");
  });
});
