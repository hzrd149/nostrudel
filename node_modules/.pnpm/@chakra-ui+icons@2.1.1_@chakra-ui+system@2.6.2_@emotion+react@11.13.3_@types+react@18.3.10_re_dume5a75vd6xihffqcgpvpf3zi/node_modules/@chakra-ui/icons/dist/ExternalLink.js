'use client'
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/ExternalLink.tsx
var ExternalLink_exports = {};
__export(ExternalLink_exports, {
  ExternalLinkIcon: () => ExternalLinkIcon
});
module.exports = __toCommonJS(ExternalLink_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var ExternalLinkIcon = (0, import_icon.createIcon)({
  displayName: "ExternalLinkIcon",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M15 3h6v6" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 14L21 3" })
  ] })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExternalLinkIcon
});
//# sourceMappingURL=ExternalLink.js.map