import { LightningElement, api, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";
import CREATEORGMESSAGECHANNEL from "@salesforce/messageChannel/CreateOrgMessageChannel__c";
import DOCKEDUTILITYBARMESSAGECHANNEL from "@salesforce/messageChannel/DockedUtilityBarMessageChannel__c";
import { publish, subscribe, unsubscribe, MessageContext } from "lightning/messageService";
import getProfileId from "@salesforce/apex/PackageVisualizerCtrl.getProfileId";
import getNamespacePermSetId from "@salesforce/apex/PackageVisualizerCtrl.getNamespacePermSetId";


export default class SetupAssistant extends NavigationMixin(LightningElement) {
  @api alert;
  @api packageListAvailable;
  @api packageTypes;

  @wire(MessageContext) messageContext;

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

  navigateToMigrationCommunity() {
    window.open("https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F94V000000PkSm", "_blank");
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

  navigateToGraphEngine(){
    window.open("https://forcedotcom.github.io/sfdx-scanner/en/v3.x/salesforce-graph-engine/introduction/", "_blank");
  }

  navigateToPMD(){
    window.open("https://forcedotcom.github.io/sfdx-scanner/en/v3.x/architecture/pmd-engine/", "_blank");
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

  navigateToCodeAnalyzerGitHubAction(){
    window.open('https://github.com/marketplace/actions/run-salesforce-code-analyzer');
  }

  navigateScratchOrgBuild(){
    this[NavigationMixin.Navigate]({
      type: "standard__component",
      attributes: {
        componentName: "pkgviz__scratchDefFileBuildCard",
      }
    });
  }
}