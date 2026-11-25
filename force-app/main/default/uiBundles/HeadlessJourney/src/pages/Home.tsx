import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import agentExchangeIcon from "../assets/agent-exchange.jpg";
import aiforceIcon from "../assets/aiforce-sparkle.png";
import botsIcon from "../assets/bots.jpg";
import roboticsIcon from "../assets/robotics.jpg";
import workflowIcon from "../assets/workflow-automation.jpg";
import partnersIcon from "../assets/partners.jpg";
import slackbotIcon from "../assets/slackbot.png";
import claudeIcon from "../assets/claude.png";
import openaiIcon from "../assets/openai.svg";
import agentforceIcon from "../assets/agentforce.jpg";
import vibeCodeyIcon from "../assets/vibe-codey.jpg";
import platformIcon from "../assets/platform.jpg";
import partnerIcon from "../assets/partners-isv.jpg";

type Archetype = "salesforce" | "external" | "partner";
type NativePath = "slack-lightning" | "employee";
type Client = "Claude" | "Slackbot" | "ChatGPT";
type Server = "Standard & Product" | "Custom";
type EmployeeServer = Server | "External";
type Link = { label: string; url: string };
type Step = { title: string; url: string; beforeUrl: string; titleLink?: Link; titleSuffix?: string; inlineLink?: Link; afterUrl?: string };
type PartnerGuidance = { partner: ReactNode; subscriber: ReactNode };
type Playbook = { title: string; architecture: string; steps: Step[]; guidance: PartnerGuidance };

