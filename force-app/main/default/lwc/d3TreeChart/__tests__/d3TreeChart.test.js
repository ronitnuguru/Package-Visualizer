import { createElement } from "lwc";
import D3TreeChart from "c/d3TreeChart";
import { loadScript } from "lightning/platformResourceLoader";

jest.mock(
  "lightning/platformResourceLoader",
  () => ({ loadScript: jest.fn() }),
  { virtual: true }
);

const flushPromises = () =>
  Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());

const createD3Mock = () => {
  const createSelection = () => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const selection = {
      append: jest.fn(() => createSelection()),
      attr: jest.fn(() => selection),
      call: jest.fn(() => selection),
      node: jest.fn(() => node),
      on: jest.fn(() => selection),
      select: jest.fn(() => selection),
      selectAll: jest.fn(() => ({ remove: jest.fn() })),
      style: jest.fn(() => selection),
      text: jest.fn(() => selection)
    };
    return selection;
  };
  return { select: jest.fn(() => createSelection()) };
};

const findIconButton = (element, tooltip) =>
  [...element.shadowRoot.querySelectorAll("lightning-button-icon")].find(
    (button) => button.tooltip === tooltip
  );

const pointerEvent = (type, values) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    button: values.button ?? 0,
    clientX: values.clientX,
    clientY: values.clientY
  });
  Object.defineProperty(event, "pointerId", { value: values.pointerId });
  return event;
};

