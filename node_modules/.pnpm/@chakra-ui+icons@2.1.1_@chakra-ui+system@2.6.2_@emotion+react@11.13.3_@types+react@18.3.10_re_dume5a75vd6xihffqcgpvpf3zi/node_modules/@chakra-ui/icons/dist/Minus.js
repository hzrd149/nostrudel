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

// src/Minus.tsx
var Minus_exports = {};
__export(Minus_exports, {
  MinusIcon: () => MinusIcon
});
module.exports = __toCommonJS(Minus_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var MinusIcon = (0, import_icon.createIcon)({
  displayName: "MinusIcon",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { height: "4", width: "20", x: "2", y: "10" }) })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MinusIcon
});
//# sourceMappingURL=Minus.js.map