const links = {
  slackSetup: { label: "Connect Salesforce and Slack", url: "https://slack.com/help/articles/30754346665747-Connect-Salesforce-and-Slack" },
  slackLightning: { label: "Set up Slackbot in Salesforce", url: "https://help.salesforce.com/s/articleView?id=slack.slack_slackbot_setup.htm&language=en_US&type=5" },
  employee: { label: "Connect an Employee Agent to Lightning", url: "https://help.salesforce.com/s/articleView?id=ai.agent_deploy_emp_lex.htm&language=en_US&type=5" },
  slackMcp: { label: "Connect Slackbot with MCP", url: "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP" },
  eca: { label: "Create an External Client App", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html" },
  serverUrls: { label: "MCP Server URL", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/server-urls.html" },
  testConnection: { label: "Test Your MCP Client", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/test-connection.html" },
  solutions: { label: "MCP Solutions", url: "https://developer.salesforce.com/docs/platform/headless-get-started/guide/headless-mcp.html" },
  standard: { label: "Standard server reference", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/servers-reference.html" },
  product: { label: "Products supporting MCP", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/products-supporting-mcp.html" },
  custom: { label: "Build a custom server", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html" },
  Claude: { label: "Connect Claude", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/claude.html" },
  ChatGPT: { label: "Connect ChatGPT", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/chatgpt.html" }
};

function GuidanceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="journey-doc-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

const activateServersUrl = "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/activate-mcp-servers.html";
const customServerSetupUrl = "https://help.salesforce.com/s/articleView?id=platform.api_catalog_create_custom_salesforce_mcp_servers.htm&type=5";
const createCustomServerApiUrl = "https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/create-custom-salesforce-mcp-servers.html";
const manageExternalServerApiUrl = "https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/manage-external-mcp-servers.html";

function getAgentforceGuidance(experience: NativePath, server: EmployeeServer): PartnerGuidance {
  const slackbot = experience === "slack-lightning";
  const client = slackbot ? "Slackbot in Lightning Experience" : "the Employee Agent";

  return {
    partner: (
      <>
        {server === "Standard & Product" && (
          <li>Recommend the narrowest server from the <GuidanceLink href={links.standard.url}>Standard or Product Servers</GuidanceLink> that supports the workflow in {client}. Check that the selected experience supports it. Start with read-only tools when the task only needs to retrieve data. Salesforce provides the server and its tools, so this path needs no managed package for those tools.</li>
        )}
        {server === "Custom" && (
          <>
            <li>Reuse existing packaged <GuidanceLink href={`${links.custom.url}#custom-tools`}>Custom Platform Tools</GuidanceLink> or create new Platform Tools, ideally with Apex using <GuidanceLink href="https://github.com/forcedotcom/sf-skills/">sf-skills</GuidanceLink>. Package eligible tools and required permission sets in managed 2GP.</li>
            <li>Provide a subscriber admin tool that uses the <GuidanceLink href="https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/get-started.html">Salesforce API Catalog Connect REST API</GuidanceLink> to create, configure, and maintain the Custom MCP Server after installation.</li>
          </>
        )}
        {server === "External" && (
          <>
            <li>Host and maintain the external MCP server outside the managed package. Document the endpoint, supported authentication, available tools, and required permissions.</li>
            {slackbot ? (
              <li>Distribute a <a className="journey-doc-link" href="https://docs.slack.dev/ai/slackbot-mcp-client/" target="_blank" rel="noopener noreferrer">Slack app configured for your MCP server</a> and provide installation and sign-in instructions.</li>
            ) : (
              <li>Package the eligible <GuidanceLink href="https://developer.salesforce.com/docs/platform/pkg2-dev/guide/dev2gp-package-mcp-agentforce.html">external server registration</GuidanceLink>, named and external credentials, and permission set, or provide a subscriber admin tool using the <GuidanceLink href={manageExternalServerApiUrl}>API Catalog Connect REST API</GuidanceLink>. Keep authentication secrets, MCP tool actions, and Agentforce Gateway policies outside the package.</li>
            )}
          </>
        )}
        <li>Provide a sample request for {client}, the test data it needs, and the expected result.</li>
      </>
    ),
    subscriber: (
      <>
        {server === "Standard & Product" && (
          <li><GuidanceLink href={activateServersUrl}>Enable the selected server in Salesforce Setup</GuidanceLink> and grant users the Salesforce permissions its tools require.</li>
        )}
        {server === "Custom" && (
          <li>Install the partner package and assign its required permissions. <GuidanceLink href={customServerSetupUrl}>Create and activate a custom server</GuidanceLink> in the subscriber org through Setup, or use the partner’s tool with the <GuidanceLink href={createCustomServerApiUrl}>API Catalog Connect REST API</GuidanceLink> to add the MCP tools the workflow needs. The custom MCP server definition stays outside managed 2GP.</li>
        )}
        {slackbot ? (
          <>
            <li><GuidanceLink href={links.slackSetup.url}>Connect Salesforce and Slack</GuidanceLink> and map user accounts. Grant the <GuidanceLink href={links.slackLightning.url}>Slackbot UI permission</GuidanceLink> to the employees who will use it in Lightning Experience.</li>
            {server === "External" ? (
              <li><GuidanceLink href="https://slack.com/help/articles/52414744085139-Connect-Slackbot-to-other-apps-with-MCP">Approve and install the partner’s Slack app</GuidanceLink>, manage access using the controls available in your Slack plan, and have employees connect their accounts if required.</li>
            ) : (
              <li><GuidanceLink href={links.slackMcp.url}>Add the Salesforce Hosted MCP Server in Slack administration</GuidanceLink>. Limit member and tool access using the controls available in your Slack plan.</li>
            )}
            <li>Run the sample request in Slackbot from Lightning Experience as a mapped employee and verify the expected result.</li>
          </>
        ) : (
          <>
            {server === "External" ? (
              <li>Install the packaged registration or register the external server in the subscriber org through <GuidanceLink href="https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register.htm&type=5">Agentforce Registry</GuidanceLink> or use the partner’s tool with the <GuidanceLink href={manageExternalServerApiUrl}>API Catalog Connect REST API</GuidanceLink>. Configure authentication, assign the required permissions, and activate the connection.</li>
            ) : (
              <li><GuidanceLink href="https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register_hosted.htm&type=5">Register the active Salesforce Hosted MCP Server in Agentforce Registry</GuidanceLink>.</li>
            )}
            <li>Select only the tools the agent needs, then <GuidanceLink href="https://help.salesforce.com/s/articleView?id=ai.agent_mcp_tool_action_add.htm&language=en_US&type=5">add their MCP tool actions</GuidanceLink> from the Asset Library in Agentforce Builder. Tell the agent when to use each action.</li>
            <li>Test the sample request before activating the agent. <GuidanceLink href={links.employee.url}>Grant employee access in Lightning Experience</GuidanceLink> and verify the result as an authorized employee.</li>
          </>
        )}
      </>
    )
  };
}

function getPlaybook(archetype: Archetype | null, native: NativePath | null, client: Client | null, server: Server | null, employeeServer: EmployeeServer | null): Playbook | null {
  if (archetype === "salesforce" && native === "slack-lightning" && employeeServer) return {
    title: "Slackbot in Lightning Experience",
    architecture: "Employee → Slackbot in Salesforce or Slack → Salesforce Capabilities",
    steps: [
      { title: "Connect Salesforce & Slack", url: links.slackSetup.url, beforeUrl: "Connect your Slack workspace and Salesforce org." },
      ...(employeeServer === "Custom" ? [
        { title: "Build Custom MCP Tools", url: links.custom.url, beforeUrl: "Build and expose the partner capabilities your employees need through a custom Salesforce Hosted MCP Server." }
      ] : []),
      { title: "Connect an MCP Server to Slackbot", url: employeeServer === "External" ? "https://slack.com/help/articles/52414744085139-Connect-Slackbot-to-other-apps-with-MCP" : "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP", beforeUrl: employeeServer === "External" ? "Install the Slack app containing your partner-hosted MCP server, connect accounts, and grant appropriate tool access." : "Enable the selected Salesforce Hosted MCP Server, then connect it to Slackbot and grant appropriate tool access." },
      { title: "Set Up and Manage Slackbot in Salesforce", url: "https://help.salesforce.com/s/articleView?id=slack.slack_slackbot_setup.htm&type=5", beforeUrl: "Configure Slackbot to work with Salesforce Hosted MCP Servers and other External MCP servers." },
      { title: "Work with Slackbot in Salesforce", url: "https://help.salesforce.com/s/articleView?id=slack.slack_slackbot_usage.htm&type=5", beforeUrl: "Use Slackbot as your personal agent for work in Salesforce and in your Slack workspace." }
    ],
    guidance: getAgentforceGuidance(native, employeeServer)
  };
  if (archetype === "salesforce" && native === "employee" && employeeServer === "External") return {
    title: "Agentforce Employee Agent",
    architecture: "Agentforce Employee Agent → External MCP Server → Partner Tools",
    steps: [
      { title: "Register an External Hosted MCP Server in Agentforce Registry", url: "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register.htm&type=5", beforeUrl: "In Setup, go to API Catalog → MCP Servers to register and create a connection to a partner-specific MCP server." },
      { title: "Activate Your MCP Tools", url: "https://developer.salesforce.com/docs/platform/pkg2-dev/guide/dev2gp-package-mcp-agentforce.html", beforeUrl: "Activate the server, review its discovered tools, and select the tools the agent needs." },
      { title: "Add Tools to Your Agent", url: "https://developer.salesforce.com/blogs/2026/10/developers-guide-to-the-winter-27-release", beforeUrl: "In Agentforce Builder, add the selected MCP tools to your Employee Agent and configure its instructions." },
      { title: "Deploy and Test Your Agent", url: links.employee.url, beforeUrl: "Activate the agent for Lightning Experience, grant employee access, and test a representative request as an authorized user." }
    ],
    guidance: getAgentforceGuidance(native, employeeServer)
  };
  if (archetype === "salesforce" && native === "employee" && employeeServer === "Standard & Product") return {
    title: "Agentforce Employee Agent",
    architecture: "Agentforce Employee Agent → Salesforce Hosted MCP Server → Salesforce Tools",
    steps: [
      { title: "Enable a Salesforce Hosted MCP Server", url: links.standard.url, beforeUrl: "In Setup, go to API Catalog → MCP Servers and configure and activate a standard server with the tools your agent needs." },
      { title: "Register a Salesforce-Hosted MCP Server in Agentforce Registry", url: "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register_hosted.htm&type=5", beforeUrl: "Register the MCP server in Agentforce Registry so your agents can access its tools." },
      { title: "Add an MCP Tool Action to Your Agent", url: "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_tool_action_add.htm&type=5", beforeUrl: "Add the agent action that references your MCP tool to your Employee Agent from the Asset Library so the agent can call the tool in conversation." },
      { title: "Test", url: "https://help.salesforce.com/s/articleView?id=ai.agent_parent_test.htm&type=5", titleLink: { label: "Deploy", url: "https://help.salesforce.com/s/articleView?id=ai.agent_deploy_emp_lex.htm&type=5" }, titleSuffix: " Your Agent", beforeUrl: "Activate the agent for Lightning Experience, grant employee access, and test a representative request as an authorized user." }
    ],
    guidance: getAgentforceGuidance(native, employeeServer)
  };
  if (archetype === "salesforce" && native === "employee" && employeeServer) return {
    title: "Agentforce Employee Agent",
    architecture: "Agentforce Employee Agent → Salesforce Hosted MCP Server → Salesforce Tools",
    steps: [
      { title: "Build Custom MCP Servers", url: links.custom.url, beforeUrl: "Use ", inlineLink: { label: "Custom Platform Tools", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html#custom-tools" }, afterUrl: " like Apex to surface MCP tools that don't exist in any standard server." },
      { title: "Create Custom Salesforce MCP Servers in API Catalog", url: "https://help.salesforce.com/s/articleView?id=platform.api_catalog_create_custom_salesforce_mcp_servers.htm&type=5", beforeUrl: "Create a custom MCP server to configure Salesforce MCP server tools that map to Apex actions, flows, and other action types." },
      { title: "Register and Select MCP Tools", url: "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect.htm&language=en_US&type=5", beforeUrl: "Register the server in Agentforce Registry and allowlist the tools your agent needs." },
      { title: "Add Tools to Your Agent", url: "https://developer.salesforce.com/blogs/2026/10/developers-guide-to-the-winter-27-release", beforeUrl: "Add the MCP tool actions to your Employee Agent in Agentforce Builder and configure its instructions." },
      { title: "Deploy and Test Your Agent", url: links.employee.url, beforeUrl: "Activate the agent for Lightning Experience, grant employee access, and test a representative request as an authorized user." }
    ],
    guidance: getAgentforceGuidance(native, employeeServer)
  };
  if (archetype === "external" && client && server) {
    const slack = client === "Slackbot";
    const slackStandardSteps: Step[] = [
      { title: "Connect Salesforce & Slack", url: links.slackSetup.url, beforeUrl: "Connect and configure your Slack workspace and Salesforce org to set up Slackbot and MCP integration." },
      { title: "Connect MCP Server to Slackbot", url: "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP#add-an-mcp-server", beforeUrl: "Add your Salesforce Hosted MCP Server to Slackbot." },
      { title: "Manage MCP Server and Tool Access", url: "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP#manage-server-and-tool-access", beforeUrl: "Secure and grant appropriate access to your users." },
      { title: "Test Your MCP Client", url: "https://docs.slack.dev/ai/slackbot-mcp-client/#using-slackbot", beforeUrl: "Verify the connection by issuing a natural language request through Slackbot’s chat interface and checking for a response." }
    ];
    const standardClientSteps: Step[] = slack ? [] : [
      { title: "Create an External Client App", url: links.eca.url, beforeUrl: "Register an External Client App (ECA) in your org to handle OAuth authentication. Each MCP server configuration links to one ECA." },
      { title: "Configure your MCP Client", url: links[client].url, beforeUrl: "Add the ", inlineLink: links.serverUrls, afterUrl: ` and your External Client App’s consumer key to ${client}.` },
      { title: "Test Your MCP Client", url: links.testConnection.url, beforeUrl: "Verify the connection by issuing a natural language request through the client’s chat interface and checking for a response." }
    ];
    const customSteps: Step[] = [
      ...standardClientSteps.slice(0, 1),
      { title: "Build Custom MCP Servers", url: links.custom.url, beforeUrl: "Use ", inlineLink: { label: "Custom Platform Tools", url: "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html#custom-tools" }, afterUrl: " like Apex to surface MCP tools that don't exist in any standard server." },
      { title: "Create Custom MCP Server", url: createCustomServerApiUrl, beforeUrl: "Use Connect REST API to create, configure, and activate your server in the subscriber org." },
      ...standardClientSteps.slice(1)
    ];
    return {
      title: `${client} with ${server === "Custom" ? (slack ? "Custom Salesforce Hosted MCP Servers" : "a Custom Salesforce Hosted MCP Server") : "Standard & Product Hosted MCP Servers"}`,
      architecture: `${client} → Salesforce Hosted MCP Server → Salesforce Tools`,
      steps: slack ? (server === "Standard & Product" ? slackStandardSteps : [slackStandardSteps[0], customSteps[0], ...slackStandardSteps.slice(1)]) : server === "Standard & Product" ? standardClientSteps : customSteps,
      guidance: {
        partner: (
          <>
            {server === "Custom" ? (
              <>
                <li>Reuse existing packaged <GuidanceLink href={`${links.custom.url}#custom-tools`}>Custom Platform Tools</GuidanceLink> or create new Platform Tools, ideally with Apex using <GuidanceLink href="https://github.com/forcedotcom/sf-skills/">sf-skills</GuidanceLink>.</li>
                <li>Provide a subscriber admin tool that uses the <GuidanceLink href="https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/get-started.html">Salesforce API Catalog Connect REST API</GuidanceLink> to create, configure, and maintain the Custom MCP Server after installation.</li>
              </>
            ) : (
              <li>Recommend the narrowest <GuidanceLink href={links.standard.url}>Standard or Product Servers</GuidanceLink> that supports the workflow in {client}. Start with read-only tools when the task only needs to retrieve data. Salesforce provides the server and its tools, so this path needs no managed package.</li>
            )}
            <li>Give the admin one sample request for {client}, the test data it needs, and the expected result.</li>
          </>
        ),
        subscriber: (
          <>
            {server === "Custom" ? (
              <li>Install the partner package and assign its required permissions. <GuidanceLink href={customServerSetupUrl}>Create and activate a custom server</GuidanceLink> in the subscriber org through Setup, or use the partner’s tool with the <GuidanceLink href={createCustomServerApiUrl}>API Catalog Connect REST API</GuidanceLink> to add the MCP tools the workflow needs. The custom MCP Server Definition stays outside managed 2GP.</li>
            ) : (
              <li>In Salesforce Setup, <GuidanceLink href={activateServersUrl}>enable the server</GuidanceLink> that supports your workflow and grant users the Salesforce permissions its tools require.</li>
            )}
            {slack ? (
              <li><GuidanceLink href={links.slackSetup.url}>Connect the Salesforce org to Slack</GuidanceLink> and map user accounts. <GuidanceLink href={links.slackMcp.url}>Add the MCP server in Slack administration</GuidanceLink> and limit member and tool access using the controls available in your Slack plan.</li>
            ) : (
              <li>Link an <GuidanceLink href={links.eca.url}>External Client App (ECA)</GuidanceLink> to the server and set its OAuth policies for the intended users. Connect {client} using the server URL and the OAuth settings in its <GuidanceLink href={links[client].url}>client setup guide</GuidanceLink>.</li>
            )}
            <li>Run the sample request in {client} as an authorized user and verify the expected result.</li>
          </>
        )
      }
    };
  }
  if (archetype === "partner") return {
    title: "External Partner Application",
    architecture: "Partner Application → Salesforce Hosted MCP Server → Salesforce Tools",
    steps: [
      { title: "Create an External Client App", url: "https://help.salesforce.com/s/articleView?id=xcloud.create_a_local_external_client_app.htm&type=5", beforeUrl: "Create an External Client App with the Access MCP servers (mcp_api) scope and your application's OAuth callback URL." },
      { title: "Package an External Client App", url: "https://help.salesforce.com/s/articleView?id=xcloud.configure_packageable_external_client_apps.htm&type=5", beforeUrl: "For distribution, configure the app as packageable and include it in your managed package." },
      { title: "Manage External Client Apps", url: "https://help.salesforce.com/s/articleView?id=xcloud.manage_external_client_apps.htm&type=5", beforeUrl: "Manage the app's policies and access in the subscriber org to support your application's connection." },
      { title: "Secure Your Connected Apps and External Client Apps", url: "https://developer.salesforce.com/docs/platform/isvforce/guide/secure-code-ac-eca.html", beforeUrl: "Implement and test Salesforce's applicable OAuth security controls to protect your partner application's connection." }
    ],
    guidance: {
      partner: (
        <>
          <li>Run the MCP client in your application. Provide the OAuth callback URL, the <GuidanceLink href={links.eca.url}>required OAuth settings</GuidanceLink>, and a sample tool request with the expected result.</li>
          <li>Start with a standard server if its tools cover the workflow. For custom capabilities, package eligible <GuidanceLink href={`${links.custom.url}#custom-tools`}>Apex actions or autolaunched flows</GuidanceLink> and the required permission sets in managed 2GP. Give the admin the list of actions to add to the server.</li>
          <li>
            If you provide the OAuth client, define a packageable External Client App (ECA) in your <a className="journey-doc-link" href="https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-before-know-orgs.html" target="_blank" rel="noopener noreferrer">Partner Business Org’s (PBO) Dev Hub</a>. Include only these two ECA metadata types in your managed 2GP package.
            <ul>
              <li>External Client Applications</li>
              <li>External Client App OAuth Settings</li>
            </ul>
            <p>Keep global OAuth settings and secrets in the Dev Hub. Apply the <GuidanceLink href="https://developer.salesforce.com/docs/platform/isvforce/guide/secure-code-ac-eca.html">OAuth security controls that apply to your app</GuidanceLink> before rollout.</p>
          </li>
        </>
      ),
      subscriber: (
        <>
          <li>Use the packaged ECA if the partner provides one, or <GuidanceLink href={links.eca.url}>create a local ECA</GuidanceLink> for customer-owned OAuth. Set the ECA’s OAuth policies and assign the required permissions to the users who will connect.</li>
          <li><GuidanceLink href={activateServersUrl}>Enable the standard Salesforce Hosted MCP servers</GuidanceLink> you need. For a custom server, create it in the subscriber org through <GuidanceLink href={customServerSetupUrl}>Salesforce Setup</GuidanceLink> or the <GuidanceLink href={createCustomServerApiUrl}>API Catalog Connect REST API</GuidanceLink>, then add the installed tools and activate it. The custom server definition stays outside managed 2GP.</li>
          <li>Link each Salesforce Hosted MCP server to the ECA. Configure the partner app with the correct <GuidanceLink href={links.serverUrls.url}>server URL</GuidanceLink> for your org and run the sample request as an authorized user.</li>
        </>
      )
    }
  };
  return null;
}

const journeys = {
  external: {
    label: "AIforce",
    surface: "External agent",
    title: "Connect an External Agent",
    description: "Give Claude, Slackbot, or ChatGPT access to Salesforce tools through a Salesforce Hosted MCP Servers.",
    tabIcon: aiforceIcon,
    icons: [botsIcon, roboticsIcon, workflowIcon]
  },
  salesforce: {
    label: "Agentforce",
    surface: "In Salesforce",
    title: "Support Employees in Lightning Experience",
    description: "Choose Slackbot or an Agentforce Employee Agent to support employees in your agentic Salesforce workflows.",
    tabIcon: agentforceIcon,
    icons: [vibeCodeyIcon, platformIcon, agentforceIcon]
  },
  partner: {
    label: "External Application",
    surface: "Partner built Application",
    title: "Connect your Partner Application",
    description: "Authenticate your partner application to Salesforce with an External Client App.",
    tabIcon: partnerIcon,
    icons: [partnersIcon, roboticsIcon, workflowIcon]
  }
} satisfies Record<Archetype, { label: string; surface: string; title: string; description: string; tabIcon: string; icons: [string, string, string] }>;

const journeyOrder: Archetype[] = ["external", "salesforce", "partner"];
const clients: Client[] = ["Slackbot", "Claude", "ChatGPT"];
const clientIcons: Record<Client, string> = { Slackbot: slackbotIcon, Claude: claudeIcon, ChatGPT: openaiIcon };
const servers: Server[] = ["Standard & Product", "Custom"];
const serverLabels: Record<Server, string> = {
  "Standard & Product": "Standard & Product Hosted MCP Servers",
  Custom: "Custom Salesforce Hosted MCP Servers"
};
const serverDescriptions: Record<Server, string> = {
  "Standard & Product": "Choose Standard or Product specific MCP Servers for out-of-the-box Platform capabilities and integrations.",
  Custom: "Choose Custom to expose a focused set of partner specific MCP tools."
};
const employeeServerLabels: Record<EmployeeServer, string> = { ...serverLabels, External: "External Hosted MCP Servers" };
const employeeServerDescriptions: Record<EmployeeServer, string> = {
  ...serverDescriptions,
  External: "Choose partner-specific MCP tools that you want to expose to Agentforce Agents and Salesforce workflows."
};
const employeeExperiences = [
  { value: "slack-lightning", label: "Slackbot in Lightning Experience", description: "Use Slackbot inside Salesforce with your connected Slack workspace.", icon: slackbotIcon },
  { value: "employee", label: "Agentforce Employee Agent", description: "Configure a native Agentforce Agent around your team’s Salesforce workflows.", icon: agentforceIcon }
] as const;

function JourneyChoice({
  label,
  description,
  icon,
  selected,
  onSelect
}: {
  label: string;
  description?: string;
  icon?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const id = useId();
  return (
    <button
      type="button"
      className={icon ? "journey-choice journey-choice-with-image" : "journey-choice"}
      aria-labelledby={`${id}-label`}
      aria-describedby={description ? `${id}-description` : undefined}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {icon && <img className={icon === openaiIcon ? "journey-choice-image journey-choice-image-openai" : "journey-choice-image"} src={icon} alt="" />}
      <strong id={`${id}-label`}>{label}</strong>
      {description && <span id={`${id}-description`} className="journey-choice-description">{description}</span>}
      {selected
        ? <Check size={16} className="journey-choice-icon" aria-hidden="true" />
        : <ArrowRight size={16} className="journey-choice-icon" aria-hidden="true" />}
    </button>
  );
}

function PartnerGuidanceCard({ guidance }: { guidance: PartnerGuidance }) {
  const guidanceRef = useRef<HTMLDivElement>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copyGuidance() {
    if (!guidanceRef.current) return;
    const content = guidanceRef.current.innerText;
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const previousFocus = document.activeElement;
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.readOnly = true;
      textarea.tabIndex = -1;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      try {
        textarea.focus({ preventScroll: true });
        textarea.select();
        setCopyFailed(!document.execCommand("copy"));
      } catch {
        setCopyFailed(true);
      } finally {
        textarea.remove();
        if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
      }
    }
  }

  return (
    <div className="journey-example">
      <div className="journey-example-header">
        <h4><img className="journey-example-icon" src={agentExchangeIcon} alt="" /> Partner Guidance</h4>
        <button type="button" className="slds-button slds-button_brand journey-copy-button" onClick={copyGuidance} aria-label="Copy to Clipboard" title="Copy to Clipboard">
          <Copy size={16} aria-hidden="true" />
        </button>
      </div>
      <div role="status" className="journey-copy-status">{copyFailed && "Unable to copy. Select the guidance and copy it manually."}</div>
      <div ref={guidanceRef}>
        <h5 id="guidance-partner-heading">What Partners deliver:</h5>
        <ul aria-labelledby="guidance-partner-heading">{guidance.partner}</ul>
        <h5 id="guidance-subscriber-heading">What Subscriber Admins configure:</h5>
        <ul aria-labelledby="guidance-subscriber-heading">{guidance.subscriber}</ul>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [archetype, setArchetype] = useState<Archetype>("external");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [native, setNative] = useState<NativePath | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [server, setServer] = useState<Server | null>(null);
  const [employeeServer, setEmployeeServer] = useState<EmployeeServer | null>(null);
  const journey = journeys[archetype];
  const playbook = getPlaybook(archetype, native, client, server, employeeServer);
  const connection = archetype === "external"
    ? [client ?? "External Agent", "Salesforce Hosted MCP Servers", "Salesforce Tools"]
    : archetype === "partner"
      ? ["Partner Application", "Salesforce Hosted MCP Servers", "Salesforce Tools"]
      : playbook?.architecture.split(" → ") ?? ["Employee", "Lightning Experience", "Employee Agent"];
  function selectJourney(value: Archetype) {
    if (value === archetype) return;
    setArchetype(value);
    setNative(null);
    setClient(null);
    setServer(null);
    setEmployeeServer(null);
  }

  return (
    <main className="journey-shell">
      <h2 id="journey-surface-heading" className="journey-question">Where will users interact with your AI solution?</h2>
      <div className="journey-tabs" role="tablist" aria-labelledby="journey-surface-heading" aria-orientation="horizontal">
        {journeyOrder.map((value, index) => {
          const TabIcon = journeys[value].tabIcon;
          return (
            <button
              key={value}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`journey-tab-${value}`}
              type="button"
              role="tab"
              aria-labelledby={`journey-name-${value}`}
              aria-describedby={`journey-surface-${value}`}
              aria-selected={archetype === value}
              aria-controls="journey-panel"
              tabIndex={archetype === value ? 0 : -1}
              className="journey-tab"
              onClick={() => selectJourney(value)}
              onKeyDown={(event) => {
                const count = journeyOrder.length;
                let next: number;
                if (event.key === "ArrowRight") next = (index + 1) % count;
                else if (event.key === "ArrowLeft") next = (index + count - 1) % count;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = count - 1;
                else return;
                event.preventDefault();
                selectJourney(journeyOrder[next]);
                tabRefs.current[next]?.focus();
              }}
            >
              <img className="journey-tab-icon" src={TabIcon} alt="" />
              <span>
                <strong id={`journey-name-${value}`}>{journeys[value].label}</strong>
                <small id={`journey-surface-${value}`}>{journeys[value].surface}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div id="journey-panel" data-path={archetype} role="tabpanel" aria-labelledby={`journey-tab-${archetype}`}>
        <div className="journey-stage">
          <header className="journey-intro">
            <h2>{journey.title}</h2>
            <p>{journey.description}</p>
          </header>
          <aside className="journey-connection" aria-labelledby="connection-heading">
            <h3 id="connection-heading">Connection Path</h3>
            <ol className="journey-flow" aria-live="polite" role="list">
              {connection.map((node, index) => {
                const Icon = journey.icons[index];
                return (
                  <li key={index}>
                    <img className="journey-station-image" src={Icon} alt="" />
                    <span>{node}</span>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>

        <div className="journey-content">
          {archetype === "salesforce" && (
            <section aria-labelledby="native-heading">
              <h3 id="native-heading">Choose an Employee Experience</h3>
              <div className="journey-choice-grid two-columns">
                {employeeExperiences.map(({ value, label, description, icon }) => (
                  <JourneyChoice
                    key={value}
                    label={label}
                    description={description}
                    icon={icon}
                    selected={native === value}
                    onSelect={() => { if (native !== value) { setNative(value); setEmployeeServer(null); } }}
                  />
                ))}
              </div>
            </section>
          )}

          {archetype === "salesforce" && native && (
            <section aria-labelledby="employee-server-heading">
              <h3 id="employee-server-heading">Which Headless tools does your Agent need?</h3>
              <div className="journey-choice-grid">
                {(["Standard & Product", "Custom", "External"] as EmployeeServer[]).map(value => (
                  <JourneyChoice
                    key={value}
                    label={employeeServerLabels[value]}
                    description={employeeServerDescriptions[value]}
                    selected={employeeServer === value}
                    onSelect={() => { setEmployeeServer(value); }}
                  />
                ))}
              </div>
            </section>
          )}

          {archetype === "external" && (
            <section aria-labelledby="client-heading">
              <h3 id="client-heading">Choose an External Agent</h3>
              <div className="journey-choice-grid">
                {clients.map(value => (
                  <JourneyChoice
                    key={value}
                    label={value}
                    icon={clientIcons[value]}
                    selected={client === value}
                    onSelect={() => {
                      if (client === value) return;
                      setClient(value);
                      setServer(null);
                                      }}
                  />
                ))}
              </div>
            </section>
          )}

          {archetype === "external" && client && (
            <section aria-labelledby="server-heading">
              <h3 id="server-heading">Which Headless tools does your Agent need?</h3>
              <div className="journey-choice-grid two-columns">
                {servers.map(value => (
                  <JourneyChoice
                    key={value}
                    label={serverLabels[value]}
                    description={serverDescriptions[value]}
                    selected={server === value}
                    onSelect={() => { setServer(value); }}
                  />
                ))}
              </div>
            </section>
          )}

          {playbook && (
            <section className="journey-playbook" aria-labelledby="playbook-heading">
              <div className="journey-playbook-header">
                <h3 id="playbook-heading">{playbook.title}</h3>
                {archetype === "external" && server === "Standard & Product" && (
                  <a className="slds-button slds-button_brand" href={links.solutions.url} target="_blank" rel="noopener noreferrer">
                    MCP Solutions <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
              <div className="journey-plan-grid">
                <section className="journey-task-list" aria-labelledby="steps-heading">
                  <h4 id="steps-heading">Setup Steps</h4>
                  <ol className="journey-checklist">
                    {playbook.steps.map(step => (
                      <li key={step.title}>
                        <a className="journey-doc-link" href={step.url} target="_blank" rel="noopener noreferrer"><strong>{step.title}</strong></a>
                        {step.titleLink && <strong>{" & "}<a className="journey-doc-link" href={step.titleLink.url} target="_blank" rel="noopener noreferrer">{step.titleLink.label}</a>{step.titleSuffix}</strong>}
                        {" — "}{step.beforeUrl}
                        {step.inlineLink && <a className="journey-doc-link" href={step.inlineLink.url} target="_blank" rel="noopener noreferrer">{step.inlineLink.label}</a>}
                        {step.afterUrl}
                      </li>
                    ))}
                  </ol>
                </section>
                <PartnerGuidanceCard
                  key={`${archetype}:${native}:${employeeServer}:${client}:${server}`}
                  guidance={playbook.guidance}
                />
              </div>

            </section>
          )}
        </div>
      </div>
    </main>
  );
}
