import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import archiver from "archiver";
import AdmZip from "adm-zip";

const version = "0.1.0";
const releaseDir = "dist-release";
const archivePath = join(
  releaseDir,
  `transit-pulse-sandbox-${version}-web.zip`,
);
const extractionDir = join(releaseDir, ".package-smoke");
const runNpm = (command: string) =>
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", `npm run ${command}`], {
        stdio: "inherit",
      })
    : spawnSync("npm", ["run", command], { stdio: "inherit" });
if (runNpm("build").status !== 0) throw new Error("npm run build failed.");
await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });
if (runNpm("demo").status !== 0) throw new Error("npm run demo failed.");
const output = createWriteStream(archivePath);
const zip = archiver("zip", { zlib: { level: 9 } });
const finished = new Promise<void>((resolve, reject) => {
  output.on("close", resolve);
  zip.on("error", reject);
});
zip.pipe(output);
zip.directory("dist", "transit-pulse-sandbox");
await zip.finalize();
await finished;
await access(archivePath);
await rm(extractionDir, { recursive: true, force: true });
new AdmZip(archivePath).extractAllTo(extractionDir, true);
await access(join(extractionDir, "transit-pulse-sandbox", "index.html"));
await rm(extractionDir, { recursive: true, force: true });
const checksum = createHash("sha256")
  .update(await readFile(archivePath))
  .digest("hex");
await writeFile(
  join(releaseDir, "SHA256SUMS.txt"),
  `${checksum}  ${archivePath.replaceAll("\\", "/")}` + "\n",
);
console.log(`Packaged ${archivePath} (${checksum}).`);
