#!/usr/bin/env node

import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDirectory = path.join(projectRoot, "dist", "client");
const indexPath = path.join(clientDirectory, "index.html");
const notFoundPath = path.join(clientDirectory, "404.html");

await copyFile(indexPath, notFoundPath);

const noJekyllPath = path.join(clientDirectory, ".nojekyll");
await writeFile(noJekyllPath, "");

const indexHtml = await readFile(indexPath, "utf8");
if (!indexHtml.includes('/tav-press/assets/')) {
  throw new Error("GitHub Pages build is missing the /tav-press/ asset base path");
}

console.log("Prepared GitHub Pages build: dist/client/404.html and .nojekyll");
