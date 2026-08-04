import { api, LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { AGENT_SCRIPTS } from "./agentScriptsData.js";
import getExtensionStatus from "@salesforce/apex/AgentforceExtensionStatusController.getStatus";
import getNamespacePermSetId from "@salesforce/apex/PackageVisualizerCtrl.getNamespacePermSetId";
import AgentScriptCoachModal from "c/agentScriptCoachModal";

const UNAVAILABLE_EXTENSION_STATUS = {
  state: "UNAVAILABLE",
  message:
    "Package Visualizer could not verify the Agentforce extension status. Try again later."
};

const AGENTEXCHANGE_LISTING_URL =
  "https://appexchange.salesforce.com/appxListingDetail?listingId=632af825-58e1-4e61-a2b6-8b008449ca03";
const SETUP_GUIDE_URL = "https://salesforce.quip.com/f3SWA340YbFH";

export default class InAppGuidanceCard extends NavigationMixin(
  LightningElement
) {
  displaySpinner;
  displayInAppPrompt;
  _extensionStatus;

  title = "AgentExchange Showcase";
  iconName = "utility:salesforce1";
  agentScripts = AGENT_SCRIPTS;
  resourcesData = [];

  @api hideInAppGuidance;

  @api
  get extensionStatus() {
    return this._extensionStatus;
  }

  set extensionStatus(value) {
    this._extensionStatus = value;
    if (value) {
      this.applyExtensionStatus(value);
    }
  }

  connectedCallback() {
    this.displaySpinner = true;
    Promise.resolve().then(() => this.initializeExtensionStatus());
  }

  initializeExtensionStatus() {
    if (this._extensionStatus) {
      this.applyExtensionStatus(this._extensionStatus);
      return;
    }
    getExtensionStatus()
      .then((status) => {
        this._extensionStatus = status || UNAVAILABLE_EXTENSION_STATUS;
        this.applyExtensionStatus(this._extensionStatus);
      })
      .catch(() => {
        this._extensionStatus = UNAVAILABLE_EXTENSION_STATUS;
        this.applyExtensionStatus(this._extensionStatus);
      });
  }

  applyExtensionStatus(status) {
    const state = status?.state || "UNAVAILABLE";
    this.resourcesData = [
      {
        label: status?.extensionLabel || "Agentforce Extension",
        description:
          status?.description ||
          "Extend Package Visualizer with Agentforce package intelligence.",
        icon: status?.iconName || "standard:agent_astro",
        listingLink: AGENTEXCHANGE_LISTING_URL,
        installLink: status?.directInstallUrl,
        helpGuideLink: SETUP_GUIDE_URL,
        helpGuideIcon: "utility:quip",
        subscriberPackageId: status?.configuredSubscriberPackageId,
        subscriberPackageVersionId:
          status?.configuredSubscriberPackageVersionId,
        permSetLabel: status?.permissionSetLabel,
        permSetNamespace: status?.namespacePrefix,
        isInstalled: state === "READY",
        isUpgradeAvailable: state === "UPDATE_REQUIRED",
        isInstallAvailable: state === "NOT_INSTALLED",
        showPermSetButton:
          ["READY", "UPDATE_REQUIRED"].includes(state) &&
          Boolean(status?.permissionSetLabel),
        showStatusMessage: ["MISCONFIGURED", "UNAVAILABLE"].includes(state),
        statusMessage: status?.message || UNAVAILABLE_EXTENSION_STATUS.message
      }
    ];
    this.displaySpinner = false;
  }

  handleSlackCommunity() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://partnerblazer.slack.com/`
      },
      state: {
        target: "_blank"
      }
    });
  }

  handleAgentforceLabs() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: `https://labs.agentforce.com/start`
      },
      state: {
        target: "_blank"
      }
    });
  }

  handleNavigateToAgentforceStudio() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: "/lightning/n/standard-AgentforceStudio?c__nav=agents"
      }
    });
  }

  handleInAppPrompt() {
    this.displayInAppPrompt = true;
  }

  handleInAppPromptCancel() {
    this.displayInAppPrompt = false;
  }

  navigateToAgentExchangeListing(event) {
    const resourceIndex = event.target.dataset.index;
    const selectedResource = this.resourcesData[resourceIndex];
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: selectedResource.listingLink
      },
      state: {
        target: "_blank"
      }
    });
  }

  handleInstall(event) {
    const resourceIndex = event.target.dataset.index;
    const selectedResource = this.resourcesData[resourceIndex];
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: selectedResource.installLink
      },
      state: {
        target: "_blank"
      }
    });
  }

  navigateToHelpGuide(event) {
    const resourceIndex = event.target.dataset.index;
    const selectedResource = this.resourcesData[resourceIndex];
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: selectedResource.helpGuideLink
      },
      state: {
        target: "_blank"
      }
    });
  }

  navigateToPermSet(event) {
    const resourceIndex = event.target.dataset.index;
    const selectedResource = this.resourcesData[resourceIndex];
    if (!selectedResource || !selectedResource.permSetLabel) {
      return;
    }
    // Open the tab now, while the click gesture is live; the Apex lookup that
    // follows is async and would otherwise leave window.open popup-blocked.
    const tab = window.open("", "_blank");
    (async () => {
      await getNamespacePermSetId({
        label: selectedResource.permSetLabel,
        namespace: selectedResource.permSetNamespace
      })
        .then((result) => {
          this.openOrgPage(
            `/lightning/setup/PermSets/${result}/PermissionSetAssignment/home`,
            tab
          );
        })
        .catch((error) => {
          console.error(error);
          this.openOrgPage("/lightning/setup/PermSets/home", tab);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Couldn't open the permission set",
              message:
                (error && error.body && error.body.message) ||
                `Confirm the ${selectedResource.permSetLabel} permission set is installed, then try again.`,
              variant: "error"
            })
          );
        });
    })();
  }

  // Opens an in-org page in a new browser tab. The new tab must be opened
  // synchronously inside the originating click handler so it inherits the
  // browser's user-activation gesture. If we waited for an Apex call to resolve
  // before calling window.open, the gesture would be gone and the popup blocker
  // would force the page to load in the current window instead of a new tab.
  // Callers that do async work before navigating open the blank tab themselves
  // and pass it in (a Window exposes a boolean `closed`; a click Event does not).
  openOrgPage(url, existingTab) {
    const reuseTab = existingTab && typeof existingTab.closed === "boolean";
    const newTab = reuseTab ? existingTab : window.open("", "_blank");
    if (!newTab) {
      return;
    }
    newTab.location.href = url.startsWith("http")
      ? url
      : window.location.origin + url;
  }

  handleAgentScriptCoach(event) {
    const scriptId = event.currentTarget.dataset.scriptId;
    const script = this.agentScripts.find((s) => s.id === scriptId);
    if (!script || !script.body) {
      return;
    }
    AgentScriptCoachModal.open({
      size: "large",
      scriptBody: script.body,
      scriptLabel: `${script.label}`,
      scriptHeader: `Agentforce Analysis - ${script.label}`,
      scriptId: script.id,
      scriptHash: script.scriptHash,
      scriptManifest: script.manifest,
      coachingEvidence: script.coachingEvidence,
      publicChatSummary: script.publicChatSummary
    });
  }

  handleCopyAgentScript(event) {
    const scriptId = event.currentTarget.dataset.scriptId;
    const script = this.agentScripts.find((s) => s.id === scriptId);
    if (!script || !script.body) {
      return;
    }
    const text = script.body;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Text copied to clipboard",
              variant: "success"
            })
          );
        })
        .catch((err) => {
          console.error("Failed to copy AgentScript:", err);
          this.fallbackCopyToClipboard(text);
        });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Text copied to clipboard",
          variant: "success"
        })
      );
    } catch (err) {
      console.error("Fallback copy to clipboard failed:", err);
    }
    document.body.removeChild(textArea);
  }
}
