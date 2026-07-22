import { spawnSync } from "node:child_process";

const runNpm = (command: string) =>
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", `npm run ${command}`], {
        stdio: "inherit",
      })
    : spawnSync("npm", ["run", command], { stdio: "inherit" });
for (const command of [
  "lint",
  "typecheck",
  "test:coverage",
  "test:e2e",
  "build",
]) {
  const result = runNpm(command);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
