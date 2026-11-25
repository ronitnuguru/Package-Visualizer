import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HomePage from "./Home";

const createCustomServerApiUrl = "https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/create-custom-salesforce-mcp-servers.html";
const manageExternalServerApiUrl = "https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/manage-external-mcp-servers.html";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Headless Toolkit journey", () => {
  it("copies the selected partner guidance without a success message", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<HomePage />);
    fireEvent.click(screen.getByRole("tab", { name: "External Application" }));
    const guidance = screen.getByRole("heading", { name: "What Partners deliver:" }).parentElement;
    Object.defineProperty(guidance, "innerText", { value: "Partner and subscriber guidance" });
    const copyButton = screen.getByRole("button", { name: "Copy to Clipboard" });
    expect(copyButton).toHaveAttribute("title", "Copy to Clipboard");
    fireEvent.click(copyButton);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Partner and subscriber guidance"));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it.each([false, true])("copies the original guidance if clipboard access is denied after switching paths (new card visible: %s)", async (showNewCard) => {
    let rejectWrite!: (reason: Error) => void;
    const pendingWrite = new Promise<void>((_, reject) => { rejectWrite = reject; });
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: vi.fn().mockReturnValue(pendingWrite) } });
    const copied = vi.fn();
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: () => { copied((document.activeElement as HTMLTextAreaElement).value); return true; }
    });

    try {
      render(<HomePage />);
      fireEvent.click(screen.getByRole("tab", { name: "External Application" }));
      const original = screen.getByRole("heading", { name: "What Partners deliver:" }).parentElement;
      Object.defineProperty(original, "innerText", { value: "External Application guidance" });
      fireEvent.click(screen.getByRole("button", { name: "Copy to Clipboard" }));
      fireEvent.click(screen.getByRole("tab", { name: "AIforce" }));
      if (showNewCard) {
        fireEvent.click(screen.getByRole("button", { name: "Slackbot" }));
        fireEvent.click(screen.getByRole("button", { name: "Standard & Product Hosted MCP Servers" }));
      }

      rejectWrite(new Error("Clipboard permission denied"));
      await waitFor(() => expect(copied).toHaveBeenCalledWith("External Application guidance"));
      expect(document.querySelector("textarea")).toBeNull();
      if (showNewCard) expect(screen.getByRole("status")).toBeEmptyDOMElement();
    } finally {
      Reflect.deleteProperty(document, "execCommand");
    }
  });
  it("shows distinct Salesforce playbooks", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("tab", { name: "Agentforce" }));
    fireEvent.click(screen.getByRole("button", { name: "Slackbot in Lightning Experience" }));
    expect(screen.queryByRole("region", { name: "Setup Steps" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Standard & Product Hosted MCP Servers" }));
    const steps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(within(steps[0]).getByRole("link", { name: "Connect Salesforce & Slack" })).toBeInTheDocument();
    expect(within(steps[2]).getByRole("link", { name: "Set Up and Manage Slackbot in Salesforce" })).toHaveAttribute("href", "https://help.salesforce.com/s/articleView?id=slack.slack_slackbot_setup.htm&type=5");
    expect(within(steps[3]).getByRole("link", { name: "Work with Slackbot in Salesforce" })).toHaveAttribute("href", "https://help.salesforce.com/s/articleView?id=slack.slack_slackbot_usage.htm&type=5");
    expect(screen.queryByRole("button", { name: "Copy Prompt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation guides")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Agentforce Employee Agent" }));
    expect(screen.queryByRole("region", { name: "Setup Steps" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "External Hosted MCP Servers" }));
    const employeeSteps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
    expect(employeeSteps).toHaveLength(4);
    ["Register an External Hosted MCP Server in Agentforce Registry", "Activate Your MCP Tools", "Add Tools to Your Agent", "Deploy and Test Your Agent"].forEach((label, index) => {
      expect(within(employeeSteps[index]).getByRole("link", { name: label })).toBeInTheDocument();
    });
    expect(within(employeeSteps[0]).getByRole("link", { name: "Register an External Hosted MCP Server in Agentforce Registry" })).toHaveAttribute("href", "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register.htm&type=5");
    expect(employeeSteps[0]).toHaveTextContent("API Catalog → MCP Servers");
    expect(screen.getByRole("list", { name: "What Partners deliver:" })).toHaveTextContent("Keep authentication secrets, MCP tool actions, and Agentforce Gateway policies outside the package.");
    expect(within(screen.getByRole("complementary", { name: "Connection Path" })).getByText("External MCP Server")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Prompt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation guides")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Work with Slackbot in Salesforce" })).not.toBeInTheDocument();
  });

  it.each(["Slackbot in Lightning Experience", "Agentforce Employee Agent"])("shows server-specific guidance for %s", (experience) => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("tab", { name: "Agentforce" }));
    fireEvent.click(screen.getByRole("button", { name: experience }));
    for (const name of ["Standard & Product Hosted MCP Servers", "Custom Salesforce Hosted MCP Servers", "External Hosted MCP Servers"]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.getByRole("region", { name: "Setup Steps" })).toBeInTheDocument();
      const partner = screen.getByRole("list", { name: "What Partners deliver:" });
      const subscriber = screen.getByRole("list", { name: "What Subscriber Admins configure:" });
      expect(screen.getByRole("button", { name: "Copy to Clipboard" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
      if (experience === "Slackbot in Lightning Experience") {
        expect(subscriber).toHaveTextContent("Slackbot UI permission");
      } else {
        expect(subscriber).toHaveTextContent("Asset Library in Agentforce Builder");
      }
      if (name === "Standard & Product Hosted MCP Servers") {
        expect(within(partner).getByRole("link", { name: "Standard or Product Servers" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/servers-reference.html");
        expect(subscriber).toHaveTextContent("Enable the selected server in Salesforce Setup");
      }
      if (name === "Custom Salesforce Hosted MCP Servers") {
        expect(partner).toHaveTextContent("Package eligible tools and required permission sets in managed 2GP");
        expect(within(partner).getByRole("link", { name: "Custom Platform Tools" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html#custom-tools");
        expect(within(partner).getByRole("link", { name: "Salesforce API Catalog Connect REST API" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/get-started.html");
        expect(subscriber).toHaveTextContent("use the partner’s tool");
        expect(within(subscriber).getByRole("link", { name: "Create and activate a custom server" })).toBeInTheDocument();
        expect(within(subscriber).getByRole("link", { name: "API Catalog Connect REST API" })).toHaveAttribute("href", createCustomServerApiUrl);
        expect(screen.getByRole("link", { name: experience === "Agentforce Employee Agent" ? "Build Custom MCP Servers" : "Build Custom MCP Tools" })).toBeInTheDocument();
      }
      if (name === "External Hosted MCP Servers" && experience === "Slackbot in Lightning Experience") {
        expect(within(partner).getByRole("link", { name: "Slack app configured for your MCP server" })).toBeInTheDocument();
        expect(subscriber).toHaveTextContent("Approve and install the partner’s Slack app");
        expect(within(subscriber).queryByRole("link", { name: "API Catalog Connect REST API" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Connect an MCP Server to Slackbot" })).toHaveAttribute("href", "https://slack.com/help/articles/52414744085139-Connect-Slackbot-to-other-apps-with-MCP");
      }
      if (name === "External Hosted MCP Servers" && experience === "Agentforce Employee Agent") {
        expect(within(partner).getByRole("link", { name: "external server registration" })).toBeInTheDocument();
        expect(within(partner).getByRole("link", { name: "API Catalog Connect REST API" })).toHaveAttribute("href", manageExternalServerApiUrl);
        expect(subscriber).toHaveTextContent("register the external server in the subscriber org");
        expect(subscriber).toHaveTextContent("use the partner’s tool");
        expect(within(subscriber).getByRole("link", { name: "API Catalog Connect REST API" })).toHaveAttribute("href", manageExternalServerApiUrl);
      }
    }
  });

  it("shows the requested custom server steps for an Employee Agent", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("tab", { name: "Agentforce" }));
    fireEvent.click(screen.getByRole("button", { name: "Agentforce Employee Agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Custom Salesforce Hosted MCP Servers" }));
    const steps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
    expect(within(steps[0]).getByRole("link", { name: "Build Custom MCP Servers" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html");
    expect(within(steps[0]).getByRole("link", { name: "Custom Platform Tools" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html#custom-tools");
    expect(within(steps[1]).getByRole("link", { name: "Create Custom Salesforce MCP Servers in API Catalog" })).toHaveAttribute("href", "https://help.salesforce.com/s/articleView?id=platform.api_catalog_create_custom_salesforce_mcp_servers.htm&type=5");
    expect(within(steps[2]).getByRole("link", { name: "Register and Select MCP Tools" })).toBeInTheDocument();
    expect(within(steps[3]).getByRole("link", { name: "Add Tools to Your Agent" })).toBeInTheDocument();
  });

  it("shows the requested standard server steps for an Employee Agent", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("tab", { name: "Agentforce" }));
    fireEvent.click(screen.getByRole("button", { name: "Agentforce Employee Agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Standard & Product Hosted MCP Servers" }));
    const steps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
    const expected = [
      ["Enable a Salesforce Hosted MCP Server", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/servers-reference.html"],
      ["Register a Salesforce-Hosted MCP Server in Agentforce Registry", "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_connect_register_hosted.htm&type=5"],
      ["Add an MCP Tool Action to Your Agent", "https://help.salesforce.com/s/articleView?id=ai.agent_mcp_tool_action_add.htm&type=5"]
    ];
    expected.forEach(([label, url], index) => expect(within(steps[index]).getByRole("link", { name: label })).toHaveAttribute("href", url));
    expect(steps[0]).toHaveTextContent("API Catalog → MCP Servers");
    expect(steps[2]).toHaveTextContent("Asset Library");
    expect(within(steps[3]).getByRole("link", { name: "Test" })).toHaveAttribute("href", "https://help.salesforce.com/s/articleView?id=ai.agent_parent_test.htm&type=5");
    expect(within(steps[3]).getByRole("link", { name: "Deploy" })).toHaveAttribute("href", "https://help.salesforce.com/s/articleView?id=ai.agent_deploy_emp_lex.htm&type=5");
    expect(steps[3]).toHaveTextContent("Test & Deploy Your Agent");
  });

  it.each(["Claude", "Slackbot", "ChatGPT"])("guides %s through both servers and clears stale selections", (client) => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("tab", { name: "AIforce" }));
    fireEvent.click(screen.getByRole("button", { name: client }));
    const path = within(screen.getByRole("complementary", { name: "Connection Path" }));
    expect(path.getByText(client)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Standard & Product Hosted MCP Servers" }));
    expect(screen.getByRole("list", { name: "What Partners deliver:" })).toHaveTextContent("Salesforce provides the server and its tools");
    expect(within(screen.getByRole("list", { name: "What Partners deliver:" })).getByRole("link", { name: "Standard or Product Servers" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/servers-reference.html");
    expect(screen.getByRole("list", { name: "What Subscriber Admins configure:" })).toHaveTextContent("enable the server");
    expect(path.getByText("Salesforce Hosted MCP Servers")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Prompt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation guides")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Custom Salesforce Hosted MCP Servers" }));
    const partner = screen.getByRole("list", { name: "What Partners deliver:" });
    expect(within(partner).getByRole("link", { name: "Custom Platform Tools" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html#custom-tools");
    expect(within(partner).getByRole("link", { name: "Salesforce API Catalog Connect REST API" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/get-started.html");
    expect(partner).toHaveTextContent("subscriber admin tool");
    expect(partner).not.toHaveTextContent("Package Visualizer");
    const subscriber = screen.getByRole("list", { name: "What Subscriber Admins configure:" });
    expect(subscriber).toHaveTextContent("Create and activate a custom server in the subscriber org");
    expect(subscriber).toHaveTextContent("use the partner’s tool");
    expect(within(subscriber).getByRole("link", { name: "API Catalog Connect REST API" })).toHaveAttribute("href", createCustomServerApiUrl);
    expect(screen.getByRole("button", { name: "Copy to Clipboard" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Prompt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation guides")).not.toBeInTheDocument();
    expect(path.getByText("Salesforce Hosted MCP Servers")).toBeInTheDocument();
    if (client === "Slackbot") {
      expect(subscriber).toHaveTextContent("map user accounts");
      expect(subscriber).not.toHaveTextContent("External Client App");
      expect(screen.getByRole("heading", { name: "Slackbot with Custom Salesforce Hosted MCP Servers" })).toBeInTheDocument();
      const customSteps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
      expect(customSteps).toHaveLength(5);
      expect(within(customSteps[1]).getByRole("link", { name: "Build Custom MCP Servers" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html");
      expect(within(customSteps[1]).getByRole("link", { name: "Custom Platform Tools" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html#custom-tools");
      expect(within(customSteps[2]).getByRole("link", { name: "Connect MCP Server to Slackbot" })).toBeInTheDocument();
      expect(within(customSteps[4]).getByRole("link", { name: "Test Your MCP Client" })).toBeInTheDocument();
    } else {
      expect(subscriber).toHaveTextContent("Link an External Client App (ECA) to the server");
      expect(within(subscriber).getByRole("link", { name: "client setup guide" })).toHaveAttribute("href", `https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/${client.toLowerCase()}.html`);
      const customSteps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
      expect(customSteps).toHaveLength(5);
      expect(within(customSteps[0]).getByRole("link", { name: "Create an External Client App" })).toBeInTheDocument();
      expect(within(customSteps[1]).getByRole("link", { name: "Build Custom MCP Servers" })).toBeInTheDocument();
      expect(within(customSteps[3]).getByRole("link", { name: "Configure your MCP Client" })).toBeInTheDocument();
      expect(within(customSteps[4]).getByRole("link", { name: "Test Your MCP Client" })).toBeInTheDocument();
      expect(within(customSteps[1]).getByRole("link", { name: "Custom Platform Tools" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/custom-servers.html#custom-tools");
      expect(within(customSteps[2]).getByRole("link", { name: "Create Custom MCP Server" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/api-catalog-connectapi/guide/create-custom-salesforce-mcp-servers.html");
    }
    fireEvent.click(screen.getByRole("tab", { name: "External Application" }));
    expect(screen.getByText(/mcp_api/)).toBeInTheDocument();
    expect(within(screen.getByRole("complementary", { name: "Connection Path" })).getByText("Salesforce Hosted MCP Servers")).toBeInTheDocument();
    expect(screen.queryByText(/In Slack administration/)).not.toBeInTheDocument();
  });

  it("shows Slackbot's linked standard-server setup steps", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Slackbot" }));
    fireEvent.click(screen.getByRole("button", { name: "Standard & Product Hosted MCP Servers" }));
    expect(within(screen.getByRole("list", { name: "What Partners deliver:" })).getByRole("link", { name: "Standard or Product Servers" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/servers-reference.html");
    const steps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    const expectedLinks = [
      ["Connect Salesforce & Slack", "https://slack.com/help/articles/30754346665747-Connect-Salesforce-and-Slack"],
      ["Connect MCP Server to Slackbot", "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP#add-an-mcp-server"],
      ["Manage MCP Server and Tool Access", "https://slack.com/help/articles/52462858006675-Connect-Slackbot-to-Salesforce-with-MCP#manage-server-and-tool-access"],
      ["Test Your MCP Client", "https://docs.slack.dev/ai/slackbot-mcp-client/#using-slackbot"]
    ];
    expectedLinks.forEach(([label, url], index) => {
      expect(within(steps[index]).getByRole("link", { name: label })).toHaveAttribute("href", url);
    });
  });

  it.each(["Claude", "ChatGPT"])("shows linked setup steps for %s", async (client) => {
    render(<HomePage />);
    const clientSection = screen.getByRole("region", { name: "Choose an External Agent" });
    expect(within(clientSection).getAllByRole("button").map(button => button.textContent)).toEqual(["Slackbot", "Claude", "ChatGPT"]);
    fireEvent.click(screen.getByRole("button", { name: client }));
    fireEvent.click(screen.getByRole("button", { name: "Standard & Product Hosted MCP Servers" }));
    const steps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(within(steps[0]).getByRole("link", { name: "Create an External Client App" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/create-external-client-app.html");
    expect(within(steps[1]).getByRole("link", { name: "Configure your MCP Client" })).toHaveAttribute("href", `https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/${client.toLowerCase()}.html`);
    expect(within(steps[1]).getByRole("link", { name: "MCP Server URL" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/server-urls.html");
    expect(within(steps[2]).getByRole("link", { name: "Test Your MCP Client" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/hosted-mcp-servers/guide/test-connection.html");
    expect(screen.getByRole("link", { name: "MCP Solutions" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/headless-get-started/guide/headless-mcp.html");
  });

  it("shows the external application steps and responsibilities without copy or guides", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("tab", { name: "External Application" }));
    expect(screen.getByText(/mcp_api/)).toBeInTheDocument();
    const steps = within(screen.getByRole("region", { name: "Setup Steps" })).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    [
      ["Create an External Client App", "https://help.salesforce.com/s/articleView?id=xcloud.create_a_local_external_client_app.htm&type=5"],
      ["Package an External Client App", "https://help.salesforce.com/s/articleView?id=xcloud.configure_packageable_external_client_apps.htm&type=5"],
      ["Manage External Client Apps", "https://help.salesforce.com/s/articleView?id=xcloud.manage_external_client_apps.htm&type=5"],
      ["Secure Your Connected Apps and External Client Apps", "https://developer.salesforce.com/docs/platform/isvforce/guide/secure-code-ac-eca.html"]
    ].forEach(([label, url], index) => expect(within(steps[index]).getByRole("link", { name: label })).toHaveAttribute("href", url));
    const partner = screen.getByRole("list", { name: "What Partners deliver:" });
    const subscriber = screen.getByRole("list", { name: "What Subscriber Admins configure:" });
    expect(within(subscriber).getByRole("link", { name: "API Catalog Connect REST API" })).toHaveAttribute("href", createCustomServerApiUrl);
    expect(within(partner).getByRole("link", { name: "Partner Business Org’s (PBO) Dev Hub" })).toHaveAttribute("href", "https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-before-know-orgs.html");
    const metadata = within(partner).getByRole("list");
    expect(within(metadata).getAllByRole("listitem").map(item => item.textContent)).toEqual([
      "External Client Applications",
      "External Client App OAuth Settings"
    ]);
    expect(subscriber).toHaveTextContent("customer-owned OAuth");
    expect(subscriber).toHaveTextContent("The custom server definition stays outside managed 2GP");
    expect(screen.queryByRole("button", { name: "Copy Prompt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation guides")).not.toBeInTheDocument();
  });
});
