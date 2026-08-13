import { LightningElement, api, wire } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import {
  MessageContext,
  subscribe,
  unsubscribe
} from "lightning/messageService";
import D3MESSAGECHANNEL from "@salesforce/messageChannel/D3MessageChannel__c";
import D3 from "@salesforce/resourceUrl/d3";
import { buildLineageModel, buildVisibleLineage } from "./d3TreeChartModel";

const CARD_WIDTH = 196;
const CARD_HEIGHT = 88;
const BRANCH_PILL_HEIGHT = 30;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 8;
const ZOOM_FACTOR = 1.25;
const PAN_STEP = CARD_WIDTH;
const PAN_CLICK_SUPPRESSION_MS = 250;

const valueOrDash = (value) => value || "—";

const formatDate = (value) => {
  if (!value || Number.isNaN(Date.parse(value))) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
};

/**
 * Shows released package-version ancestry with a focused lineage, contextual
 * branches, and a scroll-aware zoomable canvas.
 */
export default class D3TreeChart extends LightningElement {
  @api name;
  @api filterValue;
  @api packageId;
  @api namespacePrefix;

  _gridData = [];
  _packageSubscriberVersionId;
  activeSelectedId;
  model = buildLineageModel([]);
  selectedVersion;
  expandedBranchParentIds = new Set();
  errorMessage;
  isLoading = true;
  libraryLoaded = false;
  libraryPromise;
  needsRender = false;
  subscription;
  messageContext;
  d3;
  svg;
  zoomScale = 1;
  visibleLineage;
  focusKey;
  focusableElements = new Map();
  focusSelectedAfterRender = true;
  panState;
  suppressSelectionUntil = 0;
  announcement = "";

  @api
  get gridData() {
    return this._gridData;
  }

  set gridData(value) {
    this._gridData = Array.isArray(value) ? value : [];
    this.refreshLineage();
  }

  @api
  get packageSubscriberVersionId() {
    return this._packageSubscriberVersionId;
  }

  set packageSubscriberVersionId(value) {
    this._packageSubscriberVersionId = value;
    this.activeSelectedId = value;
    this.refreshLineage();
  }

  @wire(MessageContext)
  setMessageContext(messageContext) {
    this.messageContext = messageContext;
    this.subscribeToControls();
  }

  connectedCallback() {
    this.subscribeToControls();
  }

  disconnectedCallback() {
    if (this.subscription) {
      unsubscribe(this.subscription);
      this.subscription = undefined;
    }
  }

  renderedCallback() {
    if (!this.libraryPromise) {
      this.loadD3();
    }
    if (this.libraryLoaded && this.needsRender) {
      this.renderVisualization();
    }
  }

  get hasVersions() {
    return this.model.nodesById.size > 0;
  }

  get hasIncompleteLineage() {
    return this.model.issues.some((issue) =>
      ["duplicate-id", "missing-parent", "cycle"].includes(issue.type)
    );
  }

  get incompleteLineageMessage() {
    const types = new Set(this.model.issues.map((issue) => issue.type));
    const messages = [];
    if (types.has("missing-parent")) {
      messages.push("an ancestor is unavailable");
    }
    if (types.has("duplicate-id")) {
      messages.push("duplicate version identifiers were ignored");
    }
    if (types.has("cycle")) {
      messages.push("a circular ancestry relationship was stopped");
    }
    return `Lineage may be incomplete: ${messages.join("; ")}.`;
  }

  get explorerTitle() {
    return `${this.namespacePrefix || this.name || "Package"} ancestry`;
  }

  get zoomPercentage() {
    return `${Math.round(this.zoomScale * 100)}%`;
  }

  get isZoomInDisabled() {
    return this.zoomScale >= MAX_ZOOM;
  }

  get isZoomOutDisabled() {
    return this.zoomScale <= MIN_ZOOM;
  }

  get isViewDetailsDisabled() {
    return !this.selectedVersion;
  }

