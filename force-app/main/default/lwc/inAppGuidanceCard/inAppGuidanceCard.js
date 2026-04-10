import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { AGENT_SCRIPTS } from "./agentScriptsData.js";

export default class InAppGuidanceCard extends NavigationMixin(LightningElement) {
    displaySpinner;

    title = 'AgentExchange Showcase';
    iconName = 'utility:salesforce1';
    agentScripts = AGENT_SCRIPTS;
    resourcesData = [
        {
            label: 'Agentforce Extension',
            description: 'Extend agentic and AI capabilities to help ease your packaging and ISV development cycle.',
            icon: 'standard:agent_astro',
            listingLink: 'https://appexchange.salesforce.com/appxListingDetail?listingId=632af825-58e1-4e61-a2b6-8b008449ca03',
            installLink: '/packaging/installPackage.apexp?p0=04tRh000001NopxIAC',
            helpGuideLink: 'https://salesforce.quip.com/f3SWA340YbFH',
            helpGuideIcon: 'utility:quip'
        }
    ];

    handleHelpDoc(){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
              url: `https://wp-appexchange.salesforce.com/wp-content/uploads/2025/10/DF25-AgentExchange-Build-Station-Instructions.pdf`
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

    handleCopyAgentScript(event) {
        const scriptId = event.currentTarget.dataset.scriptId;
        const script = this.agentScripts.find((s) => s.id === scriptId);
        if (!script || !script.body) {
            return;
        }
        const text = script.body;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Success",
                            message: "Text copied to clipboard",
                            variant: "success"
                        })
                    );
                })
                .catch((err) => {
                    console.error("Failed to copy AgentScript:", err);
                    this.fallbackCopyToClipboard(text);
                });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand("copy");
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Success",
                    message: "Text copied to clipboard",
                    variant: "success"
                })
            );
        } catch (err) {
            console.error("Fallback copy to clipboard failed:", err);
        }
        document.body.removeChild(textArea);
    }
}