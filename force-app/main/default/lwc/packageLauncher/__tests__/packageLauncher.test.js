import { createElement } from "lwc";
import PackageLauncher from "c/packageLauncher";

// Interleaved types so a filtered position never equals the original index —
// this is what makes the index-preservation assertions meaningful.
const PACKAGES = [
  {
    id: "0Ho000000000001AAA",
    name: "Alpha",
    namespacePrefix: "alpha",
    description: "First package",
    containerOptions: "Managed"
  },
  {
    id: "0Ho000000000002AAA",
    name: "Bravo",
    namespacePrefix: "bravo",
    description: "Second package",
    containerOptions: "Unlocked"
  },
  {
    id: "0Ho000000000003AAA",
    name: "Charlie",
    namespacePrefix: "charlie",
    description: "Third package",
    containerOptions: "Managed"
  },
  {
    id: "0Ho000000000004AAA",
    name: "Delta",
    namespacePrefix: "delta",
    description: "Fourth package",
    containerOptions: "Unlocked"
  }
];

function createComponent(packageTypes = "2GP and Unlocked Packages") {
  const element = createElement("c-package-launcher", { is: PackageLauncher });
  element.packageFilterList = JSON.parse(JSON.stringify(PACKAGES));
  element.packageTypes = packageTypes;
  document.body.appendChild(element);
  return element;
}

// Only the package tiles carry data-id; the docked-utility/setup <li>s do not.
function getTiles(element) {
  return element.shadowRoot.querySelectorAll("li[data-id]");
}

function getTypeRadio(element, type) {
  return element.shadowRoot.querySelector(`input[data-type="${type}"]`);
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-package-launcher type filter", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("T1: dispatches the ORIGINAL index when a filtered tile is clicked", async () => {
    const element = createComponent();
    await flush();

    getTypeRadio(element, "Managed").click();
    await flush();

    const tiles = getTiles(element);
    expect(tiles.length).toBe(2); // Alpha (0) and Charlie (2)

    const handler = jest.fn();
    element.addEventListener("packagechange", handler);

    // Second visible tile is Charlie — original index 2, filtered position 1.
    tiles[1].click();
    await flush();

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail).toBe("2");
  });

  it("T2: dispatches the correct index with no filter active", async () => {
    const element = createComponent();
    await flush();

    const handler = jest.fn();
    element.addEventListener("packagechange", handler);

    const tiles = getTiles(element);
    expect(tiles.length).toBe(4);
    tiles[3].click(); // Delta — index 3
    await flush();

    expect(handler.mock.calls[0][0].detail).toBe("3");
  });

  it("T3: the dispatched detail is a string (parent indexes with it)", async () => {
    const element = createComponent();
    await flush();

    const handler = jest.fn();
    element.addEventListener("packagechange", handler);

    getTiles(element)[0].click();
    await flush();

    expect(typeof handler.mock.calls[0][0].detail).toBe("string");
  });

  it("T4: clicking the same picker again clears it and restores all tiles", async () => {
    const element = createComponent();
    await flush();

    const managed = getTypeRadio(element, "Managed");
    managed.click();
    await flush();
    expect(managed.checked).toBe(true);
    expect(getTiles(element).length).toBe(2);

    // Re-click the already-selected picker → toggle back to all.
    managed.click();
    await flush();
    expect(managed.checked).toBe(false);
    expect(getTiles(element).length).toBe(4);
  });

  it("T5: selecting a second type deselects the first (mutual exclusivity)", async () => {
    const element = createComponent();
    await flush();

    getTypeRadio(element, "Managed").click();
    await flush();

    getTypeRadio(element, "Unlocked").click();
    await flush();

    expect(getTypeRadio(element, "Managed").checked).toBe(false);
    expect(getTypeRadio(element, "Unlocked").checked).toBe(true);

    const tiles = getTiles(element);
    expect(tiles.length).toBe(2); // Bravo (1) and Delta (3)

    const handler = jest.fn();
    element.addEventListener("packagechange", handler);
    tiles[0].click(); // Bravo — original index 1
    await flush();
    expect(handler.mock.calls[0][0].detail).toBe("1");
  });

  it("T6: hides the pickers for 1GP but still dispatches correct indices", async () => {
    const element = createComponent("1GP and Unmanaged Packages");
    await flush();

    expect(getTypeRadio(element, "Managed")).toBeNull();
    expect(getTypeRadio(element, "Unlocked")).toBeNull();

    const handler = jest.fn();
    element.addEventListener("packagechange", handler);
    getTiles(element)[2].click(); // Charlie — index 2
    await flush();
    expect(handler.mock.calls[0][0].detail).toBe("2");
  });

  it("T7: realigns indices when the parent pushes a re-indexed (searched) list", async () => {
    const element = createComponent();
    await flush();

    getTypeRadio(element, "Managed").click();
    await flush();

    // Simulate the parent's search narrowing the list to two packages,
    // re-indexed from 0. Charlie is now at index 1 (was 2).
    element.packageFilterList = [
      JSON.parse(JSON.stringify(PACKAGES[3])), // Delta, Unlocked, now index 0
      JSON.parse(JSON.stringify(PACKAGES[2])) // Charlie, Managed, now index 1
    ];
    await flush();

    const tiles = getTiles(element);
    expect(tiles.length).toBe(1); // only Charlie is Managed
    expect(tiles[0].dataset.id).toBe("1");

    const handler = jest.fn();
    element.addEventListener("packagechange", handler);
    tiles[0].click();
    await flush();
    expect(handler.mock.calls[0][0].detail).toBe("1");
  });

  it("T8: badges reflect the per-type counts of the current list", async () => {
    const element = createComponent();
    await flush();

    const badges = element.shadowRoot.querySelectorAll("lightning-badge");
    const labels = Array.from(badges).map((b) => b.label);
    // Managed picker renders first, Unlocked second.
    expect(labels).toEqual([2, 2]); // 2 Managed, 2 Unlocked
  });
});
