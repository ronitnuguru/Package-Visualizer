export const SKILLS = [
  {
    id: "skill-1",
    name: "Salesforce Development Skills (sf-skills)",
    displayName: "Salesforce Development Skills",
    shortName: "sf-skills",
    description:
      "A library of Salesforce and community-contributed agent skills, plugins, and sample apps for building applications. Covers Agentforce, Lightning apps, Flow, Apex, SOQL, Lightning Web Components, UI bundles, and more. Optimized for Agentforce Vibes and usable with AI tools that support skills.",
    createdBy: "Salesforce Engineering",
    bestFor:
      "Building, testing, and deploying Salesforce applications with reusable agent workflows",
    cli: "npx skills add forcedotcom/sf-skills",
    githubLink: "https://github.com/forcedotcom/sf-skills"
  },
  {
    id: "skill-2",
    name: "Partner Ecosystem Agentic Kit (peak)",
    displayName: "Partner Ecosystem Agentic Kit",
    shortName: "peak",
    description:
      "An ISV Partner advisor and library of partner-focused skills for the Salesforce partner journey, from product strategy and architecture to packaging, implementation, distribution, security review, release, and operations. The advisor coordinates with the Salesforce skills library for implementation.",
    createdBy: "Partner Solutions",
    bestFor: "Guiding ISV Partners through product and partnership decisions",
    cli: `Help me install the complete ISV Partner Advisor from
https://github.com/forcedotcom/partner-ecosystem-agentic-kit.
I want to review the unreleased rename candidate on
codex/isv-partner-advisor-migration, not silently change my normal installation.
Read INSTALL.md from that same branch and use the route for this app. Verify
that its VERSION and plugin manifests match the reviewed candidate before
changing anything. If that revision has not been published, stop and explain.
Prefer its supported native
plugin route; otherwise propose the documented project-local skill layout.
Inspect existing copies first, preserve all supporting references, and ask
before making changes. Do not overwrite modified or unrelated skills, change
global settings, connect MCPs, or inspect a Salesforce org. Report the installed
source revision and scope, and verify that the entry and supporting advisors
are available. If this app cannot install them, explain that limitation rather
than claiming file reading is an installation.`,
    githubLink: "https://github.com/forcedotcom/partner-ecosystem-agentic-kit"
  }
];
