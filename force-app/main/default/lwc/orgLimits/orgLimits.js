import { LightningElement, wire } from 'lwc';
import getLimits from '@salesforce/apex/LimitsController.getLimits';

export default class OrgLimits extends LightningElement {

    limits;
    error;

    limitsList = [];
    limitsFilterList;


    displaySpinner = true;

    @wire(getLimits)
    wiredLimits({ error, data }) {
        if (data) {
            try {
                this.limits = JSON.parse(data);
                this.displaySpinner = false;
    
                Object.entries(this.limits).forEach((entry) => {
                    const [key, value] = entry;
                    this.limitsList.push({
                        label: `${key.replace(/([a-z])([A-Z])/g, '$1 $2').trim().replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')}`,
                        max: `${value.Max}`,
                        rem: `${value.Max - value.Remaining}`,
                        percentage: `${((value.Max - value.Remaining) / value.Max) * 100}`
                    })
                });
                this.limitsFilterList = this.limitsList;
                this.error = undefined;
            } catch (error) {
                console.error(error);
                this.error = error;
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
        const searchString = event.target.value;
        this.searchInputChange(searchString);
    }

    searchInputChange(searchString) {
        if (searchString.length >= 2) {
            {
                let regex = new RegExp(searchString, "i");
                let results = this.limitsList.filter(
                    row =>
                        regex.test(row.label)
                );
                this.limitsFilterList = results;
            }
        } else {
            this.limitsFilterList = this.limitsList;
        }
        this.searchQuery = searchString;
    }

}