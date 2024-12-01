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

// src/Time.tsx
var Time_exports = {};
__export(Time_exports, {
  TimeIcon: () => TimeIcon
});
module.exports = __toCommonJS(Time_exports);
var import_icon = require("@chakra-ui/icon");
var import_jsx_runtime = require("react/jsx-runtime");
var TimeIcon = (0, import_icon.createIcon)({
  displayName: "TimeIcon",
  path: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: "currentColor", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm0,22A10,10,0,1,1,22,12,10.011,10.011,0,0,1,12,22Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.134,15.81,12.5,11.561V6.5a1,1,0,0,0-2,0V12a1,1,0,0,0,.324.738l4.959,4.545a1.01,1.01,0,0,0,1.413-.061A1,1,0,0,0,17.134,15.81Z" })
  ] })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TimeIcon
});
//# sourceMappingURL=Time.js.map