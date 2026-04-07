import { LightningElement, api } from 'lwc';
import getPackageDependencies from '@salesforce/apex/PackageVisualizerCtrl.getPackageDependencies';
import getPackageVersionBySubscriberId from '@salesforce/apex/PackageVisualizerCtrl.getPackageVersionBySubscriberId';
import { NavigationMixin } from 'lightning/navigation';

export default class PackageDependenciesView extends NavigationMixin(LightningElement) {
    @api packageSubscriberVersionId;
    @api packageType;

    dependencies = [];
    isLoading = true;

    connectedCallback() {
        this.getDependencies();
    }

    getDependencies() {
        if (!this.packageSubscriberVersionId) {
            return;
        }

        this.isLoading = true;

        getPackageDependencies({ subscriberPackageVersionId: this.packageSubscriberVersionId })
            .then(result => {
                if (result.dependencies && result.dependencies.length > 0) {
                    this.dependencies = result.dependencies.map(dep => ({
                        ...dep,
                        versionDetails: null
                    }));
                } else {
                    this.dependencies = [];
                }
            })
            .catch(() => {
                this.dependencies = [];
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleSectionToggle(event) {
        const openSections = event.detail.openSections;

        openSections.forEach(subscriberPackageVersionId => {
            const dependency = this.dependencies.find(dep => dep.subscriberPackageVersionId === subscriberPackageVersionId);

            if (dependency && !dependency.versionDetails) {
                this.loadVersionDetails(subscriberPackageVersionId);
            }
        });
    }

    loadVersionDetails(subscriberPackageVersionId) {
        getPackageVersionBySubscriberId({ subscriberPackageVersionId: subscriberPackageVersionId })
            .then(result => {
                if (result) {
                    this.dependencies = this.dependencies.map(dep => {
                        if (dep.subscriberPackageVersionId === subscriberPackageVersionId) {
                            return {
                                ...dep,
                                versionDetails: result
                            };
                        }
                        return dep;
                    });
                }
            })
            .catch(() => {});
    }

    get hasDependencies() {
        return this.dependencies && this.dependencies.length > 0;
    }

    get dependenciesCount() {
        return this.dependencies ? this.dependencies.length : 0;
    }

    handleLearnMore() {
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_dev_dev2gp_create_dependencies.htm"
            }
        });
    }
}