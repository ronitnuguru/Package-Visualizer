const CARD_HEIGHT = 88;
const CARD_WIDTH = 196;
const BRANCH_PILL_HEIGHT = 30;
const BRANCH_PILL_WIDTH = 142;
const HORIZONTAL_GAP = 244;
const MAIN_ROW_Y = 36;
const BRANCH_ROW_Y = 156;
const CANVAS_PADDING = 36;
const PACKAGE_ROOT_ID = "__package-root__";

const idOf = (version) => version?.subscriberPackageVersionId;

const dateValue = (version) => {
  const value = Date.parse(version?.createdDate);
  return Number.isNaN(value) ? 0 : value;
};

const latestVersion = (versions) =>
  versions.reduce((latest, version) => {
    if (!latest || dateValue(version) >= dateValue(latest)) {
      return version;
    }
    return latest;
  }, null);

const countDescendants = (rootId, childrenByParentId) => {
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id)) {
      return 0;
    }
    visited.add(id);
    return (childrenByParentId.get(id) || []).reduce(
      (count, childId) => count + 1 + visit(childId),
      0
    );
  };
  return visit(rootId);
};

const findCycleIds = (nodesById) => {
  const cycleIds = new Set();
  nodesById.forEach((node, startId) => {
    const path = new Set();
    let currentId = startId;
    while (currentId && nodesById.has(currentId)) {
      if (path.has(currentId)) {
        cycleIds.add(currentId);
        return;
      }
      path.add(currentId);
      currentId = nodesById.get(currentId).ancestorId;
    }
  });
  return cycleIds;
};

const getPath = (selectedId, nodesById, issues) => {
  const path = [];
  const visited = new Set();
  let currentId = selectedId;

  while (currentId && nodesById.has(currentId)) {
    if (visited.has(currentId)) {
      issues.push({ type: "cycle", id: currentId });
      break;
    }
    visited.add(currentId);
    const current = nodesById.get(currentId);
    path.unshift(current);
    currentId = current.ancestorId;
  }

  return path;
};

/**
 * Normalizes released package versions into a safe, selected ancestry model.
 * The result has no DOM or D3 dependency so it can be unit-tested independently.
 *
 * @param {Array<Object>} versions Package version records returned by Apex.
 * @param {string} requestedSelectionId Optional subscriber package version id.
 * @returns {Object} A lineage model with issues and contextual branch summaries.
 */