  subscribeToControls() {
    if (this.subscription || !this.messageContext) {
      return;
    }
    this.subscription = subscribe(
      this.messageContext,
      D3MESSAGECHANNEL,
      (message) => {
        if (message?.d3ChartControls === "ExpandAll") {
          this.expandAll();
        }
        if (message?.d3ChartControls === "CollapseAll") {
          this.collapseAll();
        }
      }
    );
  }

  loadD3() {
    this.isLoading = true;
    this.errorMessage = undefined;
    this.libraryPromise = loadScript(this, `${D3}/d3/d3.min.js`)
      .then(() => {
        if (!window.d3) {
          throw new Error("The D3 library did not initialize.");
        }
        this.d3 = window.d3;
        this.libraryLoaded = true;
        this.isLoading = false;
        this.requestRender();
      })
      .catch((error) => {
        this.isLoading = false;
        this.libraryLoaded = false;
        this.errorMessage =
          error?.message || "Unable to load the ancestry visualization.";
      });
  }

  refreshLineage() {
    this.model = buildLineageModel(this._gridData, this.activeSelectedId);
    this.activeSelectedId = this.model.selectedId;
    this.selectedVersion = this.model.selectedVersion;
    this.expandedBranchParentIds = new Set(
      [...this.expandedBranchParentIds].filter((parentId) =>
        this.model.branchSummaries.some(
          (summary) => summary.parentId === parentId
        )
      )
    );
    this.focusKey = this.selectedVersion
      ? `node:${this.selectedVersion.subscriberPackageVersionId}`
      : undefined;
    this.focusSelectedAfterRender = true;
    this.requestRender();
  }

  requestRender() {
    this.needsRender = true;
    if (!this.libraryLoaded) {
      return;
    }
    Promise.resolve().then(() => {
      if (this.needsRender && this.libraryLoaded) {
        this.renderVisualization();
      }
    });
  }

  renderVisualization() {
    const canvas = this.template.querySelector(".pkgviz-ancestry-canvas");
    if (!canvas || !this.d3 || !this.hasVersions) {
      return;
    }
    try {
      this.needsRender = false;
      const previousScrollLeft = canvas.scrollLeft;
      const previousScrollTop = canvas.scrollTop;
      this.visibleLineage = buildVisibleLineage(
        this.model,
        this.expandedBranchParentIds
      );
      this.focusableElements.clear();
      this.d3.select(canvas).selectAll("*").remove();

      const svg = this.d3
        .select(canvas)
        .append("svg")
        .attr("class", "pkgviz-ancestry-svg")
        .attr("width", this.visibleLineage.width * this.zoomScale)
        .attr("height", this.visibleLineage.height * this.zoomScale)
        .attr(
          "viewBox",
          `0 0 ${this.visibleLineage.width} ${this.visibleLineage.height}`
        )
        .attr("role", "tree")
        .attr("aria-label", this.explorerTitle)
        .attr("preserveAspectRatio", "xMinYMin meet");
      const viewport = svg
        .append("g")
        .attr("class", "pkgviz-ancestry-viewport");

      this.svg = svg;

      this.visibleLineage.links.forEach((link) =>
        this.drawLink(viewport, link)
      );
      this.visibleLineage.nodes.forEach((node) =>
        this.drawNode(viewport, node)
      );
      this.visibleLineage.branchPills.forEach((pill) =>
        this.drawBranchPill(viewport, pill)
      );
      this.updateRovingTabIndex();
      if (this.focusSelectedAfterRender) {
        this.focusSelectedAfterRender = false;
        this.scrollSelectedVersionIntoView(canvas);
      } else {
        canvas.scrollLeft = previousScrollLeft;
        canvas.scrollTop = previousScrollTop;
      }
    } catch (error) {
      this.errorMessage =
        error?.message || "Unable to render the ancestry visualization.";
      this.needsRender = false;
    }
  }

