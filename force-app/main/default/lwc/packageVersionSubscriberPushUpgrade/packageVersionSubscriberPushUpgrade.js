import { LightningElement, api } from 'lwc';

export default class PackageVersionSubscriberPushUpgrade extends LightningElement {
    @api header;
    @api subscribers;
    @api packageVersionNumber;
    @api subscriberPackageId;

    handleCancel(){
        this.dispatchEvent(new CustomEvent('cancel'));
    }
}