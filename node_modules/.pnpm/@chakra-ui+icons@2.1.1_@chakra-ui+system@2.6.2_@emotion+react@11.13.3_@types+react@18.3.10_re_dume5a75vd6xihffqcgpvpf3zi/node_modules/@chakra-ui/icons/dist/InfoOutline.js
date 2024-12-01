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

// src/InfoOutline.tsx
var InfoOutline_exports = {};
__export(InfoOutline_exports, {
  InfoOutlineIcon: () => InfoOutlineIcon
});
module.exports = __toCommonJS(InfoOutline_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var InfoOutlineIcon = (0, import_icon.createIcon)({
  displayName: "InfoOutlineIcon",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "g",
    {
      fill: "currentColor",
      stroke: "currentColor",
      strokeLinecap: "square",
      strokeWidth: "2",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", fill: "none", r: "11", stroke: "currentColor" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { fill: "none", x1: "11.959", x2: "11.959", y1: "11", y2: "17" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "11.959", cy: "7", r: "1", stroke: "none" })
      ]
    }
  )
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InfoOutlineIcon
});
//# sourceMappingURL=InfoOutline.js.map