  drawLink(viewport, link) {
    const sourceX = link.source.x + (link.source.width || CARD_WIDTH);
    const sourceY = link.source.y + (link.source.height || CARD_HEIGHT) / 2;
    const targetX = link.target.x;
    const targetY = link.target.y + CARD_HEIGHT / 2;
    const curveX = (sourceX + targetX) / 2;

    viewport
      .append("path")
      .attr("class", "pkgviz-ancestry-link")
      .attr(
        "d",
        `M ${sourceX} ${sourceY} C ${curveX} ${sourceY}, ${curveX} ${targetY}, ${targetX} ${targetY}`
      )
      .attr(
        "stroke",
        link.isPath
          ? "var(--pkgviz-ancestry-path)"
          : "var(--pkgviz-ancestry-link)"
      )
      .attr("stroke-width", link.isPath ? 3 : 2)
      .attr("fill", "none");
  }

  drawNode(viewport, item) {
    const group = viewport
      .append("g")
      .attr("class", "pkgviz-ancestry-node")
      .attr("transform", `translate(${item.x}, ${item.y})`)
      .attr("role", "treeitem")
      .attr("aria-level", item.level)
      .attr("aria-selected", item.isSelected ? "true" : "false")
      .attr("tabindex", "-1")
      .attr("data-focus-key", item.key)
      .attr("aria-label", this.nodeAriaLabel(item))
      .style("cursor", item.type === "missing" ? "default" : "pointer")
      .on("click", () => this.handleNodeSelection(item))
      .on("keydown", (event) => this.handleCanvasKeydown(event, item))
      .on("focus", () => this.setFocusedItem(item.key));

    group
      .append("rect")
      .attr("width", CARD_WIDTH)
      .attr("height", CARD_HEIGHT)
      .attr("rx", 8)
      .attr(
        "fill",
        item.isSelected
          ? "var(--pkgviz-ancestry-selected-surface)"
          : "var(--pkgviz-ancestry-card-surface)"
      )
      .attr(
        "stroke",
        item.isSelected
          ? "var(--pkgviz-ancestry-selected-border)"
          : "var(--pkgviz-ancestry-border)"
      )
      .attr("stroke-width", item.isSelected ? 3 : 1);

    if (item.type === "missing") {
      group
        .append("text")
        .attr("x", 14)
        .attr("y", 32)
        .attr("fill", "var(--pkgviz-ancestry-error)")
        .attr("font-size", 14)
        .attr("font-weight", 700)
        .text(item.label);
      group
        .append("text")
        .attr("x", 14)
        .attr("y", 57)
        .attr("fill", "var(--pkgviz-ancestry-text-weak)")
        .attr("font-size", 12)
        .text("Version identifier unavailable");
      this.focusableElements.set(item.key, group.node());
      return;
    }

    const version = item.node;
    if (item.isSelected) {
      group
        .append("text")
        .attr("x", 14)
        .attr("y", 17)
        .attr("fill", "var(--pkgviz-ancestry-selected-text)")
        .attr("font-size", 10)
        .attr("font-weight", 700)
        .text("SELECTED");
    }
    group
      .append("text")
      .attr("x", 14)
      .attr("y", item.isSelected ? 37 : 28)
      .attr("fill", "var(--pkgviz-ancestry-text)")
      .attr("font-size", 15)
      .attr("font-weight", 700)
      .text(valueOrDash(version.versionNumber));
    group
      .append("circle")
      .attr("cx", 18)
      .attr("cy", item.isSelected ? 55 : 47)
      .attr("r", 4)
      .attr("fill", "var(--pkgviz-ancestry-success)");
    group
      .append("text")
      .attr("x", 28)
      .attr("y", item.isSelected ? 59 : 51)
      .attr("fill", "var(--pkgviz-ancestry-text)")
      .attr("font-size", 12)
      .text("Released");
    group
      .append("text")
      .attr("x", 14)
      .attr("y", item.isSelected ? 78 : 72)
      .attr("fill", "var(--pkgviz-ancestry-text-weak)")
      .attr("font-size", 12)
      .text(formatDate(version.createdDate));
    this.focusableElements.set(item.key, group.node());
  }

