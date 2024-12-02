import {
  __assign,
  __rest,
  __spreadArrays,
  init_tslib_es6,
  require_copy_to_clipboard,
  tslib_es6_exports
} from "./chunk-5LLG7LJ2.js";
import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __commonJS,
  __toCommonJS,
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/react.js
var require_react2 = __commonJS({
  "node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/react.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (key === "_owner" && a.$$typeof) {
            continue;
          }
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// node_modules/.pnpm/js-cookie@2.2.1/node_modules/js-cookie/src/js.cookie.js
var require_js_cookie = __commonJS({
  "node_modules/.pnpm/js-cookie@2.2.1/node_modules/js-cookie/src/js.cookie.js"(exports, module) {
    (function(factory) {
      var registeredInModuleLoader;
      if (typeof define === "function" && define.amd) {
        define(factory);
        registeredInModuleLoader = true;
      }
      if (typeof exports === "object") {
        module.exports = factory();
        registeredInModuleLoader = true;
      }
      if (!registeredInModuleLoader) {
        var OldCookies = window.Cookies;
        var api = window.Cookies = factory();
        api.noConflict = function() {
          window.Cookies = OldCookies;
          return api;
        };
      }
    })(function() {
      function extend() {
        var i = 0;
        var result = {};
        for (; i < arguments.length; i++) {
          var attributes = arguments[i];
          for (var key in attributes) {
            result[key] = attributes[key];
          }
        }
        return result;
      }
      function decode(s) {
        return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
      }
      function init(converter) {
        function api() {
        }
        function set(key, value, attributes) {
          if (typeof document === "undefined") {
            return;
          }
          attributes = extend({
            path: "/"
          }, api.defaults, attributes);
          if (typeof attributes.expires === "number") {
            attributes.expires = new Date(/* @__PURE__ */ new Date() * 1 + attributes.expires * 864e5);
          }
          attributes.expires = attributes.expires ? attributes.expires.toUTCString() : "";
          try {
            var result = JSON.stringify(value);
            if (/^[\{\[]/.test(result)) {
              value = result;
            }
          } catch (e2) {
          }
          value = converter.write ? converter.write(value, key) : encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
          key = encodeURIComponent(String(key)).replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent).replace(/[\(\)]/g, escape);
          var stringifiedAttributes = "";
          for (var attributeName in attributes) {
            if (!attributes[attributeName]) {
              continue;
            }
            stringifiedAttributes += "; " + attributeName;
            if (attributes[attributeName] === true) {
              continue;
            }
            stringifiedAttributes += "=" + attributes[attributeName].split(";")[0];
          }
          return document.cookie = key + "=" + value + stringifiedAttributes;
        }
        function get(key, json) {
          if (typeof document === "undefined") {
            return;
          }
          var jar = {};
          var cookies = document.cookie ? document.cookie.split("; ") : [];
          var i = 0;
          for (; i < cookies.length; i++) {
            var parts = cookies[i].split("=");
            var cookie = parts.slice(1).join("=");
            if (!json && cookie.charAt(0) === '"') {
              cookie = cookie.slice(1, -1);
            }
            try {
              var name = decode(parts[0]);
              cookie = (converter.read || converter)(cookie, name) || decode(cookie);
              if (json) {
                try {
                  cookie = JSON.parse(cookie);
                } catch (e2) {
                }
              }
              jar[name] = cookie;
              if (key === name) {
                break;
              }
            } catch (e2) {
            }
          }
          return key ? jar[key] : jar;
        }
        api.set = set;
        api.get = function(key) {
          return get(
            key,
            false
            /* read as raw */
          );
        };
        api.getJSON = function(key) {
          return get(
            key,
            true
            /* read as json */
          );
        };
        api.remove = function(key, attributes) {
          set(key, "", extend(attributes, {
            expires: -1
          }));
        };
        api.defaults = {};
        api.withConverter = init;
        return api;
      }
      return init(function() {
      });
    });
  }
});

// node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/index.js
var require_nano_css = __commonJS({
  "node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/index.js"(exports) {
    "use strict";
    var KEBAB_REGEX = /[A-Z]/g;
    var hash = function(str) {
      var h = 5381, i = str.length;
      while (i) h = h * 33 ^ str.charCodeAt(--i);
      return "_" + (h >>> 0).toString(36);
    };
    exports.create = function(config) {
      config = config || {};
      var assign = config.assign || Object.assign;
      var client = typeof window === "object";
      if (true) {
        if (client) {
          if (typeof document !== "object" || !document.getElementsByTagName("HTML")) {
            console.error(
              'nano-css detected browser environment because of "window" global, but "document" global seems to be defective.'
            );
          }
        }
      }
      var renderer = assign({
        raw: "",
        pfx: "_",
        client,
        assign,
        stringify: JSON.stringify,
        kebab: function(prop) {
          return prop.replace(KEBAB_REGEX, "-$&").toLowerCase();
        },
        decl: function(key, value) {
          key = renderer.kebab(key);
          return key + ":" + value + ";";
        },
        hash: function(obj) {
          return hash(renderer.stringify(obj));
        },
        selector: function(parent, selector) {
          return parent + (selector[0] === ":" ? "" : " ") + selector;
        },
        putRaw: function(rawCssRule) {
          renderer.raw += rawCssRule;
        }
      }, config);
      if (renderer.client) {
        if (!renderer.sh)
          document.head.appendChild(renderer.sh = document.createElement("style"));
        if (true) {
          renderer.sh.setAttribute("data-nano-css-dev", "");
          renderer.shTest = document.createElement("style");
          renderer.shTest.setAttribute("data-nano-css-dev-tests", "");
          document.head.appendChild(renderer.shTest);
        }
        renderer.putRaw = function(rawCssRule) {
          if (false) {
            var sheet = renderer.sh.sheet;
            try {
              sheet.insertRule(rawCssRule, sheet.cssRules.length);
            } catch (error) {
            }
          } else {
            try {
              renderer.shTest.sheet.insertRule(rawCssRule, renderer.shTest.sheet.cssRules.length);
            } catch (error) {
              if (config.verbose) {
                console.error(error);
              }
            }
            renderer.sh.appendChild(document.createTextNode(rawCssRule));
          }
        };
      }
      renderer.put = function(selector, decls, atrule) {
        var str = "";
        var prop, value;
        var postponed = [];
        for (prop in decls) {
          value = decls[prop];
          if (value instanceof Object && !(value instanceof Array)) {
            postponed.push(prop);
          } else {
            if (!renderer.sourcemaps) {
              str += "    " + renderer.decl(prop, value, selector, atrule) + "\n";
            } else {
              str += renderer.decl(prop, value, selector, atrule);
            }
          }
        }
        if (str) {
          if (!renderer.sourcemaps) {
            str = "\n" + selector + " {\n" + str + "}\n";
          } else {
            str = selector + "{" + str + "}";
          }
          renderer.putRaw(atrule ? atrule + "{" + str + "}" : str);
        }
        for (var i = 0; i < postponed.length; i++) {
          prop = postponed[i];
          if (prop[0] === "@" && prop !== "@font-face") {
            renderer.putAt(selector, decls[prop], prop);
          } else {
            renderer.put(renderer.selector(selector, prop), decls[prop], atrule);
          }
        }
      };
      renderer.putAt = renderer.put;
      return renderer;
    };
  }
});

// node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/__dev__/warnOnMissingDependencies.js
var require_warnOnMissingDependencies = __commonJS({
  "node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/__dev__/warnOnMissingDependencies.js"(exports, module) {
    "use strict";
    var pkgName = "nano-css";
    module.exports = function warnOnMissingDependencies(addon, renderer, deps) {
      var missing = [];
      for (var i = 0; i < deps.length; i++) {
        var name = deps[i];
        if (!renderer[name]) {
          missing.push(name);
        }
      }
      if (missing.length) {
        var str = 'Addon "' + addon + '" is missing the following dependencies:';
        for (var j = 0; j < missing.length; j++) {
          str += '\n require("' + pkgName + "/addon/" + missing[j] + '").addon(nano);';
        }
        throw new Error(str);
      }
    };
  }
});

// node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/cssom.js
var require_cssom = __commonJS({
  "node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/cssom.js"(exports) {
    "use strict";
    exports.addon = function(renderer) {
      if (!renderer.client) return;
      if (true) {
        require_warnOnMissingDependencies()("cssom", renderer, ["sh"]);
      }
      document.head.appendChild(renderer.msh = document.createElement("style"));
      renderer.createRule = function(selector, prelude) {
        var rawCss = selector + "{}";
        if (prelude) rawCss = prelude + "{" + rawCss + "}";
        var sheet = prelude ? renderer.msh.sheet : renderer.sh.sheet;
        var index = sheet.insertRule(rawCss, sheet.cssRules.length);
        var rule = (sheet.cssRules || sheet.rules)[index];
        rule.index = index;
        if (prelude) {
          var selectorRule = (rule.cssRules || rule.rules)[0];
          rule.style = selectorRule.style;
          rule.styleMap = selectorRule.styleMap;
        }
        return rule;
      };
    };
  }
});

// node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/vcssom/removeRule.js
var require_removeRule = __commonJS({
  "node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/vcssom/removeRule.js"(exports) {
    function removeRule(rule) {
      var maxIndex = rule.index;
      var sh = rule.parentStyleSheet;
      var rules = sh.cssRules || sh.rules;
      maxIndex = Math.max(maxIndex, rules.length - 1);
      while (maxIndex >= 0) {
        if (rules[maxIndex] === rule) {
          sh.deleteRule(maxIndex);
          break;
        }
        maxIndex--;
      }
    }
    exports.removeRule = removeRule;
  }
});

// node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/vcssom.js
var require_vcssom = __commonJS({
  "node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/vcssom.js"(exports) {
    "use strict";
    var removeRule = require_removeRule().removeRule;
    exports.addon = function(renderer) {
      if (!renderer.client) return;
      if (true) {
        require_warnOnMissingDependencies()("cssom", renderer, ["createRule"]);
      }
      var kebab = renderer.kebab;
      function VRule(selector, prelude) {
        this.rule = renderer.createRule(selector, prelude);
        this.decl = {};
      }
      VRule.prototype.diff = function(newDecl) {
        var oldDecl = this.decl;
        var style = this.rule.style;
        var property;
        for (property in oldDecl)
          if (newDecl[property] === void 0)
            style.removeProperty(property);
        for (property in newDecl)
          if (newDecl[property] !== oldDecl[property])
            style.setProperty(kebab(property), newDecl[property]);
        this.decl = newDecl;
      };
      VRule.prototype.del = function() {
        removeRule(this.rule);
      };
      function VSheet() {
        this.tree = {};
      }
      VSheet.prototype.diff = function(newTree) {
        var oldTree = this.tree;
        for (var prelude in oldTree) {
          if (newTree[prelude] === void 0) {
            var rules = oldTree[prelude];
            for (var selector in rules)
              rules[selector].del();
          }
        }
        for (var prelude in newTree) {
          if (oldTree[prelude] === void 0) {
            for (var selector in newTree[prelude]) {
              var rule = new VRule(selector, prelude);
              rule.diff(newTree[prelude][selector]);
              newTree[prelude][selector] = rule;
            }
          } else {
            var oldRules = oldTree[prelude];
            var newRules = newTree[prelude];
            for (var selector in oldRules)
              if (!newRules[selector])
                oldRules[selector].del();
            for (var selector in newRules) {
              var rule = oldRules[selector];
              if (rule) {
                rule.diff(newRules[selector]);
                newRules[selector] = rule;
              } else {
                rule = new VRule(selector, prelude);
                rule.diff(newRules[selector]);
                newRules[selector] = rule;
              }
            }
          }
        }
        this.tree = newTree;
      };
      renderer.VRule = VRule;
      renderer.VSheet = VSheet;
    };
  }
});

// node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/vcssom/cssToTree.js
var require_cssToTree = __commonJS({
  "node_modules/.pnpm/nano-css@5.6.2_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/nano-css/addon/vcssom/cssToTree.js"(exports) {
    function cssToTree2(tree, css, selector, prelude) {
      var declarations = {};
      var hasDeclarations = false;
      var key, value;
      for (key in css) {
        value = css[key];
        if (typeof value !== "object") {
          hasDeclarations = true;
          declarations[key] = value;
        }
      }
      if (hasDeclarations) {
        if (!tree[prelude]) tree[prelude] = {};
        tree[prelude][selector] = declarations;
      }
      for (key in css) {
        value = css[key];
        if (typeof value === "object") {
          if (key[0] === "@") {
            cssToTree2(tree, value, selector, key);
          } else {
            var hasCurrentSymbol = key.indexOf("&") > -1;
            var selectorParts = selector.split(",");
            if (hasCurrentSymbol) {
              for (var i = 0; i < selectorParts.length; i++) {
                selectorParts[i] = key.replace(/&/g, selectorParts[i]);
              }
            } else {
              for (var i = 0; i < selectorParts.length; i++) {
                selectorParts[i] = selectorParts[i] + " " + key;
              }
            }
            cssToTree2(tree, value, selectorParts.join(","), prelude);
          }
        }
      }
    }
    exports.cssToTree = cssToTree2;
  }
});

// node_modules/.pnpm/screenfull@5.2.0/node_modules/screenfull/dist/screenfull.js
var require_screenfull = __commonJS({
  "node_modules/.pnpm/screenfull@5.2.0/node_modules/screenfull/dist/screenfull.js"(exports, module) {
    (function() {
      "use strict";
      var document2 = typeof window !== "undefined" && typeof window.document !== "undefined" ? window.document : {};
      var isCommonjs = typeof module !== "undefined" && module.exports;
      var fn = function() {
        var val;
        var fnMap = [
          [
            "requestFullscreen",
            "exitFullscreen",
            "fullscreenElement",
            "fullscreenEnabled",
            "fullscreenchange",
            "fullscreenerror"
          ],
          // New WebKit
          [
            "webkitRequestFullscreen",
            "webkitExitFullscreen",
            "webkitFullscreenElement",
            "webkitFullscreenEnabled",
            "webkitfullscreenchange",
            "webkitfullscreenerror"
          ],
          // Old WebKit
          [
            "webkitRequestFullScreen",
            "webkitCancelFullScreen",
            "webkitCurrentFullScreenElement",
            "webkitCancelFullScreen",
            "webkitfullscreenchange",
            "webkitfullscreenerror"
          ],
          [
            "mozRequestFullScreen",
            "mozCancelFullScreen",
            "mozFullScreenElement",
            "mozFullScreenEnabled",
            "mozfullscreenchange",
            "mozfullscreenerror"
          ],
          [
            "msRequestFullscreen",
            "msExitFullscreen",
            "msFullscreenElement",
            "msFullscreenEnabled",
            "MSFullscreenChange",
            "MSFullscreenError"
          ]
        ];
        var i = 0;
        var l = fnMap.length;
        var ret = {};
        for (; i < l; i++) {
          val = fnMap[i];
          if (val && val[1] in document2) {
            for (i = 0; i < val.length; i++) {
              ret[fnMap[0][i]] = val[i];
            }
            return ret;
          }
        }
        return false;
      }();
      var eventNameMap = {
        change: fn.fullscreenchange,
        error: fn.fullscreenerror
      };
      var screenfull2 = {
        request: function(element, options) {
          return new Promise((function(resolve, reject) {
            var onFullScreenEntered = (function() {
              this.off("change", onFullScreenEntered);
              resolve();
            }).bind(this);
            this.on("change", onFullScreenEntered);
            element = element || document2.documentElement;
            var returnPromise = element[fn.requestFullscreen](options);
            if (returnPromise instanceof Promise) {
              returnPromise.then(onFullScreenEntered).catch(reject);
            }
          }).bind(this));
        },
        exit: function() {
          return new Promise((function(resolve, reject) {
            if (!this.isFullscreen) {
              resolve();
              return;
            }
            var onFullScreenExit = (function() {
              this.off("change", onFullScreenExit);
              resolve();
            }).bind(this);
            this.on("change", onFullScreenExit);
            var returnPromise = document2[fn.exitFullscreen]();
            if (returnPromise instanceof Promise) {
              returnPromise.then(onFullScreenExit).catch(reject);
            }
          }).bind(this));
        },
        toggle: function(element, options) {
          return this.isFullscreen ? this.exit() : this.request(element, options);
        },
        onchange: function(callback) {
          this.on("change", callback);
        },
        onerror: function(callback) {
          this.on("error", callback);
        },
        on: function(event, callback) {
          var eventName = eventNameMap[event];
          if (eventName) {
            document2.addEventListener(eventName, callback, false);
          }
        },
        off: function(event, callback) {
          var eventName = eventNameMap[event];
          if (eventName) {
            document2.removeEventListener(eventName, callback, false);
          }
        },
        raw: fn
      };
      if (!fn) {
        if (isCommonjs) {
          module.exports = { isEnabled: false };
        } else {
          window.screenfull = { isEnabled: false };
        }
        return;
      }
      Object.defineProperties(screenfull2, {
        isFullscreen: {
          get: function() {
            return Boolean(document2[fn.fullscreenElement]);
          }
        },
        element: {
          enumerable: true,
          get: function() {
            return document2[fn.fullscreenElement];
          }
        },
        isEnabled: {
          enumerable: true,
          get: function() {
            return Boolean(document2[fn.fullscreenEnabled]);
          }
        }
      });
      if (isCommonjs) {
        module.exports = screenfull2;
      } else {
        window.screenfull = screenfull2;
      }
    })();
  }
});

// node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/render.js
var require_render = __commonJS({
  "node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/render.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var react_1 = require_react();
    var isReact16Plus = parseInt(react_1.version.substr(0, react_1.version.indexOf("."))) > 15;
    var isFn = function(fn) {
      return typeof fn === "function";
    };
    var render2 = function(props, data) {
      var more = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        more[_i - 2] = arguments[_i];
      }
      if (true) {
        if (typeof props !== "object") {
          throw new TypeError("renderChildren(props, data) first argument must be a props object.");
        }
        var children_1 = props.children, render_1 = props.render;
        if (isFn(children_1) && isFn(render_1)) {
          console.warn('Both "render" and "children" are specified for in a universal interface component. Children will be used.');
          console.trace();
        }
        if (typeof data !== "object") {
          console.warn("Universal component interface normally expects data to be an object, " + ('"' + typeof data + '" received.'));
          console.trace();
        }
      }
      var render3 = props.render, _a = props.children, children = _a === void 0 ? render3 : _a, component = props.component, _b = props.comp, comp = _b === void 0 ? component : _b;
      if (isFn(children))
        return children.apply(void 0, tslib_1.__spreadArrays([data], more));
      if (comp) {
        return react_1.createElement(comp, data);
      }
      if (children instanceof Array)
        return isReact16Plus ? children : react_1.createElement.apply(void 0, tslib_1.__spreadArrays(["div", null], children));
      if (children && children instanceof Object) {
        if (true) {
          if (!children.type || typeof children.type !== "string" && typeof children.type !== "function" && typeof children.type !== "symbol") {
            console.warn('Universal component interface received object as children, expected React element, but received unexpected React "type".');
            console.trace();
          }
          if (typeof children.type === "string")
            return children;
          return react_1.cloneElement(children, Object.assign({}, children.props, data));
        } else {
          if (typeof children.type === "string")
            return children;
          return react_1.cloneElement(children, Object.assign({}, children.props, data));
        }
      }
      return children || null;
    };
    exports.default = render2;
  }
});

