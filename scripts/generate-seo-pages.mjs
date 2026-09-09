#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_ORIGIN, services } from "../src/serviceData.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDirectory = path.join(projectRoot, "dist", "client");
const baseIndexPath = path.join(clientDirectory, "index.html");
const deploymentBasePath = `/${String(process.env.VITE_BASE_PATH || "/").replace(/^\/+|\/+$/g, "")}`.replace(/^\/$/, "");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const safeJson = (value) =>
  JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");

const normalizePath = (service) => {
  const rawPath = service.path || `/${service.slug}`;
  const withLeadingSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  return withLeadingSlash.replace(/\/$/, "");
};

const deploymentHref = (routePath = "/") => {
  const normalized = routePath === "/" ? "/" : `${routePath.replace(/\/+$/, "")}/`;
  return `${deploymentBasePath}${normalized}` || "/";
};

const stripRouteMetadata = (html) =>
  html
    .replace(/\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/\s*<meta\s+name=["']robots["'][^>]*>/gi, "")
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/\s*<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/\s*<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "")
    .replace(/\s*<script\s+type=["']application\/ld\+json["'][^>]*data-route-schema[^>]*>[\s\S]*?<\/script>/gi, "");

const createStructuredData = (service, canonicalUrl) => {
  const serviceName = service.h1 || service.title;
  const faq = Array.isArray(service.faq) ? service.faq : [];

  const graph = [
    {
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: serviceName,
      serviceType: service.title,
      description: service.metaDescription,
      url: canonicalUrl,
      provider: {
        "@type": "Organization",
        "@id": `${SITE_ORIGIN}/#organization`,
        name: "TAV PRESS FORM",
        url: `${SITE_ORIGIN}/`,
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumbs`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Главная",
          item: `${SITE_ORIGIN}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: serviceName,
          item: canonicalUrl,
        },
      ],
    },
  ];

  if (faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
};

const createNoscriptFallback = (service, routePath) => {
  const serviceName = service.h1 || service.title;
  const deliverables = Array.isArray(service.deliverables) ? service.deliverables : [];
  const process = Array.isArray(service.process) ? service.process : [];
  const faq = Array.isArray(service.faq) ? service.faq : [];

  const deliverablesMarkup = deliverables
    .map(
      (item) =>
        `<li><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></li>`,
    )
    .join("");
  const processMarkup = process
    .map(
      (item, index) =>
        `<li><h3>${escapeHtml(item.number || String(index + 1).padStart(2, "0"))}. ${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></li>`,
    )
    .join("");
  const faqMarkup = faq
    .map(
      (item) =>
        `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`,
    )
    .join("");

  return `<noscript>
      <main>
        <nav aria-label="Хлебные крошки"><a href="${escapeHtml(deploymentHref("/"))}">Главная</a> / <span aria-current="page">${escapeHtml(serviceName)}</span></nav>
        <article>
          <header>
            <p>${escapeHtml(service.eyebrow || "Производство пресс-форм")}</p>
            <h1>${escapeHtml(serviceName)}</h1>
            <p>${escapeHtml(service.lead || service.intro || service.metaDescription)}</p>
          </header>
          ${service.intro ? `<section aria-labelledby="about-service"><h2 id="about-service">Об услуге</h2><p>${escapeHtml(service.intro)}</p></section>` : ""}
          ${deliverablesMarkup ? `<section aria-labelledby="deliverables"><h2 id="deliverables">Что изготавливаем</h2><ul>${deliverablesMarkup}</ul></section>` : ""}
          ${processMarkup ? `<section aria-labelledby="service-process"><h2 id="service-process">Как проходит проект</h2><ol>${processMarkup}</ol></section>` : ""}
          ${faqMarkup ? `<section aria-labelledby="faq"><h2 id="faq">Частые вопросы</h2>${faqMarkup}</section>` : ""}
          <p><a href="${escapeHtml(deploymentHref(routePath))}">Открыть страницу услуги</a></p>
        </article>
      </main>
    </noscript>`;
};

const createRouteHtml = (baseHtml, service) => {
  const routePath = normalizePath(service);
  const canonicalUrl = `${SITE_ORIGIN}${routePath}/`;
  const title = service.metaTitle || `${service.h1 || service.title} — TAV PRESS FORM`;
  const description = service.metaDescription || service.lead || service.intro;
  const socialImage = service.image
    ? new URL(service.image.replace(/^\//, ""), `${SITE_ORIGIN}/`).href
    : `${SITE_ORIGIN}/assets/hero-press-form.png`;
  const structuredData = createStructuredData(service, canonicalUrl);

  const routeMetadata = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="TAV PRESS FORM" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(socialImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(service.imageAlt || serviceNameForAlt(service))}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
    <script type="application/ld+json" data-route-schema>${safeJson(structuredData)}</script>`;

  const fallback = createNoscriptFallback(service, routePath);
  return stripRouteMetadata(baseHtml)
    .replace("</head>", `${routeMetadata}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n    ${fallback}`);
};

const serviceNameForAlt = (service) =>
  service.h1 || service.title || "Изготовление пресс-форм TAV PRESS FORM";

const main = async () => {
  if (!SITE_ORIGIN || !Array.isArray(services) || services.length === 0) {
    throw new Error("src/serviceData.js must export SITE_ORIGIN and a non-empty services array");
  }

  const baseHtml = await readFile(baseIndexPath, "utf8");
  const seenPaths = new Set();

  for (const service of services) {
    const routePath = normalizePath(service);
    if (routePath === "/" || seenPaths.has(routePath)) {
      throw new Error(`Invalid or duplicate service path: ${routePath}`);
    }
    seenPaths.add(routePath);

    const outputDirectory = path.join(clientDirectory, routePath.slice(1));
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, "index.html"), createRouteHtml(baseHtml, service));
  }

  console.log(`Generated ${services.length} SEO service pages in dist/client`);
};

await main();
