import { LightningElement } from 'lwc';
import genAiLimitsModal from 'c/genAiLimitsModal';

export default class OrgLimitCard extends LightningElement {

    limitsData;

    handleGenAiOrgLimitsModal(){
        this.openModal({
            headerLabel: "Generative AI Summary - Org Limits",
        });
    }

    async openModal(details){
        const result = await genAiLimitsModal.open({
          label: details.headerLabel,
          size: 'medium',
          content: JSON.stringify(this.limitsData)
        });
    }

    updateLimits(event){
        this.limitsData = event.detail;
    }
}