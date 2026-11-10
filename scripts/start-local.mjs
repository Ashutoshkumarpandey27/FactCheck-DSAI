import { spawn } from "node:child_process";

const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  console.error("SachCheck needs Node.js 22 or newer. Download it from https://nodejs.org/");
  process.exit(1);
}

await import("./build-worker.mjs");
await import("./preview-worker.mjs");

const url = "http://127.0.0.1:4173/";
const opener = process.platform === "darwin"
  ? ["open", [url]]
  : process.platform === "win32"
    ? ["cmd", ["/c", "start", "", url]]
    : ["xdg-open", [url]];

if (process.env.SACHCHECK_NO_OPEN !== "1") {
  setTimeout(() => {
    const child = spawn(opener[0], opener[1], {detached: true, stdio: "ignore"});
    child.on("error", () => {});
    child.unref();
  }, 600);
}

console.log("\nSachCheck is ready. Keep this window open while using the app.");
console.log(`If the browser does not open, visit ${url}`);
console.log("Press Ctrl+C to stop SachCheck.\n");
