import { buildLineageModel, buildVisibleLineage } from "../d3TreeChartModel";

const version = (id, ancestorId, createdDate, additionalValues = {}) => ({
  subscriberPackageVersionId: id,
  ancestorId,
  versionNumber: id,
  isReleased: true,
  createdDate,
  ...additionalValues
});

describe("d3TreeChart lineage model", () => {
  it("builds a selected ancestor path and summarizes contextual branches", () => {
    const model = buildLineageModel(
      [
        version("04tA", null, "2026-01-01T00:00:00.000Z"),
        version("04tB", "04tA", "2026-02-01T00:00:00.000Z"),
        version("04tC", "04tB", "2026-03-01T00:00:00.000Z"),
        version("04tD", "04tA", "2026-02-15T00:00:00.000Z")
      ],
      "04tC"
    );

    expect(model.path.map((node) => node.subscriberPackageVersionId)).toEqual([
      "04tA",
      "04tB",
      "04tC"
    ]);
    expect(model.branchSummaries).toEqual([
      expect.objectContaining({ parentId: "04tA", versionCount: 1 })
    ]);
  });

  it("defaults to the latest released version and excludes unreleased versions", () => {
    const model = buildLineageModel([
      version("04tA", null, "2026-01-01T00:00:00.000Z"),
      version("04tB", "04tA", "2026-02-01T00:00:00.000Z"),
      version("04tC", "04tB", "2026-03-01T00:00:00.000Z", {
        isReleased: false
      })
    ]);

    expect(model.selectedId).toBe("04tB");
    expect(model.nodesById.has("04tC")).toBe(false);
  });

  it("handles an empty result without selecting a version", () => {
    const model = buildLineageModel([], "04tUnknown");

    expect(model.nodesById.size).toBe(0);
    expect(model.path).toEqual([]);
    expect(model.selectedVersion).toBeUndefined();
    expect(model.issues).toEqual([
      { type: "missing-selection", id: "04tUnknown" }
    ]);
  });

  it("reports duplicate ids, cycles, missing parents, and an absent selection", () => {
    const model = buildLineageModel(
      [
        version("04tA", "04tMissing", "2026-01-01T00:00:00.000Z"),
        version("04tA", null, "2026-01-02T00:00:00.000Z"),
        version("04tB", "04tC", "2026-01-03T00:00:00.000Z"),
        version("04tC", "04tB", "2026-01-04T00:00:00.000Z")
      ],
      "04tUnknown"
    );

    expect(model.issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining([
        "duplicate-id",
        "missing-parent",
        "cycle",
        "missing-selection"
      ])
    );
    expect(model.selectedId).toBe("04tC");
  });

  it("renders only the focused path until a contextual branch is expanded", () => {
    const model = buildLineageModel(
      [
        version("04tA", null, "2026-01-01T00:00:00.000Z"),
        version("04tB", "04tA", "2026-02-01T00:00:00.000Z"),
        version("04tC", "04tB", "2026-03-01T00:00:00.000Z"),
        version("04tD", "04tA", "2026-02-15T00:00:00.000Z"),
        version("04tE", "04tD", "2026-02-20T00:00:00.000Z")
      ],
      "04tC"
    );

    const collapsed = buildVisibleLineage(model, new Set());
    const expanded = buildVisibleLineage(model, new Set(["04tA"]));

    expect(collapsed.nodes.map((item) => item.id)).toEqual([
      "04tA",
      "04tB",
      "04tC"
    ]);
    expect(collapsed.branchPills).toHaveLength(1);
    expect(collapsed.width).toBeGreaterThanOrEqual(
      collapsed.branchPills[0].x + 142 + 36
    );
    expect(expanded.nodes.map((item) => item.id)).toEqual(
      expect.arrayContaining(["04tD", "04tE"])
    );
    expect(expanded.branchPills).toHaveLength(0);
  });

  it("summarizes disconnected released lineages under package-level context", () => {
    const model = buildLineageModel(
      [
        version("04tRootA", null, "2026-01-01T00:00:00.000Z"),
        version("04tRootB", null, "2026-02-01T00:00:00.000Z"),
        version("04tB1", "04tRootB", "2026-03-01T00:00:00.000Z"),
        version("04tB2", "04tB1", "2026-04-01T00:00:00.000Z"),
        version("04tRootC", null, "2026-05-01T00:00:00.000Z"),
        version("04tC1", "04tRootC", "2026-06-01T00:00:00.000Z")
      ],
      "04tC1"
    );

    const collapsed = buildVisibleLineage(model, new Set());
    const expanded = buildVisibleLineage(model, new Set(["__package-root__"]));

    expect(model.path.map((node) => node.subscriberPackageVersionId)).toEqual([
      "04tRootC",
      "04tC1"
    ]);
    expect(model.branchSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parentId: "__package-root__",
          label: "Other release lines",
          versionCount: 4
        })
      ])
    );
    expect(collapsed.nodes.map((item) => item.id)).toEqual([
      "04tRootC",
      "04tC1"
    ]);
    expect(collapsed.branchPills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parentId: "__package-root__",
          label: "Other lines (+4)"
        })
      ])
    );
    expect(expanded.nodes.map((item) => item.id)).toEqual(
      expect.arrayContaining(["04tRootA", "04tRootB", "04tB1", "04tB2"])
    );
  });

  it("keeps a 2,000-version input focused until contextual branches are expanded", () => {
    const versions = [version("04tRoot", null, "2026-01-01T00:00:00.000Z")];
    versions.push(
      ...Array.from({ length: 1999 }, (_, index) =>
        version(
          `04t${index}`,
          "04tRoot",
          new Date(2026, 0, 2, 0, 0, index).toISOString()
        )
      )
    );
    const model = buildLineageModel(versions, "04t0");
    const visible = buildVisibleLineage(model, new Set());

    expect(model.nodesById.size).toBe(2000);
    expect(visible.nodes).toHaveLength(2);
    expect(visible.branchPills).toEqual([
      expect.objectContaining({ versionCount: 1998 })
    ]);
  });

  it("keeps an unavailable ancestor inside the visible canvas bounds", () => {
    const model = buildLineageModel(
      [version("04tA", "04tMissing", "2026-01-01T00:00:00.000Z")],
      "04tA"
    );
    const visible = buildVisibleLineage(model);

    expect(visible.nodes[0]).toEqual(
      expect.objectContaining({ type: "missing", x: 36 })
    );
  });
});
