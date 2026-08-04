import {
  boundedJson,
  isSalesforceId,
  safeString
} from "c/agentforceConversationUtils";

describe("agentforceConversationUtils", () => {
  it("validates Salesforce identifiers by exact prefix", () => {
    expect(isSalesforceId("0Ho000000000001AAA", "0Ho")).toBe(true);
    expect(isSalesforceId("0Ho000000000001", "0Ho")).toBe(true);
    expect(isSalesforceId("033000000000001AAA", "0Ho")).toBe(false);
  });

  it("bounds strings without changing null handling", () => {
    expect(safeString("abcdef", 3)).toBe("abc");
    expect(safeString(null, 3)).toBe("");
  });

  it("keeps prioritized metadata and reports collection truncation", () => {
    const result = boundedJson(
      {
        packageType: "2GP and Unlocked Packages",
        capturedAt: "2026-07-29T10:00:00.000Z"
      },
      {
        collectionName: "errors",
        values: Array.from({ length: 50 }, (_, index) => ({
          id: String(index),
          message: "x".repeat(200)
        })),
        totalCount: 50
      },
      1000
    );
    const snapshot = JSON.parse(result);

    expect(result.length).toBeLessThanOrEqual(1000);
    expect(snapshot.packageType).toBe("2GP and Unlocked Packages");
    expect(snapshot.totalErrorCount).toBe(50);
    expect(snapshot.includedErrorCount).toBeLessThan(50);
    expect(snapshot.errorsTruncated).toBe(true);
    expect(snapshot.snapshotTruncated).toBe(true);
  });

  it("returns valid bounded JSON when prioritized metadata alone exceeds the budget", () => {
    const result = boundedJson(
      {
        recordId: "04t000000000001AAA",
        message: "x".repeat(1000)
      },
      undefined,
      160
    );
    const snapshot = JSON.parse(result);

    expect(result.length).toBeLessThanOrEqual(160);
    expect(snapshot.recordId).toBe("04t000000000001AAA");
    expect(snapshot.snapshotTruncated).toBe(true);
  });
});
