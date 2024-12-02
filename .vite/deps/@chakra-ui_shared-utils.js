import "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/@chakra-ui+shared-utils@2.0.4/node_modules/@chakra-ui/shared-utils/dist/index.mjs
var cx = (...classNames) => classNames.filter(Boolean).join(" ");
function isDev() {
  return true;
}
function isObject(value) {
  const type = typeof value;
  return value != null && (type === "object" || type === "function") && !Array.isArray(value);
}
var warn = (options) => {
  const { condition, message } = options;
  if (condition && isDev()) {
    console.warn(message);
  }
};
function runIfFn(valueOrFn, ...args) {
  return isFunction(valueOrFn) ? valueOrFn(...args) : valueOrFn;
}
var isFunction = (value) => typeof value === "function";
var dataAttr = (condition) => condition ? "" : void 0;
var ariaAttr = (condition) => condition ? true : void 0;
function callAllHandlers(...fns) {
  return function func(event) {
    fns.some((fn) => {
      fn == null ? void 0 : fn(event);
      return event == null ? void 0 : event.defaultPrevented;
    });
  };
}
function callAll(...fns) {
  return function mergedFn(arg) {
    fns.forEach((fn) => {
      fn == null ? void 0 : fn(arg);
    });
  };
}
export {
  ariaAttr,
  callAll,
  callAllHandlers,
  cx,
  dataAttr,
  isObject,
  runIfFn,
  warn
};
//# sourceMappingURL=@chakra-ui_shared-utils.js.map
