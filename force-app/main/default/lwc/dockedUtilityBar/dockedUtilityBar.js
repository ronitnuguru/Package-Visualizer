import { LightningElement, wire, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { subscribe, unsubscribe, MessageContext } from "lightning/messageService";
import getResourcesMetadata from "@salesforce/apex/PackageVisualizerCtrl.getResourcesMetadata";
import getAppAnalyticsRequests from "@salesforce/apexContinuation/PackageVisualizerCtrl.getAppAnalyticsRequests";
import getAnnouncementsMetadata from "@salesforce/apex/PackageVisualizerCtrl.getAnnouncementsMetadata";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import genAiLimitsModal from 'c/genAiLimitsModal';


export default class DockedUtilityBar extends NavigationMixin(LightningElement) {
  @wire(MessageContext) messageContext;
  @api packageTypes;

  get is2GP() {
    return this.packageTypes === '2GP and Unlocked Packages' ? true : false;
  }

  displaySpinner = true;
  displayAppAnalyticsViewModal;

  showLimitsPanel = false;
  showResourcesPanel = false;
  showAppAnalyticsPanel = false;
  showAnnouncementsPanel = false;

  subscription = null;
  dockedUtilityLimitsPanelBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;
  dockedUtilityResourcesPanelBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;
  dockedUtilityAppAnalyticsBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;
  dockedUtilityAnnouncementsBodyStyle = `slds-utility-panel slds-grid slds-grid_vertical`;

  limitsData;
  resourcesData;
  appAnalyticsData;
  appAnalyticsViewData;
  announcementsData;

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
      message => {
        if (message) {
          if (message.dockedBarControls === "Limits") {
            this.handleLimitsUtilityPanel(message);
          } else if (message.dockedBarControls === "Resources") {
            this.handleResourcesUtilityPanel(message);
          } else if (message.dockedBarControls === "AppAnalytics") {
            this.handleAppAnalyticsUtilityPanel(message);
          } else if (message.dockedBarControls === "Announcements") {
            this.handleAnnouncementsUtilityPanel(message);
          }
        }
      }
    );
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
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
          .then(result => {
            this.resourcesData = result;
            this.displaySpinner = false;
            this.resourcesNotAvailableView = false;
          })
          .catch(error => {
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
          .then(result => {
            this.announcementsData = result;
            this.displaySpinner = false;
            this.announcementsNotAvailableView = false;
          })
          .catch(error => {
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

  handleAppAnalyticsRefresh() {
    this.getAppAnaltics();
  }

  getAppAnaltics() {
    (async () => {
      this.displaySpinner = true;
      await getAppAnalyticsRequests({
      })
        .then(result => {
          this.appAnalyticsData = result;
          this.displaySpinner = false;
          this.appAnalyticsNotAvailableView =
            !result || result.length === 0 ? true : false;
        })
        .catch(error => {
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

    this.package2VersionCreatesWithoutValidationMax = this.limitsData.package2VersionCreatesWithoutValidationMax;
    this.package2VersionCreatesWithoutValidationRem = this.limitsData.package2VersionCreatesWithoutValidationRem;
    this.package2VersionCreatesWithoutValidationPercentage =
      (this.package2VersionCreatesWithoutValidationRem /
        this.package2VersionCreatesWithoutValidationMax) *
      100;

    this.dailyApiRequestsMax = this.limitsData.dailyApiRequestsMax;
    this.dailyApiRequestsRem = this.limitsData.dailyApiRequestsRem;
    this.dailyApiRequestsPercentage = (this.dailyApiRequestsRem / this.dailyApiRequestsMax) * 100;

    this.dataStorageMBMax = this.limitsData.dataStorageMBMax;
    this.dataStorageMBRem = this.limitsData.dataStorageMBRem;
    this.dataStorageMBPercentage = (this.dataStorageMBRem / this.dataStorageMBMax) * 100;

  }

  handleGenAiLimits() {
    this.openModal({
      headerLabel: "Generative AI Summary - Org Limits",
    });
  }

  async openModal(details){
    const result = await genAiLimitsModal.open({
      label: details.headerLabel,
      size: 'medium',
      content: JSON.stringify(this.limitsData)
    });
}

  updateLimits(event){
    
  }
}