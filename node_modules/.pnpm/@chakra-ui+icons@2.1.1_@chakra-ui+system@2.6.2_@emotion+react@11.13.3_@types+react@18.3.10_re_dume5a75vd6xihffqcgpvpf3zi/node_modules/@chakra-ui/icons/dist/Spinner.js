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

// src/Spinner.tsx
var Spinner_exports = {};
__export(Spinner_exports, {
  SpinnerIcon: () => SpinnerIcon
});
module.exports = __toCommonJS(Spinner_exports);
var import_icon = require("@chakra-ui/icon");
var import_system = require("@chakra-ui/system");
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var SpinnerIcon = (0, import_system.forwardRef)((props, ref) => {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_icon.Icon, { ref, viewBox: "0 0 24 24", ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "linearGradient",
      {
        x1: "28.154%",
        y1: "63.74%",
        x2: "74.629%",
        y2: "17.783%",
        id,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { stopColor: "currentColor", offset: "0%" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { stopColor: "#fff", stopOpacity: "0", offset: "100%" })
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { transform: "translate(2)", fill: "none", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { stroke: `url(#${id})`, strokeWidth: "4", cx: "10", cy: "12", r: "10" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          d: "M10 2C4.477 2 0 6.477 0 12",
          stroke: "currentColor",
          strokeWidth: "4"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { fill: "currentColor", x: "8", width: "4", height: "4", rx: "8" })
    ] })
  ] });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SpinnerIcon
});
//# sourceMappingURL=Spinner.js.map