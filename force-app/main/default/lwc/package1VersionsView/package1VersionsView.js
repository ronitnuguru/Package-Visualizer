import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import Package1VersionData from "./package1VersionsFields";
import get1GPPackageVersionList from "@salesforce/apex/PackageVisualizerCtrl.get1GPPackageVersionList";

const actions = [
    {
        label: "Show Details",
        name: "show_details",
        iconName: "utility:display_text"
    }
];

const gridColumns = [
    {
        type: "text",
        fieldName: "versionNumber",
        label: "Version Number",
        sortable: true,
        iconName: "standard:number_input"
    },
    {
        type: "text",
        fieldName: "name",
        label: "Name",
        sortable: true,
        iconName: "custom:custom18"
    },
    {
        type: "text",
        fieldName: "id",
        label: "Version Id",
        sortable: true,
        iconName: "standard:record"
    },
    {
        type: "string",
        fieldName: "releaseState",
        label: "Release State",
        sortable: true,
        iconName: "standard:task2"
    },
    {
        type: "action",
        typeAttributes: { rowActions: actions, menuAlignment: "auto" }
    }
];

export default class PackageVersionsView extends LightningElement {
    @api id;
    @api namespacePrefix;
    @api packageType;

    selectedTab = "version-details";

    displayPackageVersionBreadCrumb = false;
    displayPackageSubscriberDetailBreadCrumb = false;
    displayVersionDetails = false;
    displaySubscribersList = false;
    displaySubscriberDetail = false;

    displaySpinner = true;
    displayDatatableSpinner = false;
    fieldsToDisplayModal = false;
    displayLMA;

    displayVersionDetailsTab;
    displayVersionSubscribersTab;
    displayPushUpgradesTab;
    displayLMATab;


    data = [];
    gridColumns = gridColumns;
    gridData;

    packageId;
    versionId;
    packageBuildNumber;
    packageReleaseState;
    packageName;
    packageVersionNumber;
    packageReleaseVersion;
    packageLastModifiedAt;
    packageIsReleased;
    

    installedStatus;
    instanceName;
    metadataPackageId;
    metadataPackageVersionId;
    orgKey;
    orgName;
    orgStatus;
    orgType;

    displayEmptyView;
    filterState = false;
    displayFilterMeta;
    displayFilterDockPanel = `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
    responsivePanelStyle = `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
    heightStyle = `table-style table-height slds-p-horizontal_medium slds-p-bottom_medium`;

    minVersionInput;
    maxVersionInput;

    tableSelectedOptions = [
        "versionNumber",
        "name",
        "id",
        "releaseState"
    ];
    tableRequiredOptions = ["versionNumber"];

    sortedBy = "versionNumber";
    sortedByLabel = "Version Number";
    sortDirection = "desc";
    relativeDateTime = Date.now();

    versionLimit = 50;
    versionOffset = 0;
    versionsLength;
    disableInfiniteLoad = true;

    get isPushUpgradeEnabled() {
        return hasPackageVisualizerPushUpgrade;
    }

    get displayManagedPackageView() {
        return this.packageType === "Managed" ? true : false;
    }

    get tableOptions() {
        return [
            { label: "Version Number", value: "versionNumber" },
            { label: "Name", value: "name" },
            { label: "Release State", value: "releaseState" },
            { label: "Version Id", value: "id" },
            { label: "Metadata Package Id", value: "metadataPackageId" },
            { label: "Major Version", value: "majorVersion" },
            { label: "Minor Version", value: "minorVersion" },
            { label: "Build Number", value: "buildNumber" },
            { label: "Last Modified Date", value: "systemModstamp" }
        ];
    }

    get tableSelectOptions() {
        return this.tableSelectedOptions;
    }

    connectedCallback() {
        this.packageId = this.id.split("-").shift();
        this.loadPackageVersions(this.packageId, false, false);
    }

    handleActive(event) {
        this.selectedTab = event.target.value;
        switch (event.target.value) {
            case "version-details":
                this.displayVersionDetailsTab = true;
                this.displayVersionSubscribersTab = false;
                this.displayPushUpgradesTab = false;
                this.displayLMATab = false;
                break;
            case "version-subscribers":
                this.displayVersionDetailsTab = false;
                this.displayVersionSubscribersTab = true;
                this.displayPushUpgradesTab = false;
                this.displayLMATab = false;
                break;
            case "push-upgrades":
                this.displayVersionDetailsTab = false;
                this.displayVersionSubscribersTab = false;
                this.displayPushUpgradesTab = true;
                this.displayLMATab = false;
                break;
            case "lma":
                this.displayVersionDetailsTab = false;
                this.displayVersionSubscribersTab = false;
                this.displayPushUpgradesTab = false;
                this.displayLMATab = true;
                break;
            default:
                this.displayVersionDetailsTab = true;
                this.displayVersionSubscribersTab = false;
                this.displayPushUpgradesTab = false;
                this.displayLMATab = false;
                break;
        }
    }

