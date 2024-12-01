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

// src/TriangleUp.tsx
var TriangleUp_exports = {};
__export(TriangleUp_exports, {
  TriangleUpIcon: () => TriangleUpIcon
});
module.exports = __toCommonJS(TriangleUp_exports);
var import_icon = require("@chakra-ui/icon");
var TriangleUpIcon = (0, import_icon.createIcon)({
  d: "M12.8,5.4c-0.377-0.504-1.223-0.504-1.6,0l-9,12c-0.228,0.303-0.264,0.708-0.095,1.047 C2.275,18.786,2.621,19,3,19h18c0.379,0,0.725-0.214,0.895-0.553c0.169-0.339,0.133-0.744-0.095-1.047L12.8,5.4z",
  displayName: "TriangleUpIcon"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TriangleUpIcon
});
//# sourceMappingURL=TriangleUp.js.map