  drawBranchPill(viewport, pill) {
    const group = viewport
      .append("g")
      .attr("class", "pkgviz-ancestry-branch")
      .attr("transform", `translate(${pill.x}, ${pill.y})`)
      .attr("role", "treeitem")
      .attr("aria-level", pill.level)
      .attr("aria-expanded", pill.isExpanded ? "true" : "false")
      .attr("tabindex", "-1")
      .attr("data-focus-key", pill.key)
      .attr(
        "aria-label",
        pill.ariaLabel ||
          `Show ${pill.versionCount} contextual ${
            pill.versionCount === 1 ? "version" : "versions"
          }`
      )
      .style("cursor", "pointer")
      .on("click", () => this.toggleBranch(pill.parentId))
      .on("keydown", (event) => this.handleCanvasKeydown(event, pill))
      .on("focus", () => this.setFocusedItem(pill.key));

    group
      .append("rect")
      .attr("width", 142)
      .attr("height", BRANCH_PILL_HEIGHT)
      .attr("rx", 15)
      .attr("fill", "var(--pkgviz-ancestry-branch-surface)")
      .attr("stroke", "var(--pkgviz-ancestry-selected-border)");
    group
      .append("text")
      .attr("x", 71)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--pkgviz-ancestry-selected-text)")
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .text(pill.label || `+${pill.versionCount} versions`);
    this.focusableElements.set(pill.key, group.node());
  }

  nodeAriaLabel(item) {
    if (item.type === "missing") {
      return "Ancestor unavailable";
    }
    return `${valueOrDash(item.node.versionNumber)}, released, ${formatDate(
      item.node.createdDate
    )}${item.isSelected ? ", selected" : ""}`;
  }

  setFocusedItem(key) {
    this.focusKey = key;
    this.updateRovingTabIndex();
  }

  updateRovingTabIndex() {
    const fallbackKey = this.visibleLineage?.focusableItems[0]?.key;
    const activeKey = this.focusKey || fallbackKey;
    this.focusableElements.forEach((element, key) => {
      element.setAttribute("tabindex", key === activeKey ? "0" : "-1");
      const item = this.visibleLineage.focusableItems.find(
        (focusableItem) => focusableItem.key === key
      );
      const isSelectedVersion = item?.type === "version" && item.isSelected;
      this.d3
        .select(element)
        .select("rect")
        .attr("stroke-width", key === activeKey || isSelectedVersion ? 3 : 1);
    });
  }

  handleCanvasKeydown(event, item) {
    const { focusableItems, relations } = this.visibleLineage;
    const currentIndex = focusableItems.findIndex(
      (focusableItem) => focusableItem.key === item.key
    );
    let targetKey;

    switch (event.key) {
      case "ArrowLeft":
        targetKey = relations.parentByKey.get(item.key);
        break;
      case "ArrowRight":
        targetKey = relations.childrenByKey.get(item.key)?.[0];
        break;
      case "ArrowUp":
        targetKey = focusableItems[Math.max(currentIndex - 1, 0)]?.key;
        break;
      case "ArrowDown":
        targetKey =
          focusableItems[Math.min(currentIndex + 1, focusableItems.length - 1)]
            ?.key;
        break;
      case "Home":
        targetKey = focusableItems[0]?.key;
        break;
      case "End":
        targetKey = focusableItems[focusableItems.length - 1]?.key;
        break;
      case "Enter":
        event.preventDefault();
        if (item.type === "branch") {
          this.toggleBranch(item.parentId);
        } else {
          this.handleNodeSelection(item, true);
        }
        return;
      case " ":
        if (item.type === "branch") {
          event.preventDefault();
          this.toggleBranch(item.parentId);
        }
        return;
      default:
        return;
    }

    if (targetKey) {
      event.preventDefault();
      this.focusItem(targetKey);
    }
  }

  focusItem(key) {
    this.focusKey = key;
    this.updateRovingTabIndex();
    this.focusableElements.get(key)?.focus();
  }

  handleNodeSelection(item, allowAfterPan = false) {
    if (!allowAfterPan && Date.now() < this.suppressSelectionUntil) {
      return;
    }
    if (item.type === "missing" || !item.node) {
      return;
    }
    this.activeSelectedId = item.id;
    this.expandedBranchParentIds = new Set();
    this.refreshLineage();
    this.announce(`Selected version ${valueOrDash(item.node.versionNumber)}.`);
    this.dispatchEvent(
      new CustomEvent("versionselect", { detail: { ...item.node } })
    );
  }

  toggleBranch(parentId) {
    const expanded = new Set(this.expandedBranchParentIds);
    if (expanded.has(parentId)) {
      expanded.delete(parentId);
      this.announce("Contextual branch collapsed.");
    } else {
      expanded.add(parentId);
      this.announce("Contextual branch expanded.");
    }
    this.expandedBranchParentIds = expanded;
    this.requestRender();
  }

  @api
  expandAll() {
    this.expandedBranchParentIds = new Set(
      this.model.branchSummaries.map((summary) => summary.parentId)
    );
    this.announce("All contextual branches expanded.");
    this.requestRender();
  }

  @api
  collapseAll() {
    this.expandedBranchParentIds = new Set();
    this.announce("All contextual branches collapsed.");
    this.requestRender();
  }

  handleZoomIn() {
    this.applyZoom(this.zoomScale * ZOOM_FACTOR);
  }

  handleZoomOut() {
    this.applyZoom(this.zoomScale / ZOOM_FACTOR);
  }

  handleFit() {
    const canvas = this.template.querySelector(".pkgviz-ancestry-canvas");
    if (!canvas || !this.visibleLineage) {
      return;
    }
    const widthScale = canvas.clientWidth / this.visibleLineage.width;
    const heightScale = canvas.clientHeight / this.visibleLineage.height;
    const fittedScale = Math.min(widthScale, heightScale, 1);
    this.setZoomScale(fittedScale);
    Promise.resolve().then(() => {
      canvas.scrollLeft = 0;
      canvas.scrollTop = 0;
    });
    this.announce(`Ancestry fitted to ${this.zoomPercentage}.`);
  }

  handleResetZoom() {
    const canvas = this.template.querySelector(".pkgviz-ancestry-canvas");
    if (!canvas || !this.svg || !this.visibleLineage) {
      return;
    }
    this.setZoomScale(1);
    Promise.resolve().then(() => this.scrollSelectedVersionIntoView(canvas));
  }

  applyZoom(requestedScale, anchor) {
    const canvas = this.template.querySelector(".pkgviz-ancestry-canvas");
    if (!canvas || !this.svg || !this.visibleLineage) {
      return;
    }
    const previousScale = this.zoomScale;
    const anchorX = anchor?.x ?? canvas.clientWidth / 2;
    const anchorY = anchor?.y ?? canvas.clientHeight / 2;
    const contentX = (canvas.scrollLeft + anchorX) / previousScale;
    const contentY = (canvas.scrollTop + anchorY) / previousScale;

    this.setZoomScale(requestedScale);
    Promise.resolve().then(() => {
      canvas.scrollLeft = Math.max(0, contentX * this.zoomScale - anchorX);
      canvas.scrollTop = Math.max(0, contentY * this.zoomScale - anchorY);
    });
    this.announce(`Zoom ${this.zoomPercentage}.`);
  }

  setZoomScale(requestedScale) {
    const normalizedScale = Number.isFinite(requestedScale)
      ? requestedScale
      : 1;
    this.zoomScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, normalizedScale));
    this.svg
      ?.attr("width", this.visibleLineage.width * this.zoomScale)
      .attr("height", this.visibleLineage.height * this.zoomScale);
  }

  handleCanvasWheel(event) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const factor = event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    this.applyZoom(this.zoomScale * factor, {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });
  }

  handleCanvasPointerDown(event) {
    if (event.button !== 0 || event.target.closest?.('[role="treeitem"]')) {
      return;
    }
    const canvas = event.currentTarget;
    this.panState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: canvas.scrollLeft,
      scrollTop: canvas.scrollTop,
      moved: false
    };
    canvas.setPointerCapture?.(event.pointerId);
  }

  handleCanvasPointerMove(event) {
    if (!this.panState || this.panState.pointerId !== event.pointerId) {
      return;
    }
    const deltaX = event.clientX - this.panState.startX;
    const deltaY = event.clientY - this.panState.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) {
      this.panState.moved = true;
    }
    if (!this.panState.moved) {
      return;
    }
    event.preventDefault();
    const canvas = event.currentTarget;
    canvas.classList.add("pkgviz-ancestry-canvas_panning");
    canvas.scrollLeft = this.panState.scrollLeft - deltaX;
    canvas.scrollTop = this.panState.scrollTop - deltaY;
  }

  handleCanvasPointerUp(event) {
    if (!this.panState || this.panState.pointerId !== event.pointerId) {
      return;
    }
    const canvas = event.currentTarget;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.classList.remove("pkgviz-ancestry-canvas_panning");
    if (this.panState.moved) {
      this.suppressSelectionUntil = Date.now() + PAN_CLICK_SUPPRESSION_MS;
    }
    this.panState = undefined;
  }

  handleCanvasPointerCancel(event) {
    event.currentTarget.classList.remove("pkgviz-ancestry-canvas_panning");
    this.panState = undefined;
    this.suppressSelectionUntil = 0;
  }

  handleCanvasNavigationKeydown(event) {
    if (event.target !== event.currentTarget) {
      return;
    }
    const canvas = event.currentTarget;
    switch (event.key) {
      case "ArrowLeft":
        canvas.scrollLeft -= PAN_STEP;
        break;
      case "ArrowRight":
        canvas.scrollLeft += PAN_STEP;
        break;
      case "ArrowUp":
        canvas.scrollTop -= PAN_STEP;
        break;
      case "ArrowDown":
        canvas.scrollTop += PAN_STEP;
        break;
      case "+":
      case "=":
        this.handleZoomIn();
        break;
      case "-":
      case "_":
        this.handleZoomOut();
        break;
      case "0":
        this.handleResetZoom();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  scrollSelectedVersionIntoView(canvas) {
    const selectedItem = this.visibleLineage?.nodes.find(
      (node) => node.isSelected
    );
    if (!canvas || !selectedItem) {
      return;
    }
    const availableWidth = Math.max(canvas.clientWidth || 0, CARD_WIDTH);
    const availableHeight = Math.max(canvas.clientHeight || 0, CARD_HEIGHT);
    const selectedCenterX = (selectedItem.x + CARD_WIDTH / 2) * this.zoomScale;
    const selectedCenterY = (selectedItem.y + CARD_HEIGHT / 2) * this.zoomScale;
    canvas.scrollLeft = Math.max(0, selectedCenterX - availableWidth / 2);
    canvas.scrollTop = Math.max(0, selectedCenterY - availableHeight / 2);
    this.announce(
      `Centered version ${valueOrDash(
        this.selectedVersion?.versionNumber
      )} at ${this.zoomPercentage}.`
    );
  }

  handleRetry() {
    this.libraryPromise = undefined;
    this.loadD3();
  }

  handleViewDetails() {
    if (!this.selectedVersion) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("currentnode", { detail: { ...this.selectedVersion } })
    );
  }

  announce(message) {
    this.announcement = message;
  }
}
