import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";

export default class SetupAssistant extends NavigationMixin(LightningElement) {
  @api alert;
  @api packageListAvailable;
  @api packageTypes;

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
    window.open("https://developer.salesforce.com/developer-centers/developer-experience", "_blank")
  }

  navigateToVSCodeTrailhead(){
    window.open("https://trailhead.salesforce.com/content/learn/projects/quickstart-vscode-salesforce", "_blank");
  }

  navigateToCLITrailhead(){
    window.open("https://trailhead.salesforce.com/content/learn/trails/set-up-your-workspace-and-install-developer-tools", "_blank");
  }
}