import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const baseRoot = resolve(scriptDirectory, "..");
const extensionRoot = resolve(
  baseRoot,
  "../Package Visualizer + ISV Tooling Agentforce Extension"
);
const phaseIndex = process.argv.indexOf("--phase");
const phase = phaseIndex === -1 ? "" : process.argv[phaseIndex + 1];
const baseVersionIndex = process.argv.indexOf("--base-version-id");
const baseVersionId =
  baseVersionIndex === -1 ? "" : process.argv[baseVersionIndex + 1];
const failures = [];

if (!new Set(["base", "extension"]).has(phase)) {
  throw new Error("Use --phase base or --phase extension.");
}

function requireText(path, expected, message) {
  if (!readFileSync(path, "utf8").includes(expected)) {
    failures.push(message);
  }
}

function filesUnder(path) {
  if (!existsSync(path)) {
    return [];
  }
  const values = [];
  for (const entry of readdirSync(path)) {
    const child = join(path, entry);
    if (statSync(child).isDirectory()) {
      values.push(...filesUnder(child));
    } else {
      values.push(child);
    }
  }
  return values;
}

function requireCleanPackageDirectory(repositoryRoot, label) {
  const result = spawnSync(
    "git",
    ["status", "--porcelain", "--", "force-app"],
    { cwd: repositoryRoot, encoding: "utf8" }
  );
  if (result.status !== 0 || result.stdout.trim()) {
    failures.push(`${label} force-app must be clean before package creation.`);
  }
}

function requireSuccessfulCheck(scriptName, args, label) {
  const result = spawnSync(
    process.execPath,
    [join(scriptDirectory, scriptName), ...args],
    { cwd: baseRoot, encoding: "utf8" }
  );
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    failures.push(`${label} failed${detail ? `: ${detail}` : "."}`);
  }
}

requireSuccessfulCheck(
  "sync-package-visualizer-agent-script.mjs",
  ["--check"],
  "AgentScript showcase drift check"
);
requireSuccessfulCheck(
  "check-agentforce-package-boundaries.mjs",
  [],
  "Agentforce package-boundary check"
);

requireText(
  join(
    baseRoot,
    "force-app/main/default/objects/Package_Visualizer_Extension__mdt/Package_Visualizer_Extension__mdt.object-meta.xml"
  ),
  "<visibility>Protected</visibility>",
  "Package_Visualizer_Extension__mdt must be Protected."
);
requireText(
  join(
    baseRoot,
    "force-app/main/default/customMetadata/Package_Visualizer_Extension.Agentforce.md-meta.xml"
  ),
  "<protected>true</protected>",
  "The Agentforce extension registry record must be protected."
);
requireText(
  join(
    baseRoot,
    "force-app/main/default/objects/Integration_Settings__c/Integration_Settings__c.object-meta.xml"
  ),
  "<visibility>Protected</visibility>",
  "Integration_Settings__c must be Protected."
);

const showcaseSource = readFileSync(
  join(
    baseRoot,
    "force-app/main/default/lwc/inAppGuidanceCard/agentScriptsData.js"
  ),
  "utf8"
);
if (
  showcaseSource.includes('id: "isv-agent-employee"') ||
  showcaseSource.includes('id: "subscriber-agent-employee"')
) {
  failures.push(
    "Remove the pilot ISV and Subscriber Agent showcase entries before packaging."
  );
}

const packagedAgentScriptPath = join(
  baseRoot,
  "force-app/main/default/lwc/inAppGuidanceCard/packageVisualizerAgentScriptGenerated.js"
);
requireText(
  packagedAgentScriptPath,
  "PACKAGE_VISUALIZER_AGENT_SCRIPT_SOURCE_VERSION = 6",
  "The packaged Package Visualizer Agent showcase must use version 6 data."
);
for (const className of [
  "AgentforcePackagePortfolioAction",
  "AgentforcePackageDetailAction",
  "AgentforcePackageBuildDiagnosisAction",
  "AgentforcePackageBuildComparisonAction",
  "AgentforcePackageVersionReadinessAction",
  "AgentforceSubscriberSupportAction",
  "AgentforcePushJobDiagnosisAction",
  "AgentforcePushRequestAnalysisAction",
  "AgentforcePushRequestComparisonAction"
]) {
  requireText(
    packagedAgentScriptPath,
    `apex://pkgviz__${className}`,
    `The packaged AgentScript showcase must namespace-qualify ${className}.`
  );
}
if (
  /apex:\/\/(?!pkgviz__)/.test(readFileSync(packagedAgentScriptPath, "utf8"))
) {
  failures.push(
    "The packaged AgentScript showcase contains an Apex target without the pkgviz__ namespace."
  );
}

for (const [root, label] of [
  [baseRoot, "Base"],
  [extensionRoot, "Extension"]
]) {
  for (const metadataType of [
    "aiAuthoringBundles",
    "bots",
    "genAiPlannerBundles"
  ]) {
    const files = filesUnder(
      join(root, "force-app/main/default", metadataType)
    );
    if (files.length > 0) {
      failures.push(
        `${label} force-app still contains unpackaged ${metadataType} metadata.`
      );
    }
  }
}

const baseProject = JSON.parse(
  readFileSync(join(baseRoot, "sfdx-project.json"), "utf8")
);
const baseDirectory = baseProject.packageDirectories[0];
if (baseDirectory.versionNumber !== "9.27.0.NEXT") {
  failures.push("Base versionNumber must be 9.27.0.NEXT.");
}
if (baseDirectory.ancestorVersion !== "9.26.0") {
  failures.push("Base ancestorVersion must be 9.26.0.");
}
const registrySource = readFileSync(
  join(
    baseRoot,
    "force-app/main/default/customMetadata/Package_Visualizer_Extension.Agentforce.md-meta.xml"
  ),
  "utf8"
);
if (
  baseDirectory.versionNumber === "9.27.0.NEXT" &&
  registrySource.includes(">1.7.0-1</value>")
) {
  failures.push(
    "Base 9.27 cannot ship with an exact 1.7.0-1 extension target when extension 1.8 depends on the new base 04t. Resolve the version-coordination policy first."
  );
}

requireCleanPackageDirectory(baseRoot, "Base");

if (phase === "extension") {
  if (!/^04t[a-zA-Z0-9]{15}$/.test(baseVersionId)) {
    failures.push("Pass the newly created base 04t with --base-version-id.");
  }
  const extensionProject = JSON.parse(
    readFileSync(join(extensionRoot, "sfdx-project.json"), "utf8")
  );
  const extensionDirectory = extensionProject.packageDirectories[0];
  if (extensionDirectory.versionNumber !== "1.8.0.NEXT") {
    failures.push("Extension versionNumber must be 1.8.0.NEXT.");
  }
  if (extensionDirectory.ancestorVersion !== "1.7.0") {
    failures.push("Extension ancestorVersion must be 1.7.0.");
  }
  if (extensionDirectory.dependencies?.[0]?.package !== baseVersionId) {
    failures.push(
      "Extension dependency must match the newly created base 04t."
    );
  }
  requireCleanPackageDirectory(extensionRoot, "Extension");
}

if (failures.length > 0) {
  throw new Error(`Packaging preflight failed:\n- ${failures.join("\n- ")}`);
}

console.log(`${phase} Agentforce packaging preflight passed.`);
