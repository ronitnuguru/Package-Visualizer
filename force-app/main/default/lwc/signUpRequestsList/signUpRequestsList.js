import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
    subscribe,
    unsubscribe,
    MessageContext
} from "lightning/messageService";
import getSignUpRequests from "@salesforce/apexContinuation/PackageVisualizerCtrl.getSignUpRequests";
import SignUpRequestsFields from "./signUpRequestsFields";
import SIGNUPLISTMESSAGECHANNEL from "@salesforce/messageChannel/SignupListMessageChannel__c";

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
        fieldName: "company",
        label: "Company",
        sortable: false,
        iconName: "standard:your_account"
    },
    {
        type: "text",
        fieldName: "edition",
        label: "Edition",
        sortable: false,
        iconName: "standard:category"
    },
    {
        type: "text",
        fieldName: "status",
        label: "Status",
        sortable: false,
        iconName: "standard:task2"
    },
    {
        type: "date",
        fieldName: "createdDate",
        label: "Created Date",
        iconName: "standard:date_time",
        sortable: false,
        typeAttributes: {
          year: "numeric",
          month: "long",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }
    },
    {
        type: "action",
        typeAttributes: { rowActions: actions, menuAlignment: "auto" }
    }
];

export default class SignUpRequestsList extends LightningElement {

    @wire(MessageContext) messageContext;

    displayDatatableSpinner;
    displaySpinner = true;
    displayEmptyView;
    displaySignUpRequestModal;

    sortedBy = "createdDate";
    sortedByLabel = "Created Date";
    sortDirection = "desc";
    relativeDateTime = Date.now();

    signUpLimit = 50;
    signUpOffset = 0;
    signUpLength;
    disableInfiniteLoad = true;

    data = [];
    gridColumns = gridColumns;

    rowData;

    subscription = null;

    connectedCallback() {
        this.loadSignUpList(false, false);

        this.subscription = subscribe(
            this.messageContext,
            SIGNUPLISTMESSAGECHANNEL,
            message => {
                if (message) {
                    if (message.refresh === true) {
                        this.signUpLimit = 50;
                        this.signUpOffset = 0;
                        this.data = [];
                        this.disableInfiniteLoad = true;
                        this.loadSignUpList(false, false);
                    }
                }
            }
        );
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    loadSignUpList(applyFilters, isViewMore) {

        if (isViewMore) {
            this.displayDatatableSpinner = true;
        } else {
            this.displaySpinner = true;
        }

        let wrapper = [];

        (async () => {
            await getSignUpRequests({
                filterWrapper: wrapper,
                sortedBy: this.sortedBy,
                sortDirection: this.sortDirection,
                signUpLimit: this.signUpLimit,
                signUpOffset: this.signUpOffset,
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
                    this.signUpLength = this.data.length;
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

    handleSort(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
        this.sortedByLabel = SignUpRequestsFields.fields[this.sortedBy].label;
        this.versionOffset = 0;
        this.loadSignUpList(false, false);
    }

    loadMoreData() {
        if (this.disableInfiniteLoad) {
            this.signUpOffset = this.signUpOffset + this.signUpLimit;
            this.loadSignUpList(false, true);
        }
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        switch (action.name) {
            case "show_details":
                this.rowData = row;
                this.displaySignUpRequestModal = true;
                break;
            default:
                break;
        }
    }

    handleModalDisplay() {
        this.displaySignUpRequestModal = false;
    }
}