// node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/wrapInStatefulComponent.js
var require_wrapInStatefulComponent = __commonJS({
  "node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/wrapInStatefulComponent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var React4 = tslib_1.__importStar(require_react());
    var wrapInStatefulComponent = function(Comp) {
      var Decorated = function(_super) {
        tslib_1.__extends(class_1, _super);
        function class_1() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        class_1.prototype.render = function() {
          return Comp(this.props, this.context);
        };
        return class_1;
      }(React4.Component);
      if (true) {
        Decorated.displayName = "Decorated(" + (Comp.displayName || Comp.name) + ")";
      }
      return Decorated;
    };
    exports.default = wrapInStatefulComponent;
  }
});

// node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/addClassDecoratorSupport.js
var require_addClassDecoratorSupport = __commonJS({
  "node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/addClassDecoratorSupport.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var wrapInStatefulComponent_1 = tslib_1.__importDefault(require_wrapInStatefulComponent());
    var addClassDecoratorSupport = function(Comp) {
      var isSFC = !Comp.prototype;
      return !isSFC ? Comp : wrapInStatefulComponent_1.default(Comp);
    };
    exports.default = addClassDecoratorSupport;
  }
});

// node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/createEnhancer.js
var require_createEnhancer = __commonJS({
  "node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/createEnhancer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.divWrapper = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var React4 = tslib_1.__importStar(require_react());
    var addClassDecoratorSupport_1 = tslib_1.__importDefault(require_addClassDecoratorSupport());
    var h = React4.createElement;
    var noWrap = function(Comp, propName, props, state) {
      var _a;
      return h(Comp, propName ? tslib_1.__assign((_a = {}, _a[propName] = state, _a), props) : tslib_1.__assign(tslib_1.__assign({}, state), props));
    };
    exports.divWrapper = function(Comp, propName, props, state) {
      return h("div", null, noWrap(Comp, propName, props, state));
    };
    var createEnhancer = function(Facc, prop, wrapper) {
      if (wrapper === void 0) {
        wrapper = noWrap;
      }
      var enhancer = function(Comp, propName, faccProps) {
        if (propName === void 0) {
          propName = prop;
        }
        if (faccProps === void 0) {
          faccProps = null;
        }
        var isClassDecoratorMethodCall = typeof Comp === "string";
        if (isClassDecoratorMethodCall) {
          return function(Klass) {
            return enhancer(Klass, Comp || prop, propName);
          };
        }
        var Enhanced = function(props) {
          return h(Facc, faccProps, function(state) {
            return wrapper(Comp, propName, props, state);
          });
        };
        if (true) {
          Enhanced.displayName = (Facc.displayName || Facc.name) + "(" + (Comp.displayName || Comp.name) + ")";
        }
        return isClassDecoratorMethodCall ? addClassDecoratorSupport_1.default(Enhanced) : Enhanced;
      };
      return enhancer;
    };
    exports.default = createEnhancer;
  }
});

// node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/hookToRenderProp.js
var require_hookToRenderProp = __commonJS({
  "node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/hookToRenderProp.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var render_1 = tslib_1.__importDefault(require_render());
    var defaultMapPropsToArgs = function(props) {
      return [props];
    };
    var hookToRenderProp = function(hook, mapPropsToArgs) {
      if (mapPropsToArgs === void 0) {
        mapPropsToArgs = defaultMapPropsToArgs;
      }
      return function(props) {
        return render_1.default(props, hook.apply(void 0, mapPropsToArgs(props)));
      };
    };
    exports.default = hookToRenderProp;
  }
});

// node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/react-universal-interface@0.6.2_react@18.3.1_tslib@2.7.0/node_modules/react-universal-interface/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hookToRenderProp = exports.createEnhancer = exports.render = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var render_1 = tslib_1.__importDefault(require_render());
    exports.render = render_1.default;
    var createEnhancer_1 = tslib_1.__importDefault(require_createEnhancer());
    exports.createEnhancer = createEnhancer_1.default;
    var hookToRenderProp_1 = tslib_1.__importDefault(require_hookToRenderProp());
    exports.hookToRenderProp = hookToRenderProp_1.default;
  }
});

// node_modules/.pnpm/fast-shallow-equal@1.0.0/node_modules/fast-shallow-equal/index.js
var require_fast_shallow_equal = __commonJS({
  "node_modules/.pnpm/fast-shallow-equal@1.0.0/node_modules/fast-shallow-equal/index.js"(exports) {
    var keyList = Object.keys;
    exports.equal = function equal(a, b) {
      if (a === b) return true;
      if (!(a instanceof Object) || !(b instanceof Object)) return false;
      var keys = keyList(a);
      var length = keys.length;
      for (var i = 0; i < length; i++)
        if (!(keys[i] in b)) return false;
      for (var i = 0; i < length; i++)
        if (a[keys[i]] !== b[keys[i]]) return false;
      return length === keyList(b).length;
    };
  }
});

// node_modules/.pnpm/ts-easing@0.2.0/node_modules/ts-easing/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/.pnpm/ts-easing@0.2.0/node_modules/ts-easing/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.easing = {
      // No easing, no acceleration
      linear: function(t) {
        return t;
      },
      // Accelerates fast, then slows quickly towards end.
      quadratic: function(t) {
        return t * (-(t * t) * t + 4 * t * t - 6 * t + 4);
      },
      // Overshoots over 1 and then returns to 1 towards end.
      cubic: function(t) {
        return t * (4 * t * t - 9 * t + 6);
      },
      // Overshoots over 1 multiple times - wiggles around 1.
      elastic: function(t) {
        return t * (33 * t * t * t * t - 106 * t * t * t + 126 * t * t - 67 * t + 15);
      },
      // Accelerating from zero velocity
      inQuad: function(t) {
        return t * t;
      },
      // Decelerating to zero velocity
      outQuad: function(t) {
        return t * (2 - t);
      },
      // Acceleration until halfway, then deceleration
      inOutQuad: function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      },
      // Accelerating from zero velocity
      inCubic: function(t) {
        return t * t * t;
      },
      // Decelerating to zero velocity
      outCubic: function(t) {
        return --t * t * t + 1;
      },
      // Acceleration until halfway, then deceleration
      inOutCubic: function(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      },
      // Accelerating from zero velocity
      inQuart: function(t) {
        return t * t * t * t;
      },
      // Decelerating to zero velocity
      outQuart: function(t) {
        return 1 - --t * t * t * t;
      },
      // Acceleration until halfway, then deceleration
      inOutQuart: function(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
      },
      // Accelerating from zero velocity
      inQuint: function(t) {
        return t * t * t * t * t;
      },
      // Decelerating to zero velocity
      outQuint: function(t) {
        return 1 + --t * t * t * t * t;
      },
      // Acceleration until halfway, then deceleration
      inOutQuint: function(t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
      },
      // Accelerating from zero velocity
      inSine: function(t) {
        return -Math.cos(t * (Math.PI / 2)) + 1;
      },
      // Decelerating to zero velocity
      outSine: function(t) {
        return Math.sin(t * (Math.PI / 2));
      },
      // Accelerating until halfway, then decelerating
      inOutSine: function(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
      },
      // Exponential accelerating from zero velocity
      inExpo: function(t) {
        return Math.pow(2, 10 * (t - 1));
      },
      // Exponential decelerating to zero velocity
      outExpo: function(t) {
        return -Math.pow(2, -10 * t) + 1;
      },
      // Exponential accelerating until halfway, then decelerating
      inOutExpo: function(t) {
        t /= 0.5;
        if (t < 1)
          return Math.pow(2, 10 * (t - 1)) / 2;
        t--;
        return (-Math.pow(2, -10 * t) + 2) / 2;
      },
      // Circular accelerating from zero velocity
      inCirc: function(t) {
        return -Math.sqrt(1 - t * t) + 1;
      },
      // Circular decelerating to zero velocity Moves VERY fast at the beginning and
      // then quickly slows down in the middle. This tween can actually be used
      // in continuous transitions where target value changes all the time,
      // because of the very quick start, it hides the jitter between target value changes.
      outCirc: function(t) {
        return Math.sqrt(1 - (t = t - 1) * t);
      },
      // Circular acceleration until halfway, then deceleration
      inOutCirc: function(t) {
        t /= 0.5;
        if (t < 1)
          return -(Math.sqrt(1 - t * t) - 1) / 2;
        t -= 2;
        return (Math.sqrt(1 - t * t) + 1) / 2;
      }
    };
  }
});

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createMemo.js
var import_react = __toESM(require_react());
var createMemo = function(fn) {
  return function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    return (0, import_react.useMemo)(function() {
      return fn.apply(void 0, args);
    }, args);
  };
};
var createMemo_default = createMemo;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createReducerContext.js
var import_react2 = __toESM(require_react());
var createReducerContext = function(reducer, defaultInitialState) {
  var context = (0, import_react2.createContext)(void 0);
  var providerFactory = function(props, children) {
    return (0, import_react2.createElement)(context.Provider, props, children);
  };
  var ReducerProvider = function(_a) {
    var children = _a.children, initialState = _a.initialState;
    var state = (0, import_react2.useReducer)(reducer, initialState !== void 0 ? initialState : defaultInitialState);
    return providerFactory({ value: state }, children);
  };
  var useReducerContext = function() {
    var state = (0, import_react2.useContext)(context);
    if (state == null) {
      throw new Error("useReducerContext must be used inside a ReducerProvider.");
    }
    return state;
  };
  return [useReducerContext, ReducerProvider, context];
};
var createReducerContext_default = createReducerContext;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createReducer.js
var import_react5 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useUpdateEffect.js
var import_react4 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useFirstMountState.js
var import_react3 = __toESM(require_react());
function useFirstMountState() {
  var isFirst = (0, import_react3.useRef)(true);
  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }
  return isFirst.current;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useUpdateEffect.js
