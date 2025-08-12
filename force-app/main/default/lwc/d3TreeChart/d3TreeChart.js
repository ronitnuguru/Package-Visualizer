import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { loadScript } from "lightning/platformResourceLoader";
import { subscribe, unsubscribe, MessageContext } from "lightning/messageService";
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

  // Core state
  d3Initialized = false;
  displaySpinner = true;

  treeData;
  isReleasedTreeData;
  errorBody = "Looks like we were unable render visualizations for this package...";

  // UI state - minimal for clean visualization

  // Interaction state
  debounceTime = 500;
  subscription = null;
  chartControls;
  filterWrapper;
  hoveredNode = null;
  selectedNode = null;
  
  // Visualization constants
  ANIMATION_DURATION = 300;
  NODE_RADIUS = 12;
  NODE_SPACING = 180;
  COLORS = {
    node: {
      default: '#ffffff',
      collapsed: '#1589ee',
      highlighted: '#ff6b35',
      selected: '#0066cc',
      hover: '#f3f3f3'
    },
    link: {
      default: '#6b7280',
      highlighted: '#1589ee',
      path: '#999'
    },
    text: {
      default: '#1f2937',
      highlighted: '#fff'
    }
  };

  // Chart dimensions
  margin;
  width;
  height;
  treeDataHeight;
  svg = null;
  panBehavior = null;
  
  // Smooth scrolling state
  smoothScrollState = {
    velocityX: 0,
    velocityY: 0,
    lastTimestamp: 0,
    isDecelerating: false,
    momentum: 0.9, // Momentum decay factor
    minVelocity: 0.1 // Minimum velocity threshold
  };

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
          this.setupVisualization();
          this.initializeD3();
          this.displaySpinner = false;
        } catch (error) {
          this.handleVisualizationError(error);
        }
      })
      .catch(error => {
        this.handleLoadError(error);
      });
    this.d3Initialized = true;
  }

  setupVisualization() {
    this.treeDataHeight = this.treeData.height;
    this.margin = { top: 20, right: 50, bottom: 50, left: 150 };
    
    // Count total nodes for better height calculation
    let totalNodes = 0;
    this.treeData.each(() => totalNodes++);
    
    // Responsive dimensions with dynamic sizing based on tree structure
    const container = this.template.querySelector("div.d3");
    const containerRect = container.getBoundingClientRect();
    
    // Dynamic width based on tree depth
    this.width = Math.max(1200, (containerRect.width || window.innerWidth * 0.8) + this.treeDataHeight * 250);
    
    // Dynamic height based on total nodes and tree depth
    const minHeight = 600;
    const nodeBasedHeight = totalNodes * 40; // 40px per node
    const depthBasedHeight = this.treeDataHeight * 120; // 120px per level
    const maxHeight = window.innerHeight * 0.9; // Don't exceed 90% of screen height
    
    this.height = Math.max(minHeight, Math.min(maxHeight, Math.max(nodeBasedHeight, depthBasedHeight)));
    


    // Create SVG with zoom and pan capabilities
    const svgContainer = d3
      .select(container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("border", "1px solid rgba(255, 255, 255, 0.3)")
      .style("border-radius", "8px")
      .style("background", "rgba(255, 255, 255, 0.1)");

    // Enhanced zoom and pan behavior with keyboard support
    this.panBehavior = d3.zoom()
      .scaleExtent([0.3, 3]) // Allow zoom from 30% to 300%
      .filter((event) => {
        // Only allow zoom for Ctrl+wheel, allow drag and keyboard events
        if (event.type === 'wheel') {
          return event.ctrlKey || event.metaKey; // Only zoom when Ctrl/Cmd is held
        }
        return event.type === 'mousedown' || event.type === 'touchstart' || event.type === 'keydown';
      })
      .on("zoom", (event) => {
        const transform = event.transform;
        this.svg.attr("transform", `translate(${this.margin.left + transform.x}, ${this.margin.top + transform.y}) scale(${transform.k})`);
      });

    svgContainer.call(this.panBehavior);

    // Ultra-smooth momentum-based wheel event handling
    this.initializeSmoothScrolling(svgContainer);

    // Add keyboard event listeners for zoom functionality
    this.addKeyboardControls(svgContainer);

    this.svg = svgContainer
      .append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);



    // Simple setup without complex gradients

    this.template.querySelector(".chart-box").scrollIntoView();
  }



  handleVisualizationError(error) {
    console.error('Visualization error:', error);
    this.displaySpinner = false;
    this.treeData = undefined;
    this.errorBody = "Looks like you do not have enough released package version nodes to view visualizations...";
  }

  handleLoadError(error) {
    console.error('D3 load error:', error);
    this.displaySpinner = false;
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error loading D3",
        message: error.message || error,
        variant: "error"
      })
    );
  }

  initializeD3() {
    const me = this;

    // Clear previous visualization
    me.svg.selectAll("*").remove();

    // Prepare node data with names like original
    me.treeData.each(function(d) {
      d.name = d.data.versionNumber;
    });

    let i = 0;
    let root;
    
    // Calculate tree layout size based on expanded tree
    const layoutWidth = me.width - me.margin.left - me.margin.right;
    const layoutHeight = me.height - me.margin.top - me.margin.bottom;
    const treemap = d3.tree().size([layoutHeight, layoutWidth]);

    root = d3.hierarchy(me.treeData, function(d) {
      return d.children;
    });
    
    root.x0 = (me.height - me.margin.top - me.margin.bottom) / 2;
    root.y0 = 0;

    // Apply initial state based on controls
    if (me.chartControls === "ExpandAll") {
      expand(root);
      update(root);
    } else if (me.chartControls === "CollapseAll") {
      collapse(root);
      update(root);
    } else {
      // Default: Auto-expand all nodes on load
      expand(root);
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
      const children = d.children ? d.children : d._children;
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (children) children.forEach(expand);
    }

    function update(source) {
      const treeData = treemap(root);
      const nodes = treeData.descendants();
      const links = treeData.descendants().slice(1);

      // Position nodes with dynamic spacing
      const dynamicSpacing = Math.max(150, Math.min(250, layoutWidth / (me.treeDataHeight + 1)));
      nodes.forEach(function(d) {
        d.y = d.depth * dynamicSpacing;
      });

      // Update nodes
      const node = me.svg.selectAll("g.node").data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

      // Enter new nodes
      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return `translate(${source.y0}, ${source.x0})`;
        })
        .style("cursor", "pointer")
        .on("click", click)
        .on("mouseover", handleNodeMouseOver)
        .on("mouseout", handleNodeMouseOut);

      // Enhanced circles for gray background
      nodeEnter
        .append("circle")
        .attr("class", "node")
        .attr("r", 1e-6)
        .style("fill", function(d) {
          return d._children ? "#1589ee" : "#ffffff";
        })
        .style("stroke", "#1589ee")
        .style("stroke-width", "2.5px")
        .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))");

      // Text labels with names like original
      nodeEnter
        .append("text")
        .attr("dy", ".35em")
        .attr("x", function(d) {
          return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
        })
        .style("font-size", "12px")
        .style("font-weight", "500")
        .style("fill", "#1f2937")
        .style("text-shadow", "0 1px 2px rgba(255, 255, 255, 0.8)")
        .text(function(d) {
          return d.data.name;
        });

      // Merge enter and update selections
      const nodeUpdate = nodeEnter.merge(node);

      // Transition to new positions
      nodeUpdate
        .transition()
        .duration(me.ANIMATION_DURATION)
        .attr("transform", function(d) {
          return `translate(${d.y}, ${d.x})`;
        });

      // Fast circle updates with better contrast
      nodeUpdate
        .select("circle.node")
        .transition()
        .duration(me.ANIMATION_DURATION)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr("r", 8)
        .style("fill", function(d) {
          return d._children ? "#1589ee" : "#ffffff";
        })
        .style("stroke", "#1589ee")
        .style("stroke-width", "2.5px")
        .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))");

      // Remove exiting nodes
      const nodeExit = node
        .exit()
        .transition()
        .duration(me.ANIMATION_DURATION)
        .attr("transform", function(d) {
          return `translate(${source.y}, ${source.x})`;
        })
        .remove();

      nodeExit.select("circle").attr("r", 1e-6);
      nodeExit.select("text").style("fill-opacity", 1e-6);

      // Update links
      const link = me.svg.selectAll("path.link").data(links, function(d) {
        return d.id;
      });

      // Enhanced links for gray background
      const linkEnter = link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .style("fill", "none")
        .style("stroke", "#6b7280")
        .style("stroke-width", "2px")
        .style("opacity", "0.8")
        .attr("d", function(d) {
          const o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        });

      // Merge enter and update selections
      const linkUpdate = linkEnter.merge(link);

      // Fast link transitions
      linkUpdate
        .transition()
        .duration(me.ANIMATION_DURATION)
        .attr("d", function(d) {
          return diagonal(d, d.parent);
        });

      // Remove exiting links
      const linkExit = link
        .exit()
        .transition()
        .duration(me.ANIMATION_DURATION)
        .attr("d", function(d) {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      // Store previous positions
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function diagonal(s, d) {
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
      }



      function click(event, versionNode) {
        // Update selected node
        me.selectedNode = versionNode;
        
        // Toggle node expansion
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

      function handleNodeMouseOver(event, d) {
        // Simple hover effect
        d3.select(event.currentTarget)
          .select("circle.node")
          .transition()
          .duration(100)
          .attr("r", 10)
          .style("stroke-width", "3px");
      }

      function handleNodeMouseOut(event, d) {
        // Quick return to normal
        d3.select(event.currentTarget)
          .select("circle.node")
          .transition()
          .duration(100)
          .attr("r", 8)
          .style("stroke-width", "2px");
      }
    }
  }

  prepData() {
    if (!this.gridData || !Array.isArray(this.gridData)) {
      throw new Error('Invalid grid data provided');
    }

    const d3Array = [];
    
    // Process grid data with enhanced validation
    this.gridData.forEach(element => {
      if (!element.subscriberPackageVersionId) {
        console.warn('Missing subscriberPackageVersionId for element:', element);
        return;
      }
      
      const processedElement = {
        ...element,
        ancestorId: element.ancestorId || "Package",
        versionNumber: element.versionNumber || 'Unknown',
        isReleased: Boolean(element.isReleased),
        name: element.name || element.versionNumber
      };
      
      d3Array.push(processedElement);
    });
    
    // Add root package node
    d3Array.unshift({
      subscriberPackageVersionId: "Package",
      ancestorId: "",
      versionNumber: this.namespacePrefix || 'Root Package',
      name: this.namespacePrefix || 'Root Package',
      isReleased: true
    });

    try {
      this.treeData = d3
        .stratify()
        .id(d => d.subscriberPackageVersionId)
        .parentId(d => d.ancestorId)(d3Array);

      // Filter to specific subtree if needed
      if (this.packageSubscriberVersionId) {
        const targetNode = this.treeData.find(
          node => node.id === this.packageSubscriberVersionId
        );
        if (targetNode) {
          this.treeData = targetNode.copy();
        }
      }
    } catch (error) {
      console.error('Error creating tree structure:', error);
      throw new Error('Failed to create tree visualization: Invalid data hierarchy');
    }
  }

  // Public API methods for external control
  @api
  expandAll() {
    this.chartControls = "ExpandAll";
    if (this.d3Initialized) {
      this.initializeD3();
    }
  }

  @api
  collapseAll() {
    this.chartControls = "CollapseAll";
    if (this.d3Initialized) {
      this.initializeD3();
    }
  }









  // Clean visualization - node details removed for minimal UI







  // Clean visualization focused on D3 interaction only

  // Initialize ultra-smooth momentum-based scrolling
  initializeSmoothScrolling(svgContainer) {
    let wheelTimeout;
    let animationFrame;
    
    const applyMomentum = () => {
      if (!this.smoothScrollState.isDecelerating) return;
      
      const currentTransform = d3.zoomTransform(svgContainer.node());
      
      // Apply velocity-based movement
      const newTransform = currentTransform.translate(
        this.smoothScrollState.velocityX,
        this.smoothScrollState.velocityY
      );
      
      // Apply transform immediately for smoothness
      this.panBehavior.transform(svgContainer, newTransform);
      
      // Decay velocity
      this.smoothScrollState.velocityX *= this.smoothScrollState.momentum;
      this.smoothScrollState.velocityY *= this.smoothScrollState.momentum;
      
      // Continue animation if velocity is significant
      if (Math.abs(this.smoothScrollState.velocityX) > this.smoothScrollState.minVelocity ||
          Math.abs(this.smoothScrollState.velocityY) > this.smoothScrollState.minVelocity) {
        animationFrame = requestAnimationFrame(applyMomentum);
      } else {
        this.smoothScrollState.isDecelerating = false;
      }
    };
    
    svgContainer.on("wheel", (event) => {
      // If Ctrl/Cmd is held, let D3 zoom handle it
      if (event.ctrlKey || event.metaKey) {
        return; // Let D3 zoom behavior handle this
      }
      
      event.preventDefault();
      
      // Enhanced smoothness parameters
      const sensitivity = 1.5; // Increased sensitivity
      const dampening = 0.7; // Reduce jitter
      
      // Calculate movement deltas with dampening
      const deltaX = (-event.deltaX * sensitivity) * dampening;
      const deltaY = (-event.deltaY * sensitivity) * dampening;
      
      // Apply immediate movement for responsiveness
      const currentTransform = d3.zoomTransform(svgContainer.node());
      const immediateTransform = currentTransform.translate(deltaX, deltaY);
      this.panBehavior.transform(svgContainer, immediateTransform);
      
      // Update velocity for momentum
      this.smoothScrollState.velocityX = deltaX * 0.3; // Reduced momentum factor
      this.smoothScrollState.velocityY = deltaY * 0.3;
      
      // Reset momentum animation
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      clearTimeout(wheelTimeout);
      
      // Start momentum deceleration after wheel stops
      wheelTimeout = setTimeout(() => {
        this.smoothScrollState.isDecelerating = true;
        animationFrame = requestAnimationFrame(applyMomentum);
      }, 50); // Short delay before momentum kicks in
    });
  }

  // Keyboard controls for zoom functionality
  addKeyboardControls(svgContainer) {
    const me = this;
    
    // Make SVG focusable for keyboard events
    svgContainer.attr("tabindex", 0);
    
    // Add keyboard event listener
    svgContainer.on("keydown", function(event) {
      const currentTransform = d3.zoomTransform(this);
      let newTransform = currentTransform;
      
      switch(event.key) {
        case '+':
        case '=':
          // Zoom in with + or = key
          event.preventDefault();
          newTransform = currentTransform.scale(1.2);
          break;
          
        case '-':
        case '_':
          // Zoom out with - or _ key
          event.preventDefault();
          newTransform = currentTransform.scale(0.8);
          break;
          
        case '0':
          // Reset zoom with 0 key
          event.preventDefault();
          newTransform = d3.zoomIdentity;
          break;
          
        case 'ArrowUp':
          // Pan up with arrow key
          event.preventDefault();
          newTransform = currentTransform.translate(0, 50);
          break;
          
        case 'ArrowDown':
          // Pan down with arrow key
          event.preventDefault();
          newTransform = currentTransform.translate(0, -50);
          break;
          
        case 'ArrowLeft':
          // Pan left with arrow key
          event.preventDefault();
          newTransform = currentTransform.translate(50, 0);
          break;
          
        case 'ArrowRight':
          // Pan right with arrow key
          event.preventDefault();
          newTransform = currentTransform.translate(-50, 0);
          break;
          
        default:
          return; // Don't prevent default for other keys
      }
      
      // Apply the transformation with smooth animation
      d3.select(this).transition()
        .duration(200)
        .ease(d3.easeQuadOut)
        .call(me.panBehavior.transform, newTransform);
    });
    
    // Focus the SVG when the component is ready
    setTimeout(() => {
      svgContainer.node().focus();
    }, 100);
    

  }







  // Utility method to get chart statistics
  getChartStatistics() {
    if (!this.treeData) return null;
    
    const stats = {
      totalNodes: 0,
      releasedNodes: 0,
      maxDepth: 0
    };
    
    this.treeData.each(node => {
      stats.totalNodes++;
      if (node.data.isReleased) {
        stats.releasedNodes++;
      }
      if (node.depth > stats.maxDepth) {
        stats.maxDepth = node.depth;
      }
    });
    
    return stats;
  }

  // Export functionality for chart data
  @api
  exportTreeData() {
    if (!this.treeData) return null;
    
    const exportData = [];
    this.treeData.each(node => {
      exportData.push({
        id: node.data.subscriberPackageVersionId,
        name: node.data.name || node.data.versionNumber,
        version: node.data.versionNumber,
        isReleased: node.data.isReleased,
        depth: node.depth,
        ancestorId: node.data.ancestorId
      });
    });
    
    return exportData;
  }
}