import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const clientDirectory = path.join(projectRoot, "dist", "client");
const pagesDirectory = path.join(projectRoot, "dist", "pages");
const serverEntry = path.join(projectRoot, "dist", "server", "index.js");

await rm(pagesDirectory, { force: true, recursive: true });
await mkdir(pagesDirectory, { recursive: true });
await cp(clientDirectory, pagesDirectory, { recursive: true });

const serverUrl = pathToFileURL(serverEntry);
serverUrl.searchParams.set("pages-build", Date.now().toString());
const { default: worker } = await import(serverUrl.href);

const response = await worker.fetch(
  new Request("http://localhost/", {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    passThroughOnException() {},
    waitUntil() {},
  },
);

if (!response.ok) {
  throw new Error(`Static page render failed with HTTP ${response.status}.`);
}

const html = await response.text();
const basePath = process.env.VITE_BASE_PATH ?? "/";
if (basePath !== "/" && !html.includes(basePath)) {
  throw new Error(`Rendered HTML does not contain the base path ${basePath}.`);
}

const indexPath = path.join(pagesDirectory, "index.html");
await writeFile(indexPath, html, "utf8");
await copyFile(indexPath, path.join(pagesDirectory, "404.html"));
await writeFile(path.join(pagesDirectory, ".nojekyll"), "", "utf8");

console.log(`GitHub Pages output created at ${pagesDirectory}.`);
