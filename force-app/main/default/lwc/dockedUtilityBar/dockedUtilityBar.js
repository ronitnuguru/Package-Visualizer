import { LightningElement, wire, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import {
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import getResourcesMetadata from "@salesforce/apex/PackageVisualizerCtrl.getResourcesMetadata";
import getAppAnalyticsRequests from "@salesforce/apexContinuation/PackageVisualizerCtrl.getAppAnalyticsRequests";
import getAnnouncementsMetadata from "@salesforce/apex/PackageVisualizerCtrl.getAnnouncementsMetadata";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import genAiLimitsModal from "c/genAiLimitsModal";

export default class DockedUtilityBar extends NavigationMixin(
  LightningElement
) {
  @wire(MessageContext) messageContext;
  @api packageTypes;

  get is2GP() {
    return this.packageTypes === "2GP and Unlocked Packages" ? true : false;
  }

  displaySpinner = true;
  displayAppAnalyticsViewModal;

  showLimitsPanel = false;
  showResourcesPanel = false;
  showAppAnalyticsPanel = false;
  showAnnouncementsPanel = false;
  showTrailheadPanel = false;

  subscription = null;
  dockedUtilityLimitsPanelBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;
  dockedUtilityResourcesPanelBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;
  dockedUtilityAppAnalyticsBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;
  dockedUtilityAnnouncementsBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;
  dockedUtilityTrailheadBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;

  trailheadData = [
    {
      label: "Second-Generation Managed Packages",
      category: "Packaging",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/second-generation-managed-packages/788ffacaf76084e849292b4cda17cbfc_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/second-generation-managed-packages",
      description: "Discover how to create second-generation managed packages."
    },
    {
      label: "Unlocked Packages for Customers",
      category: "Packaging",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/unlocked-packages-for-customers/6c4880c518cc36acc6d1a15a32260db8_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/unlocked-packages-for-customers",
      description:
        "Maintain and upgrade your apps more easily with package development."
    },
    {
      label: "App Development with Salesforce DX",
      category: "Developer Experience",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/sfdx_app_dev/9456a619f0ea917155046fbca33646a2_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/sfdx_app_dev?utm_source=chatgpt.com",
      description:
        "Use the Salesforce command-line interface to create, convert, and deploy apps."
    },
    {
      label: "Package.xml Metadata Management",
      category: "Developer Experience",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/package-xml/0623381e7c7def81a2e7d99b2f155380_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/package-xml",
      description:
        "Manage Salesforce metadata with a package.xml manifest and Salesforce CLI."
    },
    {
      label: "Package Development Model",
      category: "Packaging",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/sfdx_dev_model/fb4a5d97ab961f3df3e4d7a7217b24aa_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/sfdx_dev_model?utm_source=chatgpt.com",
      description: "Drive modular-based development with Salesforce DX tooling."
    },
    {
      label: "AgentExchange Partner Basics",
      category: "Partners",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/isvforce_basics/4c24dc52815094bef8e457762ce9ccb5_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/isvforce_basics",
      description:
        "Build a business on the Salesforce platform with the AgentExchange Partner Program."
    },
    {
      label: "App Licensing and Customer Support for AgentExchange",
      category: "Partners",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/appexchange_licensing/903b5db72887ee66aaf4b2aa92e88bb1_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/appexchange_licensing",
      description:
        "Manage licenses for your app, and provide great customer support."
    },
    {
      label: "AgentExchange App Trial Management",
      category: "Partners",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/isv_app_trials/1fe3688c9d5aaf536cc8c3a897c2b5bd_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/isv_app_trials",
      description:
        "Convert your prospects to customers with a free trial of your AgentExchange app."
    },
    {
      label: "AgentExchange Security Review",
      category: "Partners",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/isv_security_review/2905110d59e6e2df3f8ab25acafa5e38_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/isv_security_review",
      description:
        "Devise an app security strategy and prepare for a security review."
    },
    {
      label: "AgentExchange Basics",
      category: "Partners",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/appexchange_basics/4f6fbe64b38464ba090bc80b06994913_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/appexchange_basics?utm_source=chatgpt.com",
      description:
        "Extend the power of Salesforce with apps and services from AgentExchange."
    },
    {
      label: "Packaging and Data Kits in Data 360",
      category: "Data360",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/packaging-and-data-kits-in-salesforce-cdp/e869e5eeaf673a8b4680e730049dea3f_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/packaging-and-data-kits-in-salesforce-cdp",
      description: "Learn how to create and package components in Data 360."
    },
    {
      label: "Agent Customization with Apex",
      category: "Agentforce",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/agent-customization-with-apex/46e49678a2c49bb5039d942d11d94861_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/agent-customization-with-apex",
      description: "Create custom AI agents using agent actions and Apex."
    },
    {
      label: "Agent Customization with Flows",
      category: "Agentforce",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/agent-customization-with-flows/7f7c11bcaae58d5c31ea7143c717f243_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/agent-customization-with-flows",
      description:
        "Create agent-ready flows and configure agents to make the most of those flows."
    },
    {
      label: "Service Agent Customization with Prompt Builder",
      category: "Agentforce",
      icon: "https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/modules/custom-service-agents-with-prompt-builder-and-agentforce/8333d5f7d29a6621df18fbbd05753fdc_badge.png",
      link: "https://trailhead.salesforce.com/content/learn/modules/custom-service-agents-with-prompt-builder-and-agentforce",
      description:
        "Create a custom agent to respond to and resolve customer issues."
    }
  ];

  get trailheadCategories() {
    return [
      { category: "Packaging", icon: "utility:package" },
      { category: "Developer Experience", icon: "utility:insert_tag_field" },
      { category: "Partners", icon: "utility:market" },
      { category: "Agentforce", icon: "utility:agent_astro" },
      { category: "Data360", icon: "utility:data_cloud" }
    ].map(({ category, icon }) => ({
      category,
      icon,
      trails: this.trailheadData.filter((item) => item.category === category)
    }));
  }

  limitsData;
  resourcesData;
  appAnalyticsData;
  appAnalyticsViewData;
  announcementsData;

  // --- AppAnalytics auto-poll + coalesced notification state ---
  _pollTimeoutId = null; // chained setTimeout handle (latency-aware)
  _pollInFlight = false; // reentrancy guard for the continuation callout
  _seeded = false; // baseline flag — suppress notify on the first cycle
  _prevStateById = new Map(); // Id -> RequestState from the previous cycle
  terminalBadgeCount = 0; // unacknowledged completions shown on the icon
  POLL_INTERVAL_MS = 15000; // poll cadence (15s)
  TERMINAL_STATES = ["Complete", "Expired", "Failed", "NoData"];
  STATE_LABELS = {
    Complete: "completed",
    Failed: "failed",
    Expired: "expired",
    NoData: "returned no data"
  };

  limitsNotAvailableView = false;
  resourcesNotAvailableView = false;
  appAnalyticsNotAvailableView = false;
  announcementsNotAvailableView = false;

  activeScratchOrgsMax;
  activeScratchOrgsRem;
  activeScratchPercentage;

  dailyScratchOrgsMax;
  dailyScratchOrgsRem;
  dailyScratchOrgsPercentage;

  package2VersionCreatesMax;
  package2VersionCreatesRem;
  package2VersionCreatesPercentage;

  package2VersionCreatesWithoutValidationMax;
  package2VersionCreatesWithoutValidationRem;
  package2VersionCreatesWithoutValidationPercentage;

  dailyApiRequestsMax;
  dailyApiRequestsRem;
  dailyApiRequestsPercentage;

  dataStorageMBMax;
  dataStorageMBRem;
  dataStorageMBPercentage;

  connectedCallback() {
    this.subscription = subscribe(
      this.messageContext,
      DOCKEDUTILITYBARMESSAGECHANNEL,
      (message) => {
        if (message) {
          if (message.dockedBarControls === "Limits") {
            this.handleLimitsUtilityPanel(message);
          } else if (message.dockedBarControls === "Resources") {
            this.handleResourcesUtilityPanel(message);
          } else if (message.dockedBarControls === "AppAnalytics") {
            this.handleAppAnalyticsUtilityPanel(message);
          } else if (message.dockedBarControls === "Announcements") {
            this.handleAnnouncementsUtilityPanel(message);
          } else if (message.dockedBarControls === "Trailhead") {
            this.handleTrailheadUtilityPanel(message);
          }
        }
      }
    );

    // Seed AppAnalytics state on load so background-created requests are tracked
    // even before the panel is opened. Silent: no spinner, no toast on this cycle.
    this.seedAppAnalytics();
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
    this.stopPolling();
  }

  handleLimitsUtilityPanel(message) {
    this.showResourcesPanel = false;
    this.dockedUtilityResourcesPanelBodyStyle = this.showResourcesPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAppAnalyticsPanel = false;
    this.dockedUtilityAppAnalyticsBodyStyle = this.showAppAnalyticsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAnnouncementsPanel = false;
    this.dockedUtilityAnnouncementsBodyStyle = this.showAnnouncementsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showTrailheadPanel = false;
    this.dockedUtilityTrailheadBodyStyle = this.showTrailheadPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (!message.limitsOpen || !this.showLimitsPanel) {
      this.showLimitsPanel = !this.showLimitsPanel;
    }

    this.dockedUtilityLimitsPanelBodyStyle = this.showLimitsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;
  }

  handleResourcesUtilityPanel(message) {
    this.showLimitsPanel = false;
    this.dockedUtilityLimitsPanelBodyStyle = this.showLimitsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAppAnalyticsPanel = false;
    this.dockedUtilityAppAnalyticsBodyStyle = this.showAppAnalyticsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAnnouncementsPanel = false;
    this.dockedUtilityAnnouncementsBodyStyle = this.showAnnouncementsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showTrailheadPanel = false;
    this.dockedUtilityTrailheadBodyStyle = this.showTrailheadPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (!message.resourcesOpen || !this.showResourcesPanel) {
      this.showResourcesPanel = !this.showResourcesPanel;
    }

    this.dockedUtilityResourcesPanelBodyStyle = this.showResourcesPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (this.showResourcesPanel) {
      (async () => {
        this.displaySpinner = true;
        await getResourcesMetadata({})
          .then((result) => {
            this.resourcesData = result;
            this.displaySpinner = false;
            this.resourcesNotAvailableView = false;
          })
          .catch((error) => {
            console.error(error);
            this.displaySpinner = false;
            this.resourcesData = undefined;
            this.resourcesNotAvailableView = true;
            // Toast for Failure
            this.dispatchEvent(
              new ShowToastEvent({
                title: "We were unable to retrieve resources",
                message: error,
                variant: "error"
              })
            );
          });
      })();
    }
  }

  handleAppAnalyticsUtilityPanel(message) {
    this.showLimitsPanel = false;
    this.dockedUtilityLimitsPanelBodyStyle = this.showLimitsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showResourcesPanel = false;
    this.dockedUtilityResourcesPanelBodyStyle = this.showResourcesPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAnnouncementsPanel = false;
    this.dockedUtilityAnnouncementsBodyStyle = this.showAnnouncementsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showTrailheadPanel = false;
    this.dockedUtilityTrailheadBodyStyle = this.showTrailheadPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (!message.appAnalyticsRequestOpen || !this.showAppAnalyticsPanel) {
      this.showAppAnalyticsPanel = !this.showAppAnalyticsPanel;
    }

    this.dockedUtilityAppAnalyticsBodyStyle = this.showAppAnalyticsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (this.showAppAnalyticsPanel) {
      this.getAppAnaltics();
    }
  }

  handleAnnouncementsUtilityPanel(message) {
    this.showLimitsPanel = false;
    this.dockedUtilityLimitsPanelBodyStyle = this.showLimitsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showResourcesPanel = false;
    this.dockedUtilityResourcesPanelBodyStyle = this.showResourcesPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAppAnalyticsPanel = false;
    this.dockedUtilityAppAnalyticsBodyStyle = this.showAppAnalyticsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showTrailheadPanel = false;
    this.dockedUtilityTrailheadBodyStyle = this.showTrailheadPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (!message.announcementsOpen || !this.showAnnouncementsPanel) {
      this.showAnnouncementsPanel = !this.showAnnouncementsPanel;
    }

    this.dockedUtilityAnnouncementsBodyStyle = this.showAnnouncementsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (this.showAnnouncementsPanel) {
      (async () => {
        this.displaySpinner = true;
        await getAnnouncementsMetadata({})
          .then((result) => {
            this.announcementsData = result;
            this.displaySpinner = false;
            this.announcementsNotAvailableView = false;
          })
          .catch((error) => {
            console.error(error);
            this.displaySpinner = false;
            this.announcementsData = undefined;
            this.announcementsNotAvailableView = true;
            // Toast for Failure
            this.dispatchEvent(
              new ShowToastEvent({
                title: "We were unable to retrieve announcements",
                message: error,
                variant: "error"
              })
            );
          });
      })();
    }
  }

  handleTrailheadUtilityPanel(message) {
    this.showLimitsPanel = false;
    this.dockedUtilityLimitsPanelBodyStyle = this.showLimitsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showResourcesPanel = false;
    this.dockedUtilityResourcesPanelBodyStyle = this.showResourcesPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAppAnalyticsPanel = false;
    this.dockedUtilityAppAnalyticsBodyStyle = this.showAppAnalyticsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    this.showAnnouncementsPanel = false;
    this.dockedUtilityAnnouncementsBodyStyle = this.showAnnouncementsPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;

    if (!message.trailheadOpen || !this.showTrailheadPanel) {
      this.showTrailheadPanel = !this.showTrailheadPanel;
    }

    this.dockedUtilityTrailheadBodyStyle = this.showTrailheadPanel
      ? `slds-utility-panel slds-grid slds-grid_vertical slds-is-open`
      : `slds-utility-panel slds-grid slds-grid_vertical`;
  }

  handleAppAnalyticsRefresh() {
    this.getAppAnaltics();
  }

  getAppAnaltics() {
    (async () => {
      this.displaySpinner = true;
      await getAppAnalyticsRequests({})
        .then((result) => {
          this.appAnalyticsData = result;
          this.displaySpinner = false;
          this.appAnalyticsNotAvailableView =
            !result || result.length === 0 ? true : false;
          // User-visible refresh: re-baseline, clear the badge (the user is now
          // looking at the list), and arm polling if anything is still in-flight.
          this.seedStateMap(result);
          this.terminalBadgeCount = 0;
          this.startPolling();
        })
        .catch((error) => {
          console.error(error);
          this.displaySpinner = false;
          this.appAnalyticsData = undefined;
          this.appAnalyticsNotAvailableView = true;
          // Toast for Failure
          this.dispatchEvent(
            new ShowToastEvent({
              title: "We were unable to retrieve AppAnalytics requests",
              message: error,
              variant: "error"
            })
          );
        });
    })();
  }

  // Silent on-load / arm-the-poller seed. Unlike getAppAnaltics() this never
  // touches the shared displaySpinner and never toasts — it only establishes the
  // baseline and starts polling when something is in-flight.
  seedAppAnalytics() {
    (async () => {
      if (this._pollInFlight) {
        return;
      }
      this._pollInFlight = true;
      await getAppAnalyticsRequests({})
        .then((result) => {
          this.appAnalyticsData = result;
          this.seedStateMap(result);
          this.startPolling();
        })
        .catch((error) => {
          // Silent: a background seed failure must not surface a toast.
          console.error(error);
        })
        .finally(() => {
          this._pollInFlight = false;
        });
    })();
  }

  // Record the current state of every request and mark the baseline as
  // established, so the first cycle never fires notifications for stale history.
  seedStateMap(result) {
    this._prevStateById = new Map(
      (result || []).map((r) => [r.Id, r.RequestState])
    );
    this._seeded = true;
  }

  isTerminal(state) {
    return state != null && this.TERMINAL_STATES.includes(state);
  }

  hasInFlightRequests(list = this.appAnalyticsData) {
    return (list || []).some((r) => !this.isTerminal(r.RequestState));
  }

  startPolling() {
    if (this._pollTimeoutId || !this.hasInFlightRequests()) {
      return;
    }
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._pollTimeoutId = setTimeout(() => {
      this._pollTimeoutId = null;
      this.pollAppAnalytics();
    }, this.POLL_INTERVAL_MS);
  }

  stopPolling() {
    if (this._pollTimeoutId) {
      clearTimeout(this._pollTimeoutId);
      this._pollTimeoutId = null;
    }
  }

  // Silent poll tick: never touches displaySpinner. Diffs against the previous
  // cycle, coalesces newly-terminal requests into a single toast, updates the
  // badge, then re-arms only while requests remain in-flight.
  pollAppAnalytics() {
    if (this._pollInFlight) {
      return;
    }
    this._pollInFlight = true;
    (async () => {
      await getAppAnalyticsRequests({})
        .then((result) => {
          const list = result || [];
          const newlyTerminal = this._seeded
            ? list.filter((req) => {
                const prev = this._prevStateById.get(req.Id);
                const wasInFlight =
                  prev === undefined || !this.isTerminal(prev);
                return wasInFlight && this.isTerminal(req.RequestState);
              })
            : [];
          this.appAnalyticsData = result;
          this.appAnalyticsNotAvailableView = list.length === 0 ? true : false;
          this.seedStateMap(list);
          if (newlyTerminal.length > 0) {
            this.terminalBadgeCount += newlyTerminal.length;
            this.dispatchEvent(this.buildToast(newlyTerminal));
          }
          // Re-arm only while something is still pending.
          if (this.hasInFlightRequests(list)) {
            this.startPolling();
          } else {
            this.stopPolling();
          }
        })
        .catch((error) => {
          // Silent: transient poll failures must not spam toasts. Retry next tick.
          console.error(error);
          this.startPolling();
        })
        .finally(() => {
          this._pollInFlight = false;
        });
    })();
  }

  // Coalescing rule: at most ONE toast per cycle, regardless of burst size.
  buildToast(newlyTerminal) {
    if (newlyTerminal.length === 1) {
      const req = newlyTerminal[0];
      return new ShowToastEvent({
        title: "AppAnalytics request finished",
        message: `${req.Name} - ${
          this.STATE_LABELS[req.RequestState] || req.RequestState
        }`,
        variant: this.toastVariant(newlyTerminal)
      });
    }
    const counts = {};
    newlyTerminal.forEach((req) => {
      const label = this.STATE_LABELS[req.RequestState] || req.RequestState;
      counts[label] = (counts[label] || 0) + 1;
    });
    const summary = Object.keys(counts)
      .map((label) => `${counts[label]} ${label}`)
      .join(", ");
    return new ShowToastEvent({
      title: `${newlyTerminal.length} AppAnalytics requests finished`,
      message: summary,
      variant: this.toastVariant(newlyTerminal)
    });
  }

  // success only when every newly-terminal request completed; otherwise warning.
  toastVariant(newlyTerminal) {
    return newlyTerminal.every((req) => req.RequestState === "Complete")
      ? "success"
      : "warning";
  }

  get hasTerminalBadge() {
    return this.terminalBadgeCount > 0;
  }

  get badgeAriaLabel() {
    return `${this.terminalBadgeCount} finished AppAnalytics requests`;
  }

  handleAppAnalyticsExpand(event) {
    this.displayAppAnalyticsViewModal = true;
    this.appAnalyticsViewData = event.detail;
  }

  handleViewCloseModal() {
    this.displayAppAnalyticsViewModal = false;
  }

  handleLaunchAnalyticsStudio() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `/analytics/home`
      }
    });
  }

  handleResourcesTrailhead() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://trailhead.salesforce.com/content/learn/trails/sfdx_get_started`
      }
    });
  }

  handleResourcesHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_dev2gp.htm`
      }
    });
  }

  handleAppAnalyticsHelpDoc() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/app_analytics_intro.htm`
      }
    });
  }

  handleAppAnalyticsTrailhead() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://trailhead.salesforce.com/content/learn/modules/appexchange-partner-intelligence-basics`
      }
    });
  }

  handlePartnerCommunityGroup() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F9300000001s8i`
      }
    });
  }

  handlePartnerAlerts() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F9300000001s8O`
      }
    });
  }

  handleAppXDevCenterAlerts() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://developer.salesforce.com/developer-centers/appexchange`
      }
    });
  }

  prepData() {
    this.activeScratchOrgsMax = this.limitsData.activeScratchOrgsMax;
    this.activeScratchOrgsRem = this.limitsData.activeScratchOrgsRem;
    this.activeScratchPercentage =
      (this.activeScratchOrgsRem / this.activeScratchOrgsMax) * 100;

    this.dailyScratchOrgsMax = this.limitsData.dailyScratchOrgsMax;
    this.dailyScratchOrgsRem = this.limitsData.dailyScratchOrgsRem;
    this.dailyScratchOrgsPercentage =
      (this.dailyScratchOrgsRem / this.dailyScratchOrgsMax) * 100;

    this.package2VersionCreatesMax = this.limitsData.package2VersionCreatesMax;
    this.package2VersionCreatesRem = this.limitsData.package2VersionCreatesRem;
    this.package2VersionCreatesPercentage =
      (this.package2VersionCreatesRem / this.package2VersionCreatesMax) * 100;

    this.package2VersionCreatesWithoutValidationMax =
      this.limitsData.package2VersionCreatesWithoutValidationMax;
    this.package2VersionCreatesWithoutValidationRem =
      this.limitsData.package2VersionCreatesWithoutValidationRem;
    this.package2VersionCreatesWithoutValidationPercentage =
      (this.package2VersionCreatesWithoutValidationRem /
        this.package2VersionCreatesWithoutValidationMax) *
      100;

    this.dailyApiRequestsMax = this.limitsData.dailyApiRequestsMax;
    this.dailyApiRequestsRem = this.limitsData.dailyApiRequestsRem;
    this.dailyApiRequestsPercentage =
      (this.dailyApiRequestsRem / this.dailyApiRequestsMax) * 100;

    this.dataStorageMBMax = this.limitsData.dataStorageMBMax;
    this.dataStorageMBRem = this.limitsData.dataStorageMBRem;
    this.dataStorageMBPercentage =
      (this.dataStorageMBRem / this.dataStorageMBMax) * 100;
  }

  handleGenAiLimits() {
    this.openModal({
      headerLabel: "Generative AI Summary - Org Limits"
    });
  }

  async openModal(details) {
    await genAiLimitsModal.open({
      label: details.headerLabel,
      size: "medium",
      content: JSON.stringify(this.limitsData)
    });
  }

  updateLimits(event) {
    this.limitsData = event.detail;
  }
}