describe("c-d3-tree-chart", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
    delete window.d3;
  });

  it("shows an empty state when no released versions are available", async () => {
    window.d3 = {};
    loadScript.mockResolvedValue();
    const element = createElement("c-d3-tree-chart", { is: D3TreeChart });
    element.gridData = [];

    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "No released versions are available to visualize."
    );
  });

  it("shows a retry action when the secure static-resource load fails", async () => {
    loadScript.mockRejectedValue(new Error("Static resource unavailable"));
    const element = createElement("c-d3-tree-chart", { is: D3TreeChart });

    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "Static resource unavailable"
    );
    const retry = [
      ...element.shadowRoot.querySelectorAll("lightning-button")
    ].find((button) => button.label === "Retry");
    retry.click();

    expect(loadScript).toHaveBeenCalledTimes(2);
  });

  it("uses the full-width canvas and dispatches details from the header", async () => {
    window.d3 = createD3Mock();
    loadScript.mockResolvedValue();
    const element = createElement("c-d3-tree-chart", { is: D3TreeChart });
    element.gridData = [
      {
        ancestorId: null,
        createdDate: "2026-01-01T00:00:00.000Z",
        isReleased: true,
        subscriberPackageVersionId: "04tA",
        versionNumber: "1.0"
      },
      {
        ancestorId: "04tA",
        createdDate: "2026-02-01T00:00:00.000Z",
        isReleased: true,
        subscriberPackageVersionId: "04tB",
        versionNumber: "2.0"
      }
    ];
    const currentNodeHandler = jest.fn();
    element.addEventListener("currentnode", currentNodeHandler);

    document.body.appendChild(element);
    await flushPromises();
    await flushPromises();

    const canvas = element.shadowRoot.querySelector(".pkgviz-ancestry-canvas");
    expect(canvas.scrollLeft).toBeGreaterThan(0);
    expect(element.shadowRoot.querySelector("aside")).toBeNull();

    const card = element.shadowRoot.querySelector("lightning-card");
    expect(card).not.toBeNull();
    expect(card.querySelector('[slot="title"]').textContent).toContain(
      "Package Ancestry"
    );
    expect(card.querySelector('[slot="title"] lightning-icon')).not.toBeNull();
    const actions = card.querySelector('[slot="actions"]');
    expect(actions).not.toBeNull();
    expect(actions.querySelector("lightning-button-menu")).toBeNull();
    expect(findIconButton(element, "Center selected version")).toBeUndefined();
    expect(element.shadowRoot.textContent).not.toContain(
      "Trace released versions. Scroll to explore long ancestry paths."
    );

    const detailsButton = findIconButton(element, "View Details");
    expect(detailsButton).toBeDefined();
    expect(detailsButton.iconName).toBe("utility:info");
    expect(detailsButton.variant).toBe("brand");
    detailsButton.click();

    expect(currentNodeHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ subscriberPackageVersionId: "04tB" })
      })
    );
  });

  it("zooms through the scroll surface and supports drag panning", async () => {
    window.d3 = createD3Mock();
    loadScript.mockResolvedValue();
    const element = createElement("c-d3-tree-chart", { is: D3TreeChart });
    element.gridData = [
      {
        ancestorId: null,
        createdDate: "2026-01-01T00:00:00.000Z",
        isReleased: true,
        subscriberPackageVersionId: "04tA",
        versionNumber: "1.0"
      },
      {
        ancestorId: "04tA",
        createdDate: "2026-02-01T00:00:00.000Z",
        isReleased: true,
        subscriberPackageVersionId: "04tB",
        versionNumber: "2.0"
      }
    ];

    document.body.appendChild(element);
    await flushPromises();
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain("100%");
    findIconButton(element, "Zoom In").click();
    await flushPromises();
    expect(element.shadowRoot.textContent).toContain("125%");

    const canvas = element.shadowRoot.querySelector(".pkgviz-ancestry-canvas");
    canvas.scrollLeft = 500;
    canvas.scrollTop = 200;
    canvas.dispatchEvent(
      pointerEvent("pointerdown", {
        clientX: 200,
        clientY: 200,
        pointerId: 1
      })
    );
    canvas.dispatchEvent(
      pointerEvent("pointermove", {
        clientX: 100,
        clientY: 150,
        pointerId: 1
      })
    );
    canvas.dispatchEvent(
      pointerEvent("pointerup", {
        clientX: 100,
        clientY: 150,
        pointerId: 1
      })
    );

    expect(canvas.scrollLeft).toBe(600);
    expect(canvas.scrollTop).toBe(250);
  });

  it("does not capture pointer gestures that begin on a tree item", async () => {
    window.d3 = createD3Mock();
    loadScript.mockResolvedValue();
    const element = createElement("c-d3-tree-chart", { is: D3TreeChart });
    element.gridData = [
      {
        ancestorId: null,
        createdDate: "2026-01-01T00:00:00.000Z",
        isReleased: true,
        subscriberPackageVersionId: "04tA",
        versionNumber: "1.0"
      }
    ];

    document.body.appendChild(element);
    await flushPromises();
    await flushPromises();

    const canvas = element.shadowRoot.querySelector(".pkgviz-ancestry-canvas");
    const treeItem = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    treeItem.setAttribute("role", "treeitem");
    const card = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    treeItem.appendChild(card);
    canvas.appendChild(treeItem);
    canvas.scrollLeft = 200;

    card.dispatchEvent(
      pointerEvent("pointerdown", {
        clientX: 200,
        clientY: 100,
        pointerId: 2
      })
    );
    card.dispatchEvent(
      pointerEvent("pointermove", {
        clientX: 100,
        clientY: 100,
        pointerId: 2
      })
    );

    expect(canvas.scrollLeft).toBe(200);
    expect(canvas.classList).not.toContain("pkgviz-ancestry-canvas_panning");
  });

  it("groups actual-size and fit actions as icon controls", async () => {
    window.d3 = createD3Mock();
    loadScript.mockResolvedValue();
    const element = createElement("c-d3-tree-chart", { is: D3TreeChart });
    element.gridData = [
      {
        ancestorId: null,
        createdDate: "2026-01-01T00:00:00.000Z",
        isReleased: true,
        subscriberPackageVersionId: "04tA",
        versionNumber: "1.0"
      }
    ];

    document.body.appendChild(element);
    await flushPromises();
    await flushPromises();

    const actualSizeButton = findIconButton(element, "Expand");
    const fitButton = findIconButton(element, "Contract");
    expect(actualSizeButton).toBeDefined();
    expect(fitButton).toBeDefined();
    expect(actualSizeButton.parentElement).toBe(fitButton.parentElement);
    expect(actualSizeButton.parentElement.tagName).toBe(
      "LIGHTNING-BUTTON-GROUP"
    );
    findIconButton(element, "Zoom In").click();
    await flushPromises();
    expect(element.shadowRoot.textContent).toContain("125%");

    actualSizeButton.click();
    await flushPromises();
    expect(element.shadowRoot.textContent).toContain("100%");
  });

  it("does not expose redundant branch toolbar controls", async () => {
    window.d3 = createD3Mock();
    loadScript.mockResolvedValue();
    const element = createElement("c-d3-tree-chart", { is: D3TreeChart });
    element.gridData = [
      {
        ancestorId: null,
        createdDate: "2026-01-01T00:00:00.000Z",
        isReleased: true,
        subscriberPackageVersionId: "04tA",
        versionNumber: "1.0"
      }
    ];

    document.body.appendChild(element);
    await flushPromises();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("lightning-button-menu")
    ).toBeNull();
    expect(
      findIconButton(element, "Expand all contextual branches")
    ).toBeUndefined();
    expect(
      findIconButton(element, "Collapse all contextual branches")
    ).toBeUndefined();
  });
});
