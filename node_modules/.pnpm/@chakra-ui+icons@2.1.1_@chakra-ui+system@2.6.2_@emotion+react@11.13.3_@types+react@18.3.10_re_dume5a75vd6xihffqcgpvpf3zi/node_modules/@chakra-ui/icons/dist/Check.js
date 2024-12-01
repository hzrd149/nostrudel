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

// src/Check.tsx
var Check_exports = {};
__export(Check_exports, {
  CheckIcon: () => CheckIcon
});
module.exports = __toCommonJS(Check_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var CheckIcon = (0, import_icon.createIcon)({
  viewBox: "0 0 14 14",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", { points: "5.5 11.9993304 14 3.49933039 12.5 2 5.5 8.99933039 1.5 4.9968652 0 6.49933039" }) })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CheckIcon
});
//# sourceMappingURL=Check.js.map