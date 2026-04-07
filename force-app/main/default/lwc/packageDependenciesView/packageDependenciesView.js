import { LightningElement, api } from 'lwc';
import getPackageDependencies from '@salesforce/apex/PackageVisualizerCtrl.getPackageDependencies';
import getPackageVersionBySubscriberId from '@salesforce/apex/PackageVisualizerCtrl.getPackageVersionBySubscriberId';

export default class PackageDependenciesView extends LightningElement {
    @api packageSubscriberVersionId;
    @api packageType;

    dependencies = [];
    isLoading = true;

    connectedCallback() {
        this.getDependencies();
    }

    getDependencies() {
        console.log('packageSubscriberVersionId', this.packageSubscriberVersionId);

        if (!this.packageSubscriberVersionId) {
            console.log('No packageSubscriberVersionId provided');
            return;
        }

        this.isLoading = true;

        getPackageDependencies({ subscriberPackageVersionId: this.packageSubscriberVersionId })
            .then(result => {
                console.log('Package Dependencies Response:', result);
                console.log('Dependencies Array:', result.dependencies);
                console.log('Number of Dependencies:', result.dependencies ? result.dependencies.length : 0);

                if (result.dependencies && result.dependencies.length > 0) {
                    this.dependencies = result.dependencies.map(dep => ({
                        ...dep,
                        versionDetails: null
                    }));

                    result.dependencies.forEach((dep, index) => {
                        console.log(`Dependency ${index + 1}:`, {
                            subscriberPackageVersionId: dep.subscriberPackageVersionId,
                            packageName: dep.packageName,
                            versionNumber: dep.versionNumber
                        });
                    });
                } else {
                    console.log('No dependencies found for this package version');
                    this.dependencies = [];
                }
            })
            .catch(error => {
                console.error('Error fetching package dependencies:', error);
                console.error('Error details:', JSON.stringify(error));
                this.dependencies = [];
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleSectionToggle(event) {
        const openSections = event.detail.openSections;
        console.log('Open sections:', openSections);

        openSections.forEach(subscriberPackageVersionId => {
            const dependency = this.dependencies.find(dep => dep.subscriberPackageVersionId === subscriberPackageVersionId);

            if (dependency && !dependency.versionDetails) {
                console.log('Fetching version details for:', subscriberPackageVersionId);
                this.loadVersionDetails(subscriberPackageVersionId);
            }
        });
    }

    loadVersionDetails(subscriberPackageVersionId) {
        getPackageVersionBySubscriberId({ subscriberPackageVersionId: subscriberPackageVersionId })
            .then(result => {
                console.log('Version details fetched for', subscriberPackageVersionId, ':', result);
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

                    console.log('Updated dependencies with version details:', this.dependencies);
                }
            })
            .catch(error => {
                console.error('Error fetching version details for', subscriberPackageVersionId, ':', error);
            });
    }

    get hasDependencies() {
        return this.dependencies && this.dependencies.length > 0;
    }

    get dependenciesCount() {
        return this.dependencies ? this.dependencies.length : 0;
    }
}