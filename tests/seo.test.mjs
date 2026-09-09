import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { SITE_ORIGIN, services } from "../src/serviceData.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDirectory = path.join(projectRoot, "dist", "client");
const readClientFile = (...parts) => readFile(path.join(clientDirectory, ...parts), "utf8");
const normalizePath = (service) => (service.path || `/${service.slug}`).replace(/^([^/])/, "/$1").replace(/\/$/, "");
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeText = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escapeAttribute = (value) =>
  escapeText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const getViteAssets = (html) =>
  [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((match) => match[1]).sort();

test("emits one statically indexable HTML document per service", async () => {
  assert.equal(services.length, 6);
  const baseHtml = await readClientFile("index.html");
  const baseAssets = getViteAssets(baseHtml);
  assert.ok(baseAssets.length >= 2, "base build should contain JavaScript and CSS assets");

  for (const service of services) {
    const routePath = normalizePath(service);
    const html = await readClientFile(routePath.slice(1), "index.html");
    const canonical = `${SITE_ORIGIN}${routePath}/`;

    assert.match(html, new RegExp(`<title>${escapeRegex(service.metaTitle)}</title>`));
    assert.ok(html.includes(`name="description" content="${escapeAttribute(service.metaDescription)}"`));
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
    assert.ok(html.includes('name="robots" content="index, follow, max-image-preview:large"'));
    assert.ok(html.includes('property="og:title"'));
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
    assert.ok(html.includes('"@type":"Service"'));
    assert.ok(html.includes('"@type":"BreadcrumbList"'));
    assert.ok(html.includes('"@type":"FAQPage"'));
    assert.ok(html.includes("<noscript>"));
    assert.ok(html.includes(`<h1>${escapeText(service.h1 || service.title)}</h1>`));
    assert.deepEqual(getViteAssets(html), baseAssets, "service document must preserve Vite assets");
  }
});

test("service titles, descriptions and canonical URLs are unique", () => {
  const values = services.map((service) => ({
    title: service.metaTitle,
    description: service.metaDescription,
    canonical: `${SITE_ORIGIN}${normalizePath(service)}/`,
  }));

  for (const key of ["title", "description", "canonical"]) {
    assert.equal(new Set(values.map((value) => value[key])).size, services.length, `${key} must be unique`);
  }
});

test("robots and sitemap expose every public service route", async () => {
  const [robots, sitemap] = await Promise.all([
    readClientFile("robots.txt"),
    readClientFile("sitemap.xml"),
  ]);

  assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
  assert.ok(sitemap.includes(`<loc>${SITE_ORIGIN}/</loc>`));
  for (const service of services) {
    assert.ok(sitemap.includes(`<loc>${SITE_ORIGIN}${normalizePath(service)}/</loc>`));
  }
});
