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

// src/SmallClose.tsx
var SmallClose_exports = {};
__export(SmallClose_exports, {
  SmallCloseIcon: () => SmallCloseIcon
});
module.exports = __toCommonJS(SmallClose_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var SmallCloseIcon = (0, import_icon.createIcon)({
  displayName: "SmallCloseIcon",
  viewBox: "0 0 16 16",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "path",
    {
      d: "M9.41 8l2.29-2.29c.19-.18.3-.43.3-.71a1.003 1.003 0 0 0-1.71-.71L8 6.59l-2.29-2.3a1.003 1.003 0 0 0-1.42 1.42L6.59 8 4.3 10.29c-.19.18-.3.43-.3.71a1.003 1.003 0 0 0 1.71.71L8 9.41l2.29 2.29c.18.19.43.3.71.3a1.003 1.003 0 0 0 .71-1.71L9.41 8z",
      fillRule: "evenodd",
      fill: "currentColor"
    }
  )
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SmallCloseIcon
});
//# sourceMappingURL=SmallClose.js.map