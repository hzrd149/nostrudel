import {
  __commonJS
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/errors.js
var require_errors = __commonJS({
  "node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/errors.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalError = exports.InvalidDataError = exports.RoutingError = exports.UnsupportedMethodError = exports.ConnectionError = exports.RejectionError = exports.MissingProviderError = void 0;
    function fixError(error, newTarget, errorType) {
      Object.setPrototypeOf(error, errorType.prototype);
      if (newTarget === errorType) {
        error.name = newTarget.name;
        if (Error.captureStackTrace) {
          Error.captureStackTrace(error, errorType);
        } else {
          var stack = new Error(error.message).stack;
          if (stack) {
            error.stack = fixStack(stack, "new ".concat(newTarget.name));
          }
        }
      }
    }
    function fixStack(stack, functionName) {
      if (!stack)
        return stack;
      if (!functionName)
        return stack;
      var exclusion = new RegExp("\\s+at\\s".concat(functionName, "\\s"));
      var lines = stack.split("\n");
      var resultLines = lines.filter(function(line) {
        return !line.match(exclusion);
      });
      return resultLines.join("\n");
    }
    var MissingProviderError = (
      /** @class */
      function(_super) {
        __extends(MissingProviderError2, _super);
        function MissingProviderError2(message) {
          var _newTarget = this.constructor;
          var _this = _super.call(this, message) || this;
          fixError(_this, _newTarget, MissingProviderError2);
          return _this;
        }
        return MissingProviderError2;
      }(Error)
    );
    exports.MissingProviderError = MissingProviderError;
    var RejectionError = (
      /** @class */
      function(_super) {
        __extends(RejectionError2, _super);
        function RejectionError2(message) {
          var _newTarget = this.constructor;
          var _this = _super.call(this, message) || this;
          fixError(_this, _newTarget, RejectionError2);
          return _this;
        }
        return RejectionError2;
      }(Error)
    );
    exports.RejectionError = RejectionError;
    var ConnectionError = (
      /** @class */
      function(_super) {
        __extends(ConnectionError2, _super);
        function ConnectionError2(message) {
          var _newTarget = this.constructor;
          var _this = _super.call(this, message) || this;
          fixError(_this, _newTarget, ConnectionError2);
          return _this;
        }
        return ConnectionError2;
      }(Error)
    );
    exports.ConnectionError = ConnectionError;
    var UnsupportedMethodError = (
      /** @class */
      function(_super) {
        __extends(UnsupportedMethodError2, _super);
        function UnsupportedMethodError2(message) {
          var _newTarget = this.constructor;
          var _this = _super.call(this, message) || this;
          fixError(_this, _newTarget, UnsupportedMethodError2);
          return _this;
        }
        return UnsupportedMethodError2;
      }(Error)
    );
    exports.UnsupportedMethodError = UnsupportedMethodError;
    var RoutingError = (
      /** @class */
      function(_super) {
        __extends(RoutingError2, _super);
        function RoutingError2(message) {
          var _newTarget = this.constructor;
          var _this = _super.call(this, message) || this;
          fixError(_this, _newTarget, RoutingError2);
          return _this;
        }
        return RoutingError2;
      }(Error)
    );
    exports.RoutingError = RoutingError;
    var InvalidDataError = (
      /** @class */
      function(_super) {
        __extends(InvalidDataError2, _super);
        function InvalidDataError2(message) {
          var _newTarget = this.constructor;
          var _this = _super.call(this, message) || this;
          fixError(_this, _newTarget, InvalidDataError2);
          return _this;
        }
        return InvalidDataError2;
      }(Error)
    );
    exports.InvalidDataError = InvalidDataError;
    var InternalError = (
      /** @class */
      function(_super) {
        __extends(InternalError2, _super);
        function InternalError2(message) {
          var _newTarget = this.constructor;
          var _this = _super.call(this, message) || this;
          fixError(_this, _newTarget, InternalError2);
          return _this;
        }
        return InternalError2;
      }(Error)
    );
    exports.InternalError = InternalError;
  }
});

// node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/client.js
var require_client = __commonJS({
  "node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/client.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.requestProvider = void 0;
    var errors_1 = require_errors();
    function requestProvider(_) {
      if (_ === void 0) {
        _ = {};
      }
      return new Promise(function(resolve, reject) {
        if (typeof window === "undefined") {
          return reject(new Error("Must be called in a browser context"));
        }
        var webln = window.webln;
        if (!webln) {
          return reject(new errors_1.MissingProviderError("Your browser has no WebLN provider"));
        }
        webln.enable().then(function() {
          return resolve(webln);
        }).catch(function(err) {
          return reject(err);
        });
      });
    }
    exports.requestProvider = requestProvider;
  }
});

// node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/provider.js
var require_provider = __commonJS({
  "node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/provider.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/webln@0.3.2/node_modules/webln/lib/index.js"(exports) {
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_client(), exports);
    __exportStar(require_provider(), exports);
    __exportStar(require_errors(), exports);
  }
});
export default require_lib();
//# sourceMappingURL=webln.js.map
