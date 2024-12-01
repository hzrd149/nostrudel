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

// src/PlusSquare.tsx
var PlusSquare_exports = {};
__export(PlusSquare_exports, {
  PlusSquareIcon: () => PlusSquareIcon
});
module.exports = __toCommonJS(PlusSquare_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var PlusSquareIcon = (0, import_icon.createIcon)({
  displayName: "PlusSquareIcon",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { height: "18", width: "18", rx: "2", ry: "2", x: "3", y: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 8v8" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 12h8" })
  ] })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlusSquareIcon
});
//# sourceMappingURL=PlusSquare.js.map