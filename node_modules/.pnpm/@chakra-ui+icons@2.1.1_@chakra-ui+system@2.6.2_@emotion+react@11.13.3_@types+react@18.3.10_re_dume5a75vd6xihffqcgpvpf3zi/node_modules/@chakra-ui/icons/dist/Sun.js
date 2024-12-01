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

// src/Sun.tsx
var Sun_exports = {};
__export(Sun_exports, {
  SunIcon: () => SunIcon
});
module.exports = __toCommonJS(Sun_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var SunIcon = (0, import_icon.createIcon)({
  displayName: "SunIcon",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "g",
    {
      strokeLinejoin: "round",
      strokeLinecap: "round",
      strokeWidth: "2",
      fill: "none",
      stroke: "currentColor",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "5" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 1v2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 21v2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.22 4.22l1.42 1.42" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.36 18.36l1.42 1.42" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M1 12h2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 12h2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.22 19.78l1.42-1.42" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.36 5.64l1.42-1.42" })
      ]
    }
  )
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SunIcon
});
//# sourceMappingURL=Sun.js.map