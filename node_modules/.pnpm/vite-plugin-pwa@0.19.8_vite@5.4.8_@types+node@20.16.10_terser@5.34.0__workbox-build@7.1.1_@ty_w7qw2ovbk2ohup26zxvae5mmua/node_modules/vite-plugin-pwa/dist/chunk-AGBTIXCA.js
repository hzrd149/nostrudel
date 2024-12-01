import {
  cyan,
  dim,
  green,
  magenta,
  yellow
} from "./chunk-UB6OAFZF.js";

// src/utils.ts
function slash(str) {
  return str.replace(/\\/g, "/");
}
function resolveBasePath(base) {
  if (isAbsolute(base))
    return base;
  return !base.startsWith("/") && !base.startsWith("./") ? `/${base}` : base;
}
function isAbsolute(url) {
  return url.match(/^(?:[a-z]+:)?\/\//i);
}
function normalizePath(path) {
  return path.replace(/\\/g, "/");
}

// src/log.ts
import { relative } from "node:path";

// package.json
var version = "0.19.8";

// src/log.ts
function logSWViteBuild(swName, viteOptions, format) {
  const { logLevel = "info" } = viteOptions;
  if (logLevel === "silent")
    return;
  if (logLevel === "info") {
    console.info([
      "",
      `${cyan(`PWA v${version}`)}`,
      `Building ${magenta(swName)} service worker ("${magenta(format)}" format)...`
    ].join("\n"));
  }
}
function logWorkboxResult(strategy, buildResult, viteOptions, format = "none") {
  const { root, logLevel = "info" } = viteOptions;
  if (logLevel === "silent")
    return;
  const { count, size, filePaths, warnings } = buildResult;
  if (logLevel === "info") {
    const entries = [
      "",
      `${cyan(`PWA v${version}`)}`,
      `mode      ${magenta(strategy)}`
    ];
    if (strategy === "injectManifest")
      entries.push(`format:   ${magenta(format)}`);
    entries.push(
      `precache  ${green(`${count} entries`)} ${dim(`(${(size / 1024).toFixed(2)} KiB)`)}`,
      "files generated",
      ...filePaths.map((p) => `  ${dim(normalizePath(relative(root, p)))}`)
    );
    console.info(entries.join("\n"));
  }
  warnings && warnings.length > 0 && console.warn(yellow([
    "warnings",
    ...warnings.map((w) => `  ${w}`),
    ""
  ].join("\n")));
}

export {
  version,
  slash,
  resolveBasePath,
  normalizePath,
  logSWViteBuild,
  logWorkboxResult
};
