import { LightningElement, api } from "lwc";
import hasPackageVisualizerCore from "@salesforce/customPermission/Package_Visualizer_Core";
import hasPackageVisualizerPushUpgrade from "@salesforce/customPermission/Package_Visualizer_Push_Upgrade";
import hasViewSetup from "@salesforce/userPermission/ViewSetup";

export default class SetupAssistant extends LightningElement {
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
}