import { LightningElement, wire, api } from "lwc";
import getLimits from "@salesforce/apex/LimitsController.getLimits";

export default class OrgLimits extends LightningElement {
  static SEARCH_MIN_LENGTH = 2;
  static SEARCH_MAX_LENGTH = 100;

  @api hideSearch;
  limits;
  error;
  searchQuery = "";

  limitsList = [];
  limitsFilterList;

  displaySpinner = true;

  @wire(getLimits)
  wiredLimits({ error, data }) {
    if (data) {
      try {
        this.limits = JSON.parse(data);
        this.dispatchEvent(
          new CustomEvent("limits", {
            detail: this.limits
          })
        );
        this.displaySpinner = false;
        this.limitsList = [];

        Object.entries(this.limits).forEach((entry) => {
          const [key, value] = entry;
          this.limitsList.push({
            label: `${key
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .trim()
              .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")}`,
            max: `${value.Max}`,
            rem: `${value.Max - value.Remaining}`,
            percentage: `${((value.Max - value.Remaining) / value.Max) * 100}`
          });
        });
        this.limitsFilterList = this.limitsList;
        this.error = undefined;
      } catch (parseError) {
        console.error(parseError);
        this.error = parseError;
        this.limits = undefined;
        this.displaySpinner = false;
      }
    } else if (error) {
      this.error = error;
      this.limits = undefined;
      this.displaySpinner = false;
      console.error(error);
    }
  }

  handleSearchInputChange(event) {
    const searchString = event.target.value || "";
    this.searchInputChange(searchString);
  }

  searchInputChange(searchString) {
    const normalizedSearch = String(searchString).slice(
      0,
      OrgLimits.SEARCH_MAX_LENGTH
    );
    const searchLower = normalizedSearch.toLowerCase();

    if (searchLower.length >= OrgLimits.SEARCH_MIN_LENGTH) {
      this.limitsFilterList = this.limitsList.filter((row) =>
        row.label.toLowerCase().includes(searchLower)
      );
    } else {
      this.limitsFilterList = this.limitsList;
    }
    this.searchQuery = normalizedSearch;
  }
}
