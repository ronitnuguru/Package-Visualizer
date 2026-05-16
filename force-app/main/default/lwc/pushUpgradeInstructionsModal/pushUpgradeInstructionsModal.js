import { api } from "lwc";
import LightningModal from "lightning/modal";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class PushUpgradeInstructionsModal extends LightningModal {
  @api packageId;
  @api subscriberOrgId;
  @api orgName;

  copied = false;

  get apexSnippet() {
    const pkg = this.packageId || "<packageID>";
    const org = this.subscriberOrgId || "<subscriberOrgID>";
    const snippetLines = [
      `String pucId1 = PushUpgradeCustomizationRepository.create('${pkg}', '${org}', true);`,
      `System.debug('pucId1 =' + pucId1);`
    ];

    return snippetLines.map((line) => line.replace(/^\s+/, "")).join("\n");
  }

  get subscriberLabel() {
    return this.orgName
      ? `${this.orgName} (${this.subscriberOrgId})`
      : this.subscriberOrgId;
  }

  handleClose() {
    this.close();
  }

  async handleCopy() {
    const snippet = this.apexSnippet;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      } else {
        const textarea = this.template.querySelector(
          "textarea.snippet-fallback"
        );
        if (textarea) {
          textarea.removeAttribute("readonly");
          textarea.select();
          document.execCommand("copy");
          textarea.setAttribute("readonly", "true");
        }
      }
      this.copied = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Copied",
          message: "Apex snippet copied to clipboard.",
          variant: "success"
        })
      );
    } catch (e) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Copy failed",
          message: "Select the snippet manually and copy it.",
          variant: "warning"
        })
      );
    }
  }

  handleOpenDeveloperConsole() {
    window.open("/_ui/common/apex/debug/ApexCSIPage", "_blank");
  }

  handleLearnMore() {
    window.open(
      "https://developer.salesforce.com/docs/atlas.en-us.pkg2_dev.meta/pkg2_dev/push_upgrade_customized.htm",
      "_blank"
    );
  }
}
