import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import invokeMcpTool from "@salesforce/apex/PackageVisualizerCtrl.invokeMcpTool";

const TOOL_STRUCTURE = "read_wiki_structure";
const TOOL_CONTENTS = "read_wiki_contents";
const TOOL_QUESTION = "ask_question";

const PLAN_PROMPT =
  "Act as a senior engineer. Give me a prioritized plan to onboard and start " +
  "contributing to this repository: the key modules to read first, the overall " +
  "architecture, and a few good first tasks.";

const REPOSITORIES = [
  {
    label: "Package Visualizer (Base Package)",
    repoLink: "https://github.com/ronitnuguru/Package-Visualizer",
    username: "ronitnuguru",
    repoHandle: "Package-Visualizer",
    visibility: "Public"
  },
  {
    label: "Package Visualizer (Agentforce Extension)",
    repoLink:
      "https://github.com/ronitnuguru/Package-Visualizer---ISV-Tooling-Agentforce-Extension",
    username: "ronitnuguru",
    repoHandle: "Package-Visualizer---ISV-Tooling-Agentforce-Extension",
    visibility: "Public"
  }
];

export default class RepositoriesList extends NavigationMixin(
  LightningElement
) {
  repositories = REPOSITORIES;

  selectedRepo = `${REPOSITORIES[0].username}/${REPOSITORIES[0].repoHandle}`;
  question;
  response;
  activeAction;
  isLoading = false;
  hasError = false;
  errorMessage;

  get repos() {
    return this.repositories.map((repo) => ({
      ...repo,
      repoPath: `${repo.username}/${repo.repoHandle}`
    }));
  }

  get repoOptions() {
    return this.repositories.map((repo) => ({
      label: repo.label,
      value: `${repo.username}/${repo.repoHandle}`
    }));
  }

  get sendDisabled() {
    return !this.question || this.isLoading;
  }

  navigateToRepo(event) {
    const repoIndex = event.currentTarget.dataset.index;
    const selectedRepo = this.repositories[repoIndex];
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: selectedRepo.repoLink
      },
      state: {
        target: "_blank"
      }
    });
  }

  handleRepoChange(event) {
    this.selectedRepo = event.detail.value;
  }

  handleQuestionChange(event) {
    this.question = event.target.value;
  }

  handleFind() {
    this.runTool(TOOL_STRUCTURE, { repoName: this.selectedRepo }, "Find");
  }

  handleCatchUp() {
    this.runTool(TOOL_CONTENTS, { repoName: this.selectedRepo }, "Catch Up");
  }

  handlePlan() {
    this.runTool(
      TOOL_QUESTION,
      { repoName: this.selectedRepo, question: PLAN_PROMPT },
      "Plan"
    );
  }

  handleSend() {
    if (!this.question) {
      return;
    }
    this.runTool(
      TOOL_QUESTION,
      { repoName: this.selectedRepo, question: this.question },
      "Ask"
    );
  }

  runTool(toolName, inputs, actionLabel) {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = undefined;
    this.response = undefined;
    this.activeAction = actionLabel;

    invokeMcpTool({ toolName, inputsJson: JSON.stringify(inputs) })
      .then((response) => {
        const data = JSON.parse(response);
        if (data.success) {
          this.response = data.result;
        } else {
          this.hasError = true;
          this.errorMessage = data.error;
        }
      })
      .catch((error) => {
        this.hasError = true;
        this.errorMessage =
          (error && error.body && error.body.message) ||
          "Unable to generate a response for this repository.";
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
