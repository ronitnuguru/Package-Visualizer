import { LightningElement, api, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import agentforcePromptModalGenerator from 'c/agentforcePromptModalGenerator';
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";
import CREATEORGMESSAGECHANNEL from "@salesforce/messageChannel/CreateOrgMessageChannel__c";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import { publish, subscribe, unsubscribe, MessageContext } from "lightning/messageService";
import getProfileId from "@salesforce/apex/PackageVisualizerCtrl.getProfileId";
import getNamespacePermSetId from "@salesforce/apex/PackageVisualizerCtrl.getNamespacePermSetId";
import getOrgDetails from '@salesforce/apex/PackageVisualizerCtrl.getOrgDetails';
import isPboOrg from '@salesforce/apex/PackageVisualizerCtrl.isPboOrg';

export default class SetupAssistant extends NavigationMixin(LightningElement) {
  @api alert;
  @api packageListAvailable;
  @api packageTypes;

  isPBO;

  @wire(MessageContext) messageContext;

  org;
  numOfDays;
  orgId;

  get isPushUpgradeEnabled() {
    return hasPackageVisualizerPushUpgrade;
  }

  get isPackageVisualizerEnabled() {
    return hasPackageVisualizerCore;
  }

  get isSetupEnabled() {
    return !hasViewSetup;
  }

  get is2GP() {
    return this.packageTypes === '2GP and Unlocked Packages' ? true : false;
  }

  @wire(getOrgDetails)
    wiredOrg({ error, data }) {
        if (data) {
            this.org = data;
            if (this.org.TrialExpirationDate) {
                this.numOfDays = new Date(this.org.TrialExpirationDate);
            }
            if(this.org.Id){
              this.orgId = this.org.Id;
            }
            this.error = undefined;
        } else if (error) {
            this.org = undefined;
            console.error(error);
        }
    }

  @wire(isPboOrg)
    wiredPboOrg({ error, data }) {
      if (data) {
        this.isPBO = data;
      } else if (error) {
        this.isPBO = false;
        console.error(error);
      }
    }

  handleCreateOrgs(){
    publish(this.messageContext, DOCKEDUTILITYBARMESSAGECHANNEL, {
      dockedBarControls: "CreateOrgs",
      createOrgsOpen: true
    });

    publish(this.messageContext, CREATEORGMESSAGECHANNEL, {
      orgType: {
        purposeValue: 'development',
        createUsingValue: 'standard',
        editionValue: 'Partner Developer'
      }
    });
  }

  handleBackToPackageVisualizer(){
    this.dispatchEvent(new CustomEvent("back"));
  }

  navigateToDevHub() {
    window.open("/lightning/setup/DevHub/home", "_blank");
  }

  navigateToCLI() {
    window.open(
      "https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm#sfdx_setup_install_cli",
      "_blank"
    );
  }

  navigateToNamespace() {
    window.open(
      "/lightning/o/NamespaceRegistry/list?filterName=Recent",
      "_blank"
    );
  }
  
  navigateToEnvHub() {
    window.open(
      "/lightning/o/EnvironmentHubMember/list?filterName=Recent",
      "_blank"
    );
  }

  navigateToPkgVizMainPermSet(){
    (async () => {
      await getNamespacePermSetId({
          label: 'Package_VisualizerPS',
          namespace: 'pkgviz'
      })
      .then(result => {
        window.open(`/lightning/setup/PermSets/${result}/PermissionSetAssignment/home`, "_blank");
      })
      .catch(error => {
        console.error(error);
        this.navigateToPermissionSets();
      });
    })();
  }

  navigateToPkgVizPushUpgradePermSet(){
    (async () => {
      await getNamespacePermSetId({
          label: 'Package_Visualizer_Push_Upgrade',
          namespace: 'pkgviz'
      })
      .then(result => {
        window.open(`/lightning/setup/PermSets/${result}/PermissionSetAssignment/home`, "_blank");
      })
      .catch(error => {
        console.error(error);
        this.navigateToPermissionSets();
      });
    })();
  }

  navigateLimitedAccessUserProfiile(){
    (async () => {
      await getProfileId({
          label: 'Limited Access User'
      })
      .then(result => {
        window.open(`/lightning/setup/EnhancedProfiles/page?address=%2F${result}`, "_blank");
      })
      .catch(error => {
        console.error(error);
        window.open("/lightning/setup/EnhancedProfiles/home", "_blank");
      });
    })();
  }

  navigateProvUsers1(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_pkg_add_free_license_user.htm", "_blank");
  }

  navigateProvUsers2(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_setup_permission_set.htm", "_blank");
  }

  navigateProvUsers3(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/sfdx_pkg_user_permission.htm", "_blank");
  }

  navigateUnderstandingNamespaces(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_unlocked_pkg_plan_namespaces.htm", "_blank");
  }

  navigateToGuide() {
    window.open("https://salesforce.quip.com/f3SWA340YbFH", "_blank");
  }

  navigateToPermissionSets() {
    window.open("/lightning/setup/PermSets/home", "_blank");
  }

  navigateToRemoteSiteSettings(){
    window.open("/lightning/setup/SecurityRemoteProxy/home", "_blank");
  }

  navigateToCSPTrustedSites(){
    window.open("/lightning/setup/SecurityCspTrustedSite/home", "_blank");
  }

  navigateTo2GPMigrationDocs() {
    window.open("https://developer.salesforce.com/docs/atlas.en-us.pkg1_dev.meta/pkg1_dev/move_to_second_gen_pkg.htm", "_blank");
  }

  navigateToChecklistBuilder(){
    window.open("https://checklistbuilder.herokuapp.com/", "_blank");
  }

  navigateToPackageCreate(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_package_commands_unified.htm#cli_reference_package_create_unified", "_blank");
  }

  navigateToPackageVersionCreate(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_package_commands_unified.htm#cli_reference_package_version_create_unified", "_blank");
  }

  navigateToPackageVersionPromote(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_package_commands_unified.htm#cli_reference_package_version_promote_unified", "_blank");
  }

  navigateToCodeAnalyzer(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/security_review_code_analyzer_scan.htm", "_blank");
  }

  navigateTosfCommands(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_unified.htm", "_blank")
  }

  navigateToDXDevCenter(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm", "_blank")
  }

  navigateToVSCodeTrailhead(){
    window.open("https://trailhead.salesforce.com/content/learn/projects/quickstart-vscode-salesforce", "_blank");
  }

  navigateToCLITrailhead(){
    window.open("https://trailhead.salesforce.com/content/learn/trails/set-up-your-workspace-and-install-developer-tools", "_blank");
  }

  navigateToDXCreateApplication(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro_create_new_app.htm", "_blank");
  }

  navigateToDXProjectStructure(){
    window.open("https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm", "_blank");
  }

  navigateToCodeAnalyzerGuide(){
    window.open('https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/guide', "_blank");
  }

  navigateToManageUsersPartnerCommunity(){
    window.open('https://trailhead.salesforce.com/content/learn/modules/sf_partner_community/sf_partner_community_manage', "_blank");
  }

  navigateToManageAppxListingTrail(){
    window.open('https://trailhead.salesforce.com/content/learn/modules/appexchange-partners-publishing', "_blank");
  }

  navigateToTop20VulnDevPost(){
    window.open('https://developer.salesforce.com/blogs/2023/08/the-top-20-vulnerabilities-found-in-the-appexchange-security-review', "_blank");
  }

  navigateToIsvToolingTrailhead(){
    window.open('https://trailhead.salesforce.com/content/learn/modules/isvforce_basics/isvforce_basics_tools_resources','_blank');
  }

  navigateToLogCasePartnerCommunity(){
    window.open(`https://help.salesforce.com/s/articleView?id=000387818&type=1`,'_blank');
  }

  navigateToDevloperCenters(){
    window.open(`https://developer.salesforce.com/developer-centers`,'_blank');
  }

  navigateToAgentforcePackageableMetadata(){
    window.open(`https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/dev2gp_packageable_agentforce_md.htm`,'_blank');
  }

  navigateToPboTrailhead(){
    window.open(`https://trailhead.salesforce.com/content/learn/modules/isvforce_basics/isvforce_basics_tools_resources`,'_blank');
  }

  navigateScratchOrgBuild(){
    this[NavigationMixin.Navigate]({
      type: "standard__component",
      attributes: {
        componentName: "pkgviz__scratchDefFileBuildCard",
      }
    });
  }

  openAskAgentforce(event){
    switch (event.target.value) {
      case "enableDevHub":
        this.openModal({
          headerLabel: "Ask Agentforce",
          userPrompt: `How do I enable Dev Hub Features in Salesforce's Setup?`,
          systemPrompt: `Provide neatly numbered documentation with numbered steps and hyperlinks. Do not share additional information. Keep it concise and simple. The end output needs to be displayed in easily readable rich text format where text is formatted by HTML tags. Don't include the root html tag. Mostly focus on anchor tags and lists. For example, the hyperlinks need to be clickable and open in a new tab`
        })
        break;
      case "createRegisterNamespace":
        this.openModal({
          headerLabel: "Ask Agentforce",
          userPrompt: `How do I create and register namespace for Second-Generation Packages (2GP)?`,
          systemPrompt: `Provide neatly numbered documentation with numbered steps and hyperlinks. Do not share additional information. Keep it concise and simple. The end output needs to be displayed in easily readable rich text format where text is formatted by HTML tags. Don't include the root html tag. Mostly focus on anchor tags and lists. For example, the hyperlinks need to be clickable and open in a new tab. Keep the scope to 2GP packages only. Only setup details in a Salesforce org. Do not share details on CLI`
        })
        break;
      case "provAccessDevs":
        this.openModal({
          headerLabel: "Ask Agentforce",
          userPrompt: `How do I provsion access to developers in Salesforce?`,
          systemPrompt: `Provide neatly numbered documentation with numbered steps and hyperlinks. Do not share additional information. Keep it concise and simple. The end output needs to be displayed in easily readable rich text format where text is formatted by HTML tags. Don't include the root html tag. Mostly focus on anchor tags and lists. For example, the hyperlinks need to be clickable and open in a new tab. Keep the scope to 2GP packages only. Only setup details in a Salesforce org. Do not share details on CLI`
        })
        break;
        case "dxSetup":
          this.openModal({
            headerLabel: "Ask Agentforce",
            userPrompt: `How do I enable Dev Hub Features in Salesforce's Setup?`,
            systemPrompt: `Provide neatly numbered documentation with numbered steps and hyperlinks. Do not share additional information. Keep it concise and simple. The end output needs to be displayed in easily readable rich text format where text is formatted by HTML tags. Don't include the root html tag. Mostly focus on anchor tags and lists. For example, the hyperlinks need to be clickable and open in a new tab`
          })
        break;
      default:
        break;
    }
  }

  async openModal(details){
    const result = await agentforcePromptModalGenerator.open({
      label: details.headerLabel,
      size: 'medium',
      content: {
          userPrompt: details.userPrompt,
          systemPrompt: details.systemPrompt
      }
    });   
  }

  handleAnchorClick(event) {
   event.preventDefault();
        
   const targetId = event.currentTarget.dataset.target;
   const targetElement = this.template.querySelector(`[data-id="${targetId}"]`);
   
   if (targetElement) {
       targetElement.scrollIntoView({
           behavior: 'smooth',
           block: 'center' 
       });
    }
  }
}