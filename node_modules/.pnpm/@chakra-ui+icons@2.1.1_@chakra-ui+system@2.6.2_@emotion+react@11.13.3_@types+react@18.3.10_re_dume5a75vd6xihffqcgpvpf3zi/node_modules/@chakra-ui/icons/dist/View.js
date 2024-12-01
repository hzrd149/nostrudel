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

// src/View.tsx
var View_exports = {};
__export(View_exports, {
  ViewIcon: () => ViewIcon
});
module.exports = __toCommonJS(View_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var ViewIcon = (0, import_icon.createIcon)({
  displayName: "ViewIcon",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: "currentColor", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M23.432,10.524C20.787,7.614,16.4,4.538,12,4.6,7.6,4.537,3.213,7.615.568,10.524a2.211,2.211,0,0,0,0,2.948C3.182,16.351,7.507,19.4,11.839,19.4h.308c4.347,0,8.671-3.049,11.288-5.929A2.21,2.21,0,0,0,23.432,10.524ZM7.4,12A4.6,4.6,0,1,1,12,16.6,4.6,4.6,0,0,1,7.4,12Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "2" })
  ] })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ViewIcon
});
//# sourceMappingURL=View.js.map