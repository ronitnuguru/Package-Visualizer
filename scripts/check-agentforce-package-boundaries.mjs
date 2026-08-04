import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const extensionRoot = resolve(
  repositoryRoot,
  "../Package Visualizer + ISV Tooling Agentforce Extension"
);
const sourceRoot = join(repositoryRoot, "force-app/main/default");
const extensionSourceRoot = join(extensionRoot, "force-app/main/default");
const registryPath = join(
  sourceRoot,
  "customMetadata/Package_Visualizer_Extension.Agentforce.md-meta.xml"
);
const registryXml = readFileSync(registryPath, "utf8");
const targetMatch = registryXml.match(
  /<field>Target_Package_Version_Id__c<\/field>[\s\S]*?<value[^>]*>(04t[a-zA-Z0-9]{15})<\/value>/
);

if (!targetMatch) {
  throw new Error(
    "The Agentforce extension registry has no valid target 04t ID."
  );
}

const extensionActionClasses = new Set(
  readdirSync(join(extensionSourceRoot, "classes"))
    .filter((name) => name.endsWith(".cls"))
    .map((name) => name.slice(0, -4))
);
const expectedPermissionEntries = new Set([
  "AgentforcePackagePortfolioAction",
  "AgentforcePackageDetailAction",
  "AgentforcePackageBuildDiagnosisAction",
  "AgentforcePackageBuildComparisonAction",
  "AgentforcePackageVersionReadinessAction",
  "AgentforceSubscriberSupportAction",
  "AgentforcePushJobDiagnosisAction",
  "AgentforcePushRequestAnalysisAction",
  "AgentforcePushRequestComparisonAction"
]);
const extensionProject = JSON.parse(
  readFileSync(join(extensionRoot, "sfdx-project.json"), "utf8")
);
const forbiddenVersionIds = new Set([
  targetMatch[1],
  ...Object.values(extensionProject.packageAliases || {}).filter((value) =>
    /^04t[a-zA-Z0-9]{15}$/.test(value)
  )
]);
const textExtensions = new Set([
  ".cls",
  ".css",
  ".html",
  ".js",
  ".json",
  ".xml"
]);

function filesUnder(directory) {
  const values = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      values.push(...filesUnder(path));
    } else if (textExtensions.has(extname(path))) {
      values.push(path);
    }
  }
  return values;
}

const violations = [];
for (const path of filesUnder(sourceRoot)) {
  if (path === registryPath) {
    continue;
  }
  const source = readFileSync(path, "utf8");
  for (const versionId of forbiddenVersionIds) {
    if (source.includes(versionId)) {
      violations.push(
        `${path}: hardcoded Agentforce extension version ${versionId}`
      );
    }
  }
  if (path.includes("/lwc/")) {
    for (const className of extensionActionClasses) {
      if (source.includes(`@salesforce/apex/${className}`)) {
        violations.push(
          `${path}: base LWC imports extension Apex ${className}`
        );
      }
    }
  }
}

const extensionPermissionSource = readFileSync(
  join(
    extensionSourceRoot,
    "permissionsets/Package_Visualizer_Agentforce_Extension_Permissions.permissionset-meta.xml"
  ),
  "utf8"
);
const permissionEntries = new Set(
  [
    ...extensionPermissionSource.matchAll(/<apexClass>([^<]+)<\/apexClass>/g)
  ].map((match) => match[1])
);
for (const className of permissionEntries) {
  if (!expectedPermissionEntries.has(className)) {
    violations.push(
      `Package_Visualizer_Agentforce_Extension_Permissions grants unrelated Apex ${className}`
    );
  }
}
for (const className of expectedPermissionEntries) {
  if (!permissionEntries.has(className)) {
    violations.push(
      `Package_Visualizer_Agentforce_Extension_Permissions is missing ${className}`
    );
  }
}

if (violations.length > 0) {
  throw new Error(
    `Agentforce package-boundary violations:\n${violations.join("\n")}`
  );
}

console.log("Agentforce package boundaries are clean.");
