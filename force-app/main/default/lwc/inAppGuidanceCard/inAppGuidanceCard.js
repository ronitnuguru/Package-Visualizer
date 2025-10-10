import { LightningElement, wire, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import verifyUnlockedPackageInstalled from "@salesforce/apex/PackageVisualizerCtrl.verifyUnlockedPackageInstalled";

export default class InAppGuidanceCard extends NavigationMixin(LightningElement) {
    displaySpinner;

    title = 'Dreamforce 2025 Demo';
    iconName = 'utility:salesforce1';
    resourcesData = [
        {
            label: 'Package Visualizer + ISV Tooling',
            description: 'Extend agentic and AI capabilities to help ease your packaging and ISV development cycle.',
            icon: 'standard:agent_astro',
            listingLink: 'https://appexchange.salesforce.com/appxListingDetail?listingId=632af825-58e1-4e61-a2b6-8b008449ca03',
            installLink: '/packaging/installPackage.apexp?p0=04tRh000001NopxIAC',
            helpGuideLink: 'https://salesforce.quip.com/f3SWA340YbFH',
            helpGuideIcon: 'utility:quip'
        },
        {
            label: 'Plauti',
            description: 'Standardize, validate, and verify phone numbers, and email addresses upon entry through Agentforce. Empower your customers and lead the way with real-time updates during conversations, fostering a connection that inspires trust and confidence.',
            icon: 'standard:agent_astro',
            listingLink: 'https://appexchange.salesforce.com/appxListingDetail?listingId=ff8d3192-7b65-41c2-b7f3-4713a588f541',
            installLink: '/packaging/installPackage.apexp?p0=04tIV000000GOb3YAG',
            helpGuideLink: 'https://www.plauti.com/dreamforce-2025-the-biggest-salesforce-event-of-the-year',
            helpGuideIcon: 'utility:trailblazer_ext'
        },
        {
            label: 'GoMeddo',
            description: 'Native Salesforce scheduling and booking solution where Agentforce Agents you can recognize natural and real life conversational user requests, matching them with current availability, for the best customer experience and efficiency.',
            icon: 'standard:agent_astro',
            listingLink: 'https://appexchange.salesforce.com/appxListingDetail?listingId=fb196a9e-bc3a-4040-99ce-e2b12f4dbd2c',
            installLink: '/packagingSetupUI/ipLanding.app?apvId=04tQH000001Tp4zYAC',
            helpGuideLink: 'https://www.gomeddo.com/',
            helpGuideIcon: 'utility:trailblazer_ext'
        }
    ];

    handleHelpDoc(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `https://salesforce.quip.com/`
            },
            state: {
                target: "_blank"
            }
        });
    }

    handleSlackCommunity(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `https://partnerblazer.slack.com/`
            },
            state: {
                target: "_blank"
            }
        });
    }

    navigateToAgentExchangeListing(event) {
        // Get the resource data from the event target's data attribute
        const resourceIndex = event.target.dataset.index;
        const selectedResource = this.resourcesData[resourceIndex];
                
        // Navigate to the AgentExchange listing in a new tab
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: selectedResource.listingLink
            },
            state: {
                target: "_blank"
            }
        });
    }

    handleInstall(event) {
        // Get the resource data from the event target's data attribute
        const resourceIndex = event.target.dataset.index;
        const selectedResource = this.resourcesData[resourceIndex];
                
        // Navigate to the install link in a new tab
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: selectedResource.installLink
            },
            state: {
                target: "_blank"
            }
        });
    }

    navigateToHelpGuide(event) {
        // Get the resource data from the event target's data attribute
        const resourceIndex = event.target.dataset.index;
        const selectedResource = this.resourcesData[resourceIndex];
                
        // Navigate to the help guide in a new tab
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: selectedResource.helpGuideLink
            },
            state: {
                target: "_blank"
            }
        });
    }
}