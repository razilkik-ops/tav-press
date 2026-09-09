import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { stripBasePath, withBasePath } from "../src/pathing.js";
import { SITE_ORIGIN, services } from "../src/serviceData.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDirectory = path.join(projectRoot, "dist", "client");
const readClientFile = (...parts) => readFile(path.join(clientDirectory, ...parts), "utf8");

test("base-path helpers preserve routes inside the project site", () => {
  assert.equal(withBasePath("/", "/tav-press/"), "/tav-press/");
  assert.equal(withBasePath("/#services", "/tav-press/"), "/tav-press/#services");
  assert.equal(withBasePath("/assets/tooling.jpg", "/tav-press/"), "/tav-press/assets/tooling.jpg");
  assert.equal(stripBasePath("/tav-press/", "/tav-press/"), "/");
  assert.equal(stripBasePath("/tav-press/press-formy-dlya-rti/", "/tav-press/"), "/press-formy-dlya-rti");
});

test("Pages artifact uses the repository base path", async () => {
  const indexHtml = await readClientFile("index.html");
  assert.ok(indexHtml.includes('/tav-press/assets/'));
  assert.ok(!indexHtml.includes('src="/assets/'));
  assert.ok(indexHtml.includes(`rel="canonical" href="${SITE_ORIGIN}/"`));

  for (const service of services) {
    const routeHtml = await readClientFile(service.slug, "index.html");
    assert.ok(routeHtml.includes('/tav-press/assets/'));
    assert.ok(routeHtml.includes(`rel="canonical" href="${SITE_ORIGIN}${service.path}/"`));
    assert.ok(routeHtml.includes('href="/tav-press/"'));
  }
});

test("Pages artifact contains static fallback files", async () => {
  await access(path.join(clientDirectory, "404.html"));
  await access(path.join(clientDirectory, ".nojekyll"));
});

test("public SEO discovery files point at the deployed Pages origin", async () => {
  const [robots, sitemap] = await Promise.all([
    readClientFile("robots.txt"),
    readClientFile("sitemap.xml"),
  ]);

  assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
  assert.ok(sitemap.includes(`<loc>${SITE_ORIGIN}/</loc>`));
  for (const service of services) {
    assert.ok(sitemap.includes(`<loc>${SITE_ORIGIN}${service.path}/</loc>`));
  }
});
