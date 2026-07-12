import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { SETTING_OPTIONS } from "c/scratchOrgConfig";

const SETTINGS_DOC_BASE =
  "https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_settings.htm";
const SETTING_DOC = (settingName) =>
  `https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_${settingName.toLowerCase()}.htm`;

const DEFAULT_SETTING_NAMES = ["lightningExperienceSettings", "mobileSettings"];

export default class ScratchSettingsExpression extends NavigationMixin(
  LightningElement
) {
  expressionClass = "";
  confirmSelected = false;
  metadataSettings = [];

  settingOptions = SETTING_OPTIONS;

  count = 0;

  connectedCallback() {
    this.metadataSettings = this.buildDefaultSettings();
  }

  /**
   * Build the seed settings list with fresh autoNumber keys. New keys force LWC to
   * remount each child `c-scratch-row-meta-expression` so its default fields re-seed.
   */
  buildDefaultSettings() {
    return DEFAULT_SETTING_NAMES.map((name) => ({
      autoNumber: this.count++,
      setting: name
    }));
  }

  /**
   * Public hook used by the parent card's Reset button to restore the settings
   * section back to its default seed.
   */
  @api
  reset() {
    this.metadataSettings = this.buildDefaultSettings();
    this.confirmSelected = false;
    this.expressionClass = "";
    this.dispatchEvent(new CustomEvent("confirm", { detail: false }));
  }

  /**
   * Public hook the parent card calls to seed setting rows from a template preset.
   * Accepts a `{ settingName: {...} }` object with one or more top-level keys.
   */
  @api
  applySettings(settings) {
    this.applyTemplateSettings(settings);
  }

  /**
   * Public hook the parent card calls to auto-confirm the settings on launch, so consumers
   * that embed a preset start in the "Edit Settings" state without a manual click. The confirm
   * is retried across a few microtasks until every setting row is mounted, because a template
   * row (added via applySettings) mounts a tick after this is invoked and getMetaRows() must
   * read the complete set.
   */
  @api
  confirm() {
    if (this.confirmSelected) return;
    this.tryAutoConfirm(0);
  }

  tryAutoConfirm(attempt) {
    if (this.confirmSelected) return;
    const mountedRows = this.template.querySelectorAll(
      "c-scratch-row-meta-expression"
    ).length;
    if (mountedRows > 0 && mountedRows >= this.metadataSettings.length) {
      this.confirmSettings();
      return;
    }
    // Rows not fully mounted yet — retry on the next microtask, bounded so we never spin forever.
    if (attempt < 10) {
      Promise.resolve().then(() => this.tryAutoConfirm(attempt + 1));
    }
  }

  /**
   * Apply one or more setting groups from a template preset. Reads only the top-level
   * keys; each row's field values are seeded from DEFAULT_FIELDS by the child rows.
   */
  applyTemplateSettings(message) {
    if (!message) return;
    const incomingKeys = Object.keys(message);
    const additions = incomingKeys
      .filter((key) => !this.metadataSettings.some((s) => s.setting === key))
      .map((key) => ({ autoNumber: this.count++, setting: key }));

    if (additions.length) {
      this.metadataSettings = [...this.metadataSettings, ...additions];
    }
    this.resetConfirmation();
  }

  handleMetadataSettingsChange(event) {
    const index = Number(event.target.dataset.index);
    this.metadataSettings = this.metadataSettings.map((s, i) => {
      return i === index ? { ...s, setting: event.detail.value } : s;
    });
    this.resetConfirmation();
  }

  instantiateMetadataSettingExpression() {
    this.metadataSettings = [
      ...this.metadataSettings,
      { autoNumber: this.count++, setting: "" }
    ];
    this.resetConfirmation();
  }

  onRemoveSetting(event) {
    const index = Number(event.target.dataset.index);
    this.metadataSettings = this.metadataSettings.filter((_, i) => i !== index);
    this.resetConfirmation();
  }

  navigateMetaHelpDoc(event) {
    const index = Number(event.target.dataset.index);
    const navSetting = this.metadataSettings[index]?.setting;
    const url = navSetting ? SETTING_DOC(navSetting) : SETTINGS_DOC_BASE;
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: { url }
    });
  }

  confirmSettings() {
    this.confirmSelected = !this.confirmSelected;
    this.expressionClass = this.confirmSelected ? "slds-expression__group" : "";

    if (this.confirmSelected) {
      const merged = Array.from(
        this.template.querySelectorAll("c-scratch-row-meta-expression")
      ).reduce((acc, row) => Object.assign(acc, row.getMetaRows()), {});

      this.dispatchEvent(
        new CustomEvent("return", {
          detail: merged
        })
      );
    }

    this.dispatchEvent(
      new CustomEvent("confirm", {
        detail: this.confirmSelected
      })
    );
  }

  /**
   * Drop confirmation state whenever the underlying selection changes so the parent
   * never reads stale settings JSON.
   */
  resetConfirmation() {
    if (!this.confirmSelected) return;
    this.confirmSelected = false;
    this.expressionClass = "";
    this.dispatchEvent(new CustomEvent("confirm", { detail: false }));
  }
}
