import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { AGENT_SCRIPTS } from "./agentScriptsData.js";
import getInstalledPackages from "@salesforce/apex/PackageVisualizerCtrl.getInstalledPackages";
import getNamespacePermSetId from "@salesforce/apex/PackageVisualizerCtrl.getNamespacePermSetId";
import AgentScriptCoachModal from "c/agentScriptCoachModal";

function normalizeId15(id) {
  if (!id) {
    return id;
  }
  return id.length >= 15 ? id.substring(0, 15) : id;
}

export default class InAppGuidanceCard extends NavigationMixin(
  LightningElement
) {
  displaySpinner;
  displayInAppPrompt;

  // Agentforce Extension package version ID
  currentPkgVersionId = "04tRh000001bOxFIAU";

  title = "AgentExchange Showcase";
  iconName = "utility:salesforce1";
  agentScripts = AGENT_SCRIPTS;
  resourcesData = [
    {
      label: "Agentforce Extension",
      description:
        "Extend agentic and AI capabilities to help ease your packaging and ISV development cycle.",
      icon: "standard:agent_astro",
      listingLink:
        "https://appexchange.salesforce.com/appxListingDetail?listingId=632af825-58e1-4e61-a2b6-8b008449ca03",
      installLink: `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`,
      helpGuideLink: "https://salesforce.quip.com/f3SWA340YbFH",
      helpGuideIcon: "utility:quip",
      subscriberPackageId: "033Rh000002JY85IAG",
      subscriberPackageVersionId: this.currentPkgVersionId,
      permSetLabel: "Package_Visualizer_Agentforce_Extension_Permissions",
      permSetNamespace: "pkgviz"
    } /*,
        {
            label: 'Data Kit Extension',
            description: 'Understand package adoption and feature usage via Data360 and AppAnalytics.',
            icon: 'standard:data_cloud',
            installLink: '/packaging/installPackage.apexp?p0=04tRh000001NopxIAC',
            subscriberPackageId: '0335w000000XqPxAAK',
            subscriberPackageVersionId: '04t5w000000aveXAAQ'
        },
        {
            label: 'Tableau Next Extension',
            description: 'Leverage Tableau Next, Agentforce, and Data360 to experience Agentic visualizations.',
            icon: 'standard:tableau',
            installLink: '/packaging/installPackage.apexp?p0=04tRh000001NopxIAC',
            subscriberPackageId: '033Rh000003U3oLIAS',
            subscriberPackageVersionId: '04tRh000001bIOnIAM',
            //tooltip: 'Requires Agentforce, Data360 and Tableau Next'
        }
        */
  ];

  connectedCallback() {
    this.displaySpinner = true;
    const packageIds = this.resourcesData.map((r) => r.subscriberPackageId);
    getInstalledPackages({ subscriberPackageIds: packageIds })
      .then((result) => {
        const installedMap = new Map();
        for (const row of result) {
          installedMap.set(
            normalizeId15(row.subscriberPackageId),
            row.subscriberPackageVersionId
          );
        }
        this.resourcesData = this.resourcesData.map((r) => {
          const installedVersionId = installedMap.get(
            normalizeId15(r.subscriberPackageId)
          );
          const hasPackage = installedVersionId !== undefined;
          const normalizedInstalled = normalizeId15(installedVersionId);
          const normalizedTarget = normalizeId15(r.subscriberPackageVersionId);
          const versionsMatch =
            hasPackage && normalizedInstalled === normalizedTarget;
          const isUpgradeAvailable = hasPackage && !versionsMatch;
          return {
            ...r,
            isInstalled: versionsMatch,
            isUpgradeAvailable,
            showPermSetButton: hasPackage && !!r.permSetLabel
          };
        });
      })
      .catch((error) => {
        console.error("Error checking installed packages:", error);
      })
      .finally(() => {
        this.displaySpinner = false;
      });
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
      currentPkgVersionId: this.currentPkgVersionId
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
