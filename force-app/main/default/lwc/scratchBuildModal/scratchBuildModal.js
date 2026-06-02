import { api } from "lwc";
import invokeChatModelsGenAi from "@salesforce/apex/PackageVisualizerCtrl.invokeChatModelsGenAi";
import LightningModal from "lightning/modal";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const SYSTEM_PROMPT = `You are an expert Salesforce ISV Agent. You enhance a user-generated Scratch Org definition file (project-scratch-def.json) for ISV development.

The user message contains a JSON object — the user's original scratch org definition. It may be preceded by free-text describing an enhancement they want. If free-text is present, treat it as the user's request. If the message is only JSON, apply conservative best-practice defaults for ISV development.

Rules:
1. Preserve the original. Keep every existing key and value from the user's JSON exactly as given. Never remove, rename, or change an existing entry unless the user explicitly asks you to. The result must closely resemble the original.
2. Enhance minimally and only with real, valid configuration. Add scratch org "features" and "settings" only when you are confident they are genuine, documented Salesforce scratch-org definition values. Prioritize what the user asked for. When in doubt, leave it out.
3. Never invent. Do not output any feature, setting, edition, or metadata key you are not confident is a real, valid scratch org definition value. Do not guess values, fabricate API names, or add speculative configuration to "make the org more robust." Fewer correct additions are better than more uncertain ones.
4. Keep it a valid scratch org definition. Use only top-level keys that belong in project-scratch-def.json (e.g. orgName, edition, features, settings, hasSampleData, release, language, country). Do not add a "description" key. Features must be a string array; settings must be a nested object keyed by metadata settings type.

Relevant examples you may draw from when they fit the user's request (only add what is genuinely useful — do not include all of these by default):
- features: "EnableSetPasswordInApi", "AuthorApex", "DebugApex", "StateAndCountryPicklist", "MultiCurrency", "PersonAccounts", "LightningServiceConsole", "ServiceCloud", "Communities", "Sites"
- settings: "lightningExperienceSettings" (e.g. enableS1DesktopEnabled), "mobileSettings", "securitySettings" (e.g. passwordPolicies), "apexSettings" (e.g. enableCompileOnDeploy), "experienceBundleSettings", "communitiesSettings", "omniChannelSettings", "caseSettings"

Treat the list above as a menu, not a checklist. If you are not confident a feature or setting is a real, valid scratch org definition value, omit it.

Return ONLY the enhanced scratch org definition as a single valid JSON object. No prose, no comments, no markdown.`;

export default class ScratchBuildModal extends LightningModal {
  @api label;
  @api content;

  aiDiff;
  displaySpinner;
  aiResponse;
  error;
  displayAiSuggest;
  aiSuggestion;

  currentPkgVersionId = "04tRh000001bOxFIAU";
  modelsValue = "sfdc_ai__DefaultGPT54";

  get isAiSuggestionEmpty() {
    return !this.aiSuggestion;
  }

  get aiResponseDisplay() {
    if (!this.aiResponse) {
      return this.aiResponse;
    }
    const cleaned = this.aiResponse.replace(/```json\s*|\s*```/g, "").trim();
    try {
      return JSON.stringify(JSON.parse(cleaned), null, 2);
    } catch (e) {
      return cleaned;
    }
  }

  buildUserPrompt() {
    return this.aiSuggestion
      ? `${this.aiSuggestion} ${this.content}`
      : this.content;
  }

  handleUserDownloadJson() {
    const blob = new Blob([this.content], { type: "application/json" });
    const link = document.createElement("a");
    link.download = "project-scratch-def.json";
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  handleAiSuggestImprovements() {
    this.displayAiSuggest = true;
  }

  handlePopoverClose() {
    this.displayAiSuggest = false;
  }

  handleAiSuggestionChange(event) {
    this.aiSuggestion = event.target.value;
  }

  handleAiDownloadJson() {
    if (this.aiResponse) {
      const blob = new Blob([this.aiResponseDisplay], {
        type: "application/json"
      });
      const link = document.createElement("a");
      link.download = "ai-generated-scratch-def.json";
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  handleAiRewrite() {
    this.aiDiff = true;
    this.displaySpinner = true;
    this.generateAiResponse();
    this.handlePopoverClose();
  }

  async generateAiResponse() {
    try {
      this.aiResponse = await invokeChatModelsGenAi({
        className: "AgentGenAiController",
        methodName: "createChatGeneration",
        modelName: this.modelsValue,
        userPrompt: this.buildUserPrompt(),
        systemPrompt: SYSTEM_PROMPT
      });
      this.error = undefined;
      this.displaySpinner = false;
    } catch (error) {
      this.aiResponse = undefined;
      this.error = error;
      console.error(this.error);
      this.displaySpinner = false;
    }
  }

  handleAiClear() {
    this.aiDiff = false;
  }

  handleUserCopyPaste() {
    if (this.content) {
      navigator.clipboard
        .writeText(this.content)
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
          console.error("Failed to copy user content to clipboard:", err);
          // Fallback for older browsers
          this.fallbackCopyToClipboard(this.content);
        });
    }
  }

  handleAiCopyPaste() {
    if (this.aiResponse) {
      navigator.clipboard
        .writeText(this.aiResponseDisplay)
        .then(() => {
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Text copied to clipboard",
              variant: "success"
            })
          );
          // Optional: Show success message
        })
        .catch((err) => {
          console.error("Failed to copy AI response to clipboard:", err);
          // Fallback for older browsers
          this.fallbackCopyToClipboard(this.aiResponseDisplay);
        });
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

  handleIllustrationClear() {
    this.displayExtensionIllustration = false;
    this.prompt = "";
  }

  handleExtensionInstall() {
    window.open(
      `/packaging/installPackage.apexp?p0=${this.currentPkgVersionId}`,
      "_blank"
    );
  }

  handleCloseModal() {
    this.close();
  }
}