var useUpdateEffect = function(effect, deps) {
  var isFirstMount = useFirstMountState();
  (0, import_react4.useEffect)(function() {
    if (!isFirstMount) {
      return effect();
    }
  }, deps);
};
var useUpdateEffect_default = useUpdateEffect;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createReducer.js
function composeMiddleware(chain) {
  return function(context, dispatch) {
    return chain.reduceRight(function(res, middleware) {
      return middleware(context)(res);
    }, dispatch);
  };
}
var createReducer = function() {
  var middlewares = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    middlewares[_i] = arguments[_i];
  }
  var composedMiddleware = composeMiddleware(middlewares);
  return function(reducer, initialState, initializer) {
    if (initializer === void 0) {
      initializer = function(value) {
        return value;
      };
    }
    var ref = (0, import_react5.useRef)(initializer(initialState));
    var _a = (0, import_react5.useState)(ref.current), setState = _a[1];
    var dispatch = (0, import_react5.useCallback)(function(action) {
      ref.current = reducer(ref.current, action);
      setState(ref.current);
      return action;
    }, [reducer]);
    var dispatchRef = (0, import_react5.useRef)(composedMiddleware({
      getState: function() {
        return ref.current;
      },
      dispatch: function() {
        var args = [];
        for (var _i2 = 0; _i2 < arguments.length; _i2++) {
          args[_i2] = arguments[_i2];
        }
        return dispatchRef.current.apply(dispatchRef, args);
      }
    }, dispatch));
    useUpdateEffect_default(function() {
      dispatchRef.current = composedMiddleware({
        getState: function() {
          return ref.current;
        },
        dispatch: function() {
          var args = [];
          for (var _i2 = 0; _i2 < arguments.length; _i2++) {
            args[_i2] = arguments[_i2];
          }
          return dispatchRef.current.apply(dispatchRef, args);
        }
      }, dispatch);
    }, [dispatch]);
    return [ref.current, dispatchRef.current];
  };
};
var createReducer_default = createReducer;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createStateContext.js
var import_react6 = __toESM(require_react());
var createStateContext = function(defaultInitialValue) {
  var context = (0, import_react6.createContext)(void 0);
  var providerFactory = function(props, children) {
    return (0, import_react6.createElement)(context.Provider, props, children);
  };
  var StateProvider = function(_a) {
    var children = _a.children, initialValue = _a.initialValue;
    var state = (0, import_react6.useState)(initialValue !== void 0 ? initialValue : defaultInitialValue);
    return providerFactory({ value: state }, children);
  };
  var useStateContext = function() {
    var state = (0, import_react6.useContext)(context);
    if (state == null) {
      throw new Error("useStateContext must be used inside a StateProvider.");
    }
    return state;
  };
  return [useStateContext, StateProvider, context];
};
var createStateContext_default = createStateContext;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useAsync.js
var import_react9 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useAsyncFn.js
init_tslib_es6();
var import_react8 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMountedState.js
var import_react7 = __toESM(require_react());
function useMountedState() {
  var mountedRef = (0, import_react7.useRef)(false);
  var get = (0, import_react7.useCallback)(function() {
    return mountedRef.current;
  }, []);
  (0, import_react7.useEffect)(function() {
    mountedRef.current = true;
    return function() {
      mountedRef.current = false;
    };
  }, []);
  return get;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useAsyncFn.js
function useAsyncFn(fn, deps, initialState) {
  if (deps === void 0) {
    deps = [];
  }
  if (initialState === void 0) {
    initialState = { loading: false };
  }
  var lastCallId = (0, import_react8.useRef)(0);
  var isMounted = useMountedState();
  var _a = (0, import_react8.useState)(initialState), state = _a[0], set = _a[1];
  var callback = (0, import_react8.useCallback)(function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var callId = ++lastCallId.current;
    if (!state.loading) {
      set(function(prevState) {
        return __assign(__assign({}, prevState), { loading: true });
      });
    }
    return fn.apply(void 0, args).then(function(value) {
      isMounted() && callId === lastCallId.current && set({ value, loading: false });
      return value;
    }, function(error) {
      isMounted() && callId === lastCallId.current && set({ error, loading: false });
      return error;
    });
  }, deps);
  return [state, callback];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useAsync.js
function useAsync(fn, deps) {
  if (deps === void 0) {
    deps = [];
  }
  var _a = useAsyncFn(fn, deps, {
    loading: true
  }), state = _a[0], callback = _a[1];
  (0, import_react9.useEffect)(function() {
    callback();
  }, [callback]);
  return state;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useAsyncRetry.js
init_tslib_es6();
var import_react10 = __toESM(require_react());
var useAsyncRetry = function(fn, deps) {
  if (deps === void 0) {
    deps = [];
  }
  var _a = (0, import_react10.useState)(0), attempt = _a[0], setAttempt = _a[1];
  var state = useAsync(fn, __spreadArrays(deps, [attempt]));
  var stateLoading = state.loading;
  var retry = (0, import_react10.useCallback)(function() {
    if (stateLoading) {
      if (true) {
        console.log("You are calling useAsyncRetry hook retry() method while loading in progress, this is a no-op.");
      }
      return;
    }
    setAttempt(function(currentAttempt) {
      return currentAttempt + 1;
    });
  }, __spreadArrays(deps, [stateLoading]));
  return __assign(__assign({}, state), { retry });
};
var useAsyncRetry_default = useAsyncRetry;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createHTMLMediaHook.js
init_tslib_es6();
var React = __toESM(require_react());
var import_react12 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useSetState.js
var import_react11 = __toESM(require_react());
var useSetState = function(initialState) {
  if (initialState === void 0) {
    initialState = {};
  }
  var _a = (0, import_react11.useState)(initialState), state = _a[0], set = _a[1];
  var setState = (0, import_react11.useCallback)(function(patch) {
    set(function(prevState) {
      return Object.assign({}, prevState, patch instanceof Function ? patch(prevState) : patch);
    });
  }, []);
  return [state, setState];
};
var useSetState_default = useSetState;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/misc/parseTimeRanges.js
function parseTimeRanges(ranges) {
  var result = [];
  for (var i = 0; i < ranges.length; i++) {
    result.push({
      start: ranges.start(i),
      end: ranges.end(i)
    });
  }
  return result;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createHTMLMediaHook.js
function createHTMLMediaHook(tag) {
  return function(elOrProps) {
    var element;
    var props;
    if (React.isValidElement(elOrProps)) {
      element = elOrProps;
      props = element.props;
    } else {
      props = elOrProps;
    }
    var _a = useSetState_default({
      buffered: [],
      time: 0,
      duration: 0,
      paused: true,
      muted: false,
      volume: 1,
      playing: false
    }), state = _a[0], setState = _a[1];
    var ref = (0, import_react12.useRef)(null);
    var wrapEvent = function(userEvent, proxyEvent) {
      return function(event) {
        try {
          proxyEvent && proxyEvent(event);
        } finally {
          userEvent && userEvent(event);
        }
      };
    };
    var onPlay = function() {
      return setState({ paused: false });
    };
    var onPlaying = function() {
      return setState({ playing: true });
    };
    var onWaiting = function() {
      return setState({ playing: false });
    };
    var onPause = function() {
      return setState({ paused: true, playing: false });
    };
    var onVolumeChange = function() {
      var el = ref.current;
      if (!el) {
        return;
      }
      setState({
        muted: el.muted,
        volume: el.volume
      });
    };
    var onDurationChange = function() {
      var el = ref.current;
      if (!el) {
        return;
      }
      var duration = el.duration, buffered = el.buffered;
      setState({
        duration,
        buffered: parseTimeRanges(buffered)
      });
    };
    var onTimeUpdate = function() {
      var el = ref.current;
      if (!el) {
        return;
      }
      setState({ time: el.currentTime });
    };
    var onProgress = function() {
      var el = ref.current;
      if (!el) {
        return;
      }
      setState({ buffered: parseTimeRanges(el.buffered) });
    };
    if (element) {
      element = React.cloneElement(element, __assign(__assign({ controls: false }, props), { ref, onPlay: wrapEvent(props.onPlay, onPlay), onPlaying: wrapEvent(props.onPlaying, onPlaying), onWaiting: wrapEvent(props.onWaiting, onWaiting), onPause: wrapEvent(props.onPause, onPause), onVolumeChange: wrapEvent(props.onVolumeChange, onVolumeChange), onDurationChange: wrapEvent(props.onDurationChange, onDurationChange), onTimeUpdate: wrapEvent(props.onTimeUpdate, onTimeUpdate), onProgress: wrapEvent(props.onProgress, onProgress) }));
    } else {
      element = React.createElement(tag, __assign(__assign({ controls: false }, props), { ref, onPlay: wrapEvent(props.onPlay, onPlay), onPlaying: wrapEvent(props.onPlaying, onPlaying), onWaiting: wrapEvent(props.onWaiting, onWaiting), onPause: wrapEvent(props.onPause, onPause), onVolumeChange: wrapEvent(props.onVolumeChange, onVolumeChange), onDurationChange: wrapEvent(props.onDurationChange, onDurationChange), onTimeUpdate: wrapEvent(props.onTimeUpdate, onTimeUpdate), onProgress: wrapEvent(props.onProgress, onProgress) }));
    }
    var lockPlay = false;
    var controls = {
      play: function() {
        var el = ref.current;
        if (!el) {
          return void 0;
        }
        if (!lockPlay) {
          var promise = el.play();
          var isPromise = typeof promise === "object";
          if (isPromise) {
            lockPlay = true;
            var resetLock = function() {
              lockPlay = false;
            };
            promise.then(resetLock, resetLock);
          }
          return promise;
        }
        return void 0;
      },
      pause: function() {
        var el = ref.current;
        if (el && !lockPlay) {
          return el.pause();
        }
      },
      seek: function(time) {
        var el = ref.current;
        if (!el || state.duration === void 0) {
          return;
        }
        time = Math.min(state.duration, Math.max(0, time));
        el.currentTime = time;
      },
      volume: function(volume) {
        var el = ref.current;
        if (!el) {
          return;
        }
        volume = Math.min(1, Math.max(0, volume));
        el.volume = volume;
        setState({ volume });
      },
      mute: function() {
        var el = ref.current;
        if (!el) {
          return;
        }
        el.muted = true;
      },
      unmute: function() {
        var el = ref.current;
        if (!el) {
          return;
        }
        el.muted = false;
      }
    };
    (0, import_react12.useEffect)(function() {
      var el = ref.current;
      if (!el) {
        if (true) {
          if (tag === "audio") {
            console.error("useAudio() ref to <audio> element is empty at mount. It seem you have not rendered the audio element, which it returns as the first argument const [audio] = useAudio(...).");
          } else if (tag === "video") {
            console.error("useVideo() ref to <video> element is empty at mount. It seem you have not rendered the video element, which it returns as the first argument const [video] = useVideo(...).");
          }
        }
        return;
      }
      setState({
        volume: el.volume,
        muted: el.muted,
        paused: el.paused
      });
      if (props.autoPlay && el.paused) {
        controls.play();
      }
    }, [props.src]);
    return [element, state, controls, ref];
  };
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useAudio.js
var useAudio = createHTMLMediaHook("audio");
var useAudio_default = useAudio;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useBattery.js
var import_react14 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/misc/util.js
var noop = function() {
};
function on(obj) {
  var args = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  }
  if (obj && obj.addEventListener) {
    obj.addEventListener.apply(obj, args);
  }
}
function off(obj) {
  var args = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  }
  if (obj && obj.removeEventListener) {
    obj.removeEventListener.apply(obj, args);
  }
}
var isBrowser = typeof window !== "undefined";
var isNavigator = typeof navigator !== "undefined";

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/misc/isDeepEqual.js
var import_react13 = __toESM(require_react2());
var isDeepEqual_default = import_react13.default;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useBattery.js
var nav = isNavigator ? navigator : void 0;
var isBatteryApiSupported = nav && typeof nav.getBattery === "function";
function useBatteryMock() {
  return { isSupported: false };
}
function useBattery() {
  var _a = (0, import_react14.useState)({ isSupported: true, fetched: false }), state = _a[0], setState = _a[1];
  (0, import_react14.useEffect)(function() {
    var isMounted = true;
    var battery = null;
    var handleChange = function() {
      if (!isMounted || !battery) {
        return;
      }
      var newState = {
        isSupported: true,
        fetched: true,
        level: battery.level,
        charging: battery.charging,
        dischargingTime: battery.dischargingTime,
        chargingTime: battery.chargingTime
      };
      !isDeepEqual_default(state, newState) && setState(newState);
    };
    nav.getBattery().then(function(bat) {
      if (!isMounted) {
        return;
      }
      battery = bat;
      on(battery, "chargingchange", handleChange);
      on(battery, "chargingtimechange", handleChange);
      on(battery, "dischargingtimechange", handleChange);
      on(battery, "levelchange", handleChange);
      handleChange();
    });
    return function() {
      isMounted = false;
      if (battery) {
        off(battery, "chargingchange", handleChange);
        off(battery, "chargingtimechange", handleChange);
        off(battery, "dischargingtimechange", handleChange);
        off(battery, "levelchange", handleChange);
      }
    };
  }, []);
  return state;
}
var useBattery_default = isBatteryApiSupported ? useBattery : useBatteryMock;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useBeforeUnload.js
var import_react15 = __toESM(require_react());
var useBeforeUnload = function(enabled, message) {
  if (enabled === void 0) {
    enabled = true;
  }
  var handler = (0, import_react15.useCallback)(function(event) {
    var finalEnabled = typeof enabled === "function" ? enabled() : true;
    if (!finalEnabled) {
      return;
    }
    event.preventDefault();
    if (message) {
      event.returnValue = message;
    }
    return message;
  }, [enabled, message]);
  (0, import_react15.useEffect)(function() {
    if (!enabled) {
      return;
    }
    on(window, "beforeunload", handler);
    return function() {
      return off(window, "beforeunload", handler);
    };
  }, [enabled, handler]);
};
var useBeforeUnload_default = useBeforeUnload;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useToggle.js
var import_react16 = __toESM(require_react());
var toggleReducer = function(state, nextValue) {
  return typeof nextValue === "boolean" ? nextValue : !state;
};
var useToggle = function(initialValue) {
  return (0, import_react16.useReducer)(toggleReducer, initialValue);
};
var useToggle_default = useToggle;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useBoolean.js
var useBoolean_default = useToggle_default;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useClickAway.js
var import_react17 = __toESM(require_react());
var defaultEvents = ["mousedown", "touchstart"];
var useClickAway = function(ref, onClickAway, events) {
  if (events === void 0) {
    events = defaultEvents;
  }
  var savedCallback = (0, import_react17.useRef)(onClickAway);
  (0, import_react17.useEffect)(function() {
    savedCallback.current = onClickAway;
  }, [onClickAway]);
  (0, import_react17.useEffect)(function() {
    var handler = function(event) {
      var el = ref.current;
      el && !el.contains(event.target) && savedCallback.current(event);
    };
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
      var eventName = events_1[_i];
      on(document, eventName, handler);
    }
    return function() {
      for (var _i2 = 0, events_2 = events; _i2 < events_2.length; _i2++) {
        var eventName2 = events_2[_i2];
        off(document, eventName2, handler);
      }
    };
  }, [events, ref]);
};
var useClickAway_default = useClickAway;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useCookie.js
var import_react18 = __toESM(require_react());
var import_js_cookie = __toESM(require_js_cookie());
var useCookie = function(cookieName) {
  var _a = (0, import_react18.useState)(function() {
    return import_js_cookie.default.get(cookieName) || null;
  }), value = _a[0], setValue = _a[1];
  var updateCookie = (0, import_react18.useCallback)(function(newValue, options) {
    import_js_cookie.default.set(cookieName, newValue, options);
    setValue(newValue);
  }, [cookieName]);
  var deleteCookie = (0, import_react18.useCallback)(function() {
    import_js_cookie.default.remove(cookieName);
    setValue(null);
  }, [cookieName]);
  return [value, updateCookie, deleteCookie];
};
var useCookie_default = useCookie;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useCopyToClipboard.js
var import_copy_to_clipboard = __toESM(require_copy_to_clipboard());
var import_react19 = __toESM(require_react());
var useCopyToClipboard = function() {
  var isMounted = useMountedState();
  var _a = useSetState_default({
    value: void 0,
    error: void 0,
    noUserInteraction: true
  }), state = _a[0], setState = _a[1];
  var copyToClipboard = (0, import_react19.useCallback)(function(value) {
    if (!isMounted()) {
      return;
    }
    var noUserInteraction;
    var normalizedValue;
    try {
      if (typeof value !== "string" && typeof value !== "number") {
        var error = new Error("Cannot copy typeof " + typeof value + " to clipboard, must be a string");
        if (true)
          console.error(error);
        setState({
          value,
          error,
          noUserInteraction: true
        });
        return;
      } else if (value === "") {
        var error = new Error("Cannot copy empty string to clipboard.");
        if (true)
          console.error(error);
        setState({
          value,
          error,
          noUserInteraction: true
        });
        return;
      }
      normalizedValue = value.toString();
      noUserInteraction = (0, import_copy_to_clipboard.default)(normalizedValue);
      setState({
        value: normalizedValue,
        error: void 0,
        noUserInteraction
      });
    } catch (error2) {
      setState({
        value: normalizedValue,
        error: error2,
        noUserInteraction
      });
    }
  }, []);
  return [state, copyToClipboard];
};
var useCopyToClipboard_default = useCopyToClipboard;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useCounter.js
var import_react22 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useGetSet.js
var import_react21 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useUpdate.js
var import_react20 = __toESM(require_react());
var updateReducer = function(num) {
  return (num + 1) % 1e6;
};
function useUpdate() {
  var _a = (0, import_react20.useReducer)(updateReducer, 0), update = _a[1];
  return update;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/misc/hookState.js
function resolveHookState(nextState, currentState) {
  if (typeof nextState === "function") {
    return nextState.length ? nextState(currentState) : nextState();
  }
  return nextState;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useGetSet.js
function useGetSet(initialState) {
  var state = (0, import_react21.useRef)(resolveHookState(initialState));
  var update = useUpdate();
  return (0, import_react21.useMemo)(function() {
    return [
      function() {
        return state.current;
      },
      function(newState) {
        state.current = resolveHookState(newState, state.current);
        update();
      }
    ];
  }, []);
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useCounter.js
function useCounter(initialValue, max, min) {
  if (initialValue === void 0) {
    initialValue = 0;
  }
  if (max === void 0) {
    max = null;
  }
  if (min === void 0) {
    min = null;
  }
  var init = resolveHookState(initialValue);
  typeof init !== "number" && console.error("initialValue has to be a number, got " + typeof initialValue);
  if (typeof min === "number") {
    init = Math.max(init, min);
  } else if (min !== null) {
    console.error("min has to be a number, got " + typeof min);
  }
  if (typeof max === "number") {
    init = Math.min(init, max);
  } else if (max !== null) {
    console.error("max has to be a number, got " + typeof max);
  }
  var _a = useGetSet(init), get = _a[0], setInternal = _a[1];
  return [
    get(),
    (0, import_react22.useMemo)(function() {
      var set = function(newState) {
        var prevState = get();
        var rState = resolveHookState(newState, prevState);
        if (prevState !== rState) {
          if (typeof min === "number") {
            rState = Math.max(rState, min);
          }
          if (typeof max === "number") {
            rState = Math.min(rState, max);
          }
          prevState !== rState && setInternal(rState);
        }
      };
      return {
        get,
        set,
        inc: function(delta) {
          if (delta === void 0) {
            delta = 1;
          }
          var rDelta = resolveHookState(delta, get());
          if (typeof rDelta !== "number") {
            console.error("delta has to be a number or function returning a number, got " + typeof rDelta);
          }
          set(function(num) {
            return num + rDelta;
          });
        },
        dec: function(delta) {
          if (delta === void 0) {
            delta = 1;
          }
          var rDelta = resolveHookState(delta, get());
          if (typeof rDelta !== "number") {
            console.error("delta has to be a number or function returning a number, got " + typeof rDelta);
          }
          set(function(num) {
            return num - rDelta;
          });
        },
        reset: function(value) {
          if (value === void 0) {
            value = init;
          }
          var rValue = resolveHookState(value, get());
          if (typeof rValue !== "number") {
            console.error("value has to be a number or function returning a number, got " + typeof rValue);
          }
          init = rValue;
          set(rValue);
        }
      };
    }, [init, min, max])
  ];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useCss.js
var import_nano_css = __toESM(require_nano_css());
var import_cssom = __toESM(require_cssom());
var import_vcssom = __toESM(require_vcssom());
var import_cssToTree = __toESM(require_cssToTree());
var import_react24 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useIsomorphicLayoutEffect.js
var import_react23 = __toESM(require_react());
var useIsomorphicLayoutEffect = isBrowser ? import_react23.useLayoutEffect : import_react23.useEffect;
var useIsomorphicLayoutEffect_default = useIsomorphicLayoutEffect;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useCss.js
var nano = (0, import_nano_css.create)();
(0, import_cssom.addon)(nano);
(0, import_vcssom.addon)(nano);
var counter = 0;
var useCss = function(css) {
  var className = (0, import_react24.useMemo)(function() {
    return "react-use-css-" + (counter++).toString(36);
  }, []);
  var sheet = (0, import_react24.useMemo)(function() {
    return new nano.VSheet();
  }, []);
  useIsomorphicLayoutEffect_default(function() {
    var tree = {};
    (0, import_cssToTree.cssToTree)(tree, css, "." + className, "");
    sheet.diff(tree);
    return function() {
      sheet.diff({});
    };
  });
  return className;
};
var useCss_default = useCss;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useCustomCompareEffect.js
var import_react25 = __toESM(require_react());
var isPrimitive = function(val) {
  return val !== Object(val);
};
var useCustomCompareEffect = function(effect, deps, depsEqual) {
  if (true) {
    if (!(deps instanceof Array) || !deps.length) {
      console.warn("`useCustomCompareEffect` should not be used with no dependencies. Use React.useEffect instead.");
    }
    if (deps.every(isPrimitive)) {
      console.warn("`useCustomCompareEffect` should not be used with dependencies that are all primitive values. Use React.useEffect instead.");
    }
    if (typeof depsEqual !== "function") {
      console.warn("`useCustomCompareEffect` should be used with depsEqual callback for comparing deps list");
    }
  }
  var ref = (0, import_react25.useRef)(void 0);
  if (!ref.current || !depsEqual(deps, ref.current)) {
    ref.current = deps;
  }
  (0, import_react25.useEffect)(effect, ref.current);
};
var useCustomCompareEffect_default = useCustomCompareEffect;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useDebounce.js
var import_react27 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useTimeoutFn.js
var import_react26 = __toESM(require_react());
function useTimeoutFn(fn, ms) {
  if (ms === void 0) {
    ms = 0;
  }
  var ready = (0, import_react26.useRef)(false);
  var timeout = (0, import_react26.useRef)();
  var callback = (0, import_react26.useRef)(fn);
  var isReady = (0, import_react26.useCallback)(function() {
    return ready.current;
  }, []);
  var set = (0, import_react26.useCallback)(function() {
    ready.current = false;
    timeout.current && clearTimeout(timeout.current);
    timeout.current = setTimeout(function() {
      ready.current = true;
      callback.current();
    }, ms);
  }, [ms]);
  var clear = (0, import_react26.useCallback)(function() {
    ready.current = null;
    timeout.current && clearTimeout(timeout.current);
  }, []);
  (0, import_react26.useEffect)(function() {
    callback.current = fn;
  }, [fn]);
  (0, import_react26.useEffect)(function() {
    set();
    return clear;
  }, [ms]);
  return [isReady, clear, set];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useDebounce.js
function useDebounce(fn, ms, deps) {
  if (ms === void 0) {
    ms = 0;
  }
  if (deps === void 0) {
    deps = [];
  }
  var _a = useTimeoutFn(fn, ms), isReady = _a[0], cancel = _a[1], reset = _a[2];
  (0, import_react27.useEffect)(reset, deps);
  return [isReady, cancel];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useDeepCompareEffect.js
var isPrimitive2 = function(val) {
  return val !== Object(val);
};
var useDeepCompareEffect = function(effect, deps) {
  if (true) {
    if (!(deps instanceof Array) || !deps.length) {
      console.warn("`useDeepCompareEffect` should not be used with no dependencies. Use React.useEffect instead.");
    }
    if (deps.every(isPrimitive2)) {
      console.warn("`useDeepCompareEffect` should not be used with dependencies that are all primitive values. Use React.useEffect instead.");
    }
  }
  useCustomCompareEffect_default(effect, deps, isDeepEqual_default);
};
var useDeepCompareEffect_default = useDeepCompareEffect;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useDefault.js
var import_react28 = __toESM(require_react());
var useDefault = function(defaultValue, initialValue) {
  var _a = (0, import_react28.useState)(initialValue), value = _a[0], setValue = _a[1];
  if (value === void 0 || value === null) {
    return [defaultValue, setValue];
  }
  return [value, setValue];
};
var useDefault_default = useDefault;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useDrop.js
init_tslib_es6();
var import_react29 = __toESM(require_react());
var createProcess = function(options) {
  return function(dataTransfer, event) {
    var uri = dataTransfer.getData("text/uri-list");
    if (uri) {
      (options.onUri || noop)(uri, event);
      return;
    }
    if (dataTransfer.files && dataTransfer.files.length) {
      (options.onFiles || noop)(Array.from(dataTransfer.files), event);
      return;
    }
    if (event.clipboardData) {
      var text = event.clipboardData.getData("text");
      (options.onText || noop)(text, event);
      return;
    }
  };
};
var useDrop = function(options, args) {
  if (options === void 0) {
    options = {};
  }
  if (args === void 0) {
    args = [];
  }
  var onFiles = options.onFiles, onText = options.onText, onUri = options.onUri;
  var _a = (0, import_react29.useState)(false), over = _a[0], setOverRaw = _a[1];
  var setOver = (0, import_react29.useCallback)(setOverRaw, []);
  var process2 = (0, import_react29.useMemo)(function() {
    return createProcess(options);
  }, [onFiles, onText, onUri]);
  (0, import_react29.useEffect)(function() {
    var onDragOver = function(event) {
      event.preventDefault();
      setOver(true);
    };
    var onDragEnter = function(event) {
      event.preventDefault();
      setOver(true);
    };
    var onDragLeave = function() {
      setOver(false);
    };
    var onDragExit = function() {
      setOver(false);
    };
    var onDrop = function(event) {
      event.preventDefault();
      setOver(false);
      process2(event.dataTransfer, event);
    };
    var onPaste = function(event) {
      process2(event.clipboardData, event);
    };
    on(document, "dragover", onDragOver);
    on(document, "dragenter", onDragEnter);
    on(document, "dragleave", onDragLeave);
    on(document, "dragexit", onDragExit);
    on(document, "drop", onDrop);
    if (onText) {
      on(document, "paste", onPaste);
    }
    return function() {
      off(document, "dragover", onDragOver);
      off(document, "dragenter", onDragEnter);
      off(document, "dragleave", onDragLeave);
      off(document, "dragexit", onDragExit);
      off(document, "drop", onDrop);
      off(document, "paste", onPaste);
    };
  }, __spreadArrays([process2], args));
  return { over };
};
var useDrop_default = useDrop;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useDropArea.js
var import_react30 = __toESM(require_react());
var createProcess2 = function(options, mounted) {
  return function(dataTransfer, event) {
    var uri = dataTransfer.getData("text/uri-list");
    if (uri) {
      (options.onUri || noop)(uri, event);
      return;
    }
    if (dataTransfer.files && dataTransfer.files.length) {
      (options.onFiles || noop)(Array.from(dataTransfer.files), event);
      return;
    }
    if (dataTransfer.items && dataTransfer.items.length) {
      dataTransfer.items[0].getAsString(function(text) {
        if (mounted) {
          (options.onText || noop)(text, event);
        }
      });
    }
  };
};
var createBond = function(process2, setOver) {
  return {
    onDragOver: function(event) {
      event.preventDefault();
    },
    onDragEnter: function(event) {
      event.preventDefault();
      setOver(true);
    },
    onDragLeave: function() {
      setOver(false);
    },
    onDrop: function(event) {
      event.preventDefault();
      event.persist();
      setOver(false);
      process2(event.dataTransfer, event);
    },
    onPaste: function(event) {
      event.persist();
      process2(event.clipboardData, event);
    }
  };
};
var useDropArea = function(options) {
  if (options === void 0) {
    options = {};
  }
  var onFiles = options.onFiles, onText = options.onText, onUri = options.onUri;
  var isMounted = useMountedState();
  var _a = (0, import_react30.useState)(false), over = _a[0], setOver = _a[1];
  var process2 = (0, import_react30.useMemo)(function() {
    return createProcess2(options, isMounted());
  }, [onFiles, onText, onUri]);
  var bond = (0, import_react30.useMemo)(function() {
    return createBond(process2, setOver);
  }, [process2, setOver]);
  return [bond, { over }];
};
var useDropArea_default = useDropArea;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useEffectOnce.js
var import_react31 = __toESM(require_react());
var useEffectOnce = function(effect) {
  (0, import_react31.useEffect)(effect, []);
};
var useEffectOnce_default = useEffectOnce;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useEnsuredForwardedRef.js
var import_react32 = __toESM(require_react());
function useEnsuredForwardedRef(forwardedRef) {
  var ensuredRef = (0, import_react32.useRef)(forwardedRef && forwardedRef.current);
  (0, import_react32.useEffect)(function() {
    if (!forwardedRef) {
      return;
    }
    forwardedRef.current = ensuredRef.current;
  }, [forwardedRef]);
  return ensuredRef;
}
function ensuredForwardRef(Component) {
  return (0, import_react32.forwardRef)(function(props, ref) {
    var ensuredRef = useEnsuredForwardedRef(ref);
    return Component(props, ensuredRef);
  });
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useEvent.js
var import_react33 = __toESM(require_react());
var defaultTarget = isBrowser ? window : null;
var isListenerType1 = function(target) {
  return !!target.addEventListener;
};
var isListenerType2 = function(target) {
  return !!target.on;
};
var useEvent = function(name, handler, target, options) {
  if (target === void 0) {
    target = defaultTarget;
  }
  (0, import_react33.useEffect)(function() {
    if (!handler) {
      return;
    }
    if (!target) {
      return;
    }
    if (isListenerType1(target)) {
      on(target, name, handler, options);
    } else if (isListenerType2(target)) {
      target.on(name, handler, options);
    }
    return function() {
      if (isListenerType1(target)) {
        off(target, name, handler, options);
      } else if (isListenerType2(target)) {
        target.off(name, handler, options);
      }
    };
  }, [name, handler, target, JSON.stringify(options)]);
};
var useEvent_default = useEvent;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useError.js
var import_react34 = __toESM(require_react());
var useError = function() {
  var _a = (0, import_react34.useState)(null), error = _a[0], setError = _a[1];
  (0, import_react34.useEffect)(function() {
    if (error) {
      throw error;
    }
  }, [error]);
  var dispatchError = (0, import_react34.useCallback)(function(err) {
    setError(err);
  }, []);
  return dispatchError;
};
var useError_default = useError;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useFavicon.js
var import_react35 = __toESM(require_react());
var useFavicon = function(href) {
  (0, import_react35.useEffect)(function() {
    var link = document.querySelector("link[rel*='icon']") || document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = href;
    document.getElementsByTagName("head")[0].appendChild(link);
  }, [href]);
};
var useFavicon_default = useFavicon;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useFullscreen.js
var import_react36 = __toESM(require_react());
var import_screenfull = __toESM(require_screenfull());
var useFullscreen = function(ref, enabled, options) {
  if (options === void 0) {
    options = {};
  }
  var video = options.video, _a = options.onClose, onClose = _a === void 0 ? noop : _a;
  var _b = (0, import_react36.useState)(enabled), isFullscreen = _b[0], setIsFullscreen = _b[1];
  useIsomorphicLayoutEffect_default(function() {
    if (!enabled) {
      return;
    }
    if (!ref.current) {
      return;
    }
    var onWebkitEndFullscreen = function() {
      if (video === null || video === void 0 ? void 0 : video.current) {
        off(video.current, "webkitendfullscreen", onWebkitEndFullscreen);
      }
      onClose();
    };
    var onChange = function() {
      if (import_screenfull.default.isEnabled) {
        var isScreenfullFullscreen = import_screenfull.default.isFullscreen;
        setIsFullscreen(isScreenfullFullscreen);
        if (!isScreenfullFullscreen) {
          onClose();
        }
      }
    };
    if (import_screenfull.default.isEnabled) {
      try {
        import_screenfull.default.request(ref.current);
        setIsFullscreen(true);
      } catch (error) {
        onClose(error);
        setIsFullscreen(false);
      }
      import_screenfull.default.on("change", onChange);
    } else if (video && video.current && video.current.webkitEnterFullscreen) {
      video.current.webkitEnterFullscreen();
      on(video.current, "webkitendfullscreen", onWebkitEndFullscreen);
      setIsFullscreen(true);
    } else {
      onClose();
      setIsFullscreen(false);
    }
    return function() {
      setIsFullscreen(false);
      if (import_screenfull.default.isEnabled) {
        try {
          import_screenfull.default.off("change", onChange);
          import_screenfull.default.exit();
        } catch (_a2) {
        }
      } else if (video && video.current && video.current.webkitExitFullscreen) {
        off(video.current, "webkitendfullscreen", onWebkitEndFullscreen);
        video.current.webkitExitFullscreen();
      }
    };
  }, [enabled, video, ref]);
  return isFullscreen;
};
var useFullscreen_default = useFullscreen;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useGeolocation.js
init_tslib_es6();
var import_react37 = __toESM(require_react());
var useGeolocation = function(options) {
  var _a = (0, import_react37.useState)({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: Date.now()
  }), state = _a[0], setState = _a[1];
  var mounted = true;
  var watchId;
  var onEvent = function(event) {
    if (mounted) {
      setState({
        loading: false,
        accuracy: event.coords.accuracy,
        altitude: event.coords.altitude,
        altitudeAccuracy: event.coords.altitudeAccuracy,
        heading: event.coords.heading,
        latitude: event.coords.latitude,
        longitude: event.coords.longitude,
        speed: event.coords.speed,
        timestamp: event.timestamp
      });
    }
  };
  var onEventError = function(error) {
    return mounted && setState(function(oldState) {
      return __assign(__assign({}, oldState), { loading: false, error });
    });
  };
  (0, import_react37.useEffect)(function() {
    navigator.geolocation.getCurrentPosition(onEvent, onEventError, options);
    watchId = navigator.geolocation.watchPosition(onEvent, onEventError, options);
    return function() {
      mounted = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);
  return state;
};
var useGeolocation_default = useGeolocation;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useGetSetState.js
init_tslib_es6();
var import_react38 = __toESM(require_react());
var useGetSetState = function(initialState) {
  if (initialState === void 0) {
    initialState = {};
  }
  if (true) {
    if (typeof initialState !== "object") {
      console.error("useGetSetState initial state must be an object.");
    }
  }
  var update = useUpdate();
  var state = (0, import_react38.useRef)(__assign({}, initialState));
  var get = (0, import_react38.useCallback)(function() {
    return state.current;
  }, []);
  var set = (0, import_react38.useCallback)(function(patch) {
    if (!patch) {
      return;
    }
    if (true) {
      if (typeof patch !== "object") {
        console.error("useGetSetState setter patch must be an object.");
      }
    }
    Object.assign(state.current, patch);
    update();
  }, []);
  return [get, set];
};
var useGetSetState_default = useGetSetState;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useHarmonicIntervalFn.js
var import_react39 = __toESM(require_react());

// node_modules/.pnpm/set-harmonic-interval@1.0.1/node_modules/set-harmonic-interval/lib/index.esm.js
var counter2 = 0;
var buckets = {};
var setHarmonicInterval = function(fn, ms) {
  var _a;
  var id = counter2++;
  if (buckets[ms]) {
    buckets[ms].listeners[id] = fn;
  } else {
    var timer = setInterval(function() {
      var listeners = buckets[ms].listeners;
      var didThrow = false;
      var lastError;
      for (var _i = 0, _a2 = Object.values(listeners); _i < _a2.length; _i++) {
        var listener = _a2[_i];
        try {
          listener();
        } catch (error) {
          didThrow = true;
          lastError = error;
        }
      }
      if (didThrow)
        throw lastError;
    }, ms);
    buckets[ms] = {
      ms,
      timer,
      listeners: (_a = {}, _a[id] = fn, _a)
    };
  }
  return {
    bucket: buckets[ms],
    id
  };
};
var clearHarmonicInterval = function(_a) {
  var bucket = _a.bucket, id = _a.id;
  delete bucket.listeners[id];
  var hasListeners = false;
  for (var listener in bucket.listeners) {
    hasListeners = true;
    break;
  }
  if (!hasListeners) {
    clearInterval(bucket.timer);
    delete buckets[bucket.ms];
  }
};

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useHarmonicIntervalFn.js
var useHarmonicIntervalFn = function(fn, delay) {
  if (delay === void 0) {
    delay = 0;
  }
  var latestCallback = (0, import_react39.useRef)(function() {
  });
  (0, import_react39.useEffect)(function() {
    latestCallback.current = fn;
  });
  (0, import_react39.useEffect)(function() {
    if (delay !== null) {
      var interval_1 = setHarmonicInterval(function() {
        return latestCallback.current();
      }, delay);
      return function() {
        return clearHarmonicInterval(interval_1);
      };
    }
    return void 0;
  }, [delay]);
};
var useHarmonicIntervalFn_default = useHarmonicIntervalFn;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useHover.js
var React2 = __toESM(require_react());
var useState15 = React2.useState;
var useHover = function(element) {
  var _a = useState15(false), state = _a[0], setState = _a[1];
  var onMouseEnter = function(originalOnMouseEnter) {
    return function(event) {
      (originalOnMouseEnter || noop)(event);
      setState(true);
    };
  };
  var onMouseLeave = function(originalOnMouseLeave) {
    return function(event) {
      (originalOnMouseLeave || noop)(event);
      setState(false);
    };
  };
  if (typeof element === "function") {
    element = element(state);
  }
  var el = React2.cloneElement(element, {
    onMouseEnter: onMouseEnter(element.props.onMouseEnter),
    onMouseLeave: onMouseLeave(element.props.onMouseLeave)
  });
  return [el, state];
};
var useHover_default = useHover;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useHoverDirty.js
var import_react40 = __toESM(require_react());
var useHoverDirty = function(ref, enabled) {
  if (enabled === void 0) {
    enabled = true;
  }
  if (true) {
    if (typeof ref !== "object" || typeof ref.current === "undefined") {
      console.error("useHoverDirty expects a single ref argument.");
    }
  }
  var _a = (0, import_react40.useState)(false), value = _a[0], setValue = _a[1];
  (0, import_react40.useEffect)(function() {
    var onMouseOver = function() {
      return setValue(true);
    };
    var onMouseOut = function() {
      return setValue(false);
    };
    if (enabled && ref && ref.current) {
      on(ref.current, "mouseover", onMouseOver);
      on(ref.current, "mouseout", onMouseOut);
    }
    var current = ref.current;
    return function() {
      if (enabled && current) {
        off(current, "mouseover", onMouseOver);
        off(current, "mouseout", onMouseOut);
      }
    };
  }, [enabled, ref]);
  return value;
};
var useHoverDirty_default = useHoverDirty;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useIdle.js
var import_react41 = __toESM(require_react());

// node_modules/.pnpm/throttle-debounce@3.0.1/node_modules/throttle-debounce/esm/index.js
function throttle(delay, noTrailing, callback, debounceMode) {
  var timeoutID;
  var cancelled = false;
  var lastExec = 0;
  function clearExistingTimeout() {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
  }
  function cancel() {
    clearExistingTimeout();
    cancelled = true;
  }
  if (typeof noTrailing !== "boolean") {
    debounceMode = callback;
    callback = noTrailing;
    noTrailing = void 0;
  }
  function wrapper() {
    for (var _len = arguments.length, arguments_ = new Array(_len), _key = 0; _key < _len; _key++) {
      arguments_[_key] = arguments[_key];
    }
    var self = this;
    var elapsed = Date.now() - lastExec;
    if (cancelled) {
      return;
    }
    function exec() {
      lastExec = Date.now();
      callback.apply(self, arguments_);
    }
    function clear() {
      timeoutID = void 0;
    }
    if (debounceMode && !timeoutID) {
      exec();
    }
    clearExistingTimeout();
    if (debounceMode === void 0 && elapsed > delay) {
      exec();
    } else if (noTrailing !== true) {
      timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === void 0 ? delay - elapsed : delay);
    }
  }
  wrapper.cancel = cancel;
  return wrapper;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useIdle.js
var defaultEvents2 = ["mousemove", "mousedown", "resize", "keydown", "touchstart", "wheel"];
var oneMinute = 6e4;
var useIdle = function(ms, initialState, events) {
  if (ms === void 0) {
    ms = oneMinute;
  }
  if (initialState === void 0) {
    initialState = false;
  }
  if (events === void 0) {
    events = defaultEvents2;
  }
  var _a = (0, import_react41.useState)(initialState), state = _a[0], setState = _a[1];
  (0, import_react41.useEffect)(function() {
    var mounted = true;
    var timeout;
    var localState = state;
    var set = function(newState) {
      if (mounted) {
        localState = newState;
        setState(newState);
      }
    };
    var onEvent = throttle(50, function() {
      if (localState) {
        set(false);
      }
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        return set(true);
      }, ms);
    });
    var onVisibility = function() {
      if (!document.hidden) {
        onEvent();
      }
    };
    for (var i = 0; i < events.length; i++) {
      on(window, events[i], onEvent);
    }
    on(document, "visibilitychange", onVisibility);
    timeout = setTimeout(function() {
      return set(true);
    }, ms);
    return function() {
      mounted = false;
      for (var i2 = 0; i2 < events.length; i2++) {
        off(window, events[i2], onEvent);
      }
      off(document, "visibilitychange", onVisibility);
    };
  }, [ms, events]);
  return state;
};
var useIdle_default = useIdle;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useIntersection.js
var import_react42 = __toESM(require_react());
var useIntersection = function(ref, options) {
  var _a = (0, import_react42.useState)(null), intersectionObserverEntry = _a[0], setIntersectionObserverEntry = _a[1];
  (0, import_react42.useEffect)(function() {
    if (ref.current && typeof IntersectionObserver === "function") {
      var handler = function(entries) {
        setIntersectionObserverEntry(entries[0]);
      };
      var observer_1 = new IntersectionObserver(handler, options);
      observer_1.observe(ref.current);
      return function() {
        setIntersectionObserverEntry(null);
        observer_1.disconnect();
      };
    }
    return function() {
    };
  }, [ref.current, options.threshold, options.root, options.rootMargin]);
  return intersectionObserverEntry;
};
var useIntersection_default = useIntersection;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useInterval.js
var import_react43 = __toESM(require_react());
var useInterval = function(callback, delay) {
  var savedCallback = (0, import_react43.useRef)(function() {
  });
  (0, import_react43.useEffect)(function() {
    savedCallback.current = callback;
  });
  (0, import_react43.useEffect)(function() {
    if (delay !== null) {
      var interval_1 = setInterval(function() {
        return savedCallback.current();
      }, delay || 0);
      return function() {
        return clearInterval(interval_1);
      };
    }
    return void 0;
  }, [delay]);
};
var useInterval_default = useInterval;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useKey.js
var import_react44 = __toESM(require_react());
var createKeyPredicate = function(keyFilter) {
  return typeof keyFilter === "function" ? keyFilter : typeof keyFilter === "string" ? function(event) {
    return event.key === keyFilter;
  } : keyFilter ? function() {
    return true;
  } : function() {
    return false;
  };
};
var useKey = function(key, fn, opts, deps) {
  if (fn === void 0) {
    fn = noop;
  }
  if (opts === void 0) {
    opts = {};
  }
  if (deps === void 0) {
    deps = [key];
  }
  var _a = opts.event, event = _a === void 0 ? "keydown" : _a, target = opts.target, options = opts.options;
  var useMemoHandler = (0, import_react44.useMemo)(function() {
    var predicate = createKeyPredicate(key);
    var handler = function(handlerEvent) {
      if (predicate(handlerEvent)) {
        return fn(handlerEvent);
      }
    };
    return handler;
  }, deps);
  useEvent_default(event, useMemoHandler, target, options);
};
var useKey_default = useKey;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createBreakpoint.js
var import_react45 = __toESM(require_react());
var createBreakpoint = function(breakpoints) {
  if (breakpoints === void 0) {
    breakpoints = { laptopL: 1440, laptop: 1024, tablet: 768 };
  }
  return function() {
    var _a = (0, import_react45.useState)(isBrowser ? window.innerWidth : 0), screen = _a[0], setScreen = _a[1];
    (0, import_react45.useEffect)(function() {
      var setSideScreen = function() {
        setScreen(window.innerWidth);
      };
      setSideScreen();
      on(window, "resize", setSideScreen);
      return function() {
        off(window, "resize", setSideScreen);
      };
    });
    var sortedBreakpoints = (0, import_react45.useMemo)(function() {
      return Object.entries(breakpoints).sort(function(a, b) {
        return a[1] >= b[1] ? 1 : -1;
      });
    }, [breakpoints]);
    var result = sortedBreakpoints.reduce(function(acc, _a2) {
      var name = _a2[0], width = _a2[1];
      if (screen >= width) {
        return name;
      } else {
        return acc;
      }
    }, sortedBreakpoints[0][0]);
    return result;
  };
};
var createBreakpoint_default = createBreakpoint;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useKeyPress.js
var import_react46 = __toESM(require_react());
var useKeyPress = function(keyFilter) {
  var _a = (0, import_react46.useState)([false, null]), state = _a[0], set = _a[1];
  useKey_default(keyFilter, function(event) {
    return set([true, event]);
  }, { event: "keydown" }, [state]);
  useKey_default(keyFilter, function(event) {
    return set([false, event]);
  }, { event: "keyup" }, [state]);
  return state;
};
var useKeyPress_default = useKeyPress;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useKeyPressEvent.js
var useKeyPressEvent = function(key, keydown, keyup, useKeyPress2) {
  if (useKeyPress2 === void 0) {
    useKeyPress2 = useKeyPress_default;
  }
  var _a = useKeyPress2(key), pressed = _a[0], event = _a[1];
  useUpdateEffect_default(function() {
    if (!pressed && keyup) {
      keyup(event);
    } else if (pressed && keydown) {
      keydown(event);
    }
  }, [pressed]);
};
var useKeyPressEvent_default = useKeyPressEvent;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useLatest.js
var import_react47 = __toESM(require_react());
var useLatest = function(value) {
  var ref = (0, import_react47.useRef)(value);
  ref.current = value;
  return ref;
};
var useLatest_default = useLatest;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useLifecycles.js
var import_react48 = __toESM(require_react());
var useLifecycles = function(mount, unmount) {
  (0, import_react48.useEffect)(function() {
    if (mount) {
      mount();
    }
    return function() {
      if (unmount) {
        unmount();
      }
    };
  }, []);
};
var useLifecycles_default = useLifecycles;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useList.js
var import_react49 = __toESM(require_react());
function useList(initialList) {
  if (initialList === void 0) {
    initialList = [];
  }
  var list = (0, import_react49.useRef)(resolveHookState(initialList));
  var update = useUpdate();
  var actions = (0, import_react49.useMemo)(function() {
    var a = {
      set: function(newList) {
        list.current = resolveHookState(newList, list.current);
        update();
      },
      push: function() {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          items[_i] = arguments[_i];
        }
        items.length && actions.set(function(curr) {
          return curr.concat(items);
        });
      },
      updateAt: function(index, item) {
        actions.set(function(curr) {
          var arr = curr.slice();
          arr[index] = item;
          return arr;
        });
      },
      insertAt: function(index, item) {
        actions.set(function(curr) {
          var arr = curr.slice();
          index > arr.length ? arr[index] = item : arr.splice(index, 0, item);
          return arr;
        });
      },
      update: function(predicate, newItem) {
        actions.set(function(curr) {
          return curr.map(function(item) {
            return predicate(item, newItem) ? newItem : item;
          });
        });
      },
      updateFirst: function(predicate, newItem) {
        var index = list.current.findIndex(function(item) {
          return predicate(item, newItem);
        });
        index >= 0 && actions.updateAt(index, newItem);
      },
      upsert: function(predicate, newItem) {
        var index = list.current.findIndex(function(item) {
          return predicate(item, newItem);
        });
        index >= 0 ? actions.updateAt(index, newItem) : actions.push(newItem);
      },
      sort: function(compareFn) {
        actions.set(function(curr) {
          return curr.slice().sort(compareFn);
        });
      },
      filter: function(callbackFn, thisArg) {
        actions.set(function(curr) {
          return curr.slice().filter(callbackFn, thisArg);
        });
      },
      removeAt: function(index) {
        actions.set(function(curr) {
          var arr = curr.slice();
          arr.splice(index, 1);
          return arr;
        });
      },
      clear: function() {
        actions.set([]);
      },
      reset: function() {
        actions.set(resolveHookState(initialList).slice());
      }
    };
    a.remove = a.removeAt;
    return a;
  }, []);
  return [list.current, actions];
}
var useList_default = useList;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useLocalStorage.js
var import_react50 = __toESM(require_react());
var useLocalStorage = function(key, initialValue, options) {
  if (!isBrowser) {
    return [initialValue, noop, noop];
  }
  if (!key) {
    throw new Error("useLocalStorage key may not be falsy");
  }
  var deserializer = options ? options.raw ? function(value) {
    return value;
  } : options.deserializer : JSON.parse;
  var initializer = (0, import_react50.useRef)(function(key2) {
    try {
      var serializer = options ? options.raw ? String : options.serializer : JSON.stringify;
      var localStorageValue = localStorage.getItem(key2);
      if (localStorageValue !== null) {
        return deserializer(localStorageValue);
      } else {
        initialValue && localStorage.setItem(key2, serializer(initialValue));
        return initialValue;
      }
    } catch (_a2) {
      return initialValue;
    }
  });
  var _a = (0, import_react50.useState)(function() {
    return initializer.current(key);
  }), state = _a[0], setState = _a[1];
  (0, import_react50.useLayoutEffect)(function() {
    return setState(initializer.current(key));
  }, [key]);
  var set = (0, import_react50.useCallback)(function(valOrFunc) {
    try {
      var newState = typeof valOrFunc === "function" ? valOrFunc(state) : valOrFunc;
      if (typeof newState === "undefined")
        return;
      var value = void 0;
      if (options)
        if (options.raw)
          if (typeof newState === "string")
            value = newState;
          else
            value = JSON.stringify(newState);
        else if (options.serializer)
          value = options.serializer(newState);
        else
          value = JSON.stringify(newState);
      else
        value = JSON.stringify(newState);
      localStorage.setItem(key, value);
      setState(deserializer(value));
    } catch (_a2) {
    }
  }, [key, setState]);
  var remove = (0, import_react50.useCallback)(function() {
    try {
      localStorage.removeItem(key);
      setState(void 0);
    } catch (_a2) {
    }
  }, [key, setState]);
  return [state, set, remove];
};
var useLocalStorage_default = useLocalStorage;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useLocation.js
var import_react51 = __toESM(require_react());
var patchHistoryMethod = function(method) {
  var history = window.history;
  var original = history[method];
  history[method] = function(state) {
    var result = original.apply(this, arguments);
    var event = new Event(method.toLowerCase());
    event.state = state;
    window.dispatchEvent(event);
    return result;
  };
};
if (isBrowser) {
  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
}
var useLocationServer = function() {
  return {
    trigger: "load",
    length: 1
  };
};
var buildState = function(trigger) {
  var _a = window.history, state = _a.state, length = _a.length;
  var _b = window.location, hash = _b.hash, host = _b.host, hostname = _b.hostname, href = _b.href, origin = _b.origin, pathname = _b.pathname, port = _b.port, protocol = _b.protocol, search = _b.search;
  return {
    trigger,
    state,
    length,
    hash,
    host,
    hostname,
    href,
    origin,
    pathname,
    port,
    protocol,
    search
  };
};
var useLocationBrowser = function() {
  var _a = (0, import_react51.useState)(buildState("load")), state = _a[0], setState = _a[1];
  (0, import_react51.useEffect)(function() {
    var onPopstate = function() {
      return setState(buildState("popstate"));
    };
    var onPushstate = function() {
      return setState(buildState("pushstate"));
    };
    var onReplacestate = function() {
      return setState(buildState("replacestate"));
    };
    on(window, "popstate", onPopstate);
    on(window, "pushstate", onPushstate);
    on(window, "replacestate", onReplacestate);
    return function() {
      off(window, "popstate", onPopstate);
      off(window, "pushstate", onPushstate);
      off(window, "replacestate", onReplacestate);
    };
  }, []);
  return state;
};
var hasEventConstructor = typeof Event === "function";
var useLocation_default = isBrowser && hasEventConstructor ? useLocationBrowser : useLocationServer;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useLockBodyScroll.js
var import_react52 = __toESM(require_react());
function getClosestBody(el) {
  if (!el) {
    return null;
  } else if (el.tagName === "BODY") {
    return el;
  } else if (el.tagName === "IFRAME") {
    var document_1 = el.contentDocument;
    return document_1 ? document_1.body : null;
  } else if (!el.offsetParent) {
    return null;
  }
  return getClosestBody(el.offsetParent);
}
function preventDefault(rawEvent) {
  var e2 = rawEvent || window.event;
  if (e2.touches.length > 1)
    return true;
  if (e2.preventDefault)
    e2.preventDefault();
  return false;
}
var isIosDevice = isBrowser && window.navigator && window.navigator.platform && /iP(ad|hone|od)/.test(window.navigator.platform);
var bodies = /* @__PURE__ */ new Map();
var doc = typeof document === "object" ? document : void 0;
var documentListenerAdded = false;
var useLockBodyScroll_default = !doc ? function useLockBodyMock(_locked, _elementRef) {
  if (_locked === void 0) {
    _locked = true;
  }
} : function useLockBody(locked, elementRef) {
  if (locked === void 0) {
    locked = true;
  }
  var bodyRef = (0, import_react52.useRef)(doc.body);
  elementRef = elementRef || bodyRef;
  var lock = function(body) {
    var bodyInfo = bodies.get(body);
    if (!bodyInfo) {
      bodies.set(body, { counter: 1, initialOverflow: body.style.overflow });
      if (isIosDevice) {
        if (!documentListenerAdded) {
          on(document, "touchmove", preventDefault, { passive: false });
          documentListenerAdded = true;
        }
      } else {
        body.style.overflow = "hidden";
      }
    } else {
      bodies.set(body, {
        counter: bodyInfo.counter + 1,
        initialOverflow: bodyInfo.initialOverflow
      });
    }
  };
  var unlock = function(body) {
    var bodyInfo = bodies.get(body);
    if (bodyInfo) {
      if (bodyInfo.counter === 1) {
        bodies.delete(body);
        if (isIosDevice) {
          body.ontouchmove = null;
          if (documentListenerAdded) {
            off(document, "touchmove", preventDefault);
            documentListenerAdded = false;
          }
        } else {
          body.style.overflow = bodyInfo.initialOverflow;
        }
      } else {
        bodies.set(body, {
          counter: bodyInfo.counter - 1,
          initialOverflow: bodyInfo.initialOverflow
        });
      }
    }
  };
  (0, import_react52.useEffect)(function() {
    var body = getClosestBody(elementRef.current);
    if (!body) {
      return;
    }
    if (locked) {
      lock(body);
    } else {
      unlock(body);
    }
  }, [locked, elementRef.current]);
  (0, import_react52.useEffect)(function() {
    var body = getClosestBody(elementRef.current);
    if (!body) {
      return;
    }
    return function() {
      unlock(body);
    };
  }, []);
};

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useLogger.js
init_tslib_es6();
var useLogger = function(componentName) {
  var rest = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    rest[_i - 1] = arguments[_i];
  }
  useEffectOnce_default(function() {
    console.log.apply(console, __spreadArrays([componentName + " mounted"], rest));
    return function() {
      return console.log(componentName + " unmounted");
    };
  });
  useUpdateEffect_default(function() {
    console.log.apply(console, __spreadArrays([componentName + " updated"], rest));
  });
};
var useLogger_default = useLogger;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useLongPress.js
var import_react53 = __toESM(require_react());
var isTouchEvent = function(ev) {
  return "touches" in ev;
};
var preventDefault2 = function(ev) {
  if (!isTouchEvent(ev))
    return;
  if (ev.touches.length < 2 && ev.preventDefault) {
    ev.preventDefault();
  }
};
var useLongPress = function(callback, _a) {
  var _b = _a === void 0 ? {} : _a, _c = _b.isPreventDefault, isPreventDefault = _c === void 0 ? true : _c, _d = _b.delay, delay = _d === void 0 ? 300 : _d;
  var timeout = (0, import_react53.useRef)();
  var target = (0, import_react53.useRef)();
  var start = (0, import_react53.useCallback)(function(event) {
    if (isPreventDefault && event.target) {
      on(event.target, "touchend", preventDefault2, { passive: false });
      target.current = event.target;
    }
    timeout.current = setTimeout(function() {
      return callback(event);
    }, delay);
  }, [callback, delay, isPreventDefault]);
  var clear = (0, import_react53.useCallback)(function() {
    timeout.current && clearTimeout(timeout.current);
    if (isPreventDefault && target.current) {
      off(target.current, "touchend", preventDefault2);
    }
  }, [isPreventDefault]);
  return {
    onMouseDown: function(e2) {
      return start(e2);
    },
    onTouchStart: function(e2) {
      return start(e2);
    },
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear
  };
};
var useLongPress_default = useLongPress;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMap.js
init_tslib_es6();
var import_react54 = __toESM(require_react());
var useMap = function(initialMap) {
  if (initialMap === void 0) {
    initialMap = {};
  }
  var _a = (0, import_react54.useState)(initialMap), map = _a[0], set = _a[1];
  var stableActions = (0, import_react54.useMemo)(function() {
    return {
      set: function(key, entry) {
        set(function(prevMap) {
          var _a2;
          return __assign(__assign({}, prevMap), (_a2 = {}, _a2[key] = entry, _a2));
        });
      },
      setAll: function(newMap) {
        set(newMap);
      },
      remove: function(key) {
        set(function(prevMap) {
          var _a2 = prevMap, _b = key, omit = _a2[_b], rest = __rest(_a2, [typeof _b === "symbol" ? _b : _b + ""]);
          return rest;
        });
      },
      reset: function() {
        return set(initialMap);
      }
    };
  }, [set]);
  var utils = __assign({ get: (0, import_react54.useCallback)(function(key) {
    return map[key];
  }, [map]) }, stableActions);
  return [map, utils];
};
var useMap_default = useMap;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMedia.js
var import_react55 = __toESM(require_react());
var getInitialState = function(query, defaultState4) {
  if (defaultState4 !== void 0) {
    return defaultState4;
  }
  if (isBrowser) {
    return window.matchMedia(query).matches;
  }
  if (true) {
    console.warn("`useMedia` When server side rendering, defaultState should be defined to prevent a hydration mismatches.");
  }
  return false;
};
var useMedia = function(query, defaultState4) {
  var _a = (0, import_react55.useState)(getInitialState(query, defaultState4)), state = _a[0], setState = _a[1];
  (0, import_react55.useEffect)(function() {
    var mounted = true;
    var mql = window.matchMedia(query);
    var onChange = function() {
      if (!mounted) {
        return;
      }
      setState(!!mql.matches);
    };
    mql.addEventListener("change", onChange);
    setState(mql.matches);
    return function() {
      mounted = false;
      mql.removeEventListener("change", onChange);
    };
  }, [query]);
  return state;
};
var useMedia_default = useMedia;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMediaDevices.js
var import_react56 = __toESM(require_react());
var useMediaDevices = function() {
  var _a = (0, import_react56.useState)({}), state = _a[0], setState = _a[1];
  (0, import_react56.useEffect)(function() {
    var mounted = true;
    var onChange = function() {
      navigator.mediaDevices.enumerateDevices().then(function(devices) {
        if (mounted) {
          setState({
            devices: devices.map(function(_a2) {
              var deviceId = _a2.deviceId, groupId = _a2.groupId, kind = _a2.kind, label = _a2.label;
              return {
                deviceId,
                groupId,
                kind,
                label
              };
            })
          });
        }
      }).catch(noop);
    };
    on(navigator.mediaDevices, "devicechange", onChange);
    onChange();
    return function() {
      mounted = false;
      off(navigator.mediaDevices, "devicechange", onChange);
    };
  }, []);
  return state;
};
var useMediaDevicesMock = function() {
  return {};
};
var useMediaDevices_default = isNavigator && !!navigator.mediaDevices ? useMediaDevices : useMediaDevicesMock;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMediatedState.js
var import_react57 = __toESM(require_react());
function useMediatedState(mediator, initialState) {
  var mediatorFn = (0, import_react57.useRef)(mediator);
  var _a = (0, import_react57.useState)(initialState), state = _a[0], setMediatedState = _a[1];
  var setState = (0, import_react57.useCallback)(function(newState) {
    if (mediatorFn.current.length === 2) {
      mediatorFn.current(newState, setMediatedState);
    } else {
      setMediatedState(mediatorFn.current(newState));
    }
  }, [state]);
  return [state, setState];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMethods.js
var import_react58 = __toESM(require_react());
var useMethods = function(createMethods, initialState) {
  var reducer = (0, import_react58.useMemo)(function() {
    return function(reducerState, action) {
      var _a2;
      return (_a2 = createMethods(reducerState))[action.type].apply(_a2, action.payload);
    };
  }, [createMethods]);
  var _a = (0, import_react58.useReducer)(reducer, initialState), state = _a[0], dispatch = _a[1];
  var wrappedMethods = (0, import_react58.useMemo)(function() {
    var actionTypes = Object.keys(createMethods(initialState));
    return actionTypes.reduce(function(acc, type) {
      acc[type] = function() {
        var payload = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          payload[_i] = arguments[_i];
        }
        return dispatch({ type, payload });
      };
      return acc;
    }, {});
  }, [createMethods, initialState]);
  return [state, wrappedMethods];
};
var useMethods_default = useMethods;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMotion.js
var import_react59 = __toESM(require_react());
var defaultState = {
  acceleration: {
    x: null,
    y: null,
    z: null
  },
  accelerationIncludingGravity: {
    x: null,
    y: null,
    z: null
  },
  rotationRate: {
    alpha: null,
    beta: null,
    gamma: null
  },
  interval: 16
};
var useMotion = function(initialState) {
  if (initialState === void 0) {
    initialState = defaultState;
  }
  var _a = (0, import_react59.useState)(initialState), state = _a[0], setState = _a[1];
  (0, import_react59.useEffect)(function() {
    var handler = function(event) {
      var acceleration = event.acceleration, accelerationIncludingGravity = event.accelerationIncludingGravity, rotationRate = event.rotationRate, interval = event.interval;
      setState({
        acceleration: {
          x: acceleration.x,
          y: acceleration.y,
          z: acceleration.z
        },
        accelerationIncludingGravity: {
          x: accelerationIncludingGravity.x,
          y: accelerationIncludingGravity.y,
          z: accelerationIncludingGravity.z
        },
        rotationRate: {
          alpha: rotationRate.alpha,
          beta: rotationRate.beta,
          gamma: rotationRate.gamma
        },
        interval
      });
    };
    on(window, "devicemotion", handler);
    return function() {
      off(window, "devicemotion", handler);
    };
  }, []);
  return state;
};
var useMotion_default = useMotion;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMount.js
var useMount = function(fn) {
  useEffectOnce_default(function() {
    fn();
  });
};
var useMount_default = useMount;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMouse.js
var import_react62 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useRafState.js
var import_react61 = __toESM(require_react());

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useUnmount.js
var import_react60 = __toESM(require_react());
var useUnmount = function(fn) {
  var fnRef = (0, import_react60.useRef)(fn);
  fnRef.current = fn;
  useEffectOnce_default(function() {
    return function() {
      return fnRef.current();
    };
  });
};
var useUnmount_default = useUnmount;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useRafState.js
var useRafState = function(initialState) {
  var frame = (0, import_react61.useRef)(0);
  var _a = (0, import_react61.useState)(initialState), state = _a[0], setState = _a[1];
  var setRafState = (0, import_react61.useCallback)(function(value) {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(function() {
      setState(value);
    });
  }, []);
  useUnmount_default(function() {
    cancelAnimationFrame(frame.current);
  });
  return [state, setRafState];
};
var useRafState_default = useRafState;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMouse.js
var useMouse = function(ref) {
  if (true) {
    if (typeof ref !== "object" || typeof ref.current === "undefined") {
      console.error("useMouse expects a single ref argument.");
    }
  }
  var _a = useRafState_default({
    docX: 0,
    docY: 0,
    posX: 0,
    posY: 0,
    elX: 0,
    elY: 0,
    elH: 0,
    elW: 0
  }), state = _a[0], setState = _a[1];
  (0, import_react62.useEffect)(function() {
    var moveHandler = function(event) {
      if (ref && ref.current) {
        var _a2 = ref.current.getBoundingClientRect(), left = _a2.left, top_1 = _a2.top, elW = _a2.width, elH = _a2.height;
        var posX = left + window.pageXOffset;
        var posY = top_1 + window.pageYOffset;
        var elX = event.pageX - posX;
        var elY = event.pageY - posY;
        setState({
          docX: event.pageX,
          docY: event.pageY,
          posX,
          posY,
          elX,
          elY,
          elH,
          elW
        });
      }
    };
    on(document, "mousemove", moveHandler);
    return function() {
      off(document, "mousemove", moveHandler);
    };
  }, [ref]);
  return state;
};
var useMouse_default = useMouse;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMouseHovered.js
var nullRef = { current: null };
var useMouseHovered = function(ref, options) {
  if (options === void 0) {
    options = {};
  }
  var whenHovered = !!options.whenHovered;
  var bound = !!options.bound;
  var isHovered = useHoverDirty_default(ref, whenHovered);
  var state = useMouse_default(whenHovered && !isHovered ? nullRef : ref);
  if (bound) {
    state.elX = Math.max(0, Math.min(state.elX, state.elW));
    state.elY = Math.max(0, Math.min(state.elY, state.elH));
  }
  return state;
};
var useMouseHovered_default = useMouseHovered;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMouseWheel.js
var import_react63 = __toESM(require_react());
var useMouseWheel_default = function() {
  var _a = (0, import_react63.useState)(0), mouseWheelScrolled = _a[0], setMouseWheelScrolled = _a[1];
  (0, import_react63.useEffect)(function() {
    var updateScroll = function(e2) {
      setMouseWheelScrolled(e2.deltaY + mouseWheelScrolled);
    };
    on(window, "wheel", updateScroll, false);
    return function() {
      return off(window, "wheel", updateScroll);
    };
  });
  return mouseWheelScrolled;
};

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useNetworkState.js
var import_react64 = __toESM(require_react());
var nav2 = isNavigator ? navigator : void 0;
var conn = nav2 && (nav2.connection || nav2.mozConnection || nav2.webkitConnection);
function getConnectionState(previousState) {
  var online = nav2 === null || nav2 === void 0 ? void 0 : nav2.onLine;
  var previousOnline = previousState === null || previousState === void 0 ? void 0 : previousState.online;
  return {
    online,
    previous: previousOnline,
    since: online !== previousOnline ? /* @__PURE__ */ new Date() : previousState === null || previousState === void 0 ? void 0 : previousState.since,
    downlink: conn === null || conn === void 0 ? void 0 : conn.downlink,
    downlinkMax: conn === null || conn === void 0 ? void 0 : conn.downlinkMax,
    effectiveType: conn === null || conn === void 0 ? void 0 : conn.effectiveType,
    rtt: conn === null || conn === void 0 ? void 0 : conn.rtt,
    saveData: conn === null || conn === void 0 ? void 0 : conn.saveData,
    type: conn === null || conn === void 0 ? void 0 : conn.type
  };
}
function useNetworkState(initialState) {
  var _a = (0, import_react64.useState)(initialState !== null && initialState !== void 0 ? initialState : getConnectionState), state = _a[0], setState = _a[1];
  (0, import_react64.useEffect)(function() {
    var handleStateChange = function() {
      setState(getConnectionState);
    };
    on(window, "online", handleStateChange, { passive: true });
    on(window, "offline", handleStateChange, { passive: true });
    if (conn) {
      on(conn, "change", handleStateChange, { passive: true });
    }
    return function() {
      off(window, "online", handleStateChange);
      off(window, "offline", handleStateChange);
      if (conn) {
        off(conn, "change", handleStateChange);
      }
    };
  }, []);
  return state;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useNumber.js
var useNumber_default = useCounter;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useObservable.js
var import_react65 = __toESM(require_react());
function useObservable(observable$, initialValue) {
  var _a = (0, import_react65.useState)(initialValue), value = _a[0], update = _a[1];
  useIsomorphicLayoutEffect_default(function() {
    var s = observable$.subscribe(update);
    return function() {
      return s.unsubscribe();
    };
  }, [observable$]);
  return value;
}
var useObservable_default = useObservable;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useOrientation.js
var import_react66 = __toESM(require_react());
var defaultState2 = {
  angle: 0,
  type: "landscape-primary"
};
var useOrientation = function(initialState) {
  if (initialState === void 0) {
    initialState = defaultState2;
  }
  var _a = (0, import_react66.useState)(initialState), state = _a[0], setState = _a[1];
  (0, import_react66.useEffect)(function() {
    var screen = window.screen;
    var mounted = true;
    var onChange = function() {
      if (mounted) {
        var orientation_1 = screen.orientation;
        if (orientation_1) {
          var angle = orientation_1.angle, type = orientation_1.type;
          setState({ angle, type });
        } else if (window.orientation !== void 0) {
          setState({
            angle: typeof window.orientation === "number" ? window.orientation : 0,
            type: ""
          });
        } else {
          setState(initialState);
        }
      }
    };
    on(window, "orientationchange", onChange);
    onChange();
    return function() {
      mounted = false;
      off(window, "orientationchange", onChange);
    };
  }, []);
  return state;
};
var useOrientation_default = useOrientation;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/usePageLeave.js
var import_react67 = __toESM(require_react());
var usePageLeave = function(onPageLeave, args) {
  if (args === void 0) {
    args = [];
  }
  (0, import_react67.useEffect)(function() {
    if (!onPageLeave) {
      return;
    }
    var handler = function(event) {
      event = event ? event : window.event;
      var from = event.relatedTarget || event.toElement;
      if (!from || from.nodeName === "HTML") {
        onPageLeave();
      }
    };
    on(document, "mouseout", handler);
    return function() {
      off(document, "mouseout", handler);
    };
  }, args);
};
var usePageLeave_default = usePageLeave;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/usePermission.js
var import_react68 = __toESM(require_react());
var usePermission = function(permissionDesc) {
  var _a = (0, import_react68.useState)(""), state = _a[0], setState = _a[1];
  (0, import_react68.useEffect)(function() {
    var mounted = true;
    var permissionStatus = null;
    var onChange = function() {
      if (!mounted) {
        return;
      }
      setState(function() {
        var _a2;
        return (_a2 = permissionStatus === null || permissionStatus === void 0 ? void 0 : permissionStatus.state) !== null && _a2 !== void 0 ? _a2 : "";
      });
    };
    navigator.permissions.query(permissionDesc).then(function(status) {
      permissionStatus = status;
      on(permissionStatus, "change", onChange);
      onChange();
    }).catch(noop);
    return function() {
      permissionStatus && off(permissionStatus, "change", onChange);
      mounted = false;
      permissionStatus = null;
    };
  }, [permissionDesc]);
  return state;
};
var usePermission_default = usePermission;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/usePrevious.js
var import_react69 = __toESM(require_react());
function usePrevious(state) {
  var ref = (0, import_react69.useRef)();
  (0, import_react69.useEffect)(function() {
    ref.current = state;
  });
  return ref.current;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/usePreviousDistinct.js
var import_react70 = __toESM(require_react());
var strictEquals = function(prev, next) {
  return prev === next;
};
function usePreviousDistinct(value, compare) {
  if (compare === void 0) {
    compare = strictEquals;
  }
  var prevRef = (0, import_react70.useRef)();
  var curRef = (0, import_react70.useRef)(value);
  var isFirstMount = useFirstMountState();
  if (!isFirstMount && !compare(curRef.current, value)) {
    prevRef.current = curRef.current;
    curRef.current = value;
  }
  return prevRef.current;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/usePromise.js
var import_react71 = __toESM(require_react());
var usePromise = function() {
  var isMounted = useMountedState();
  return (0, import_react71.useCallback)(function(promise) {
    return new Promise(function(resolve, reject) {
      var onValue = function(value) {
        isMounted() && resolve(value);
      };
      var onError = function(error) {
        isMounted() && reject(error);
      };
      promise.then(onValue, onError);
    });
  }, []);
};
var usePromise_default = usePromise;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useQueue.js
init_tslib_es6();
var import_react72 = __toESM(require_react());
var useQueue = function(initialValue) {
  if (initialValue === void 0) {
    initialValue = [];
  }
  var _a = (0, import_react72.useState)(initialValue), state = _a[0], set = _a[1];
  return {
    add: function(value) {
      set(function(queue) {
        return __spreadArrays(queue, [value]);
      });
    },
    remove: function() {
      var result;
      set(function(_a2) {
        var first = _a2[0], rest = _a2.slice(1);
        result = first;
        return rest;
      });
      return result;
    },
    get first() {
      return state[0];
    },
    get last() {
      return state[state.length - 1];
    },
    get size() {
      return state.length;
    }
  };
};
var useQueue_default = useQueue;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useRaf.js
var import_react73 = __toESM(require_react());
var useRaf = function(ms, delay) {
  if (ms === void 0) {
    ms = 1e12;
  }
  if (delay === void 0) {
    delay = 0;
  }
  var _a = (0, import_react73.useState)(0), elapsed = _a[0], set = _a[1];
  useIsomorphicLayoutEffect_default(function() {
    var raf;
    var timerStop;
    var start;
    var onFrame = function() {
      var time = Math.min(1, (Date.now() - start) / ms);
      set(time);
      loop();
    };
    var loop = function() {
      raf = requestAnimationFrame(onFrame);
    };
    var onStart = function() {
      timerStop = setTimeout(function() {
        cancelAnimationFrame(raf);
        set(1);
      }, ms);
      start = Date.now();
      loop();
    };
    var timerDelay = setTimeout(onStart, delay);
    return function() {
      clearTimeout(timerStop);
      clearTimeout(timerDelay);
      cancelAnimationFrame(raf);
    };
  }, [ms, delay]);
  return elapsed;
};
var useRaf_default = useRaf;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useRafLoop.js
var import_react74 = __toESM(require_react());
function useRafLoop(callback, initiallyActive) {
  if (initiallyActive === void 0) {
    initiallyActive = true;
  }
  var raf = (0, import_react74.useRef)(null);
  var rafActivity = (0, import_react74.useRef)(false);
  var rafCallback = (0, import_react74.useRef)(callback);
  rafCallback.current = callback;
  var step = (0, import_react74.useCallback)(function(time) {
    if (rafActivity.current) {
      rafCallback.current(time);
      raf.current = requestAnimationFrame(step);
    }
  }, []);
  var result = (0, import_react74.useMemo)(function() {
    return [
      function() {
        if (rafActivity.current) {
          rafActivity.current = false;
          raf.current && cancelAnimationFrame(raf.current);
        }
      },
      function() {
        if (!rafActivity.current) {
          rafActivity.current = true;
          raf.current = requestAnimationFrame(step);
        }
      },
      function() {
        return rafActivity.current;
      }
    ];
  }, []);
  (0, import_react74.useEffect)(function() {
    if (initiallyActive) {
      result[1]();
    }
    return result[0];
  }, []);
  return result;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useSearchParam.js
var import_react75 = __toESM(require_react());
var getValue = function(search, param) {
  return new URLSearchParams(search).get(param);
};
var useSearchParam = function(param) {
  var location = window.location;
  var _a = (0, import_react75.useState)(function() {
    return getValue(location.search, param);
  }), value = _a[0], setValue = _a[1];
  (0, import_react75.useEffect)(function() {
    var onChange = function() {
      setValue(getValue(location.search, param));
    };
    on(window, "popstate", onChange);
    on(window, "pushstate", onChange);
    on(window, "replacestate", onChange);
    return function() {
      off(window, "popstate", onChange);
      off(window, "pushstate", onChange);
      off(window, "replacestate", onChange);
    };
  }, []);
  return value;
};
var useSearchParamServer = function() {
  return null;
};
var useSearchParam_default = isBrowser ? useSearchParam : useSearchParamServer;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useScratch.js
init_tslib_es6();
var import_react76 = __toESM(require_react());
var import_react_universal_interface = __toESM(require_lib());
var useScratch = function(params) {
  if (params === void 0) {
    params = {};
  }
  var disabled = params.disabled;
  var paramsRef = useLatest_default(params);
  var _a = (0, import_react76.useState)({ isScratching: false }), state = _a[0], setState = _a[1];
  var refState = (0, import_react76.useRef)(state);
  var refScratching = (0, import_react76.useRef)(false);
  var refAnimationFrame = (0, import_react76.useRef)(null);
  var _b = (0, import_react76.useState)(null), el = _b[0], setEl = _b[1];
  (0, import_react76.useEffect)(function() {
    if (disabled)
      return;
    if (!el)
      return;
    var onMoveEvent = function(docX, docY) {
      cancelAnimationFrame(refAnimationFrame.current);
      refAnimationFrame.current = requestAnimationFrame(function() {
        var _a2 = el.getBoundingClientRect(), left = _a2.left, top = _a2.top;
        var elX = left + window.scrollX;
        var elY = top + window.scrollY;
        var x = docX - elX;
        var y = docY - elY;
        setState(function(oldState) {
          var newState = __assign(__assign({}, oldState), { dx: x - (oldState.x || 0), dy: y - (oldState.y || 0), end: Date.now(), isScratching: true });
          refState.current = newState;
          (paramsRef.current.onScratch || noop)(newState);
          return newState;
        });
      });
    };
    var onMouseMove = function(event) {
      onMoveEvent(event.pageX, event.pageY);
    };
    var onTouchMove = function(event) {
      onMoveEvent(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    };
    var onMouseUp;
    var onTouchEnd;
    var stopScratching = function() {
      if (!refScratching.current)
        return;
      refScratching.current = false;
      refState.current = __assign(__assign({}, refState.current), { isScratching: false });
      (paramsRef.current.onScratchEnd || noop)(refState.current);
      setState({ isScratching: false });
      off(window, "mousemove", onMouseMove);
      off(window, "touchmove", onTouchMove);
      off(window, "mouseup", onMouseUp);
      off(window, "touchend", onTouchEnd);
    };
    onMouseUp = stopScratching;
    onTouchEnd = stopScratching;
    var startScratching = function(docX, docY) {
      if (!refScratching.current)
        return;
      var _a2 = el.getBoundingClientRect(), left = _a2.left, top = _a2.top;
      var elX = left + window.scrollX;
      var elY = top + window.scrollY;
      var x = docX - elX;
      var y = docY - elY;
      var time = Date.now();
      var newState = {
        isScratching: true,
        start: time,
        end: time,
        docX,
        docY,
        x,
        y,
        dx: 0,
        dy: 0,
        elH: el.offsetHeight,
        elW: el.offsetWidth,
        elX,
        elY
      };
      refState.current = newState;
      (paramsRef.current.onScratchStart || noop)(newState);
      setState(newState);
      on(window, "mousemove", onMouseMove);
      on(window, "touchmove", onTouchMove);
      on(window, "mouseup", onMouseUp);
      on(window, "touchend", onTouchEnd);
    };
    var onMouseDown = function(event) {
      refScratching.current = true;
      startScratching(event.pageX, event.pageY);
    };
    var onTouchStart = function(event) {
      refScratching.current = true;
      startScratching(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    };
    on(el, "mousedown", onMouseDown);
    on(el, "touchstart", onTouchStart);
    return function() {
      off(el, "mousedown", onMouseDown);
      off(el, "touchstart", onTouchStart);
      off(window, "mousemove", onMouseMove);
      off(window, "touchmove", onTouchMove);
      off(window, "mouseup", onMouseUp);
      off(window, "touchend", onTouchEnd);
      if (refAnimationFrame.current)
        cancelAnimationFrame(refAnimationFrame.current);
      refAnimationFrame.current = null;
      refScratching.current = false;
      refState.current = { isScratching: false };
      setState(refState.current);
    };
  }, [el, disabled, paramsRef]);
  return [setEl, state];
};
var useScratch_default = useScratch;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useScroll.js
var import_react77 = __toESM(require_react());
var useScroll = function(ref) {
  if (true) {
    if (typeof ref !== "object" || typeof ref.current === "undefined") {
      console.error("`useScroll` expects a single ref argument.");
    }
  }
  var _a = useRafState_default({
    x: 0,
    y: 0
  }), state = _a[0], setState = _a[1];
  (0, import_react77.useEffect)(function() {
    var handler = function() {
      if (ref.current) {
        setState({
          x: ref.current.scrollLeft,
          y: ref.current.scrollTop
        });
      }
    };
    if (ref.current) {
      on(ref.current, "scroll", handler, {
        capture: false,
        passive: true
      });
    }
    return function() {
      if (ref.current) {
        off(ref.current, "scroll", handler);
      }
    };
  }, [ref]);
  return state;
};
var useScroll_default = useScroll;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useScrolling.js
var import_react78 = __toESM(require_react());
var useScrolling = function(ref) {
  var _a = (0, import_react78.useState)(false), scrolling = _a[0], setScrolling = _a[1];
  (0, import_react78.useEffect)(function() {
    if (ref.current) {
      var scrollingTimeout_1;
      var handleScrollEnd_1 = function() {
        setScrolling(false);
      };
      var handleScroll_1 = function() {
        setScrolling(true);
        clearTimeout(scrollingTimeout_1);
        scrollingTimeout_1 = setTimeout(function() {
          return handleScrollEnd_1();
        }, 150);
      };
      on(ref.current, "scroll", handleScroll_1, false);
      return function() {
        if (ref.current) {
          off(ref.current, "scroll", handleScroll_1, false);
        }
      };
    }
    return function() {
    };
  }, [ref]);
  return scrolling;
};
var useScrolling_default = useScrolling;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useSessionStorage.js
var import_react79 = __toESM(require_react());
var useSessionStorage = function(key, initialValue, raw) {
  if (!isBrowser) {
    return [initialValue, function() {
    }];
  }
  var _a = (0, import_react79.useState)(function() {
    try {
      var sessionStorageValue = sessionStorage.getItem(key);
      if (typeof sessionStorageValue !== "string") {
        sessionStorage.setItem(key, raw ? String(initialValue) : JSON.stringify(initialValue));
        return initialValue;
      } else {
        return raw ? sessionStorageValue : JSON.parse(sessionStorageValue || "null");
      }
    } catch (_a2) {
      return initialValue;
    }
  }), state = _a[0], setState = _a[1];
  (0, import_react79.useEffect)(function() {
    try {
      var serializedState = raw ? String(state) : JSON.stringify(state);
      sessionStorage.setItem(key, serializedState);
    } catch (_a2) {
    }
  });
  return [state, setState];
};
var useSessionStorage_default = useSessionStorage;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useShallowCompareEffect.js
var import_fast_shallow_equal = __toESM(require_fast_shallow_equal());
var isPrimitive3 = function(val) {
  return val !== Object(val);
};
var shallowEqualDepsList = function(prevDeps, nextDeps) {
  return prevDeps.every(function(dep, index) {
    return (0, import_fast_shallow_equal.equal)(dep, nextDeps[index]);
  });
};
var useShallowCompareEffect = function(effect, deps) {
  if (true) {
    if (!(deps instanceof Array) || !deps.length) {
      console.warn("`useShallowCompareEffect` should not be used with no dependencies. Use React.useEffect instead.");
    }
    if (deps.every(isPrimitive3)) {
      console.warn("`useShallowCompareEffect` should not be used with dependencies that are all primitive values. Use React.useEffect instead.");
    }
  }
  useCustomCompareEffect_default(effect, deps, shallowEqualDepsList);
};
var useShallowCompareEffect_default = useShallowCompareEffect;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useSize.js
init_tslib_es6();
var React3 = __toESM(require_react());
var useState41 = React3.useState;
var useEffect45 = React3.useEffect;
var useRef27 = React3.useRef;
var DRAF = function(callback) {
  return setTimeout(callback, 35);
};
var useSize = function(element, _a) {
  var _b = _a === void 0 ? {} : _a, _c = _b.width, width = _c === void 0 ? Infinity : _c, _d = _b.height, height = _d === void 0 ? Infinity : _d;
  if (!isBrowser) {
    return [
      typeof element === "function" ? element({ width, height }) : element,
      { width, height }
    ];
  }
  var _e = useState41({ width, height }), state = _e[0], setState = _e[1];
  if (typeof element === "function") {
    element = element(state);
  }
  var style = element.props.style || {};
  var ref = useRef27(null);
  var window2 = null;
  var setSize = function() {
    var iframe = ref.current;
    var size = iframe ? {
      width: iframe.offsetWidth,
      height: iframe.offsetHeight
    } : { width, height };
    setState(size);
  };
  var onWindow = function(windowToListenOn) {
    on(windowToListenOn, "resize", setSize);
    DRAF(setSize);
  };
  useEffect45(function() {
    var iframe = ref.current;
    if (!iframe) {
      return;
    }
    if (iframe.contentWindow) {
      window2 = iframe.contentWindow;
      onWindow(window2);
    } else {
      var onLoad_1 = function() {
        on(iframe, "load", onLoad_1);
        window2 = iframe.contentWindow;
        onWindow(window2);
      };
      off(iframe, "load", onLoad_1);
    }
    return function() {
      if (window2 && window2.removeEventListener) {
        off(window2, "resize", setSize);
      }
    };
  }, []);
  style.position = "relative";
  var sized = React3.cloneElement.apply(React3, __spreadArrays([element, { style }], __spreadArrays([
    React3.createElement("iframe", {
      ref,
      style: {
        background: "transparent",
        border: "none",
        height: "100%",
        left: 0,
        position: "absolute",
        top: 0,
        width: "100%",
        zIndex: -1
      }
    })
  ], React3.Children.toArray(element.props.children))));
  return [sized, state];
};
var useSize_default = useSize;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useSlider.js
var import_react80 = __toESM(require_react());
var useSlider = function(ref, options) {
  if (options === void 0) {
    options = {};
  }
  var isMounted = useMountedState();
  var isSliding = (0, import_react80.useRef)(false);
  var valueRef = (0, import_react80.useRef)(0);
  var frame = (0, import_react80.useRef)(0);
  var _a = useSetState_default({
    isSliding: false,
    value: 0
  }), state = _a[0], setState = _a[1];
  valueRef.current = state.value;
  (0, import_react80.useEffect)(function() {
    if (isBrowser) {
      var styles = options.styles === void 0 ? true : options.styles;
      var reverse_1 = options.reverse === void 0 ? false : options.reverse;
      if (ref.current && styles) {
        ref.current.style.userSelect = "none";
      }
      var startScrubbing_1 = function() {
        if (!isSliding.current && isMounted()) {
          (options.onScrubStart || noop)();
          isSliding.current = true;
          setState({ isSliding: true });
          bindEvents_1();
        }
      };
      var stopScrubbing_1 = function() {
        if (isSliding.current && isMounted()) {
          (options.onScrubStop || noop)(valueRef.current);
          isSliding.current = false;
          setState({ isSliding: false });
          unbindEvents_1();
        }
      };
      var onMouseDown_1 = function(event) {
        startScrubbing_1();
        onMouseMove_1(event);
      };
      var onMouseMove_1 = options.vertical ? function(event) {
        return onScrub_1(event.clientY);
      } : function(event) {
        return onScrub_1(event.clientX);
      };
      var onTouchStart_1 = function(event) {
        startScrubbing_1();
        onTouchMove_1(event);
      };
      var onTouchMove_1 = options.vertical ? function(event) {
        return onScrub_1(event.changedTouches[0].clientY);
      } : function(event) {
        return onScrub_1(event.changedTouches[0].clientX);
      };
      var bindEvents_1 = function() {
        on(document, "mousemove", onMouseMove_1);
        on(document, "mouseup", stopScrubbing_1);
        on(document, "touchmove", onTouchMove_1);
        on(document, "touchend", stopScrubbing_1);
      };
      var unbindEvents_1 = function() {
        off(document, "mousemove", onMouseMove_1);
        off(document, "mouseup", stopScrubbing_1);
        off(document, "touchmove", onTouchMove_1);
        off(document, "touchend", stopScrubbing_1);
      };
      var onScrub_1 = function(clientXY) {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(function() {
          if (isMounted() && ref.current) {
            var rect = ref.current.getBoundingClientRect();
            var pos = options.vertical ? rect.top : rect.left;
            var length_1 = options.vertical ? rect.height : rect.width;
            if (!length_1) {
              return;
            }
            var value = (clientXY - pos) / length_1;
            if (value > 1) {
              value = 1;
            } else if (value < 0) {
              value = 0;
            }
            if (reverse_1) {
              value = 1 - value;
            }
            setState({
              value
            });
            (options.onScrub || noop)(value);
          }
        });
      };
      on(ref.current, "mousedown", onMouseDown_1);
      on(ref.current, "touchstart", onTouchStart_1);
      return function() {
        off(ref.current, "mousedown", onMouseDown_1);
        off(ref.current, "touchstart", onTouchStart_1);
      };
    } else {
      return void 0;
    }
  }, [ref, options.vertical]);
  return state;
};
var useSlider_default = useSlider;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useSpeech.js
init_tslib_es6();
var import_react81 = __toESM(require_react());
var Status;
(function(Status2) {
  Status2[Status2["init"] = 0] = "init";
  Status2[Status2["play"] = 1] = "play";
  Status2[Status2["pause"] = 2] = "pause";
  Status2[Status2["end"] = 3] = "end";
})(Status || (Status = {}));
var useSpeech = function(text, options) {
  var mounted = (0, import_react81.useRef)(false);
  var _a = (0, import_react81.useState)(function() {
    var _a2 = options.voice || {}, _b = _a2.lang, lang = _b === void 0 ? "default" : _b, _c = _a2.name, name = _c === void 0 ? "" : _c;
    return {
      isPlaying: false,
      status: Status[Status.init],
      lang: options.lang || "default",
      voiceInfo: { lang, name },
      rate: options.rate || 1,
      pitch: options.pitch || 1,
      volume: options.volume || 1
    };
  }), state = _a[0], setState = _a[1];
  var handlePlay = (0, import_react81.useCallback)(function() {
    if (!mounted.current) {
      return;
    }
    setState(function(preState) {
      return __assign(__assign({}, preState), { isPlaying: true, status: Status[Status.play] });
    });
  }, []);
  var handlePause = (0, import_react81.useCallback)(function() {
    if (!mounted.current) {
      return;
    }
    setState(function(preState) {
      return __assign(__assign({}, preState), { isPlaying: false, status: Status[Status.pause] });
    });
  }, []);
  var handleEnd = (0, import_react81.useCallback)(function() {
    if (!mounted.current) {
      return;
    }
    setState(function(preState) {
      return __assign(__assign({}, preState), { isPlaying: false, status: Status[Status.end] });
    });
  }, []);
  (0, import_react81.useEffect)(function() {
    mounted.current = true;
    var utterance = new SpeechSynthesisUtterance(text);
    options.lang && (utterance.lang = options.lang);
    options.voice && (utterance.voice = options.voice);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.onstart = handlePlay;
    utterance.onpause = handlePause;
    utterance.onresume = handlePlay;
    utterance.onend = handleEnd;
    window.speechSynthesis.speak(utterance);
    return function() {
      mounted.current = false;
    };
  }, []);
  return state;
};
var useSpeech_default = useSpeech;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useStartTyping.js
var isFocusedElementEditable = function() {
  var activeElement = document.activeElement, body = document.body;
  if (!activeElement) {
    return false;
  }
  if (activeElement === body) {
    return false;
  }
  switch (activeElement.tagName) {
    case "INPUT":
    case "TEXTAREA":
      return true;
  }
  return activeElement.hasAttribute("contenteditable");
};
var isTypedCharGood = function(_a) {
  var keyCode = _a.keyCode, metaKey = _a.metaKey, ctrlKey = _a.ctrlKey, altKey = _a.altKey;
  if (metaKey || ctrlKey || altKey) {
    return false;
  }
  if (keyCode >= 48 && keyCode <= 57) {
    return true;
  }
  if (keyCode >= 65 && keyCode <= 90) {
    return true;
  }
  return false;
};
var useStartTyping = function(onStartTyping) {
  useIsomorphicLayoutEffect_default(function() {
    var keydown = function(event) {
      !isFocusedElementEditable() && isTypedCharGood(event) && onStartTyping(event);
    };
    on(document, "keydown", keydown);
    return function() {
      off(document, "keydown", keydown);
    };
  }, []);
};
var useStartTyping_default = useStartTyping;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useStateWithHistory.js
var import_react82 = __toESM(require_react());
function useStateWithHistory(initialState, capacity, initialHistory) {
  if (capacity === void 0) {
    capacity = 10;
  }
  if (capacity < 1) {
    throw new Error("Capacity has to be greater than 1, got '" + capacity + "'");
  }
  var isFirstMount = useFirstMountState();
  var _a = (0, import_react82.useState)(initialState), state = _a[0], innerSetState = _a[1];
  var history = (0, import_react82.useRef)(initialHistory !== null && initialHistory !== void 0 ? initialHistory : []);
  var historyPosition = (0, import_react82.useRef)(0);
  if (isFirstMount) {
    if (history.current.length) {
      if (history.current[history.current.length - 1] !== initialState) {
        history.current.push(initialState);
      }
      if (history.current.length > capacity) {
        history.current = history.current.slice(history.current.length - capacity);
      }
    } else {
      history.current.push(initialState);
    }
    historyPosition.current = history.current.length && history.current.length - 1;
  }
  var setState = (0, import_react82.useCallback)(function(newState) {
    innerSetState(function(currentState) {
      newState = resolveHookState(newState, currentState);
      if (newState !== currentState) {
        if (historyPosition.current < history.current.length - 1) {
          history.current = history.current.slice(0, historyPosition.current + 1);
        }
        historyPosition.current = history.current.push(newState) - 1;
        if (history.current.length > capacity) {
          history.current = history.current.slice(history.current.length - capacity);
        }
      }
      return newState;
    });
  }, [state, capacity]);
  var historyState = (0, import_react82.useMemo)(function() {
    return {
      history: history.current,
      position: historyPosition.current,
      capacity,
      back: function(amount) {
        if (amount === void 0) {
          amount = 1;
        }
        if (!historyPosition.current) {
          return;
        }
        innerSetState(function() {
          historyPosition.current -= Math.min(amount, historyPosition.current);
          return history.current[historyPosition.current];
        });
      },
      forward: function(amount) {
        if (amount === void 0) {
          amount = 1;
        }
        if (historyPosition.current === history.current.length - 1) {
          return;
        }
        innerSetState(function() {
          historyPosition.current = Math.min(historyPosition.current + amount, history.current.length - 1);
          return history.current[historyPosition.current];
        });
      },
      go: function(position) {
        if (position === historyPosition.current) {
          return;
        }
        innerSetState(function() {
          historyPosition.current = position < 0 ? Math.max(history.current.length + position, 0) : Math.min(history.current.length - 1, position);
          return history.current[historyPosition.current];
        });
      }
    };
  }, [state]);
  return [state, setState, historyState];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useStateList.js
init_tslib_es6();
var import_react83 = __toESM(require_react());
function useStateList(stateSet) {
  if (stateSet === void 0) {
    stateSet = [];
  }
  var isMounted = useMountedState();
  var update = useUpdate();
  var index = (0, import_react83.useRef)(0);
  useUpdateEffect_default(function() {
    if (stateSet.length <= index.current) {
      index.current = stateSet.length - 1;
      update();
    }
  }, [stateSet.length]);
  var actions = (0, import_react83.useMemo)(function() {
    return {
      next: function() {
        return actions.setStateAt(index.current + 1);
      },
      prev: function() {
        return actions.setStateAt(index.current - 1);
      },
      setStateAt: function(newIndex) {
        if (!isMounted())
          return;
        if (!stateSet.length)
          return;
        if (newIndex === index.current)
          return;
        index.current = newIndex >= 0 ? newIndex % stateSet.length : stateSet.length + newIndex % stateSet.length;
        update();
      },
      setState: function(state) {
        if (!isMounted())
          return;
        var newIndex = stateSet.length ? stateSet.indexOf(state) : -1;
        if (newIndex === -1) {
          throw new Error("State '" + state + "' is not a valid state (does not exist in state list)");
        }
        index.current = newIndex;
        update();
      }
    };
  }, [stateSet]);
  return __assign({ state: stateSet[index.current], currentIndex: index.current, isFirst: index.current === 0, isLast: index.current === stateSet.length - 1 }, actions);
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useThrottle.js
var import_react84 = __toESM(require_react());
var useThrottle = function(value, ms) {
  if (ms === void 0) {
    ms = 200;
  }
  var _a = (0, import_react84.useState)(value), state = _a[0], setState = _a[1];
  var timeout = (0, import_react84.useRef)();
  var nextValue = (0, import_react84.useRef)(null);
  var hasNextValue = (0, import_react84.useRef)(0);
  (0, import_react84.useEffect)(function() {
    if (!timeout.current) {
      setState(value);
      var timeoutCallback_1 = function() {
        if (hasNextValue.current) {
          hasNextValue.current = false;
          setState(nextValue.current);
          timeout.current = setTimeout(timeoutCallback_1, ms);
        } else {
          timeout.current = void 0;
        }
      };
      timeout.current = setTimeout(timeoutCallback_1, ms);
    } else {
      nextValue.current = value;
      hasNextValue.current = true;
    }
  }, [value]);
  useUnmount_default(function() {
    timeout.current && clearTimeout(timeout.current);
  });
  return state;
};
var useThrottle_default = useThrottle;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useThrottleFn.js
var import_react85 = __toESM(require_react());
var useThrottleFn = function(fn, ms, args) {
  if (ms === void 0) {
    ms = 200;
  }
  var _a = (0, import_react85.useState)(null), state = _a[0], setState = _a[1];
  var timeout = (0, import_react85.useRef)();
  var nextArgs = (0, import_react85.useRef)();
  (0, import_react85.useEffect)(function() {
    if (!timeout.current) {
      setState(fn.apply(void 0, args));
      var timeoutCallback_1 = function() {
        if (nextArgs.current) {
          setState(fn.apply(void 0, nextArgs.current));
          nextArgs.current = void 0;
          timeout.current = setTimeout(timeoutCallback_1, ms);
        } else {
          timeout.current = void 0;
        }
      };
      timeout.current = setTimeout(timeoutCallback_1, ms);
    } else {
      nextArgs.current = args;
    }
  }, args);
  useUnmount_default(function() {
    timeout.current && clearTimeout(timeout.current);
  });
  return state;
};
var useThrottleFn_default = useThrottleFn;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useTimeout.js
function useTimeout(ms) {
  if (ms === void 0) {
    ms = 0;
  }
  var update = useUpdate();
  return useTimeoutFn(update, ms);
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useTitle.js
var import_react86 = __toESM(require_react());
var DEFAULT_USE_TITLE_OPTIONS = {
  restoreOnUnmount: false
};
function useTitle(title, options) {
  if (options === void 0) {
    options = DEFAULT_USE_TITLE_OPTIONS;
  }
  var prevTitleRef = (0, import_react86.useRef)(document.title);
  if (document.title !== title)
    document.title = title;
  (0, import_react86.useEffect)(function() {
    if (options && options.restoreOnUnmount) {
      return function() {
        document.title = prevTitleRef.current;
      };
    } else {
      return;
    }
  }, []);
}
var useTitle_default = typeof document !== "undefined" ? useTitle : function(_title) {
};

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useTween.js
var import_ts_easing = __toESM(require_lib2());
var useTween = function(easingName, ms, delay) {
  if (easingName === void 0) {
    easingName = "inCirc";
  }
  if (ms === void 0) {
    ms = 200;
  }
  if (delay === void 0) {
    delay = 0;
  }
  var fn = import_ts_easing.easing[easingName];
  var t = useRaf_default(ms, delay);
  if (true) {
    if (typeof fn !== "function") {
      console.error('useTween() expected "easingName" property to be a valid easing function name, like:"' + Object.keys(import_ts_easing.easing).join('", "') + '".');
      console.trace();
      return 0;
    }
  }
  return fn(t);
};
var useTween_default = useTween;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useUnmountPromise.js
var import_react87 = __toESM(require_react());
var useUnmountPromise = function() {
  var refUnmounted = (0, import_react87.useRef)(false);
  useEffectOnce_default(function() {
    return function() {
      refUnmounted.current = true;
    };
  });
  var wrapper = (0, import_react87.useMemo)(function() {
    var race = function(promise, onError) {
      var newPromise = new Promise(function(resolve, reject) {
        promise.then(function(result) {
          if (!refUnmounted.current)
            resolve(result);
        }, function(error) {
          if (!refUnmounted.current)
            reject(error);
          else if (onError)
            onError(error);
          else
            console.error("useUnmountPromise", error);
        });
      });
      return newPromise;
    };
    return race;
  }, []);
  return wrapper;
};
var useUnmountPromise_default = useUnmountPromise;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useUpsert.js
init_tslib_es6();
function useUpsert(predicate, initialList) {
  if (initialList === void 0) {
    initialList = [];
  }
  var _a = useList_default(initialList), list = _a[0], listActions = _a[1];
  return [
    list,
    __assign(__assign({}, listActions), { upsert: function(newItem) {
      listActions.upsert(predicate, newItem);
    } })
  ];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useVibrate.js
var import_react88 = __toESM(require_react());
var isVibrationApiSupported = isNavigator && "vibrate" in navigator;
function useVibrate(enabled, pattern, loop) {
  if (enabled === void 0) {
    enabled = true;
  }
  if (pattern === void 0) {
    pattern = [1e3, 1e3];
  }
  if (loop === void 0) {
    loop = true;
  }
  (0, import_react88.useEffect)(function() {
    var interval;
    if (enabled) {
      navigator.vibrate(pattern);
      if (loop) {
        var duration = pattern instanceof Array ? pattern.reduce(function(a, b) {
          return a + b;
        }) : pattern;
        interval = setInterval(function() {
          navigator.vibrate(pattern);
        }, duration);
      }
    }
    return function() {
      if (enabled) {
        navigator.vibrate(0);
        if (loop) {
          clearInterval(interval);
        }
      }
    };
  }, [enabled]);
}
var useVibrate_default = isVibrationApiSupported ? useVibrate : noop;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useVideo.js
var useVideo = createHTMLMediaHook("video");
var useVideo_default = useVideo;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useStateValidator.js
var import_react89 = __toESM(require_react());
function useStateValidator(state, validator, initialState) {
  if (initialState === void 0) {
    initialState = [void 0];
  }
  var validatorInner = (0, import_react89.useRef)(validator);
  var stateInner = (0, import_react89.useRef)(state);
  validatorInner.current = validator;
  stateInner.current = state;
  var _a = (0, import_react89.useState)(initialState), validity = _a[0], setValidity = _a[1];
  var validate = (0, import_react89.useCallback)(function() {
    if (validatorInner.current.length >= 2) {
      validatorInner.current(stateInner.current, setValidity);
    } else {
      setValidity(validatorInner.current(stateInner.current));
    }
  }, [setValidity]);
  (0, import_react89.useEffect)(function() {
    validate();
  }, [state]);
  return [validity, validate];
}

// node_modules/.pnpm/@xobotyi+scrollbar-width@1.9.5/node_modules/@xobotyi/scrollbar-width/dist/index.esm.js
var e = function(t) {
  if ("undefined" == typeof document) return 0;
  if (document.body && (!document.readyState || "loading" !== document.readyState)) {
    if (true !== t && "number" == typeof e.__cache) return e.__cache;
    var o = document.createElement("div"), d = o.style;
    d.display = "block", d.position = "absolute", d.width = "100px", d.height = "100px", d.left = "-999px", d.top = "-999px", d.overflow = "scroll", document.body.insertBefore(o, null);
    var n = o.clientWidth;
    if (0 !== n) return e.__cache = 100 - n, document.body.removeChild(o), e.__cache;
    document.body.removeChild(o);
  }
};

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useScrollbarWidth.js
var import_react90 = __toESM(require_react());
function useScrollbarWidth() {
  var _a = (0, import_react90.useState)(e()), sbw = _a[0], setSbw = _a[1];
  (0, import_react90.useEffect)(function() {
    if (typeof sbw !== "undefined") {
      return;
    }
    var raf = requestAnimationFrame(function() {
      setSbw(e());
    });
    return function() {
      return cancelAnimationFrame(raf);
    };
  }, []);
  return sbw;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMultiStateValidator.js
var import_react91 = __toESM(require_react());
function useMultiStateValidator(states, validator, initialValidity) {
  if (initialValidity === void 0) {
    initialValidity = [void 0];
  }
  if (typeof states !== "object") {
    throw new Error("states expected to be an object or array, got " + typeof states);
  }
  var validatorInner = (0, import_react91.useRef)(validator);
  var statesInner = (0, import_react91.useRef)(states);
  validatorInner.current = validator;
  statesInner.current = states;
  var _a = (0, import_react91.useState)(initialValidity), validity = _a[0], setValidity = _a[1];
  var validate = (0, import_react91.useCallback)(function() {
    if (validatorInner.current.length >= 2) {
      validatorInner.current(statesInner.current, setValidity);
    } else {
      setValidity(validatorInner.current(statesInner.current));
    }
  }, [setValidity]);
  (0, import_react91.useEffect)(function() {
    validate();
  }, Object.values(states));
  return [validity, validate];
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useWindowScroll.js
var import_react92 = __toESM(require_react());
var useWindowScroll = function() {
  var _a = useRafState_default(function() {
    return {
      x: isBrowser ? window.pageXOffset : 0,
      y: isBrowser ? window.pageYOffset : 0
    };
  }), state = _a[0], setState = _a[1];
  (0, import_react92.useEffect)(function() {
    var handler = function() {
      setState(function(state2) {
        var pageXOffset = window.pageXOffset, pageYOffset = window.pageYOffset;
        return state2.x !== pageXOffset || state2.y !== pageYOffset ? {
          x: pageXOffset,
          y: pageYOffset
        } : state2;
      });
    };
    handler();
    on(window, "scroll", handler, {
      capture: false,
      passive: true
    });
    return function() {
      off(window, "scroll", handler);
    };
  }, []);
  return state;
};
var useWindowScroll_default = useWindowScroll;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useWindowSize.js
var import_react93 = __toESM(require_react());
var useWindowSize = function(initialWidth, initialHeight) {
  if (initialWidth === void 0) {
    initialWidth = Infinity;
  }
  if (initialHeight === void 0) {
    initialHeight = Infinity;
  }
  var _a = useRafState_default({
    width: isBrowser ? window.innerWidth : initialWidth,
    height: isBrowser ? window.innerHeight : initialHeight
  }), state = _a[0], setState = _a[1];
  (0, import_react93.useEffect)(function() {
    if (isBrowser) {
      var handler_1 = function() {
        setState({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };
      on(window, "resize", handler_1);
      return function() {
        off(window, "resize", handler_1);
      };
    }
  }, []);
  return state;
};
var useWindowSize_default = useWindowSize;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useMeasure.js
var import_react94 = __toESM(require_react());
var defaultState3 = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
};
function useMeasure() {
  var _a = (0, import_react94.useState)(null), element = _a[0], ref = _a[1];
  var _b = (0, import_react94.useState)(defaultState3), rect = _b[0], setRect = _b[1];
  var observer = (0, import_react94.useMemo)(function() {
    return new window.ResizeObserver(function(entries) {
      if (entries[0]) {
        var _a2 = entries[0].contentRect, x = _a2.x, y = _a2.y, width = _a2.width, height = _a2.height, top_1 = _a2.top, left = _a2.left, bottom = _a2.bottom, right = _a2.right;
        setRect({ x, y, width, height, top: top_1, left, bottom, right });
      }
    });
  }, []);
  useIsomorphicLayoutEffect_default(function() {
    if (!element)
      return;
    observer.observe(element);
    return function() {
      observer.disconnect();
    };
  }, [element]);
  return [ref, rect];
}
var useMeasure_default = isBrowser && typeof window.ResizeObserver !== "undefined" ? useMeasure : function() {
  return [noop, defaultState3];
};

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/usePinchZoom.js
var import_react95 = __toESM(require_react());
var ZoomState;
(function(ZoomState2) {
  ZoomState2["ZOOMING_IN"] = "ZOOMING_IN";
  ZoomState2["ZOOMING_OUT"] = "ZOOMING_OUT";
})(ZoomState || (ZoomState = {}));
var usePinchZoom = function(ref) {
  var cacheRef = (0, import_react95.useMemo)(function() {
    return {
      evCache: [],
      prevDiff: -1
    };
  }, [ref.current]);
  var _a = (0, import_react95.useState)(), zoomingState = _a[0], setZoomingState = _a[1];
  var pointermove_handler = function(ev) {
    for (var i = 0; i < cacheRef.evCache.length; i++) {
      if (ev.pointerId == cacheRef.evCache[i].pointerId) {
        cacheRef.evCache[i] = ev;
        break;
      }
    }
    if (cacheRef.evCache.length == 2) {
      var curDiff = Math.abs(cacheRef.evCache[0].clientX - cacheRef.evCache[1].clientX);
      if (cacheRef.prevDiff > 0) {
        if (curDiff > cacheRef.prevDiff) {
          setZoomingState([ZoomState.ZOOMING_IN, curDiff]);
        }
        if (curDiff < cacheRef.prevDiff) {
          setZoomingState([ZoomState.ZOOMING_OUT, curDiff]);
        }
      }
      cacheRef.prevDiff = curDiff;
    }
  };
  var pointerdown_handler = function(ev) {
    cacheRef.evCache.push(ev);
  };
  var pointerup_handler = function(ev) {
    remove_event(ev);
    if (cacheRef.evCache.length < 2) {
      cacheRef.prevDiff = -1;
    }
  };
  var remove_event = function(ev) {
    for (var i = 0; i < cacheRef.evCache.length; i++) {
      if (cacheRef.evCache[i].pointerId == ev.pointerId) {
        cacheRef.evCache.splice(i, 1);
        break;
      }
    }
  };
  (0, import_react95.useEffect)(function() {
    if (ref === null || ref === void 0 ? void 0 : ref.current) {
      ref.current.onpointerdown = pointerdown_handler;
      ref.current.onpointermove = pointermove_handler;
      ref.current.onpointerup = pointerup_handler;
      ref.current.onpointercancel = pointerup_handler;
      ref.current.onpointerout = pointerup_handler;
      ref.current.onpointerleave = pointerup_handler;
    }
  }, [ref === null || ref === void 0 ? void 0 : ref.current]);
  return zoomingState ? { zoomingState: zoomingState[0], pinchState: zoomingState[1] } : { zoomingState: null, pinchState: 0 };
};
var usePinchZoom_default = usePinchZoom;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useRendersCount.js
var import_react96 = __toESM(require_react());
function useRendersCount() {
  return ++(0, import_react96.useRef)(0).current;
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useSet.js
init_tslib_es6();
var import_react97 = __toESM(require_react());
var useSet = function(initialSet) {
  if (initialSet === void 0) {
    initialSet = /* @__PURE__ */ new Set();
  }
  var _a = (0, import_react97.useState)(initialSet), set = _a[0], setSet = _a[1];
  var stableActions = (0, import_react97.useMemo)(function() {
    var add = function(item) {
      return setSet(function(prevSet) {
        return new Set(__spreadArrays(Array.from(prevSet), [item]));
      });
    };
    var remove = function(item) {
      return setSet(function(prevSet) {
        return new Set(Array.from(prevSet).filter(function(i) {
          return i !== item;
        }));
      });
    };
    var toggle = function(item) {
      return setSet(function(prevSet) {
        return prevSet.has(item) ? new Set(Array.from(prevSet).filter(function(i) {
          return i !== item;
        })) : new Set(__spreadArrays(Array.from(prevSet), [item]));
      });
    };
    return { add, remove, toggle, reset: function() {
      return setSet(initialSet);
    }, clear: function() {
      return setSet(/* @__PURE__ */ new Set());
    } };
  }, [setSet]);
  var utils = __assign({ has: (0, import_react97.useCallback)(function(item) {
    return set.has(item);
  }, [set]) }, stableActions);
  return [set, utils];
};
var useSet_default = useSet;

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/factory/createGlobalState.js
var import_react98 = __toESM(require_react());
function createGlobalState(initialState) {
  var store = {
    state: initialState instanceof Function ? initialState() : initialState,
    setState: function(nextState) {
      store.state = resolveHookState(nextState, store.state);
      store.setters.forEach(function(setter) {
        return setter(store.state);
      });
    },
    setters: []
  };
  return function() {
    var _a = (0, import_react98.useState)(store.state), globalState = _a[0], stateSetter = _a[1];
    useEffectOnce_default(function() {
      return function() {
        store.setters = store.setters.filter(function(setter) {
          return setter !== stateSetter;
        });
      };
    });
    useIsomorphicLayoutEffect_default(function() {
      if (!store.setters.includes(stateSetter)) {
        store.setters.push(stateSetter);
      }
    });
    return [globalState, store.setState];
  };
}

// node_modules/.pnpm/react-use@17.5.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-use/esm/useHash.js
var import_react99 = __toESM(require_react());
var useHash = function() {
  var _a = (0, import_react99.useState)(function() {
    return window.location.hash;
  }), hash = _a[0], setHash = _a[1];
  var onHashChange = (0, import_react99.useCallback)(function() {
    setHash(window.location.hash);
  }, []);
  useLifecycles_default(function() {
    on(window, "hashchange", onHashChange);
  }, function() {
    off(window, "hashchange", onHashChange);
  });
  var _setHash = (0, import_react99.useCallback)(function(newHash) {
    if (newHash !== hash) {
      window.location.hash = newHash;
    }
  }, [hash]);
  return [hash, _setHash];
};
export {
  createBreakpoint_default as createBreakpoint,
  createGlobalState,
  createMemo_default as createMemo,
  createReducer_default as createReducer,
  createReducerContext_default as createReducerContext,
  createStateContext_default as createStateContext,
  ensuredForwardRef,
  useAsync,
  useAsyncFn,
  useAsyncRetry_default as useAsyncRetry,
  useAudio_default as useAudio,
  useBattery_default as useBattery,
  useBeforeUnload_default as useBeforeUnload,
  useBoolean_default as useBoolean,
  useClickAway_default as useClickAway,
  useCookie_default as useCookie,
  useCopyToClipboard_default as useCopyToClipboard,
  useCounter,
  useCss_default as useCss,
  useCustomCompareEffect_default as useCustomCompareEffect,
  useDebounce,
  useDeepCompareEffect_default as useDeepCompareEffect,
  useDefault_default as useDefault,
  useDrop_default as useDrop,
  useDropArea_default as useDropArea,
  useEffectOnce_default as useEffectOnce,
  useEnsuredForwardedRef,
  useError_default as useError,
  useEvent_default as useEvent,
  useFavicon_default as useFavicon,
  useFirstMountState,
  useFullscreen_default as useFullscreen,
  useGeolocation_default as useGeolocation,
  useGetSet,
  useGetSetState_default as useGetSetState,
  useHarmonicIntervalFn_default as useHarmonicIntervalFn,
  useHash,
  useHover_default as useHover,
  useHoverDirty_default as useHoverDirty,
  useIdle_default as useIdle,
  useIntersection_default as useIntersection,
  useInterval_default as useInterval,
  useIsomorphicLayoutEffect_default as useIsomorphicLayoutEffect,
  useKey_default as useKey,
  useKeyPress_default as useKeyPress,
  useKeyPressEvent_default as useKeyPressEvent,
  useLatest_default as useLatest,
  useLifecycles_default as useLifecycles,
  useList_default as useList,
  useLocalStorage_default as useLocalStorage,
  useLocation_default as useLocation,
  useLockBodyScroll_default as useLockBodyScroll,
  useLogger_default as useLogger,
  useLongPress_default as useLongPress,
  useMap_default as useMap,
  useMeasure_default as useMeasure,
  useMedia_default as useMedia,
  useMediaDevices_default as useMediaDevices,
  useMediatedState,
  useMethods_default as useMethods,
  useMotion_default as useMotion,
  useMount_default as useMount,
  useMountedState,
  useMouse_default as useMouse,
  useMouseHovered_default as useMouseHovered,
  useMouseWheel_default as useMouseWheel,
  useMultiStateValidator,
  useNetworkState,
  useNumber_default as useNumber,
  useObservable_default as useObservable,
  useOrientation_default as useOrientation,
  usePageLeave_default as usePageLeave,
  usePermission_default as usePermission,
  usePinchZoom_default as usePinchZoom,
  usePrevious,
  usePreviousDistinct,
  usePromise_default as usePromise,
  useQueue_default as useQueue,
  useRaf_default as useRaf,
  useRafLoop,
  useRafState_default as useRafState,
  useRendersCount,
  useScratch_default as useScratch,
  useScroll_default as useScroll,
  useScrollbarWidth,
  useScrolling_default as useScrolling,
  useSearchParam_default as useSearchParam,
  useSessionStorage_default as useSessionStorage,
  useSet_default as useSet,
  useSetState_default as useSetState,
  useShallowCompareEffect_default as useShallowCompareEffect,
  useSize_default as useSize,
  useSlider_default as useSlider,
  useSpeech_default as useSpeech,
  useStartTyping_default as useStartTyping,
  useStateList,
  useStateValidator,
  useStateWithHistory,
  useThrottle_default as useThrottle,
  useThrottleFn_default as useThrottleFn,
  useTimeout,
  useTimeoutFn,
  useTitle_default as useTitle,
  useToggle_default as useToggle,
  useTween_default as useTween,
  useUnmount_default as useUnmount,
  useUnmountPromise_default as useUnmountPromise,
  useUpdate,
  useUpdateEffect_default as useUpdateEffect,
  useUpsert,
  useVibrate_default as useVibrate,
  useVideo_default as useVideo,
  useWindowScroll_default as useWindowScroll,
  useWindowSize_default as useWindowSize
};
/*! Bundled license information:

js-cookie/src/js.cookie.js:
  (*!
   * JavaScript Cookie v2.2.1
   * https://github.com/js-cookie/js-cookie
   *
   * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
   * Released under the MIT license
   *)

screenfull/dist/screenfull.js:
  (*!
  * screenfull
  * v5.2.0 - 2021-11-03
  * (c) Sindre Sorhus; MIT License
  *)
*/
//# sourceMappingURL=react-use.js.map
