import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=(path)=>readFile(resolve(root,path),"utf8");
const [template,html,css,js,notice]=await Promise.all([read("worker-src/worker.mjs"),read("workspace-src/index.html"),read("workspace-src/app.css"),read("workspace-src/app.js"),read("workspace-src/demo-source/jansetu-notice/index.html")]);
const assets=`const ASSETS=${JSON.stringify({html,css,js,notice})};`;
const output=resolve(root,"dist/server");await rm(resolve(root,"dist"),{recursive:true,force:true});await mkdir(output,{recursive:true});await writeFile(resolve(output,"index.js"),template.replace("/*__ASSETS__*/",()=>assets));
console.log(`Built Worker at ${resolve(output,"index.js")}`);
