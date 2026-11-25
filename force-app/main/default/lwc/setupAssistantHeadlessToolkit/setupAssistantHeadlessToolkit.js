import { LightningElement, api, wire } from "lwc";
import getJourneyUrl from "@salesforce/apex/HeadlessJourneyLauncherController.getJourneyUrl";
import createJourneyTrustedUrl from "@salesforce/apex/HeadlessJourneyLauncherController.createJourneyTrustedUrl";
import canCustomizeApplication from "@salesforce/userPermission/CustomizeApplication";
import canModifyAllData from "@salesforce/userPermission/ModifyAllData";

const EMBED_READY_EVENT = "sf-embedding.component.ready";
const EMBED_ERROR_EVENT = "sf-embedding.component.error";
const EMBED_LOAD_TIMEOUT_MS = 15000;
const TRUSTED_URLS_SETUP = "/lightning/setup/SecurityCspTrustedSite/home";

export default class SetupAssistantHeadlessToolkit extends LightningElement {
  @api orgId;

  autoConfirmSettings = true;
  embedState = "loading";
  embedHost;
  embedLoadTimer;
  creatingTrustedUrl = false;
  trustedUrlConfirmed = false;
  trustedUrlError;

  @wire(getJourneyUrl) journey;

  get journeyUrl() {
    return this.journey?.data;
  }

  get journeyOrigin() {
    return new URL(this.journeyUrl).origin;
  }

  handleOpenJourney() {
    window.open(this.journeyUrl, "_blank", "noopener,noreferrer");
  }

  handleOpenTrustedUrls() {
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.opener = null;
      newTab.location.href = window.location.origin + TRUSTED_URLS_SETUP;
    }
  }

  handleRefresh() {
    this.removeEmbedListeners();
    this.trustedUrlError = undefined;
    this.embedState = "loading";
  }

  get showCreateTrustedUrl() {
    return canCustomizeApplication && canModifyAllData;
  }

  get createTrustedUrlDisabled() {
    return this.creatingTrustedUrl || this.trustedUrlConfirmed;
  }

  async handleCreateTrustedUrl() {
    if (this.createTrustedUrlDisabled || !this.showCreateTrustedUrl) return;
    this.creatingTrustedUrl = true;
    this.trustedUrlError = undefined;
    try {
      await createJourneyTrustedUrl();
      this.trustedUrlConfirmed = true;
    } catch (error) {
      this.trustedUrlError = error?.body?.message || "Couldn’t create the Trusted URL. Review it in Setup.";
    } finally {
      this.creatingTrustedUrl = false;
    }
  }

  get journeyResolved() {
    return this.journey?.data !== undefined || Boolean(this.journey?.error);
  }

  get journeyUnavailable() {
    return this.journeyResolved && !this.journeyUrl;
  }

  get isLoading() {
    return !this.journeyResolved || (Boolean(this.journeyUrl) && this.embedState === "loading");
  }

  get embedFailed() {
    return this.embedState === "failed";
  }

  get hideJourneyHeader() {
    return !this.embedFailed;
  }

  get showEmbed() {
    return Boolean(this.journeyUrl) && !this.embedFailed;
  }

  get embedClass() {
    return this.embedState === "loading" ? "journey-embed-loading" : "";
  }

  handleEmbedReady = () => {
    clearTimeout(this.embedLoadTimer);
    this.embedState = "ready";
  };

  handleEmbedError = () => {
    clearTimeout(this.embedLoadTimer);
    this.embedState = "failed";
  };

  renderedCallback() {
    const host = this.refs?.journeyEmbed;
    if (host === this.embedHost) return;
    this.removeEmbedListeners();
    if (!host) return;
    this.embedHost = host;
    host.addEventListener(EMBED_READY_EVENT, this.handleEmbedReady);
    host.addEventListener(EMBED_ERROR_EVENT, this.handleEmbedError);
    this.embedLoadTimer = setTimeout(this.handleEmbedError, EMBED_LOAD_TIMEOUT_MS);
  }

  disconnectedCallback() {
    this.removeEmbedListeners();
    this.embedState = "loading";
  }

  removeEmbedListeners() {
    clearTimeout(this.embedLoadTimer);
    this.embedHost?.removeEventListener(EMBED_READY_EVENT, this.handleEmbedReady);
    this.embedHost?.removeEventListener(EMBED_ERROR_EVENT, this.handleEmbedError);
    this.embedHost = undefined;
  }
}
