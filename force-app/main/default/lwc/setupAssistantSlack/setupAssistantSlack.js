import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

export default class SetupAssistantSlack extends NavigationMixin(LightningElement) {

    @api orgId;

    navigateToSlackDeveloperProgram(){
        window.open(`https://api.slack.com/developer-program`,'_blank');
    }

    navigateToPartnerSandboxes(){
        window.open(`https://docs.slack.dev/tools/partner-sandboxes/`,'_blank');
    }
}