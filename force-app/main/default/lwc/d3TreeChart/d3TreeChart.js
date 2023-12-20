import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { loadScript } from "lightning/platformResourceLoader";
import {
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import D3MESSAGECHANNEL from "@salesforce/messageChannel/D3MessageChannel__c";
import D3 from "@salesforce/resourceUrl/d3";

export default class D3TreeChart extends LightningElement {
  @api name;
  @api gridData;
  @api filterValue;
  @api packageId;
  @api packageSubscriberVersionId;
  @api namespacePrefix;

  @wire(MessageContext) messageContext;

  d3Initialized = false;
  displaySpinner = true;

  treeData;
  isReleasedTreeData;
  errorBody =
    "Looks like we were unable render visualizations for this package...";

  activeSections = [];
  accordionHeader = "Version Details";
  subscriberPackageVersionId;
  name;
  isReleased;
  currentNode;
  currentNodeAncestry = [];
  displayNodeDetails = false;
  displayAccordionSlot = false;

  debounceTime = 500;

  filterValue;
  subscription = null;

  margin;
  width;
  height;
  treeDataHeight;
  svg = null;

  chartControls;
  filterWrapper;

  connectedCallback() {
    this.subscription = subscribe(
      this.messageContext,
      D3MESSAGECHANNEL,
      message => {
        if (message.d3ChartControls === "ExpandAll") {
          this.chartControls = "ExpandAll";
          this.initializeD3();
        } else if (message.d3ChartControls === "CollapseAll") {
          this.chartControls = "CollapseAll";
          this.initializeD3();
        } else {
          this.chartControls = "";
        }
      }
    );
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }

  renderedCallback() {
    if (this.d3Initialized) {
      return;
    }
    this.displaySpinner = true;
    Promise.all([loadScript(this, D3 + "/d3/d3.min.js")])
      .then(() => {
        this.prepData();
      })
      .then(() => {
        try {
          this.treeDataHeight = this.treeData.height;
          this.margin = { top: 10, right: 0, bottom: 30, left: 120 };
          this.width =
            window.innerWidth +
            this.treeDataHeight * (this.treeDataHeight / 2) * 10;
          this.height = window.innerHeight;

          this.svg = d3
            .select(this.template.querySelector("div.d3"))
            .append("svg")
            .attr("width", this.width + this.margin.right + this.margin.left)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr(
              "transform",
              `translate(${this.margin.left}, ${this.margin.top})`
            );
          this.template.querySelector(".chart-box").scrollIntoView();
          this.initializeD3();
          this.displaySpinner = false;
        } catch (error) {
          console.error(error);
          this.displaySpinner = false;
          this.treeData = undefined;
          this.errorBody =
            "Looks like you do not have enough released package version nodes to view visualizations...";
        }
      })
      .catch(error => {
        console.error(error);
        this.displaySpinner = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error loading D3",
            message: error,
            variant: "error"
          })
        );
      });
    this.d3Initialized = true;
  }

  initializeD3() {
    const me = this;

    me.treeData.each(function(d) {
      d.name = d.data.versionNumber;
    });

    let i = 0;
    let duration = 750;
    let root;
    let treemap = d3.tree().size([me.height, me.width]);

    root = d3.hierarchy(me.treeData, function(d) {
      return d.children;
    });
    root.x0 = me.height / 2;
    root.y0 = 0;

    if (me.chartControls === "ExpandAll") {
      expand(root);
      update(root);
    } else if (me.chartControls === "CollapseAll") {
      collapse(root);
      update(root);
    } else {
      if (!this.packageSubscriberVersionId) {
        root.children.forEach(collapse);
      }
      update(root);
    }

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    function expand(d) {
      var children = d.children ? d.children : d._children;
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (children) children.forEach(expand);
    }

    function update(source) {
      let treeData = treemap(root);
      treemap = d3.tree().size([me.height, me.width]);
      let nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

      nodes.forEach(function(d) {
        d.y = d.depth * 180;
      });

      let node = me.svg.selectAll("g.node").data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

      let nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return `translate(${source.y0}, ${source.x0})`;
        })
        .on("click", click);

      nodeEnter
        .append("circle")
        .attr("class", "node")
        .attr("r", 1e-6)
        .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
        });

      nodeEnter
        .append("text")
        .attr("dy", ".35em")
        .attr("x", function(d) {
          return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
        })
        .text(function(d) {
          return d.data.name;
        });

      let nodeUpdate = nodeEnter.merge(node);

      nodeUpdate
        .transition()
        .duration(duration)
        .attr("transform", function(d) {
          return `translate(${d.y}, ${d.x})`;
        });

      nodeUpdate
        .select("circle.node")
        .attr("r", 10)
        .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
        })
        .attr("cursor", "pointer");

      let nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", function(d) {
          return `translate(${source.y}, ${source.x})`;
        })
        .remove();

      nodeExit.select("circle").attr("r", 1e-6);

      nodeExit.select("text").style("fill-opacity", 1e-6);

      let link = me.svg.selectAll("path.link").data(links, function(d) {
        return d.id;
      });

      let linkEnter = link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        });

      let linkUpdate = linkEnter.merge(link);

      linkUpdate
        .transition()
        .duration(duration)
        .attr("d", function(d) {
          return diagonal(d, d.parent);
        });

      let linkExit = link
        .exit()
        .transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function diagonal(s, d) {
        let path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;

        return path;
      }

      function click(d, versionNode) {
        this.dispatchEvent(
          new CustomEvent("detail", { detail: versionNode.data, bubbles: true })
        );
        if (versionNode.children) {
          if (versionNode.children.length) {
            me.height = me.height - versionNode.children.length * 20;
          }
          versionNode._children = versionNode.children;
          versionNode.children = null;
        } else {
          if (versionNode._children) {
            me.height = me.height - versionNode._children.length * 20;
          }
          versionNode.children = versionNode._children;
          versionNode._children = null;
        }
        update(versionNode);
      }
    }
  }

  prepData() {
    let d3Array = [];
    this.gridData.forEach(element => {
      if (element.ancestorId === undefined) {
        d3Array.push({ ...element, ancestorId: "Package" });
      } else {
        d3Array.push({ ...element });
      }
    });
    d3Array.unshift({
      subscriberPackageVersionId: "Package",
      ancestorId: "",
      versionNumber: this.namespacePrefix
    });

    this.treeData = d3
      .stratify()
      .id(function(d) {
        return d.subscriberPackageVersionId;
      })
      .parentId(function(d) {
        return d.ancestorId;
      })(d3Array);

    if (this.packageSubscriberVersionId) {
      let z = this.treeData.find(
        node => node.id === this.packageSubscriberVersionId
      );
      this.treeData = z.copy();
    }
  }

  handleAccordionToggle(event) {
    if (event.detail.openSections.length) {
      this.displayAccordionSlot =
        event.detail.openSections.length > 0 ? true : false;
    }
  }

  handleNodeDetail(event) {
    this.displayNodeDetails = true;
    this.accordionHeader = event.detail.name;
    this.currentNode = event.detail.data;
    this.currentNodeAncestry = [
      ...event.detail.descendants(),
      ...event.detail.ancestors()
    ];
    this.subscriberPackageVersionId =
      event.detail.data.subscriberPackageVersionId;
    this.name = event.detail.data.name;
    this.isReleased = event.detail.data.isReleased;
  }

  handleVersionDetailExpand() {
    this.dispatchEvent(
      new CustomEvent("currentnode", { detail: this.currentNode })
    );
  }

  handleScrollToLeft() {
    this.dispatchEvent(new CustomEvent("scrollleft"));
  }

  handleScrollToRight() {
    this.dispatchEvent(
      new CustomEvent("scrollright", { detail: this.treeDataHeight })
    );
  }
}