export function buildLineageModel(versions, requestedSelectionId) {
  const issues = [];
  const nodesById = new Map();
  const childrenByParentId = new Map();
  const sourceVersions = Array.isArray(versions) ? versions : [];

  sourceVersions.forEach((version) => {
    const id = idOf(version);
    if (!id || version?.isReleased === false) {
      return;
    }
    if (nodesById.has(id)) {
      issues.push({ type: "duplicate-id", id });
      return;
    }
    nodesById.set(id, { ...version, ancestorId: version.ancestorId || null });
  });

  nodesById.forEach((node, id) => {
    if (!node.ancestorId) {
      return;
    }
    if (!nodesById.has(node.ancestorId)) {
      issues.push({
        type: "missing-parent",
        id,
        ancestorId: node.ancestorId
      });
      return;
    }
    const children = childrenByParentId.get(node.ancestorId) || [];
    children.push(id);
    childrenByParentId.set(node.ancestorId, children);
  });

  findCycleIds(nodesById).forEach((id) => {
    if (!issues.some((issue) => issue.type === "cycle" && issue.id === id)) {
      issues.push({ type: "cycle", id });
    }
  });

  let selectedId = requestedSelectionId;
  if (selectedId && !nodesById.has(selectedId)) {
    issues.push({ type: "missing-selection", id: selectedId });
    selectedId = undefined;
  }
  selectedId = selectedId || idOf(latestVersion([...nodesById.values()]));

  const path = selectedId ? getPath(selectedId, nodesById, issues) : [];
  const pathIds = new Set(path.map(idOf));
  const branchSummaries = [];

  path.forEach((node, index) => {
    const nextPathId = idOf(path[index + 1]);
    const branchRootIds = (childrenByParentId.get(idOf(node)) || []).filter(
      (childId) => childId !== nextPathId && !pathIds.has(childId)
    );
    if (branchRootIds.length) {
      branchSummaries.push({
        parentId: idOf(node),
        branchRootIds,
        versionCount: branchRootIds.reduce(
          (count, rootId) =>
            count + 1 + countDescendants(rootId, childrenByParentId),
          0
        )
      });
    }
  });

  const disconnectedRootIds = [...nodesById.values()]
    .filter(
      (node) =>
        !pathIds.has(idOf(node)) &&
        (!node.ancestorId || !nodesById.has(node.ancestorId))
    )
    .map(idOf);
  if (disconnectedRootIds.length) {
    branchSummaries.push({
      parentId: PACKAGE_ROOT_ID,
      branchRootIds: disconnectedRootIds,
      versionCount: disconnectedRootIds.reduce(
        (count, rootId) =>
          count + 1 + countDescendants(rootId, childrenByParentId),
        0
      ),
      label: "Other release lines"
    });
  }

  const missingParentForSelectedPath = path.length
    ? issues.find(
        (issue) => issue.type === "missing-parent" && issue.id === idOf(path[0])
      )
    : undefined;

  return {
    nodesById,
    childrenByParentId,
    issues,
    selectedId,
    selectedVersion: selectedId ? nodesById.get(selectedId) : undefined,
    path,
    pathIds,
    branchSummaries,
    missingParentForSelectedPath
  };
}

const addRelation = (relations, parentKey, childKey) => {
  if (!parentKey || !childKey) {
    return;
  }
  relations.parentByKey.set(childKey, parentKey);
  const children = relations.childrenByKey.get(parentKey) || [];
  children.push(childKey);
  relations.childrenByKey.set(parentKey, children);
};

/**
 * Produces the visible SVG layout. Branch descendants are absent until their
 * corresponding contextual branch summary has been expanded.
 *
 * @param {Object} model Result from buildLineageModel.
 * @param {Set<string>} expandedBranchParentIds Selected branch parent ids.
 * @returns {Object} Position, relation, and accessibility data for the renderer.
 */
