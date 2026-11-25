import { createElement } from "lwc";
import WarningModal from "c/warningModal";

function mount(variant = "brand") {
  const element = createElement("c-warning-modal", { is: WarningModal });
  element.header = "Confirm action";
  element.body = "Confirmation message";
  element.neutralButtonLabel = "Cancel";
  element.brandButtonLabel = "Confirm";
  element.brandButtonVariant = variant;
  document.body.appendChild(element);
  return element;
}
afterEach(() => document.body.replaceChildren());

it.each(["brand", "destructive"])(
  "renders the %s confirmation style and dispatches confirmation",
  (variant) => {
    const element = mount(variant);
    const confirm = element.shadowRoot.querySelector(`.slds-button_${variant}`);
    expect(confirm.textContent.trim()).toBe("Confirm");
    const listener = jest.fn();
    element.addEventListener("brandclick", listener);
    confirm.click();
    expect(listener).toHaveBeenCalledTimes(1);
  }
);

it("focuses Cancel, traps Tab, and cancels on Escape or close", () => {
  const element = mount("destructive");
  const buttons = element.shadowRoot.querySelectorAll("button");
  const cancel = element.shadowRoot.querySelector('[data-id="cancel"]');
  expect(element.shadowRoot.activeElement).toBe(cancel);
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  last.focus();
  last.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true
    })
  );
  expect(element.shadowRoot.activeElement).toBe(first);
  first.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true
    })
  );
  expect(element.shadowRoot.activeElement).toBe(last);
  const listener = jest.fn();
  element.addEventListener("neutralclick", listener);
  last.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  expect(listener).toHaveBeenCalledTimes(1);
  first.click();
  cancel.click();
  expect(listener).toHaveBeenCalledTimes(3);
});
