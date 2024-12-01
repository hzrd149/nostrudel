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

// src/ChevronUp.tsx
var ChevronUp_exports = {};
__export(ChevronUp_exports, {
  ChevronUpIcon: () => ChevronUpIcon
});
module.exports = __toCommonJS(ChevronUp_exports);
var import_icon = require("@chakra-ui/icon");
var ChevronUpIcon = (0, import_icon.createIcon)({
  d: "M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z",
  displayName: "ChevronUpIcon"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChevronUpIcon
});
//# sourceMappingURL=ChevronUp.js.map