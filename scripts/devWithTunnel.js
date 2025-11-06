#!/usr/bin/env node

/*
 * Start the Next.js dev server and Cloudflare tunnel together. The tunnel URL
 * is persisted by `scripts/cfTunnel.js`.
 */

const { spawn } = require("node:child_process");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function spawnProc(cmd, args, name, extraEnv = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  child.on("exit", (code, signal) => {
    console.log(`[dev] ${name} exited`, code ?? "", signal ?? "");
  });
  return child;
}

async function run() {
  console.log("[dev] Starting Next.js dev server and Cloudflare tunnel...");

  const devProc = spawnProc(npmCmd, ["run", "dev"], "dev");

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await wait(2000);

  const tunnelProc = spawnProc("node", ["scripts/cfTunnel.js"], "tunnel");

  const shutdown = (sig) => {
    console.log(`[dev] Received ${sig}, shutting down...`);
    if (!devProc.killed) devProc.kill(sig);
    if (!tunnelProc.killed) tunnelProc.kill(sig);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

run().catch((err) => {
  console.error("[dev] Failed to start combined dev/tunnel:", err);
  process.exit(1);
});
