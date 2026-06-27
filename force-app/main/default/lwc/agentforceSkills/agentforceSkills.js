import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { SKILLS } from "./skillsData.js";

export default class AgentforceSkills extends NavigationMixin(
  LightningElement
) {
  skills = SKILLS;

  handleAgentSkills() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: "https://agentskills.io/home"
      },
      state: {
        target: "_blank"
      }
    });
  }

  handleAgentforceLabs() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: "https://labs.agentforce.com/docs/skills"
      },
      state: {
        target: "_blank"
      }
    });
  }

  navigateToSkillGithub(event) {
    const skillIndex = event.target.dataset.index;
    const selectedSkill = this.skills[skillIndex];
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: selectedSkill.githubLink
      },
      state: {
        target: "_blank"
      }
    });
  }

  handleCopySkillCli(event) {
    const skillIndex = event.currentTarget.dataset.index;
    const skill = this.skills[skillIndex];
    if (!skill || !skill.cli) {
      return;
    }
    const text = skill.cli;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
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
          console.error("Failed to copy CLI command:", err);
          this.fallbackCopyToClipboard(text);
        });
    } else {
      this.fallbackCopyToClipboard(text);
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
}
