const DEFAULT_SNAPSHOT_BUDGET = 24000;

export function safeString(value, maxLength) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).slice(0, maxLength);
}

export function isSalesforceId(value, prefix) {
  const escapedPrefix = String(prefix || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  return new RegExp(
    `^${escapedPrefix}[a-zA-Z0-9]{${
      15 - escapedPrefix.length
    }}(?:[a-zA-Z0-9]{3})?$`
  ).test(value || "");
}

export function boundedJson(
  prioritizedMetadata,
  collectionOptions,
  budget = DEFAULT_SNAPSHOT_BUDGET
) {
  const options = collectionOptions || {};
  const collectionName = options.collectionName;
  const values = Array.isArray(options.values) ? options.values : [];
  if (!collectionName) {
    return serializePrioritized(prioritizedMetadata || {}, budget);
  }

  const singularName = collectionName.endsWith("s")
    ? collectionName.slice(0, -1)
    : collectionName;
  const countPrefix =
    singularName.charAt(0).toUpperCase() + singularName.slice(1);
  const totalCount = Math.max(
    Number.isFinite(Number(options.totalCount))
      ? Number(options.totalCount)
      : values.length,
    values.length
  );
  const snapshot = {
    ...(prioritizedMetadata || {}),
    [`total${countPrefix}Count`]: totalCount,
    [`included${countPrefix}Count`]: 0,
    [`${collectionName}Truncated`]: false,
    snapshotTruncated: false,
    [collectionName]: []
  };

  for (const value of values) {
    snapshot[collectionName].push(value);
    snapshot[`included${countPrefix}Count`] = snapshot[collectionName].length;
    if (JSON.stringify(snapshot).length > budget) {
      snapshot[collectionName].pop();
      snapshot[`included${countPrefix}Count`] = snapshot[collectionName].length;
      snapshot[`${collectionName}Truncated`] = true;
      snapshot.snapshotTruncated = true;
      break;
    }
  }

  if (snapshot[collectionName].length < totalCount) {
    snapshot[`${collectionName}Truncated`] = true;
    snapshot.snapshotTruncated = true;
  }
  const serialized = JSON.stringify(snapshot);
  return serialized.length <= budget
    ? serialized
    : serializePrioritized(
        {
          ...(prioritizedMetadata || {}),
          [`total${countPrefix}Count`]: totalCount,
          [`included${countPrefix}Count`]: 0,
          [`${collectionName}Truncated`]: true
        },
        budget
      );
}

function serializePrioritized(value, budget) {
  const serialized = JSON.stringify(value);
  if (serialized.length <= budget) {
    return serialized;
  }

  const bounded = { snapshotTruncated: true };
  for (const [key, entryValue] of Object.entries(value)) {
    bounded[key] = entryValue;
    if (JSON.stringify(bounded).length <= budget) {
      continue;
    }

    delete bounded[key];
    if (typeof entryValue !== "string") {
      continue;
    }

    let lowerBound = 0;
    let upperBound = entryValue.length;
    while (lowerBound < upperBound) {
      const midpoint = Math.ceil((lowerBound + upperBound) / 2);
      bounded[key] = entryValue.slice(0, midpoint);
      if (JSON.stringify(bounded).length <= budget) {
        lowerBound = midpoint;
      } else {
        upperBound = midpoint - 1;
      }
    }
    if (lowerBound > 0) {
      bounded[key] = entryValue.slice(0, lowerBound);
    } else {
      delete bounded[key];
    }
  }

  const boundedValue = JSON.stringify(bounded);
  if (boundedValue.length <= budget) {
    return boundedValue;
  }
  return budget >= 26 ? '{"snapshotTruncated":true}' : "{}";
}
