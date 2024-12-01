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

// src/ChevronLeft.tsx
var ChevronLeft_exports = {};
__export(ChevronLeft_exports, {
  ChevronLeftIcon: () => ChevronLeftIcon
});
module.exports = __toCommonJS(ChevronLeft_exports);
var import_icon = require("@chakra-ui/icon");
var ChevronLeftIcon = (0, import_icon.createIcon)({
  d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  displayName: "ChevronLeftIcon"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChevronLeftIcon
});
//# sourceMappingURL=ChevronLeft.js.map