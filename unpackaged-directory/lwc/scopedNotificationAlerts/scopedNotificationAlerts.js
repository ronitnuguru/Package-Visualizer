import { api } from "lwc";
import LightningModal from "lightning/modal";
// TODO: point this at the ECA upgrade modal component once it exists
// import ecaUpgradeModal from "c/ecaUpgradeModal";

export default class ScopedNotificationAlerts extends LightningModal {
  async handleOpenModal() {
    // LightningModal stub — wire up the ECA upgrade modal here
    // await ecaUpgradeModal.open({
    //   label: "Upgrade to an External Client App",
    //   size: "medium"
    // });
  }
}