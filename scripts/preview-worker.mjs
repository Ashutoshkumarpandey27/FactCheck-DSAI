import http from "node:http";
import { spawn } from "node:child_process";
import worker from "../dist/server/index.js";

const nativeFetch = globalThis.fetch;

function curlConfigValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\r", "").replaceAll("\n", "");
}

async function curlFetch(input, init = {}) {
  const request = input instanceof Request ? input : new Request(input, init);
  const url = new URL(request.url);

  if (process.platform === "win32" || ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    return nativeFetch(input, init);
  }

  const headers = [...request.headers].map(
    ([name, value]) => `header = "${curlConfigValue(`${name}: ${value}`)}"`,
  );
  const config = [
    "silent",
    "show-error",
    "location",
    "max-time = 120",
    `request = "${curlConfigValue(request.method)}"`,
    ...headers,
  ].join("\n");
  const body = request.method === "GET" || request.method === "HEAD" ? null : Buffer.from(await request.arrayBuffer());

  return await new Promise((resolve, reject) => {
    const args = ["--config", "/dev/fd/3", "--write-out", "\n__SACHCHECK_HTTP_STATUS__:%{http_code}\n__SACHCHECK_CONTENT_TYPE__:%{content_type}"];
    if (body) args.push("--data-binary", "@-");
    args.push(url.toString());

    const child = spawn("curl", args, { stdio: ["pipe", "pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    const abort = () => child.kill("SIGTERM");

    request.signal?.addEventListener("abort", abort, { once: true });
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      request.signal?.removeEventListener("abort", abort);
      if (request.signal?.aborted) {
        reject(request.signal.reason ?? new DOMException("The operation was aborted", "AbortError"));
        return;
      }
      if (code !== 0) {
        reject(new Error(Buffer.concat(stderr).toString("utf8").trim() || `curl exited with code ${code}`));
        return;
      }

      const output = Buffer.concat(stdout).toString("utf8");
      const marker = "\n__SACHCHECK_HTTP_STATUS__:";
      const markerIndex = output.lastIndexOf(marker);
      if (markerIndex < 0) {
        reject(new Error("OpenAI response did not include an HTTP status"));
        return;
      }
      const metadata = output.slice(markerIndex + marker.length).trim();
      const typeMarker = "\n__SACHCHECK_CONTENT_TYPE__:";
      const typeIndex = metadata.indexOf(typeMarker);
      const status = Number((typeIndex < 0 ? metadata : metadata.slice(0, typeIndex)).trim());
      const contentType = typeIndex < 0 ? "application/octet-stream" : metadata.slice(typeIndex + typeMarker.length).trim();
      resolve(new Response(output.slice(0, markerIndex), {
        status,
        headers: { "content-type": contentType || "application/octet-stream" },
      }));
    });

    child.stdio[3].end(config);
    child.stdin.end(body ?? undefined);
  });
}

// Some macOS environments allow curl but block direct sockets from Node. Route
// the local preview's provider and evidence requests through curl while keeping
// the production worker unchanged.
globalThis.fetch = curlFetch;

const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=chunks.length?Buffer.concat(chunks):undefined;const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers,body,duplex:body?'half':undefined});const response=await worker.fetch(request,{});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch(error){res.writeHead(500,{'content-type':'text/plain'});res.end(error.stack)}});
server.listen(port,"127.0.0.1",()=>console.log(`SachCheck preview: http://127.0.0.1:${port}`));
