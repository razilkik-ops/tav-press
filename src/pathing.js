export function normalizePath(pathname) {
  const clean = decodeURI(pathname || "/").replace(/\/+$/, "") || "/";
  return clean === "/index.html" ? "/" : clean;
}

export function normalizeBasePath(baseUrl = "/") {
  const clean = `/${String(baseUrl).replace(/^\/+|\/+$/g, "")}`;
  return clean === "/" ? "" : clean;
}

export function withBasePath(pathname, baseUrl = "/") {
  if (!String(pathname).startsWith("/")) return pathname;
  const basePath = normalizeBasePath(baseUrl);
  return `${basePath}${pathname}` || "/";
}

export function stripBasePath(pathname, baseUrl = "/") {
  const normalized = normalizePath(pathname);
  const basePath = normalizeBasePath(baseUrl);

  if (!basePath) return normalized;
  if (normalized === basePath) return "/";
  if (normalized.startsWith(`${basePath}/`)) {
    return normalizePath(normalized.slice(basePath.length));
  }

  return normalized;
}
