import { LightningElement, api, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { RefreshEvent } from "lightning/refresh";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import ScratchBuildModal from "c/scratchBuildModal";
import isActiveScratchOrg from "@salesforce/apex/Package2Interface.isActiveScratchOrg";
import getOrgCountryCode from "@salesforce/apex/PackageVisualizerCtrl.getOrgCountryCode";
import {
  EDITION_OPTIONS,
  RELEASE_OPTIONS,
  CREATE_USING_OPTIONS,
  PREFERRED_LANGUAGE_OPTIONS,
  COUNTRY_OPTIONS,
  TEMPLATES,
  DEFAULT_FEATURES,
  buildFeaturePill
} from "c/scratchOrgConfig";

const HELP_URLS = {
  scratchRelease:
    "https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_version_selection.htm",
  scratchDefFile:
    "https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm",
  orgShape:
    "https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_shape_intro.htm",
  supportedEditions:
    "https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_editions_and_allocations.htm",
  devWorkflow:
    "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/dev2gp_so_how_fit_pkg_dev.htm"
};

export default class ScratchDefFileBuildCard extends NavigationMixin(
  LightningElement
) {
  // When set by a parent, the matching TEMPLATES preset is auto-applied once on first render.
  @api templateKey;
  _templateApplied = false;

  editionValue = "Developer";
  releaseValue = "current";
  createUsingValue = "edition";
  orgValue = "Scratch Org";
  orgDescription;
  hasSampleData = false;
  sourceOrgId;

  errorText;
  displayError = false;

  metaSettings = {};
  metaConfirmSelected = false;
  displayScratchOrgActions;
  displayEdition = true;

  featuresList = DEFAULT_FEATURES.map((name) => buildFeaturePill(name));
  featureValue = "";
  preferredLanguage = "en_US";
  country;
  defaultCountry = "US";

  editionOptions = EDITION_OPTIONS;
  releaseOptions = RELEASE_OPTIONS;
  createUsingOptions = CREATE_USING_OPTIONS;
  preferredLanguageOptions = PREFERRED_LANGUAGE_OPTIONS;
  countryOptions = COUNTRY_OPTIONS;

  renderedCallback() {
    if (this._templateApplied || !this.templateKey) {
      return;
    }
    this._templateApplied = true;
    this.applyTemplateByKey(this.templateKey, { showToast: false });
  }

  @wire(getOrgCountryCode)
  wiredCountryCode({ error, data }) {
    if (data) {
      this.defaultCountry = data;
      this.country = data;
    } else if (error) {
      console.error(error);
      this.defaultCountry = "US";
      this.country = "US";
    }
  }

  @wire(isActiveScratchOrg)
  wiredIsActiveScratchOrg({ data, error }) {
    if (data === true || data === false) {
      this.displayScratchOrgActions = data;
    } else if (error) {
      this.displayScratchOrgActions = undefined;
      console.error(error);
    }
  }

  get hasFeatures() {
    return this.featuresList.length > 0;
  }

  handleAddFeature() {
    const trimmed = (this.featureValue || "").trim();
    if (!trimmed) {
      this.featureValue = "";
      return;
    }
    const exists = this.featuresList.some(
      (feature) => feature.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      this.featuresList = [...this.featuresList, buildFeaturePill(trimmed)];
    }
    this.featureValue = "";
  }

  addFeatures(features) {
    if (!features?.length) return;
    const existing = new Set(
      this.featuresList.map((f) => f.name.toLowerCase())
    );
    const additions = [];
    features.forEach((feature) => {
      const trimmed = String(feature || "").trim();
      if (trimmed && !existing.has(trimmed.toLowerCase())) {
        additions.push(buildFeaturePill(trimmed));
        existing.add(trimmed.toLowerCase());
      }
    });
    if (additions.length) {
      this.featuresList = [...this.featuresList, ...additions];
    }
  }

  /**
   * One handler for every template menu-item. The clicked item carries `data-template`
   * pointing to a key in the TEMPLATES registry (see c/scratchOrgConfig).
   */
  applyTemplate(event) {
    const key = event.currentTarget.dataset.template;
    this.applyTemplateByKey(key, { showToast: true });
  }

  /**
   * Apply a TEMPLATES preset by key: set the edition, add its features, and push its settings
   * directly to the settings child. Used both by the menu handler and by the `templateKey` auto-apply.
   */
  applyTemplateByKey(templateKey, { showToast = true } = {}) {
    const template = TEMPLATES[templateKey];
    if (!template) {
      console.warn(`Unknown scratch org template: ${templateKey}`);
      return;
    }

    if (template.edition) {
      this.editionValue = template.edition;
    }
    this.addFeatures(template.features);

    const settingsCmp = this.template.querySelector(
      "c-scratch-settings-expression"
    );
    if (settingsCmp) {
      settingsCmp.applySettings(template.settings || {});
    }

    if (showToast) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: `Sample Scratch Org Features and Settings for ${template.label} have been added`,
          variant: "success"
        })
      );
    }
  }

  handleCreateUsingChange(event) {
    this.createUsingValue = event.detail.value;
    this.displayEdition = this.createUsingValue === "edition";
  }

  handleFeatureValueChangeOnKeyDown(event) {
    if (event.key === "Enter") {
      this.featureValue = event.target.value;
      this.handleAddFeature();
    }
  }

  handleConfirmSelected(event) {
    this.metaConfirmSelected = event.detail;
    if (!event.detail) {
      this.metaSettings = {};
    }
  }

  handleFeatureRemove(event) {
    const feature = event.detail.item.name;
    this.featuresList = this.featuresList.filter(
      (pill) => pill.name !== feature
    );
  }

  handleFeatureValueChange(event) {
    this.featureValue = event.target.value;
  }

  handleEditionChange(event) {
    this.editionValue = event.detail.value;
  }

  handleReleaseChange(event) {
    this.releaseValue = event.detail.value;
  }

  handleHasSampleDataChange(event) {
    this.hasSampleData = event.target.checked;
  }

  handleOrgNameChange(event) {
    this.orgValue = event.target.value;
  }

  handleSourceOrgChange(event) {
    this.sourceOrgId = event.target.value;
  }

  handleDescriptionChange(event) {
    this.orgDescription = event.target.value;
  }

  handlePreferredLanguageChange(event) {
    this.preferredLanguage = event.detail.value;
  }

  handleCountryChange(event) {
    this.country = event.detail.value;
  }

  handleMetadataSettings(event) {
    // Child now returns a real settings object (not a JSON string).
    this.metaSettings = event.detail || {};
  }

  navigateToScratchOrgInfo() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: { objectApiName: "ScratchOrgInfo", actionName: "list" }
    });
  }

  navigateToActiveScratchOrgs() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: { objectApiName: "ActiveScratchOrg", actionName: "list" }
    });
  }

  navigateToScratchOrgRelease() {
    this.openHelp(HELP_URLS.scratchRelease);
  }

  navigateToScratchHelpDefFile() {
    this.openHelp(HELP_URLS.scratchDefFile);
  }

  navigateToOrgShape() {
    this.openHelp(HELP_URLS.orgShape);
  }

  navigateToSupportedScratchEditions() {
    this.openHelp(HELP_URLS.supportedEditions);
  }

  navigateToScratchDevWorkflow() {
    this.openHelp(HELP_URLS.devWorkflow);
  }

  openHelp(url) {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: { url }
    });
  }

  async handleScratchOrgBuildFile() {
    try {
      const allValid = [
        ...this.template.querySelectorAll("lightning-input"),
        ...this.template.querySelectorAll("lightning-combobox"),
        ...this.template.querySelectorAll("lightning-radio-group")
      ].reduce((validSoFar, inputCmp) => {
        inputCmp.reportValidity();
        return validSoFar && inputCmp.checkValidity();
      }, true);

      if (!allValid || !this.metaConfirmSelected) {
        this.displayError = true;
        this.errorText =
          "Please try again after completing all the required fields and confirming the metadata settings.";
        return;
      }

      const payload = {
        orgName: this.orgValue,
        ...(this.displayEdition
          ? { edition: this.editionValue }
          : { sourceOrg: this.sourceOrgId }),
        description: this.orgDescription,
        hasSampleData: this.hasSampleData,
        release: this.releaseValue,
        country: this.country,
        language: this.preferredLanguage,
        features: this.featuresList.map((feature) => feature.label),
        settings: this.metaSettings || {}
      };

      this.displayError = false;
      this.errorText = "";

      await ScratchBuildModal.open({
        size: "large",
        label: "Sample Scratch Org Definition File",
        content: JSON.stringify(payload, null, 2)
      });
    } catch (error) {
      this.displayError = true;
      console.error(error);
      this.errorText =
        "Please try again after completing all the required fields and confirming the metadata settings.";
    }
  }

  handleResetForm() {
    this.editionValue = "Developer";
    this.releaseValue = "current";
    this.createUsingValue = "edition";
    this.displayEdition = true;
    this.orgValue = "Scratch Org";
    this.orgDescription = "";
    this.hasSampleData = false;
    this.sourceOrgId = "";
    this.featuresList = DEFAULT_FEATURES.map((name) => buildFeaturePill(name));
    this.featureValue = "";
    this.preferredLanguage = "en_US";
    this.country = this.defaultCountry;
    this.metaSettings = {};
    this.metaConfirmSelected = false;
    this.displayError = false;
    this.errorText = "";

    const settingsCmp = this.template.querySelector(
      "c-scratch-settings-expression"
    );
    if (settingsCmp) {
      settingsCmp.reset();
    }

    this.dispatchEvent(new RefreshEvent());
  }

  handlePopoverClose() {
    this.displayError = false;
  }
}
