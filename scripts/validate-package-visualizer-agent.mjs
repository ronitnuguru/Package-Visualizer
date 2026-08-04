import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const source = resolve(
  repositoryRoot,
  "../Package Visualizer + ISV Tooling Agentforce Extension/my-unpackaged-directory/aiAuthoringBundles/Package_Visualizer_Agent"
);
const targetIndex = process.argv.indexOf("--target-org");
const targetOrg = targetIndex === -1 ? "PkgViz" : process.argv[targetIndex + 1];
const temporaryProject = mkdtempSync(join(tmpdir(), "pkgviz-agent-validate-"));
const bundleParent = join(
  temporaryProject,
  "force-app/main/default/aiAuthoringBundles"
);

try {
  mkdirSync(bundleParent, { recursive: true });
  cpSync(source, join(bundleParent, "Package_Visualizer_Agent"), {
    recursive: true
  });
  writeFileSync(
    join(temporaryProject, "sfdx-project.json"),
    JSON.stringify(
      {
        packageDirectories: [{ path: "force-app", default: true }],
        name: "Package Visualizer Agent Validation",
        namespace: "pkgviz",
        sourceApiVersion: "66.0"
      },
      null,
      2
    ) + "\n"
  );

  const result = spawnSync(
    "sf",
    [
      "agent",
      "validate",
      "authoring-bundle",
      "--json",
      "--api-name",
      "Package_Visualizer_Agent",
      "--target-org",
      targetOrg
    ],
    { cwd: temporaryProject, encoding: "utf8" }
  );
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(temporaryProject, { recursive: true, force: true });
}
