#!/usr/bin/env node

/*
 * Create a Cloudflare Tunnel to the local Next.js dev server and save the
 * public URL to `.frontend_tunnel_url` in the project root. Inspired by the
 * backend tunnel script.
 */

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const BIN_DIR = path.join(PROJECT_ROOT, "bin");
const SAVED_URL_FILE = path.join(PROJECT_ROOT, ".frontend_tunnel_url");

const DEFAULT_PORT = 9002;
const port = Number.parseInt(
  process.env.FRONTEND_PORT || process.env.PORT || `${DEFAULT_PORT}`,
  10
);

const log = (...args) => {
  console.log("[frontend-tunnel]", ...args);
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const which = (cmd) => {
  try {
    const res = spawnSync("which", [cmd], { encoding: "utf8" });
    if (res.status === 0) return res.stdout.trim();
  } catch (error) {
    log("which command failed:", error);
  }
  return null;
};

const download = (url, destPath) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          download(res.headers.location, destPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => reject(err));
  });

async function ensureCloudflared() {
  const explicit = process.env.CLOUDFLARED_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const inPath = which("cloudflared");
  if (inPath) return inPath;

  ensureDir(BIN_DIR);
  const target = path.join(BIN_DIR, "cloudflared");
  if (fs.existsSync(target)) return target;

  const downloadUrl =
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64";
  log("Downloading cloudflared binary ...");
  const tmpTarget = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    await download(downloadUrl, tmpTarget);
    fs.chmodSync(tmpTarget, 0o755);
    fs.renameSync(tmpTarget, target);
    log("Binary stored at", target);
  } catch (err) {
    if (fs.existsSync(tmpTarget)) {
      try {
        fs.unlinkSync(tmpTarget);
      } catch (unlinkErr) {
        log("Failed to clean temp file:", unlinkErr);
      }
    }
    throw err;
  }
  return target;
}

const saveUrl = (url) => {
  fs.writeFileSync(SAVED_URL_FILE, `${url.trim()}\n`, "utf8");
  log("Saved tunnel URL to", path.relative(PROJECT_ROOT, SAVED_URL_FILE));
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  if (!Number.isFinite(port)) {
    throw new Error("Invalid dev server port");
  }

  const targetUrl = `http://127.0.0.1:${port}`;
  const cfPath = await ensureCloudflared();
  await delay(100);
  log("Starting Cloudflare tunnel for", targetUrl);

  const proc = spawn(cfPath, ["tunnel", "--url", targetUrl], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  const onData = (buf) => {
    const text = buf.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
    if (match) saveUrl(match[0]);
    process.stdout.write(text.replace(/^/gm, "[cloudflared] "));
  };

  proc.stdout?.on("data", onData);
  proc.stderr?.on("data", onData);

  const shutdown = (sig) => {
    log(`Received ${sig}, stopping tunnel ...`);
    proc.kill(sig);
  };

  ["SIGINT", "SIGTERM"].forEach((sig) => {
    process.on(sig, () => shutdown(sig));
  });

  return new Promise((resolve) => {
    proc.on("close", (code) => {
      log("cloudflared exited with code", code ?? "null");
      resolve(code ?? 0);
    });
  });
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("[frontend-tunnel] Failed:", err);
    process.exit(1);
  });