export function buildVisibleLineage(
  model,
  expandedBranchParentIds = new Set()
) {
  const nodes = [];
  const branchPills = [];
  const links = [];
  const relations = {
    parentByKey: new Map(),
    childrenByKey: new Map()
  };
  const renderedBranchIds = new Set();
  let branchRow = 0;

  const pathNodeById = new Map();
  const pathOffset = model.missingParentForSelectedPath ? HORIZONTAL_GAP : 0;
  model.path.forEach((node, index) => {
    const item = {
      type: "version",
      key: `node:${idOf(node)}`,
      id: idOf(node),
      node,
      x: CANVAS_PADDING + pathOffset + index * HORIZONTAL_GAP,
      y: MAIN_ROW_Y,
      level: index + 1,
      isSelected: idOf(node) === model.selectedId,
      isPath: true
    };
    nodes.push(item);
    pathNodeById.set(item.id, item);
    if (index) {
      const parent = nodes[index - 1];
      links.push({ source: parent, target: item, isPath: true });
      addRelation(relations, parent.key, item.key);
    }
  });

  if (model.missingParentForSelectedPath && nodes.length) {
    const missing = {
      type: "missing",
      key: `missing:${model.missingParentForSelectedPath.ancestorId}`,
      id: model.missingParentForSelectedPath.ancestorId,
      x: nodes[0].x - HORIZONTAL_GAP,
      y: MAIN_ROW_Y,
      level: 1,
      label: "Ancestor unavailable"
    };
    nodes.unshift(missing);
    links.push({ source: missing, target: nodes[1], isPath: true });
    addRelation(relations, missing.key, nodes[1].key);
  }

  const appendBranchNode = (id, parentItem, depth, parentKey) => {
    if (renderedBranchIds.has(id)) {
      return;
    }
    renderedBranchIds.add(id);
    const node = model.nodesById.get(id);
    if (!node) {
      return;
    }
    const item = {
      type: "version",
      key: `node:${id}`,
      id,
      node,
      x: parentItem.x + HORIZONTAL_GAP,
      y: BRANCH_ROW_Y + branchRow * (CARD_HEIGHT + 28),
      level: parentItem.level + depth,
      isSelected: id === model.selectedId,
      isPath: false
    };
    branchRow += 1;
    nodes.push(item);
    links.push({ source: parentItem, target: item, isPath: false });
    addRelation(relations, parentKey, item.key);
    (model.childrenByParentId.get(id) || []).forEach((childId) =>
      appendBranchNode(childId, item, depth + 1, item.key)
    );
  };

  model.branchSummaries.forEach((summary) => {
    if (summary.parentId === PACKAGE_ROOT_ID) {
      const pill = {
        type: "branch",
        key: `branch:${summary.parentId}`,
        parentId: summary.parentId,
        x: CANVAS_PADDING,
        y: BRANCH_ROW_Y,
        level: 1,
        versionCount: summary.versionCount,
        label: `Other lines (+${summary.versionCount})`,
        ariaLabel: `Show ${summary.versionCount} version${
          summary.versionCount === 1 ? "" : "s"
        } in other release lines`,
        width: BRANCH_PILL_WIDTH,
        height: BRANCH_PILL_HEIGHT,
        isExpanded: expandedBranchParentIds.has(summary.parentId)
      };
      branchPills.push(pill);
      if (pill.isExpanded) {
        summary.branchRootIds.forEach((rootId) =>
          appendBranchNode(rootId, pill, 1, pill.key)
        );
      }
      return;
    }

    const parentItem = pathNodeById.get(summary.parentId);
    if (!parentItem) {
      return;
    }
    if (expandedBranchParentIds.has(summary.parentId)) {
      summary.branchRootIds.forEach((rootId) =>
        appendBranchNode(rootId, parentItem, 1, parentItem.key)
      );
      return;
    }
    const pill = {
      type: "branch",
      key: `branch:${summary.parentId}`,
      parentId: summary.parentId,
      x: parentItem.x + CARD_WIDTH + 18,
      y: parentItem.y + CARD_HEIGHT + 18,
      level: parentItem.level + 1,
      versionCount: summary.versionCount,
      ariaLabel: `Show ${summary.versionCount} contextual version${
        summary.versionCount === 1 ? "" : "s"
      }`,
      width: BRANCH_PILL_WIDTH,
      height: BRANCH_PILL_HEIGHT,
      isExpanded: false
    };
    branchPills.push(pill);
    addRelation(relations, parentItem.key, pill.key);
  });

  const maxNodeX = nodes.reduce(
    (value, item) => Math.max(value, item.x + CARD_WIDTH),
    CARD_WIDTH
  );
  const maxNodeY = nodes.reduce(
    (value, item) => Math.max(value, item.y + CARD_HEIGHT),
    CARD_HEIGHT
  );
  const maxPillX = branchPills.reduce(
    (value, item) => Math.max(value, item.x + BRANCH_PILL_WIDTH),
    0
  );
  const maxPillY = branchPills.reduce(
    (value, item) => Math.max(value, item.y + BRANCH_PILL_HEIGHT),
    0
  );
  const focusableItems = [...nodes, ...branchPills].sort(
    (left, right) => left.y - right.y || left.x - right.x
  );

  return {
    nodes,
    branchPills,
    links,
    relations,
    focusableItems,
    width: Math.max(maxNodeX, maxPillX) + CANVAS_PADDING,
    height: Math.max(maxNodeY, maxPillY, 268) + CANVAS_PADDING,
    cardWidth: CARD_WIDTH,
    cardHeight: CARD_HEIGHT
  };
}
