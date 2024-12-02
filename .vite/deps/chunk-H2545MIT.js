import {
  __commonJS
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/json-stringify-deterministic@1.0.12/node_modules/json-stringify-deterministic/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/.pnpm/json-stringify-deterministic@1.0.12/node_modules/json-stringify-deterministic/lib/defaults.js"(exports, module) {
    module.exports = {
      space: "",
      cycles: false,
      replacer: (k, v) => v,
      stringify: JSON.stringify
    };
  }
});

// node_modules/.pnpm/json-stringify-deterministic@1.0.12/node_modules/json-stringify-deterministic/lib/util.js
var require_util = __commonJS({
  "node_modules/.pnpm/json-stringify-deterministic@1.0.12/node_modules/json-stringify-deterministic/lib/util.js"(exports, module) {
    "use strict";
    module.exports = {
      isArray: Array.isArray,
      assign: Object.assign,
      isObject: (v) => typeof v === "object",
      isFunction: (v) => typeof v === "function",
      isBoolean: (v) => typeof v === "boolean",
      isRegex: (v) => v instanceof RegExp,
      keys: Object.keys
    };
  }
});

// node_modules/.pnpm/json-stringify-deterministic@1.0.12/node_modules/json-stringify-deterministic/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/json-stringify-deterministic@1.0.12/node_modules/json-stringify-deterministic/lib/index.js"(exports, module) {
    var DEFAULTS = require_defaults();
    var isFunction = require_util().isFunction;
    var isBoolean = require_util().isBoolean;
    var isObject = require_util().isObject;
    var isArray = require_util().isArray;
    var isRegex = require_util().isRegex;
    var assign = require_util().assign;
    var keys = require_util().keys;
    function serialize(obj) {
      if (obj === null || obj === void 0) return obj;
      if (isRegex(obj)) return obj.toString();
      return obj.toJSON ? obj.toJSON() : obj;
    }
    function stringifyDeterministic(obj, opts) {
      opts = opts || assign({}, DEFAULTS);
      if (isFunction(opts)) opts = { compare: opts };
      const space = opts.space || DEFAULTS.space;
      const cycles = isBoolean(opts.cycles) ? opts.cycles : DEFAULTS.cycles;
      const replacer = opts.replacer || DEFAULTS.replacer;
      const stringify = opts.stringify || DEFAULTS.stringify;
      const compare = opts.compare && /* @__PURE__ */ function(f) {
        return function(node) {
          return function(a, b) {
            const aobj = { key: a, value: node[a] };
            const bobj = { key: b, value: node[b] };
            return f(aobj, bobj);
          };
        };
      }(opts.compare);
      if (!cycles) stringify(obj);
      const seen = [];
      return function _deterministic(parent, key, node, level) {
        const indent = space ? "\n" + new Array(level + 1).join(space) : "";
        const colonSeparator = space ? ": " : ":";
        node = serialize(node);
        node = replacer.call(parent, key, node);
        if (node === void 0) return;
        if (!isObject(node) || node === null) return stringify(node);
        if (isArray(node)) {
          const out = [];
          for (let i = 0; i < node.length; i++) {
            const item = _deterministic(node, i, node[i], level + 1) || stringify(null);
            out.push(indent + space + item);
          }
          return "[" + out.join(",") + indent + "]";
        } else {
          if (cycles) {
            if (seen.indexOf(node) !== -1) {
              return stringify("[Circular]");
            } else {
              seen.push(node);
            }
          }
          const nodeKeys = keys(node).sort(compare && compare(node));
          const out = [];
          for (let i = 0; i < nodeKeys.length; i++) {
            const key2 = nodeKeys[i];
            const value = _deterministic(node, key2, node[key2], level + 1);
            if (!value) continue;
            const keyValue = stringify(key2) + colonSeparator + value;
            out.push(indent + space + keyValue);
          }
          seen.splice(seen.indexOf(node), 1);
          return "{" + out.join(",") + indent + "}";
        }
      }({ "": obj }, "", obj, 0);
    }
    module.exports = stringifyDeterministic;
  }
});

export {
  require_lib
};
//# sourceMappingURL=chunk-H2545MIT.js.map