    loadPackageVersions(packageID, applyFilters, isViewMore) {
        if (isViewMore) {
            this.displayDatatableSpinner = true;
        } else {
            this.displaySpinner = true;
        }
        let wrapper = [
            {
                fieldName: "MetadataPackageId",
                value: packageID,
                dataType: "STRING"
            }
        ];
        let minMajorVersion;
        let maxMajorVersion;
        let minMinorVersion;
        let maxMinorVersion;

        if (applyFilters === true) {
            const maxMajor = this.template.querySelector(".maxMajorInput");
            const maxMinor = this.template.querySelector(".maxMinorInput");
            const minMajor = this.template.querySelector(".minMajorInput");
            const minMinor = this.template.querySelector(".minMinorInput");

            if (
                maxMajor.value &&
                maxMinor.value &&
                minMajor.value &&
                minMinor.value
            ) {
                minMajorVersion = minMajor.value;
                maxMajorVersion = maxMajor.value;
                minMinorVersion = minMinor.value;
                maxMinorVersion = maxMinor.value;

                this.displayFilterMeta = true;
            }
        }
        (async () => {
            await get1GPPackageVersionList({
                filterWrapper: wrapper,
                minMajorVersion: minMajorVersion,
                maxMajorVersion: maxMajorVersion,
                minMinorVersion: minMinorVersion,
                maxMinorVersion: maxMinorVersion,
                sortedBy: this.sortedBy,
                sortDirection: this.sortDirection,
                versionLimit: this.versionLimit,
                versionOffset: this.versionOffset
            })
                .then(result => {
                    this.displaySpinner = false;
                    this.displayDatatableSpinner = false;
                    if (isViewMore) {
                        if (result.length === 0) {
                            this.disableInfiniteLoad = false;
                        } else {
                            this.data = this.data.concat(result);
                        }
                    } else {
                        this.data = result;
                    }
                    this.relativeDateTime = Date.now();
                    this.versionsLength = this.data.length;
                    this.displayEmptyView = this.data.length === 0 ? true : false;
                })
                .catch(error => {
                    console.error(error);
                    this.displaySpinner = false;
                    this.displayDatatableSpinner = false;
                    this.data = undefined;
                    // Toast for Failure
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Something went wrong",
                            message: error,
                            variant: "error"
                        })
                    );
                });
        })();
    }

    loadMoreData() {
        if (this.disableInfiniteLoad) {
            this.versionOffset = this.versionOffset + this.versionLimit;
            this.loadPackageVersions(this.packageId, this.displayFilterMeta, true);
        }
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        switch (action.name) {
            case "show_details":
                this.handlePackageVersionClick();
                this.getPackageVersionDetails(row);
                this.selectedTab = "version-details";
                this.displayVersionDetailsTab = true;
                this.displayVersionSubscribersTab = false;
                this.displayPushUpgradesTab = false;
                break;
            case "view_subscribers":
                this.handlePackageVersionClick();
                this.getPackageVersionDetails(row);
                this.selectedTab = "version-subscribers";
                this.displayVersionDetailsTab = false;
                this.displayVersionSubscribersTab = true;
                this.displayPushUpgradesTab = false;
                break;
            default:
                this.selectedTab = "version-details";
                this.displayVersionDetailsTab = true;
                this.displayVersionSubscribersTab = false;
                this.displayPushUpgradesTab = false;
                break;
        }
    }

    getPackageVersionDetails(row) {
        this.versionId = row.id;
        this.packageId = row.metadataPackageId;
        this.packageReleaseState = row.releaseState;
        this.packageName = row.name;
        this.packageVersionNumber = row.versionNumber;
        this.packageLastModifiedAt = row.systemModstamp;
        this.packageIsReleased = row.releaseState === "Released" ? true : false;
    }

    handleAllVersionsClick() {
        this.displayPackageVersionBreadCrumb = false;
        this.displayVersionDetails = false;
        this.displaySubscribersList = false;
        this.displayPackageSubscriberDetailBreadCrumb = false;
        this.displayReviewAncestryBreadCrumb = false;
    }

    handleSubscribersView() {
        this.displayPackageVersionBreadCrumb = true;
        this.displayVersionDetails = false;
        this.displaySubscribersList = true;
        this.displayPackageSubscriberDetailBreadCrumb = false;
        this.displayReviewAncestryBreadCrumb = false;
    }

    handlePushUpgrades() {
        this.displayPackageVersionBreadCrumb = true;
        this.displayVersionDetails = false;
        this.displaySubscribersList = false;
        this.displayPackageSubscriberDetailBreadCrumb = false;
        this.displayReviewAncestryBreadCrumb = false;
    }

    handlePackageVersionClick() {
        this.displayPackageVersionBreadCrumb = true;
        this.displayVersionDetails = true;
        this.displaySubscribersList = false;
        this.displayPackageSubscriberDetailBreadCrumb = false;
        this.displayReviewAncestryBreadCrumb = false;
    }

    handleSubscriberDetailView(event) {
        this.displayPackageVersionBreadCrumb = true;
        this.displayVersionDetails = false;
        this.displaySubscribersList = false;
        this.displaySubscriberDetail = true;
        this.displayPackageSubscriberDetailBreadCrumb = true;
        this.displayReviewAncestryBreadCrumb = false;
        this.getPackageSubscriberDetails(event.detail);
    }

    getPackageSubscriberDetails(row) {
        this.installedStatus = row.installedStatus;
        this.instanceName = row.instanceName;
        this.metadataPackageId = row.metadataPackageId;
        this.metadataPackageVersionId = row.metadataPackageVersionId;
        this.orgKey = row.orgKey;
        this.orgName = row.orgName;
        this.orgStatus = row.orgStatus;
        this.orgType = row.orgType;
        this.versionSubscribersDetail = true;
    }

    handleFilterPanel() {
        this.filterState = !this.filterState;
        this.handleFilterState(this.filterState);
        this.responsivePanelStyle = this.filterState
            ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
            : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
    }

    handleFilterState(state) {
        this.displayFilterDockPanel = state
            ? `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-is-open`
            : `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-panel_drawer slds-border_top slds-border_right slds-border_bottom slds-hidden`;
    }

    handleFilterSubmit() {
        const maxMajor = this.template.querySelector(".maxMajorInput");
        const maxMinor = this.template.querySelector(".maxMinorInput");
        const minMajor = this.template.querySelector(".minMajorInput");
        const minMinor = this.template.querySelector(".minMinorInput");

        if (
            maxMajor.reportValidity() &&
            maxMinor.reportValidity() &&
            minMajor.reportValidity() &&
            minMinor.reportValidity()
        ) {
            if (
                maxMajor.value &&
                maxMinor.value &&
                minMajor.value &&
                minMinor.value
            ) {
                this.maxMajorNumber = maxMajor.value;
                this.maxMinorNumber = maxMinor.value;
                this.minMajorNumber = minMajor.value;
                this.minMinorNumber = minMinor.value;
            }
            this.filterState = false;
            this.handleFilterState(this.filterState);
            this.responsivePanelStyle = this.filterState
                ? `border-style: ridge; direction:ltr; width:calc(100% - 320px);border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`
                : `border-style: ridge; direction:ltr;width:100%;border-color:#DDDBDA;border-width:thin;box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);`;
            this.versionOffset = 0;
            this.disableInfiniteLoad = true;
            this.loadPackageVersions(this.packageId, true, false);
        }
    }

    handleFilterReset() {
        this.checkBoxFilterValues = [];
        this.displayFilterMeta = false;
        this.minMinorNumber = undefined;
        this.minMajorNumber = undefined;
        this.maxMinorNumber = undefined;
        this.maxMajorNumber = undefined;
        this.versionOffset = 0;
        this.disableInfiniteLoad = true;
        this.loadPackageVersions(this.packageId, false, false);
        this.filterState = true;
        this.handleFilterState(this.filterState);
    }

    handleFilterEdit() {
        this.versionOffset = 0;
        this.loadPackageVersions(this.packageId, false, false);
        this.filterState = true;
        this.handleFilterState(this.filterState);
    }

    handleFieldsToDisplay() {
        this.fieldsToDisplayModal = true;
    }

    handleFieldsToDisplayModalCancel() {
        this.fieldsToDisplayModal = false;
    }

    handleFieldsToDisplayModalSave(event) {
        if (event.detail !== null) {
            this.createColumns(event.detail);
            this.tableSelectedOptions = event.detail;
        }
        this.fieldsToDisplayModal = false;
    }

    createColumns(newColumns) {
        this.gridColumns = newColumns.reduce((accumulator, fieldValue) => {
            const columnData = Package1VersionData.fields[fieldValue];
            accumulator.push({ ...columnData });
            return accumulator;
        }, []);
        this.gridColumns.push({
            type: "action",
            typeAttributes: { rowActions: actions, menuAlignment: "auto" }
        });
    }

    minVersionInputChange(event) {
        this.minVersionInput = event.target.value;
    }

    maxVersionInputChange(event) {
        this.maxVersionInput = event.target.value;
    }

    handleSort(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
        this.sortedByLabel = Package1VersionData.fields[this.sortedBy].label;
        this.versionOffset = 0;
        this.loadPackageVersions(this.packageId, true, false);
    }

    handleEdit() {
        //this.dispatchEvent(new CustomEvent("edit"));
        this.sortedBy = 'systemModstamp';
        this.sortedByLabel = 'Last Modified Date';
        this.sortDirection = 'desc';
        this.checkBoxFilterValues = [];
        this.displayFilterMeta = false;
        this.displayEmptyView = false;
        this.displaySpinner = true;
        this.loadPackageVersions(this.packageId, false, false);
    }
}