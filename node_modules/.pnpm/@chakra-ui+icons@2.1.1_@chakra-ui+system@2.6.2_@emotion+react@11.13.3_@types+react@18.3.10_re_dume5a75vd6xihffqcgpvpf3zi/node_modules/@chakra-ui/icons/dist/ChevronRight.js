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

// src/ChevronRight.tsx
var ChevronRight_exports = {};
__export(ChevronRight_exports, {
  ChevronRightIcon: () => ChevronRightIcon
});
module.exports = __toCommonJS(ChevronRight_exports);
var import_icon = require("@chakra-ui/icon");
var ChevronRightIcon = (0, import_icon.createIcon)({
  d: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  displayName: "ChevronRightIcon"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChevronRightIcon
});
//# sourceMappingURL=ChevronRight.js.map