import {
  require_styles
} from "./chunk-3SRPTME3.js";
import "./chunk-LYXLU5JT.js";
import {
  require_jsx_runtime
} from "./chunk-N2VR5K3D.js";
import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __commonJS,
  __esm,
  __export,
  __toCommonJS
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/classnames@2.5.1/node_modules/classnames/index.js
var require_classnames = __commonJS({
  "node_modules/.pnpm/classnames@2.5.1/node_modules/classnames/index.js"(exports, module) {
    (function() {
      "use strict";
      var hasOwn = {}.hasOwnProperty;
      function classNames() {
        var classes = "";
        for (var i = 0; i < arguments.length; i++) {
          var arg = arguments[i];
          if (arg) {
            classes = appendClass(classes, parseValue(arg));
          }
        }
        return classes;
      }
      function parseValue(arg) {
        if (typeof arg === "string" || typeof arg === "number") {
          return arg;
        }
        if (typeof arg !== "object") {
          return "";
        }
        if (Array.isArray(arg)) {
          return classNames.apply(null, arg);
        }
        if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes("[native code]")) {
          return arg.toString();
        }
        var classes = "";
        for (var key in arg) {
          if (hasOwn.call(arg, key) && arg[key]) {
            classes = appendClass(classes, key);
          }
        }
        return classes;
      }
      function appendClass(value, newClass) {
        if (!newClass) {
          return value;
        }
        if (value) {
          return value + " " + newClass;
        }
        return value + newClass;
      }
      if (typeof module !== "undefined" && module.exports) {
        classNames.default = classNames;
        module.exports = classNames;
      } else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
        define("classnames", [], function() {
          return classNames;
        });
      } else {
        window.classNames = classNames;
      }
    })();
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/base.js
var require_base = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/base.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = Diff;
    function Diff() {
    }
    Diff.prototype = {
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      diff: function diff(oldString, newString) {
        var _options$timeout;
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        var callback = options.callback;
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        this.options = options;
        var self = this;
        function done(value) {
          if (callback) {
            setTimeout(function() {
              callback(void 0, value);
            }, 0);
            return true;
          } else {
            return value;
          }
        }
        oldString = this.castInput(oldString);
        newString = this.castInput(newString);
        oldString = this.removeEmpty(this.tokenize(oldString));
        newString = this.removeEmpty(this.tokenize(newString));
        var newLen = newString.length, oldLen = oldString.length;
        var editLength = 1;
        var maxEditLength = newLen + oldLen;
        if (options.maxEditLength) {
          maxEditLength = Math.min(maxEditLength, options.maxEditLength);
        }
        var maxExecutionTime = (
          /*istanbul ignore start*/
          (_options$timeout = /*istanbul ignore end*/
          options.timeout) !== null && _options$timeout !== void 0 ? _options$timeout : Infinity
        );
        var abortAfterTimestamp = Date.now() + maxExecutionTime;
        var bestPath = [{
          oldPos: -1,
          lastComponent: void 0
        }];
        var newPos = this.extractCommon(bestPath[0], newString, oldString, 0);
        if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done([{
            value: this.join(newString),
            count: newString.length
          }]);
        }
        var minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
        function execEditLength() {
          for (var diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
            var basePath = (
              /*istanbul ignore start*/
              void 0
            );
            var removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
            if (removePath) {
              bestPath[diagonalPath - 1] = void 0;
            }
            var canAdd = false;
            if (addPath) {
              var addPathNewPos = addPath.oldPos - diagonalPath;
              canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
            }
            var canRemove = removePath && removePath.oldPos + 1 < oldLen;
            if (!canAdd && !canRemove) {
              bestPath[diagonalPath] = void 0;
              continue;
            }
            if (!canRemove || canAdd && removePath.oldPos + 1 < addPath.oldPos) {
              basePath = self.addToPath(addPath, true, void 0, 0);
            } else {
              basePath = self.addToPath(removePath, void 0, true, 1);
            }
            newPos = self.extractCommon(basePath, newString, oldString, diagonalPath);
            if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
              return done(buildValues(self, basePath.lastComponent, newString, oldString, self.useLongestToken));
            } else {
              bestPath[diagonalPath] = basePath;
              if (basePath.oldPos + 1 >= oldLen) {
                maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
              }
              if (newPos + 1 >= newLen) {
                minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
              }
            }
          }
          editLength++;
        }
        if (callback) {
          (function exec() {
            setTimeout(function() {
              if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
                return callback();
              }
              if (!execEditLength()) {
                exec();
              }
            }, 0);
          })();
        } else {
          while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
            var ret = execEditLength();
            if (ret) {
              return ret;
            }
          }
        }
      },
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      addToPath: function addToPath(path, added, removed, oldPosInc) {
        var last = path.lastComponent;
        if (last && last.added === added && last.removed === removed) {
          return {
            oldPos: path.oldPos + oldPosInc,
            lastComponent: {
              count: last.count + 1,
              added,
              removed,
              previousComponent: last.previousComponent
            }
          };
        } else {
          return {
            oldPos: path.oldPos + oldPosInc,
            lastComponent: {
              count: 1,
              added,
              removed,
              previousComponent: last
            }
          };
        }
      },
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
        var newLen = newString.length, oldLen = oldString.length, oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
        while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
          newPos++;
          oldPos++;
          commonCount++;
        }
        if (commonCount) {
          basePath.lastComponent = {
            count: commonCount,
            previousComponent: basePath.lastComponent
          };
        }
        basePath.oldPos = oldPos;
        return newPos;
      },
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      equals: function equals(left, right) {
        if (this.options.comparator) {
          return this.options.comparator(left, right);
        } else {
          return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
        }
      },
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      removeEmpty: function removeEmpty(array) {
        var ret = [];
        for (var i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }
        return ret;
      },
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      castInput: function castInput(value) {
        return value;
      },
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      tokenize: function tokenize(value) {
        return value.split("");
      },
      /*istanbul ignore start*/
      /*istanbul ignore end*/
      join: function join(chars) {
        return chars.join("");
      }
    };
    function buildValues(diff, lastComponent, newString, oldString, useLongestToken) {
      var components = [];
      var nextComponent;
      while (lastComponent) {
        components.push(lastComponent);
        nextComponent = lastComponent.previousComponent;
        delete lastComponent.previousComponent;
        lastComponent = nextComponent;
      }
      components.reverse();
      var componentPos = 0, componentLen = components.length, newPos = 0, oldPos = 0;
      for (; componentPos < componentLen; componentPos++) {
        var component = components[componentPos];
        if (!component.removed) {
          if (!component.added && useLongestToken) {
            var value = newString.slice(newPos, newPos + component.count);
            value = value.map(function(value2, i) {
              var oldValue = oldString[oldPos + i];
              return oldValue.length > value2.length ? oldValue : value2;
            });
            component.value = diff.join(value);
          } else {
            component.value = diff.join(newString.slice(newPos, newPos + component.count));
          }
          newPos += component.count;
          if (!component.added) {
            oldPos += component.count;
          }
        } else {
          component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
          oldPos += component.count;
          if (componentPos && components[componentPos - 1].added) {
            var tmp = components[componentPos - 1];
            components[componentPos - 1] = components[componentPos];
            components[componentPos] = tmp;
          }
        }
      }
      var finalComponent = components[componentLen - 1];
      if (componentLen > 1 && typeof finalComponent.value === "string" && (finalComponent.added || finalComponent.removed) && diff.equals("", finalComponent.value)) {
        components[componentLen - 2].value += finalComponent.value;
        components.pop();
      }
      return components;
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/character.js
var require_character = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/character.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.diffChars = diffChars;
    exports.characterDiff = void 0;
    var _base = _interopRequireDefault(require_base());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var characterDiff = new /*istanbul ignore start*/
    _base[
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
    ]();
    exports.characterDiff = characterDiff;
    function diffChars(oldStr, newStr, options) {
      return characterDiff.diff(oldStr, newStr, options);
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/util/params.js
var require_params = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/util/params.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.generateOptions = generateOptions;
    function generateOptions(options, defaults) {
      if (typeof options === "function") {
        defaults.callback = options;
      } else if (options) {
        for (var name in options) {
          if (options.hasOwnProperty(name)) {
            defaults[name] = options[name];
          }
        }
      }
      return defaults;
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/word.js
var require_word = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/word.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.diffWords = diffWords;
    exports.diffWordsWithSpace = diffWordsWithSpace;
    exports.wordDiff = void 0;
    var _base = _interopRequireDefault(require_base());
    var _params = require_params();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
    var reWhitespace = /\S/;
    var wordDiff = new /*istanbul ignore start*/
    _base[
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
    ]();
    exports.wordDiff = wordDiff;
    wordDiff.equals = function(left, right) {
      if (this.options.ignoreCase) {
        left = left.toLowerCase();
        right = right.toLowerCase();
      }
      return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
    };
    wordDiff.tokenize = function(value) {
      var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);
      for (var i = 0; i < tokens.length - 1; i++) {
        if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
          tokens[i] += tokens[i + 2];
          tokens.splice(i + 1, 2);
          i--;
        }
      }
      return tokens;
    };
    function diffWords(oldStr, newStr, options) {
      options = /*istanbul ignore start*/
      (0, /*istanbul ignore end*/
      /*istanbul ignore start*/
      _params.generateOptions)(options, {
        ignoreWhitespace: true
      });
      return wordDiff.diff(oldStr, newStr, options);
    }
    function diffWordsWithSpace(oldStr, newStr, options) {
      return wordDiff.diff(oldStr, newStr, options);
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/line.js
var require_line = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/line.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.diffLines = diffLines;
    exports.diffTrimmedLines = diffTrimmedLines;
    exports.lineDiff = void 0;
    var _base = _interopRequireDefault(require_base());
    var _params = require_params();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var lineDiff = new /*istanbul ignore start*/
    _base[
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
    ]();
    exports.lineDiff = lineDiff;
    lineDiff.tokenize = function(value) {
      if (this.options.stripTrailingCr) {
        value = value.replace(/\r\n/g, "\n");
      }
      var retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
      if (!linesAndNewlines[linesAndNewlines.length - 1]) {
        linesAndNewlines.pop();
      }
      for (var i = 0; i < linesAndNewlines.length; i++) {
        var line = linesAndNewlines[i];
        if (i % 2 && !this.options.newlineIsToken) {
          retLines[retLines.length - 1] += line;
        } else {
          if (this.options.ignoreWhitespace) {
            line = line.trim();
          }
          retLines.push(line);
        }
      }
      return retLines;
    };
    function diffLines(oldStr, newStr, callback) {
      return lineDiff.diff(oldStr, newStr, callback);
    }
    function diffTrimmedLines(oldStr, newStr, callback) {
      var options = (
        /*istanbul ignore start*/
        (0, /*istanbul ignore end*/
        /*istanbul ignore start*/
        _params.generateOptions)(callback, {
          ignoreWhitespace: true
        })
      );
      return lineDiff.diff(oldStr, newStr, options);
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/sentence.js
var require_sentence = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/sentence.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.diffSentences = diffSentences;
    exports.sentenceDiff = void 0;
    var _base = _interopRequireDefault(require_base());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var sentenceDiff = new /*istanbul ignore start*/
    _base[
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
    ]();
    exports.sentenceDiff = sentenceDiff;
    sentenceDiff.tokenize = function(value) {
      return value.split(/(\S.+?[.!?])(?=\s+|$)/);
    };
    function diffSentences(oldStr, newStr, callback) {
      return sentenceDiff.diff(oldStr, newStr, callback);
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/css.js
var require_css = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/css.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.diffCss = diffCss;
    exports.cssDiff = void 0;
    var _base = _interopRequireDefault(require_base());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var cssDiff = new /*istanbul ignore start*/
    _base[
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
    ]();
    exports.cssDiff = cssDiff;
    cssDiff.tokenize = function(value) {
      return value.split(/([{}:;,]|\s+)/);
    };
    function diffCss(oldStr, newStr, callback) {
      return cssDiff.diff(oldStr, newStr, callback);
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/json.js
var require_json = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/json.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.diffJson = diffJson;
    exports.canonicalize = canonicalize;
    exports.jsonDiff = void 0;
    var _base = _interopRequireDefault(require_base());
    var _line = require_line();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    function _typeof(obj) {
      "@babel/helpers - typeof";
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function _typeof2(obj2) {
          return typeof obj2;
        };
      } else {
        _typeof = function _typeof2(obj2) {
          return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        };
      }
      return _typeof(obj);
    }
    var objectPrototypeToString = Object.prototype.toString;
    var jsonDiff = new /*istanbul ignore start*/
    _base[
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
    ]();
    exports.jsonDiff = jsonDiff;
    jsonDiff.useLongestToken = true;
    jsonDiff.tokenize = /*istanbul ignore start*/
    _line.lineDiff.tokenize;
    jsonDiff.castInput = function(value) {
      var _this$options = (
        /*istanbul ignore end*/
        this.options
      ), undefinedReplacement = _this$options.undefinedReplacement, _this$options$stringi = _this$options.stringifyReplacer, stringifyReplacer = _this$options$stringi === void 0 ? function(k, v) {
        return (
          /*istanbul ignore end*/
          typeof v === "undefined" ? undefinedReplacement : v
        );
      } : _this$options$stringi;
      return typeof value === "string" ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, "  ");
    };
    jsonDiff.equals = function(left, right) {
      return (
        /*istanbul ignore start*/
        _base[
          /*istanbul ignore start*/
          "default"
          /*istanbul ignore end*/
        ].prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"))
      );
    };
    function diffJson(oldObj, newObj, options) {
      return jsonDiff.diff(oldObj, newObj, options);
    }
    function canonicalize(obj, stack, replacementStack, replacer, key) {
      stack = stack || [];
      replacementStack = replacementStack || [];
      if (replacer) {
        obj = replacer(key, obj);
      }
      var i;
      for (i = 0; i < stack.length; i += 1) {
        if (stack[i] === obj) {
          return replacementStack[i];
        }
      }
      var canonicalizedObj;
      if ("[object Array]" === objectPrototypeToString.call(obj)) {
        stack.push(obj);
        canonicalizedObj = new Array(obj.length);
        replacementStack.push(canonicalizedObj);
        for (i = 0; i < obj.length; i += 1) {
          canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
        }
        stack.pop();
        replacementStack.pop();
        return canonicalizedObj;
      }
      if (obj && obj.toJSON) {
        obj = obj.toJSON();
      }
      if (
        /*istanbul ignore start*/
        _typeof(
          /*istanbul ignore end*/
          obj
        ) === "object" && obj !== null
      ) {
        stack.push(obj);
        canonicalizedObj = {};
        replacementStack.push(canonicalizedObj);
        var sortedKeys = [], _key;
        for (_key in obj) {
          if (obj.hasOwnProperty(_key)) {
            sortedKeys.push(_key);
          }
        }
        sortedKeys.sort();
        for (i = 0; i < sortedKeys.length; i += 1) {
          _key = sortedKeys[i];
          canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
        }
        stack.pop();
        replacementStack.pop();
      } else {
        canonicalizedObj = obj;
      }
      return canonicalizedObj;
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/array.js
var require_array = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/diff/array.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.diffArrays = diffArrays;
    exports.arrayDiff = void 0;
    var _base = _interopRequireDefault(require_base());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var arrayDiff = new /*istanbul ignore start*/
    _base[
      /*istanbul ignore start*/
      "default"
      /*istanbul ignore end*/
    ]();
    exports.arrayDiff = arrayDiff;
    arrayDiff.tokenize = function(value) {
      return value.slice();
    };
    arrayDiff.join = arrayDiff.removeEmpty = function(value) {
      return value;
    };
    function diffArrays(oldArr, newArr, callback) {
      return arrayDiff.diff(oldArr, newArr, callback);
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/parse.js
var require_parse = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/parse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.parsePatch = parsePatch;
    function parsePatch(uniDiff) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/), delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [], list = [], i = 0;
      function parseIndex() {
        var index = {};
        list.push(index);
        while (i < diffstr.length) {
          var line = diffstr[i];
          if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
            break;
          }
          var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
          if (header) {
            index.index = header[1];
          }
          i++;
        }
        parseFileHeader(index);
        parseFileHeader(index);
        index.hunks = [];
        while (i < diffstr.length) {
          var _line = diffstr[i];
          if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
            break;
          } else if (/^@@/.test(_line)) {
            index.hunks.push(parseHunk());
          } else if (_line && options.strict) {
            throw new Error("Unknown line " + (i + 1) + " " + JSON.stringify(_line));
          } else {
            i++;
          }
        }
      }
      function parseFileHeader(index) {
        var fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);
        if (fileHeader) {
          var keyPrefix = fileHeader[1] === "---" ? "old" : "new";
          var data = fileHeader[2].split("	", 2);
          var fileName = data[0].replace(/\\\\/g, "\\");
          if (/^".*"$/.test(fileName)) {
            fileName = fileName.substr(1, fileName.length - 2);
          }
          index[keyPrefix + "FileName"] = fileName;
          index[keyPrefix + "Header"] = (data[1] || "").trim();
          i++;
        }
      }
      function parseHunk() {
        var chunkHeaderIndex = i, chunkHeaderLine = diffstr[i++], chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        var hunk = {
          oldStart: +chunkHeader[1],
          oldLines: typeof chunkHeader[2] === "undefined" ? 1 : +chunkHeader[2],
          newStart: +chunkHeader[3],
          newLines: typeof chunkHeader[4] === "undefined" ? 1 : +chunkHeader[4],
          lines: [],
          linedelimiters: []
        };
        if (hunk.oldLines === 0) {
          hunk.oldStart += 1;
        }
        if (hunk.newLines === 0) {
          hunk.newStart += 1;
        }
        var addCount = 0, removeCount = 0;
        for (; i < diffstr.length; i++) {
          if (diffstr[i].indexOf("--- ") === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf("+++ ") === 0 && diffstr[i + 2].indexOf("@@") === 0) {
            break;
          }
          var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? " " : diffstr[i][0];
          if (operation === "+" || operation === "-" || operation === " " || operation === "\\") {
            hunk.lines.push(diffstr[i]);
            hunk.linedelimiters.push(delimiters[i] || "\n");
            if (operation === "+") {
              addCount++;
            } else if (operation === "-") {
              removeCount++;
            } else if (operation === " ") {
              addCount++;
              removeCount++;
            }
          } else {
            break;
          }
        }
        if (!addCount && hunk.newLines === 1) {
          hunk.newLines = 0;
        }
        if (!removeCount && hunk.oldLines === 1) {
          hunk.oldLines = 0;
        }
        if (options.strict) {
          if (addCount !== hunk.newLines) {
            throw new Error("Added line count did not match for hunk at line " + (chunkHeaderIndex + 1));
          }
          if (removeCount !== hunk.oldLines) {
            throw new Error("Removed line count did not match for hunk at line " + (chunkHeaderIndex + 1));
          }
        }
        return hunk;
      }
      while (i < diffstr.length) {
        parseIndex();
      }
      return list;
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/util/distance-iterator.js
var require_distance_iterator = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/util/distance-iterator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = _default;
    function _default(start, minLine, maxLine) {
      var wantForward = true, backwardExhausted = false, forwardExhausted = false, localOffset = 1;
      return function iterator() {
        if (wantForward && !forwardExhausted) {
          if (backwardExhausted) {
            localOffset++;
          } else {
            wantForward = false;
          }
          if (start + localOffset <= maxLine) {
            return localOffset;
          }
          forwardExhausted = true;
        }
        if (!backwardExhausted) {
          if (!forwardExhausted) {
            wantForward = true;
          }
          if (minLine <= start - localOffset) {
            return -localOffset++;
          }
          backwardExhausted = true;
          return iterator();
        }
      };
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/apply.js
var require_apply = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/apply.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.applyPatch = applyPatch;
    exports.applyPatches = applyPatches;
    var _parse = require_parse();
    var _distanceIterator = _interopRequireDefault(require_distance_iterator());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    function applyPatch(source, uniDiff) {
      var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      if (typeof uniDiff === "string") {
        uniDiff = /*istanbul ignore start*/
        (0, /*istanbul ignore end*/
        /*istanbul ignore start*/
        _parse.parsePatch)(uniDiff);
      }
      if (Array.isArray(uniDiff)) {
        if (uniDiff.length > 1) {
          throw new Error("applyPatch only works with a single input.");
        }
        uniDiff = uniDiff[0];
      }
      var lines = source.split(/\r\n|[\n\v\f\r\x85]/), delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [], hunks = uniDiff.hunks, compareLine = options.compareLine || function(lineNumber, line2, operation2, patchContent) {
        return (
          /*istanbul ignore end*/
          line2 === patchContent
        );
      }, errorCount = 0, fuzzFactor = options.fuzzFactor || 0, minLine = 0, offset = 0, removeEOFNL, addEOFNL;
      function hunkFits(hunk2, toPos2) {
        for (var j2 = 0; j2 < hunk2.lines.length; j2++) {
          var line2 = hunk2.lines[j2], operation2 = line2.length > 0 ? line2[0] : " ", content2 = line2.length > 0 ? line2.substr(1) : line2;
          if (operation2 === " " || operation2 === "-") {
            if (!compareLine(toPos2 + 1, lines[toPos2], operation2, content2)) {
              errorCount++;
              if (errorCount > fuzzFactor) {
                return false;
              }
            }
            toPos2++;
          }
        }
        return true;
      }
      for (var i = 0; i < hunks.length; i++) {
        var hunk = hunks[i], maxLine = lines.length - hunk.oldLines, localOffset = 0, toPos = offset + hunk.oldStart - 1;
        var iterator = (
          /*istanbul ignore start*/
          (0, /*istanbul ignore end*/
          /*istanbul ignore start*/
          _distanceIterator[
            /*istanbul ignore start*/
            "default"
            /*istanbul ignore end*/
          ])(toPos, minLine, maxLine)
        );
        for (; localOffset !== void 0; localOffset = iterator()) {
          if (hunkFits(hunk, toPos + localOffset)) {
            hunk.offset = offset += localOffset;
            break;
          }
        }
        if (localOffset === void 0) {
          return false;
        }
        minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
      }
      var diffOffset = 0;
      for (var _i = 0; _i < hunks.length; _i++) {
        var _hunk = hunks[_i], _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;
        diffOffset += _hunk.newLines - _hunk.oldLines;
        for (var j = 0; j < _hunk.lines.length; j++) {
          var line = _hunk.lines[j], operation = line.length > 0 ? line[0] : " ", content = line.length > 0 ? line.substr(1) : line, delimiter = _hunk.linedelimiters && _hunk.linedelimiters[j] || "\n";
          if (operation === " ") {
            _toPos++;
          } else if (operation === "-") {
            lines.splice(_toPos, 1);
            delimiters.splice(_toPos, 1);
          } else if (operation === "+") {
            lines.splice(_toPos, 0, content);
            delimiters.splice(_toPos, 0, delimiter);
            _toPos++;
          } else if (operation === "\\") {
            var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;
            if (previousOperation === "+") {
              removeEOFNL = true;
            } else if (previousOperation === "-") {
              addEOFNL = true;
            }
          }
        }
      }
      if (removeEOFNL) {
        while (!lines[lines.length - 1]) {
          lines.pop();
          delimiters.pop();
        }
      } else if (addEOFNL) {
        lines.push("");
        delimiters.push("\n");
      }
      for (var _k = 0; _k < lines.length - 1; _k++) {
        lines[_k] = lines[_k] + delimiters[_k];
      }
      return lines.join("");
    }
    function applyPatches(uniDiff, options) {
      if (typeof uniDiff === "string") {
        uniDiff = /*istanbul ignore start*/
        (0, /*istanbul ignore end*/
        /*istanbul ignore start*/
        _parse.parsePatch)(uniDiff);
      }
      var currentIndex = 0;
      function processIndex() {
        var index = uniDiff[currentIndex++];
        if (!index) {
          return options.complete();
        }
        options.loadFile(index, function(err, data) {
          if (err) {
            return options.complete(err);
          }
          var updatedContent = applyPatch(data, index, options);
          options.patched(index, updatedContent, function(err2) {
            if (err2) {
              return options.complete(err2);
            }
            processIndex();
          });
        });
      }
      processIndex();
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/create.js
var require_create = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/create.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.structuredPatch = structuredPatch;
    exports.formatPatch = formatPatch;
    exports.createTwoFilesPatch = createTwoFilesPatch;
    exports.createPatch = createPatch;
    var _line = require_line();
    function _toConsumableArray(arr) {
      return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }
    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr)) return _arrayLikeToArray(arr);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      if (!options) {
        options = {};
      }
      if (typeof options.context === "undefined") {
        options.context = 4;
      }
      var diff = (
        /*istanbul ignore start*/
        (0, /*istanbul ignore end*/
        /*istanbul ignore start*/
        _line.diffLines)(oldStr, newStr, options)
      );
      if (!diff) {
        return;
      }
      diff.push({
        value: "",
        lines: []
      });
      function contextLines(lines) {
        return lines.map(function(entry) {
          return " " + entry;
        });
      }
      var hunks = [];
      var oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
      var _loop = function _loop2(i2) {
        var current = diff[i2], lines = current.lines || current.value.replace(/\n$/, "").split("\n");
        current.lines = lines;
        if (current.added || current.removed) {
          var _curRange;
          if (!oldRangeStart) {
            var prev = diff[i2 - 1];
            oldRangeStart = oldLine;
            newRangeStart = newLine;
            if (prev) {
              curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
              oldRangeStart -= curRange.length;
              newRangeStart -= curRange.length;
            }
          }
          (_curRange = /*istanbul ignore end*/
          curRange).push.apply(
            /*istanbul ignore start*/
            _curRange,
            /*istanbul ignore start*/
            _toConsumableArray(
              /*istanbul ignore end*/
              lines.map(function(entry) {
                return (current.added ? "+" : "-") + entry;
              })
            )
          );
          if (current.added) {
            newLine += lines.length;
          } else {
            oldLine += lines.length;
          }
        } else {
          if (oldRangeStart) {
            if (lines.length <= options.context * 2 && i2 < diff.length - 2) {
              var _curRange2;
              (_curRange2 = /*istanbul ignore end*/
              curRange).push.apply(
                /*istanbul ignore start*/
                _curRange2,
                /*istanbul ignore start*/
                _toConsumableArray(
                  /*istanbul ignore end*/
                  contextLines(lines)
                )
              );
            } else {
              var _curRange3;
              var contextSize = Math.min(lines.length, options.context);
              (_curRange3 = /*istanbul ignore end*/
              curRange).push.apply(
                /*istanbul ignore start*/
                _curRange3,
                /*istanbul ignore start*/
                _toConsumableArray(
                  /*istanbul ignore end*/
                  contextLines(lines.slice(0, contextSize))
                )
              );
              var hunk = {
                oldStart: oldRangeStart,
                oldLines: oldLine - oldRangeStart + contextSize,
                newStart: newRangeStart,
                newLines: newLine - newRangeStart + contextSize,
                lines: curRange
              };
              if (i2 >= diff.length - 2 && lines.length <= options.context) {
                var oldEOFNewline = /\n$/.test(oldStr);
                var newEOFNewline = /\n$/.test(newStr);
                var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;
                if (!oldEOFNewline && noNlBeforeAdds && oldStr.length > 0) {
                  curRange.splice(hunk.oldLines, 0, "\\ No newline at end of file");
                }
                if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
                  curRange.push("\\ No newline at end of file");
                }
              }
              hunks.push(hunk);
              oldRangeStart = 0;
              newRangeStart = 0;
              curRange = [];
            }
          }
          oldLine += lines.length;
          newLine += lines.length;
        }
      };
      for (var i = 0; i < diff.length; i++) {
        _loop(
          /*istanbul ignore end*/
          i
        );
      }
      return {
        oldFileName,
        newFileName,
        oldHeader,
        newHeader,
        hunks
      };
    }
    function formatPatch(diff) {
      if (Array.isArray(diff)) {
        return diff.map(formatPatch).join("\n");
      }
      var ret = [];
      if (diff.oldFileName == diff.newFileName) {
        ret.push("Index: " + diff.oldFileName);
      }
      ret.push("===================================================================");
      ret.push("--- " + diff.oldFileName + (typeof diff.oldHeader === "undefined" ? "" : "	" + diff.oldHeader));
      ret.push("+++ " + diff.newFileName + (typeof diff.newHeader === "undefined" ? "" : "	" + diff.newHeader));
      for (var i = 0; i < diff.hunks.length; i++) {
        var hunk = diff.hunks[i];
        if (hunk.oldLines === 0) {
          hunk.oldStart -= 1;
        }
        if (hunk.newLines === 0) {
          hunk.newStart -= 1;
        }
        ret.push("@@ -" + hunk.oldStart + "," + hunk.oldLines + " +" + hunk.newStart + "," + hunk.newLines + " @@");
        ret.push.apply(ret, hunk.lines);
      }
      return ret.join("\n") + "\n";
    }
    function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      return formatPatch(structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options));
    }
    function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
      return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/util/array.js
var require_array2 = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/util/array.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.arrayEqual = arrayEqual;
    exports.arrayStartsWith = arrayStartsWith;
    function arrayEqual(a, b) {
      if (a.length !== b.length) {
        return false;
      }
      return arrayStartsWith(a, b);
    }
    function arrayStartsWith(array, start) {
      if (start.length > array.length) {
        return false;
      }
      for (var i = 0; i < start.length; i++) {
        if (start[i] !== array[i]) {
          return false;
        }
      }
      return true;
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/merge.js
var require_merge = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/merge.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.calcLineCount = calcLineCount;
    exports.merge = merge;
    var _create = require_create();
    var _parse = require_parse();
    var _array = require_array2();
    function _toConsumableArray(arr) {
      return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }
    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr)) return _arrayLikeToArray(arr);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    function calcLineCount(hunk) {
      var _calcOldNewLineCount = (
        /*istanbul ignore end*/
        calcOldNewLineCount(hunk.lines)
      ), oldLines = _calcOldNewLineCount.oldLines, newLines = _calcOldNewLineCount.newLines;
      if (oldLines !== void 0) {
        hunk.oldLines = oldLines;
      } else {
        delete hunk.oldLines;
      }
      if (newLines !== void 0) {
        hunk.newLines = newLines;
      } else {
        delete hunk.newLines;
      }
    }
    function merge(mine, theirs, base) {
      mine = loadPatch(mine, base);
      theirs = loadPatch(theirs, base);
      var ret = {};
      if (mine.index || theirs.index) {
        ret.index = mine.index || theirs.index;
      }
      if (mine.newFileName || theirs.newFileName) {
        if (!fileNameChanged(mine)) {
          ret.oldFileName = theirs.oldFileName || mine.oldFileName;
          ret.newFileName = theirs.newFileName || mine.newFileName;
          ret.oldHeader = theirs.oldHeader || mine.oldHeader;
          ret.newHeader = theirs.newHeader || mine.newHeader;
        } else if (!fileNameChanged(theirs)) {
          ret.oldFileName = mine.oldFileName;
          ret.newFileName = mine.newFileName;
          ret.oldHeader = mine.oldHeader;
          ret.newHeader = mine.newHeader;
        } else {
          ret.oldFileName = selectField(ret, mine.oldFileName, theirs.oldFileName);
          ret.newFileName = selectField(ret, mine.newFileName, theirs.newFileName);
          ret.oldHeader = selectField(ret, mine.oldHeader, theirs.oldHeader);
          ret.newHeader = selectField(ret, mine.newHeader, theirs.newHeader);
        }
      }
      ret.hunks = [];
      var mineIndex = 0, theirsIndex = 0, mineOffset = 0, theirsOffset = 0;
      while (mineIndex < mine.hunks.length || theirsIndex < theirs.hunks.length) {
        var mineCurrent = mine.hunks[mineIndex] || {
          oldStart: Infinity
        }, theirsCurrent = theirs.hunks[theirsIndex] || {
          oldStart: Infinity
        };
        if (hunkBefore(mineCurrent, theirsCurrent)) {
          ret.hunks.push(cloneHunk(mineCurrent, mineOffset));
          mineIndex++;
          theirsOffset += mineCurrent.newLines - mineCurrent.oldLines;
        } else if (hunkBefore(theirsCurrent, mineCurrent)) {
          ret.hunks.push(cloneHunk(theirsCurrent, theirsOffset));
          theirsIndex++;
          mineOffset += theirsCurrent.newLines - theirsCurrent.oldLines;
        } else {
          var mergedHunk = {
            oldStart: Math.min(mineCurrent.oldStart, theirsCurrent.oldStart),
            oldLines: 0,
            newStart: Math.min(mineCurrent.newStart + mineOffset, theirsCurrent.oldStart + theirsOffset),
            newLines: 0,
            lines: []
          };
          mergeLines(mergedHunk, mineCurrent.oldStart, mineCurrent.lines, theirsCurrent.oldStart, theirsCurrent.lines);
          theirsIndex++;
          mineIndex++;
          ret.hunks.push(mergedHunk);
        }
      }
      return ret;
    }
    function loadPatch(param, base) {
      if (typeof param === "string") {
        if (/^@@/m.test(param) || /^Index:/m.test(param)) {
          return (
            /*istanbul ignore start*/
            (0, /*istanbul ignore end*/
            /*istanbul ignore start*/
            _parse.parsePatch)(param)[0]
          );
        }
        if (!base) {
          throw new Error("Must provide a base reference or pass in a patch");
        }
        return (
          /*istanbul ignore start*/
          (0, /*istanbul ignore end*/
          /*istanbul ignore start*/
          _create.structuredPatch)(void 0, void 0, base, param)
        );
      }
      return param;
    }
    function fileNameChanged(patch) {
      return patch.newFileName && patch.newFileName !== patch.oldFileName;
    }
    function selectField(index, mine, theirs) {
      if (mine === theirs) {
        return mine;
      } else {
        index.conflict = true;
        return {
          mine,
          theirs
        };
      }
    }
    function hunkBefore(test, check) {
      return test.oldStart < check.oldStart && test.oldStart + test.oldLines < check.oldStart;
    }
    function cloneHunk(hunk, offset) {
      return {
        oldStart: hunk.oldStart,
        oldLines: hunk.oldLines,
        newStart: hunk.newStart + offset,
        newLines: hunk.newLines,
        lines: hunk.lines
      };
    }
    function mergeLines(hunk, mineOffset, mineLines, theirOffset, theirLines) {
      var mine = {
        offset: mineOffset,
        lines: mineLines,
        index: 0
      }, their = {
        offset: theirOffset,
        lines: theirLines,
        index: 0
      };
      insertLeading(hunk, mine, their);
      insertLeading(hunk, their, mine);
      while (mine.index < mine.lines.length && their.index < their.lines.length) {
        var mineCurrent = mine.lines[mine.index], theirCurrent = their.lines[their.index];
        if ((mineCurrent[0] === "-" || mineCurrent[0] === "+") && (theirCurrent[0] === "-" || theirCurrent[0] === "+")) {
          mutualChange(hunk, mine, their);
        } else if (mineCurrent[0] === "+" && theirCurrent[0] === " ") {
          var _hunk$lines;
          (_hunk$lines = /*istanbul ignore end*/
          hunk.lines).push.apply(
            /*istanbul ignore start*/
            _hunk$lines,
            /*istanbul ignore start*/
            _toConsumableArray(
              /*istanbul ignore end*/
              collectChange(mine)
            )
          );
        } else if (theirCurrent[0] === "+" && mineCurrent[0] === " ") {
          var _hunk$lines2;
          (_hunk$lines2 = /*istanbul ignore end*/
          hunk.lines).push.apply(
            /*istanbul ignore start*/
            _hunk$lines2,
            /*istanbul ignore start*/
            _toConsumableArray(
              /*istanbul ignore end*/
              collectChange(their)
            )
          );
        } else if (mineCurrent[0] === "-" && theirCurrent[0] === " ") {
          removal(hunk, mine, their);
        } else if (theirCurrent[0] === "-" && mineCurrent[0] === " ") {
          removal(hunk, their, mine, true);
        } else if (mineCurrent === theirCurrent) {
          hunk.lines.push(mineCurrent);
          mine.index++;
          their.index++;
        } else {
          conflict(hunk, collectChange(mine), collectChange(their));
        }
      }
      insertTrailing(hunk, mine);
      insertTrailing(hunk, their);
      calcLineCount(hunk);
    }
    function mutualChange(hunk, mine, their) {
      var myChanges = collectChange(mine), theirChanges = collectChange(their);
      if (allRemoves(myChanges) && allRemoves(theirChanges)) {
        if (
          /*istanbul ignore start*/
          (0, /*istanbul ignore end*/
          /*istanbul ignore start*/
          _array.arrayStartsWith)(myChanges, theirChanges) && skipRemoveSuperset(their, myChanges, myChanges.length - theirChanges.length)
        ) {
          var _hunk$lines3;
          (_hunk$lines3 = /*istanbul ignore end*/
          hunk.lines).push.apply(
            /*istanbul ignore start*/
            _hunk$lines3,
            /*istanbul ignore start*/
            _toConsumableArray(
              /*istanbul ignore end*/
              myChanges
            )
          );
          return;
        } else if (
          /*istanbul ignore start*/
          (0, /*istanbul ignore end*/
          /*istanbul ignore start*/
          _array.arrayStartsWith)(theirChanges, myChanges) && skipRemoveSuperset(mine, theirChanges, theirChanges.length - myChanges.length)
        ) {
          var _hunk$lines4;
          (_hunk$lines4 = /*istanbul ignore end*/
          hunk.lines).push.apply(
            /*istanbul ignore start*/
            _hunk$lines4,
            /*istanbul ignore start*/
            _toConsumableArray(
              /*istanbul ignore end*/
              theirChanges
            )
          );
          return;
        }
      } else if (
        /*istanbul ignore start*/
        (0, /*istanbul ignore end*/
        /*istanbul ignore start*/
        _array.arrayEqual)(myChanges, theirChanges)
      ) {
        var _hunk$lines5;
        (_hunk$lines5 = /*istanbul ignore end*/
        hunk.lines).push.apply(
          /*istanbul ignore start*/
          _hunk$lines5,
          /*istanbul ignore start*/
          _toConsumableArray(
            /*istanbul ignore end*/
            myChanges
          )
        );
        return;
      }
      conflict(hunk, myChanges, theirChanges);
    }
    function removal(hunk, mine, their, swap) {
      var myChanges = collectChange(mine), theirChanges = collectContext(their, myChanges);
      if (theirChanges.merged) {
        var _hunk$lines6;
        (_hunk$lines6 = /*istanbul ignore end*/
        hunk.lines).push.apply(
          /*istanbul ignore start*/
          _hunk$lines6,
          /*istanbul ignore start*/
          _toConsumableArray(
            /*istanbul ignore end*/
            theirChanges.merged
          )
        );
      } else {
        conflict(hunk, swap ? theirChanges : myChanges, swap ? myChanges : theirChanges);
      }
    }
    function conflict(hunk, mine, their) {
      hunk.conflict = true;
      hunk.lines.push({
        conflict: true,
        mine,
        theirs: their
      });
    }
    function insertLeading(hunk, insert, their) {
      while (insert.offset < their.offset && insert.index < insert.lines.length) {
        var line = insert.lines[insert.index++];
        hunk.lines.push(line);
        insert.offset++;
      }
    }
    function insertTrailing(hunk, insert) {
      while (insert.index < insert.lines.length) {
        var line = insert.lines[insert.index++];
        hunk.lines.push(line);
      }
    }
    function collectChange(state) {
      var ret = [], operation = state.lines[state.index][0];
      while (state.index < state.lines.length) {
        var line = state.lines[state.index];
        if (operation === "-" && line[0] === "+") {
          operation = "+";
        }
        if (operation === line[0]) {
          ret.push(line);
          state.index++;
        } else {
          break;
        }
      }
      return ret;
    }
    function collectContext(state, matchChanges) {
      var changes = [], merged = [], matchIndex = 0, contextChanges = false, conflicted = false;
      while (matchIndex < matchChanges.length && state.index < state.lines.length) {
        var change = state.lines[state.index], match = matchChanges[matchIndex];
        if (match[0] === "+") {
          break;
        }
        contextChanges = contextChanges || change[0] !== " ";
        merged.push(match);
        matchIndex++;
        if (change[0] === "+") {
          conflicted = true;
          while (change[0] === "+") {
            changes.push(change);
            change = state.lines[++state.index];
          }
        }
        if (match.substr(1) === change.substr(1)) {
          changes.push(change);
          state.index++;
        } else {
          conflicted = true;
        }
      }
      if ((matchChanges[matchIndex] || "")[0] === "+" && contextChanges) {
        conflicted = true;
      }
      if (conflicted) {
        return changes;
      }
      while (matchIndex < matchChanges.length) {
        merged.push(matchChanges[matchIndex++]);
      }
      return {
        merged,
        changes
      };
    }
    function allRemoves(changes) {
      return changes.reduce(function(prev, change) {
        return prev && change[0] === "-";
      }, true);
    }
    function skipRemoveSuperset(state, removeChanges, delta) {
      for (var i = 0; i < delta; i++) {
        var changeContent = removeChanges[removeChanges.length - delta + i].substr(1);
        if (state.lines[state.index + i] !== " " + changeContent) {
          return false;
        }
      }
      state.index += delta;
      return true;
    }
    function calcOldNewLineCount(lines) {
      var oldLines = 0;
      var newLines = 0;
      lines.forEach(function(line) {
        if (typeof line !== "string") {
          var myCount = calcOldNewLineCount(line.mine);
          var theirCount = calcOldNewLineCount(line.theirs);
          if (oldLines !== void 0) {
            if (myCount.oldLines === theirCount.oldLines) {
              oldLines += myCount.oldLines;
            } else {
              oldLines = void 0;
            }
          }
          if (newLines !== void 0) {
            if (myCount.newLines === theirCount.newLines) {
              newLines += myCount.newLines;
            } else {
              newLines = void 0;
            }
          }
        } else {
          if (newLines !== void 0 && (line[0] === "+" || line[0] === " ")) {
            newLines++;
          }
          if (oldLines !== void 0 && (line[0] === "-" || line[0] === " ")) {
            oldLines++;
          }
        }
      });
      return {
        oldLines,
        newLines
      };
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/reverse.js
var require_reverse = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/patch/reverse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.reversePatch = reversePatch;
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
        keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};
        if (i % 2) {
          ownKeys(Object(source), true).forEach(function(key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }
      return target;
    }
    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function reversePatch(structuredPatch) {
      if (Array.isArray(structuredPatch)) {
        return structuredPatch.map(reversePatch).reverse();
      }
      return (
        /*istanbul ignore start*/
        _objectSpread(_objectSpread(
          {},
          /*istanbul ignore end*/
          structuredPatch
        ), {}, {
          oldFileName: structuredPatch.newFileName,
          oldHeader: structuredPatch.newHeader,
          newFileName: structuredPatch.oldFileName,
          newHeader: structuredPatch.oldHeader,
          hunks: structuredPatch.hunks.map(function(hunk) {
            return {
              oldLines: hunk.newLines,
              oldStart: hunk.newStart,
              newLines: hunk.oldLines,
              newStart: hunk.oldStart,
              linedelimiters: hunk.linedelimiters,
              lines: hunk.lines.map(function(l) {
                if (l.startsWith("-")) {
                  return (
                    /*istanbul ignore start*/
                    "+".concat(
                      /*istanbul ignore end*/
                      l.slice(1)
                    )
                  );
                }
                if (l.startsWith("+")) {
                  return (
                    /*istanbul ignore start*/
                    "-".concat(
                      /*istanbul ignore end*/
                      l.slice(1)
                    )
                  );
                }
                return l;
              })
            };
          })
        })
      );
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/convert/dmp.js
var require_dmp = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/convert/dmp.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.convertChangesToDMP = convertChangesToDMP;
    function convertChangesToDMP(changes) {
      var ret = [], change, operation;
      for (var i = 0; i < changes.length; i++) {
        change = changes[i];
        if (change.added) {
          operation = 1;
        } else if (change.removed) {
          operation = -1;
        } else {
          operation = 0;
        }
        ret.push([operation, change.value]);
      }
      return ret;
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/convert/xml.js
var require_xml = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/convert/xml.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.convertChangesToXML = convertChangesToXML;
    function convertChangesToXML(changes) {
      var ret = [];
      for (var i = 0; i < changes.length; i++) {
        var change = changes[i];
        if (change.added) {
          ret.push("<ins>");
        } else if (change.removed) {
          ret.push("<del>");
        }
        ret.push(escapeHTML(change.value));
        if (change.added) {
          ret.push("</ins>");
        } else if (change.removed) {
          ret.push("</del>");
        }
      }
      return ret.join("");
    }
    function escapeHTML(s) {
      var n = s;
      n = n.replace(/&/g, "&amp;");
      n = n.replace(/</g, "&lt;");
      n = n.replace(/>/g, "&gt;");
      n = n.replace(/"/g, "&quot;");
      return n;
    }
  }
});

// node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/diff@5.2.0/node_modules/diff/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "Diff", {
      enumerable: true,
      get: function get() {
        return _base["default"];
      }
    });
    Object.defineProperty(exports, "diffChars", {
      enumerable: true,
      get: function get() {
        return _character.diffChars;
      }
    });
    Object.defineProperty(exports, "diffWords", {
      enumerable: true,
      get: function get() {
        return _word.diffWords;
      }
    });
    Object.defineProperty(exports, "diffWordsWithSpace", {
      enumerable: true,
      get: function get() {
        return _word.diffWordsWithSpace;
      }
    });
    Object.defineProperty(exports, "diffLines", {
      enumerable: true,
      get: function get() {
        return _line.diffLines;
      }
    });
    Object.defineProperty(exports, "diffTrimmedLines", {
      enumerable: true,
      get: function get() {
        return _line.diffTrimmedLines;
      }
    });
    Object.defineProperty(exports, "diffSentences", {
      enumerable: true,
      get: function get() {
        return _sentence.diffSentences;
      }
    });
    Object.defineProperty(exports, "diffCss", {
      enumerable: true,
      get: function get() {
        return _css.diffCss;
      }
    });
    Object.defineProperty(exports, "diffJson", {
      enumerable: true,
      get: function get() {
        return _json.diffJson;
      }
    });
    Object.defineProperty(exports, "canonicalize", {
      enumerable: true,
      get: function get() {
        return _json.canonicalize;
      }
    });
    Object.defineProperty(exports, "diffArrays", {
      enumerable: true,
      get: function get() {
        return _array.diffArrays;
      }
    });
    Object.defineProperty(exports, "applyPatch", {
      enumerable: true,
      get: function get() {
        return _apply.applyPatch;
      }
    });
    Object.defineProperty(exports, "applyPatches", {
      enumerable: true,
      get: function get() {
        return _apply.applyPatches;
      }
    });
    Object.defineProperty(exports, "parsePatch", {
      enumerable: true,
      get: function get() {
        return _parse.parsePatch;
      }
    });
    Object.defineProperty(exports, "merge", {
      enumerable: true,
      get: function get() {
        return _merge.merge;
      }
    });
    Object.defineProperty(exports, "reversePatch", {
      enumerable: true,
      get: function get() {
        return _reverse.reversePatch;
      }
    });
    Object.defineProperty(exports, "structuredPatch", {
      enumerable: true,
      get: function get() {
        return _create.structuredPatch;
      }
    });
    Object.defineProperty(exports, "createTwoFilesPatch", {
      enumerable: true,
      get: function get() {
        return _create.createTwoFilesPatch;
      }
    });
    Object.defineProperty(exports, "createPatch", {
      enumerable: true,
      get: function get() {
        return _create.createPatch;
      }
    });
    Object.defineProperty(exports, "formatPatch", {
      enumerable: true,
      get: function get() {
        return _create.formatPatch;
      }
    });
    Object.defineProperty(exports, "convertChangesToDMP", {
      enumerable: true,
      get: function get() {
        return _dmp.convertChangesToDMP;
      }
    });
    Object.defineProperty(exports, "convertChangesToXML", {
      enumerable: true,
      get: function get() {
        return _xml.convertChangesToXML;
      }
    });
    var _base = _interopRequireDefault(require_base());
    var _character = require_character();
    var _word = require_word();
    var _line = require_line();
    var _sentence = require_sentence();
    var _css = require_css();
    var _json = require_json();
    var _array = require_array();
    var _apply = require_apply();
    var _parse = require_parse();
    var _merge = require_merge();
    var _reverse = require_reverse();
    var _create = require_create();
    var _dmp = require_dmp();
    var _xml = require_xml();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
  }
});

// node_modules/.pnpm/react-diff-viewer-continued@3.4.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-diff-viewer-continued/lib/src/compute-lines.js
var require_compute_lines = __commonJS({
  "node_modules/.pnpm/react-diff-viewer-continued@3.4.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-diff-viewer-continued/lib/src/compute-lines.js"(exports) {
    "use strict";
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
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeLineInformation = exports.DiffMethod = exports.DiffType = void 0;
    var diff = __importStar(require_lib());
    var jsDiff = diff;
    var DiffType;
    (function(DiffType2) {
      DiffType2[DiffType2["DEFAULT"] = 0] = "DEFAULT";
      DiffType2[DiffType2["ADDED"] = 1] = "ADDED";
      DiffType2[DiffType2["REMOVED"] = 2] = "REMOVED";
      DiffType2[DiffType2["CHANGED"] = 3] = "CHANGED";
    })(DiffType || (exports.DiffType = DiffType = {}));
    var DiffMethod;
    (function(DiffMethod2) {
      DiffMethod2["CHARS"] = "diffChars";
      DiffMethod2["WORDS"] = "diffWords";
      DiffMethod2["WORDS_WITH_SPACE"] = "diffWordsWithSpace";
      DiffMethod2["LINES"] = "diffLines";
      DiffMethod2["TRIMMED_LINES"] = "diffTrimmedLines";
      DiffMethod2["SENTENCES"] = "diffSentences";
      DiffMethod2["CSS"] = "diffCss";
      DiffMethod2["JSON"] = "diffJson";
    })(DiffMethod || (exports.DiffMethod = DiffMethod = {}));
    var constructLines = (value) => {
      if (value === "")
        return [];
      const lines = value.replace(/\n$/, "").split("\n");
      return lines;
    };
    var computeDiff = (oldValue, newValue, compareMethod = DiffMethod.CHARS) => {
      const diffArray = jsDiff[compareMethod](oldValue, newValue);
      const computedDiff = {
        left: [],
        right: []
      };
      diffArray.forEach(({ added, removed, value }) => {
        const diffInformation = {};
        if (added) {
          diffInformation.type = DiffType.ADDED;
          diffInformation.value = value;
          computedDiff.right.push(diffInformation);
        }
        if (removed) {
          diffInformation.type = DiffType.REMOVED;
          diffInformation.value = value;
          computedDiff.left.push(diffInformation);
        }
        if (!removed && !added) {
          diffInformation.type = DiffType.DEFAULT;
          diffInformation.value = value;
          computedDiff.right.push(diffInformation);
          computedDiff.left.push(diffInformation);
        }
        return diffInformation;
      });
      return computedDiff;
    };
    var computeLineInformation = (oldString, newString, disableWordDiff = false, lineCompareMethod = DiffMethod.CHARS, linesOffset = 0, showLines = []) => {
      let diffArray = [];
      if (typeof oldString === "string" && typeof newString === "string") {
        diffArray = diff.diffLines(oldString.trimRight(), newString.trimRight(), {
          newlineIsToken: false,
          ignoreWhitespace: false,
          ignoreCase: false
        });
      } else {
        diffArray = diff.diffJson(oldString, newString);
      }
      let rightLineNumber = linesOffset;
      let leftLineNumber = linesOffset;
      let lineInformation = [];
      let counter = 0;
      const diffLines = [];
      const ignoreDiffIndexes = [];
      const getLineInformation = (value, diffIndex, added, removed, evaluateOnlyFirstLine) => {
        const lines = constructLines(value);
        return lines.map((line, lineIndex) => {
          const left = {};
          const right = {};
          if (ignoreDiffIndexes.includes(`${diffIndex}-${lineIndex}`) || evaluateOnlyFirstLine && lineIndex !== 0) {
            return void 0;
          }
          if (added || removed) {
            let countAsChange = true;
            if (removed) {
              leftLineNumber += 1;
              left.lineNumber = leftLineNumber;
              left.type = DiffType.REMOVED;
              left.value = line || " ";
              const nextDiff = diffArray[diffIndex + 1];
              if (nextDiff && nextDiff.added) {
                const nextDiffLines = constructLines(nextDiff.value)[lineIndex];
                if (nextDiffLines) {
                  const nextDiffLineInfo = getLineInformation(nextDiffLines, diffIndex, true, false, true);
                  const { value: rightValue, lineNumber, type } = nextDiffLineInfo[0].right;
                  ignoreDiffIndexes.push(`${diffIndex + 1}-${lineIndex}`);
                  right.lineNumber = lineNumber;
                  if (left.value === rightValue) {
                    countAsChange = false;
                    right.type = 0;
                    left.type = 0;
                    right.value = rightValue;
                  } else {
                    right.type = type;
                    if (disableWordDiff) {
                      right.value = rightValue;
                    } else {
                      const computedDiff = computeDiff(line, rightValue, lineCompareMethod);
                      right.value = computedDiff.right;
                      left.value = computedDiff.left;
                    }
                  }
                }
              }
            } else {
              rightLineNumber += 1;
              right.lineNumber = rightLineNumber;
              right.type = DiffType.ADDED;
              right.value = line;
            }
            if (countAsChange && !evaluateOnlyFirstLine) {
              if (!diffLines.includes(counter)) {
                diffLines.push(counter);
              }
            }
          } else {
            leftLineNumber += 1;
            rightLineNumber += 1;
            left.lineNumber = leftLineNumber;
            left.type = DiffType.DEFAULT;
            left.value = line;
            right.lineNumber = rightLineNumber;
            right.type = DiffType.DEFAULT;
            right.value = line;
          }
          if ((showLines === null || showLines === void 0 ? void 0 : showLines.includes(`L-${left.lineNumber}`)) || (showLines === null || showLines === void 0 ? void 0 : showLines.includes(`R-${right.lineNumber}`)) && !diffLines.includes(counter)) {
            diffLines.push(counter);
          }
          if (!evaluateOnlyFirstLine) {
            counter += 1;
          }
          return { right, left };
        }).filter(Boolean);
      };
      diffArray.forEach(({ added, removed, value }, index) => {
        lineInformation = [
          ...lineInformation,
          ...getLineInformation(value, index, added, removed)
        ];
      });
      return {
        lineInformation,
        diffLines
      };
    };
    exports.computeLineInformation = computeLineInformation;
  }
});

// node_modules/.pnpm/react-diff-viewer-continued@3.4.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-diff-viewer-continued/lib/src/compute-hidden-blocks.js
var require_compute_hidden_blocks = __commonJS({
  "node_modules/.pnpm/react-diff-viewer-continued@3.4.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-diff-viewer-continued/lib/src/compute-hidden-blocks.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeHiddenBlocks = void 0;
    function computeHiddenBlocks(lineInformation, diffLines, extraLines) {
      let newBlockIndex = 0;
      let currentBlock;
      let lineBlocks = {};
      let blocks = [];
      lineInformation.forEach((line, lineIndex) => {
        const isDiffLine = diffLines.some((diffLine) => diffLine >= lineIndex - extraLines && diffLine <= lineIndex + extraLines);
        if (!isDiffLine && currentBlock == void 0) {
          currentBlock = {
            index: newBlockIndex,
            startLine: lineIndex,
            endLine: lineIndex,
            lines: 1
          };
          blocks.push(currentBlock);
          lineBlocks[lineIndex] = currentBlock.index;
          newBlockIndex++;
        } else if (!isDiffLine) {
          currentBlock.endLine = lineIndex;
          currentBlock.lines++;
          lineBlocks[lineIndex] = currentBlock.index;
        } else {
          currentBlock = void 0;
        }
      });
      return {
        lineBlocks,
        blocks
      };
    }
    exports.computeHiddenBlocks = computeHiddenBlocks;
  }
});

// node_modules/.pnpm/memoize-one@6.0.0/node_modules/memoize-one/dist/memoize-one.esm.js
var memoize_one_esm_exports = {};
__export(memoize_one_esm_exports, {
  default: () => memoizeOne
});
function isEqual(first, second) {
  if (first === second) {
    return true;
  }
  if (safeIsNaN(first) && safeIsNaN(second)) {
    return true;
  }
  return false;
}
function areInputsEqual(newInputs, lastInputs) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  for (var i = 0; i < newInputs.length; i++) {
    if (!isEqual(newInputs[i], lastInputs[i])) {
      return false;
    }
  }
  return true;
}
function memoizeOne(resultFn, isEqual2) {
  if (isEqual2 === void 0) {
    isEqual2 = areInputsEqual;
  }
  var cache = null;
  function memoized() {
    var newArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      newArgs[_i] = arguments[_i];
    }
    if (cache && cache.lastThis === this && isEqual2(newArgs, cache.lastArgs)) {
      return cache.lastResult;
    }
    var lastResult = resultFn.apply(this, newArgs);
    cache = {
      lastResult,
      lastArgs: newArgs,
      lastThis: this
    };
    return lastResult;
  }
  memoized.clear = function clear() {
    cache = null;
  };
  return memoized;
}
var safeIsNaN;
var init_memoize_one_esm = __esm({
  "node_modules/.pnpm/memoize-one@6.0.0/node_modules/memoize-one/dist/memoize-one.esm.js"() {
    safeIsNaN = Number.isNaN || function ponyfill(value) {
      return typeof value === "number" && value !== value;
    };
  }
});

// node_modules/.pnpm/react-diff-viewer-continued@3.4.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-diff-viewer-continued/lib/src/index.js
var require_src = __commonJS({
  "node_modules/.pnpm/react-diff-viewer-continued@3.4.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-diff-viewer-continued/lib/src/index.js"(exports) {
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m2, k);
      if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m2[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m2, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m2[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffMethod = exports.LineNumberPrefix = void 0;
    var jsx_runtime_1 = require_jsx_runtime();
    var React = __importStar(require_react());
    var classnames_1 = __importDefault(require_classnames());
    var compute_lines_1 = require_compute_lines();
    Object.defineProperty(exports, "DiffMethod", { enumerable: true, get: function() {
      return compute_lines_1.DiffMethod;
    } });
    var styles_1 = __importDefault(require_styles());
    var compute_hidden_blocks_1 = require_compute_hidden_blocks();
    var m = (init_memoize_one_esm(), __toCommonJS(memoize_one_esm_exports));
    var memoize = m.default || m;
    var LineNumberPrefix;
    (function(LineNumberPrefix2) {
      LineNumberPrefix2["LEFT"] = "L";
      LineNumberPrefix2["RIGHT"] = "R";
    })(LineNumberPrefix || (exports.LineNumberPrefix = LineNumberPrefix = {}));
    var DiffViewer = class extends React.Component {
      constructor(props) {
        super(props);
        this.resetCodeBlocks = () => {
          if (this.state.expandedBlocks.length > 0) {
            this.setState({
              expandedBlocks: []
            });
            return true;
          }
          return false;
        };
        this.onBlockExpand = (id) => {
          const prevState = this.state.expandedBlocks.slice();
          prevState.push(id);
          this.setState({
            expandedBlocks: prevState
          });
        };
        this.computeStyles = memoize(styles_1.default);
        this.onLineNumberClickProxy = (id) => {
          if (this.props.onLineNumberClick) {
            return (e) => this.props.onLineNumberClick(id, e);
          }
          return () => {
          };
        };
        this.renderWordDiff = (diffArray, renderer) => {
          return diffArray.map((wordDiff, i) => {
            return (0, jsx_runtime_1.jsx)("span", { className: (0, classnames_1.default)(this.styles.wordDiff, {
              [this.styles.wordAdded]: wordDiff.type === compute_lines_1.DiffType.ADDED,
              [this.styles.wordRemoved]: wordDiff.type === compute_lines_1.DiffType.REMOVED
            }), children: renderer ? renderer(wordDiff.value) : wordDiff.value }, i);
          });
        };
        this.renderLine = (lineNumber, type, prefix, value, additionalLineNumber, additionalPrefix) => {
          const lineNumberTemplate = `${prefix}-${lineNumber}`;
          const additionalLineNumberTemplate = `${additionalPrefix}-${additionalLineNumber}`;
          const highlightLine = this.props.highlightLines.includes(lineNumberTemplate) || this.props.highlightLines.includes(additionalLineNumberTemplate);
          const added = type === compute_lines_1.DiffType.ADDED;
          const removed = type === compute_lines_1.DiffType.REMOVED;
          const changed = type === compute_lines_1.DiffType.CHANGED;
          let content;
          if (Array.isArray(value)) {
            content = this.renderWordDiff(value, this.props.renderContent);
          } else if (this.props.renderContent) {
            content = this.props.renderContent(value);
          } else {
            content = value;
          }
          return (0, jsx_runtime_1.jsxs)(React.Fragment, { children: [!this.props.hideLineNumbers && (0, jsx_runtime_1.jsx)("td", { onClick: lineNumber && this.onLineNumberClickProxy(lineNumberTemplate), className: (0, classnames_1.default)(this.styles.gutter, {
            [this.styles.emptyGutter]: !lineNumber,
            [this.styles.diffAdded]: added,
            [this.styles.diffRemoved]: removed,
            [this.styles.diffChanged]: changed,
            [this.styles.highlightedGutter]: highlightLine
          }), children: (0, jsx_runtime_1.jsx)("pre", { className: this.styles.lineNumber, children: lineNumber }) }), !this.props.splitView && !this.props.hideLineNumbers && (0, jsx_runtime_1.jsx)("td", { onClick: additionalLineNumber && this.onLineNumberClickProxy(additionalLineNumberTemplate), className: (0, classnames_1.default)(this.styles.gutter, {
            [this.styles.emptyGutter]: !additionalLineNumber,
            [this.styles.diffAdded]: added,
            [this.styles.diffRemoved]: removed,
            [this.styles.diffChanged]: changed,
            [this.styles.highlightedGutter]: highlightLine
          }), children: (0, jsx_runtime_1.jsx)("pre", { className: this.styles.lineNumber, children: additionalLineNumber }) }), this.props.renderGutter ? this.props.renderGutter({
            lineNumber,
            type,
            prefix,
            value,
            additionalLineNumber,
            additionalPrefix,
            styles: this.styles
          }) : null, !this.props.hideMarkers && (0, jsx_runtime_1.jsx)("td", { className: (0, classnames_1.default)(this.styles.marker, {
            [this.styles.emptyLine]: !content,
            [this.styles.diffAdded]: added,
            [this.styles.diffRemoved]: removed,
            [this.styles.diffChanged]: changed,
            [this.styles.highlightedLine]: highlightLine
          }), children: (0, jsx_runtime_1.jsxs)("pre", { children: [added && "+", removed && "-"] }) }), (0, jsx_runtime_1.jsx)("td", { className: (0, classnames_1.default)(this.styles.content, {
            [this.styles.emptyLine]: !content,
            [this.styles.diffAdded]: added,
            [this.styles.diffRemoved]: removed,
            [this.styles.diffChanged]: changed,
            [this.styles.highlightedLine]: highlightLine
          }), children: (0, jsx_runtime_1.jsx)("pre", { className: this.styles.contentText, children: content }) })] });
        };
        this.renderSplitView = ({ left, right }, index) => {
          return (0, jsx_runtime_1.jsxs)("tr", { className: this.styles.line, children: [this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value), this.renderLine(right.lineNumber, right.type, LineNumberPrefix.RIGHT, right.value)] }, index);
        };
        this.renderInlineView = ({ left, right }, index) => {
          let content;
          if (left.type === compute_lines_1.DiffType.REMOVED && right.type === compute_lines_1.DiffType.ADDED) {
            return (0, jsx_runtime_1.jsxs)(React.Fragment, { children: [(0, jsx_runtime_1.jsx)("tr", { className: this.styles.line, children: this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value, null) }), (0, jsx_runtime_1.jsx)("tr", { className: this.styles.line, children: this.renderLine(null, right.type, LineNumberPrefix.RIGHT, right.value, right.lineNumber) })] }, index);
          }
          if (left.type === compute_lines_1.DiffType.REMOVED) {
            content = this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value, null);
          }
          if (left.type === compute_lines_1.DiffType.DEFAULT) {
            content = this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value, right.lineNumber, LineNumberPrefix.RIGHT);
          }
          if (right.type === compute_lines_1.DiffType.ADDED) {
            content = this.renderLine(null, right.type, LineNumberPrefix.RIGHT, right.value, right.lineNumber);
          }
          return (0, jsx_runtime_1.jsx)("tr", { className: this.styles.line, children: content }, index);
        };
        this.onBlockClickProxy = (id) => () => this.onBlockExpand(id);
        this.renderSkippedLineIndicator = (num, blockNumber, leftBlockLineNumber, rightBlockLineNumber) => {
          const { hideLineNumbers, splitView } = this.props;
          const message = this.props.codeFoldMessageRenderer ? this.props.codeFoldMessageRenderer(num, leftBlockLineNumber, rightBlockLineNumber) : (0, jsx_runtime_1.jsxs)("pre", { className: this.styles.codeFoldContent, children: ["Expand ", num, " lines ..."] });
          const content = (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("a", { onClick: this.onBlockClickProxy(blockNumber), tabIndex: 0, children: message }) });
          const isUnifiedViewWithoutLineNumbers = !splitView && !hideLineNumbers;
          return (0, jsx_runtime_1.jsxs)("tr", { className: this.styles.codeFold, children: [!hideLineNumbers && (0, jsx_runtime_1.jsx)("td", { className: this.styles.codeFoldGutter }), this.props.renderGutter ? (0, jsx_runtime_1.jsx)("td", { className: this.styles.codeFoldGutter }) : null, (0, jsx_runtime_1.jsx)("td", { className: (0, classnames_1.default)({
            [this.styles.codeFoldGutter]: isUnifiedViewWithoutLineNumbers
          }) }), isUnifiedViewWithoutLineNumbers ? (0, jsx_runtime_1.jsxs)(React.Fragment, { children: [(0, jsx_runtime_1.jsx)("td", {}), content] }) : (0, jsx_runtime_1.jsxs)(React.Fragment, { children: [content, this.props.renderGutter ? (0, jsx_runtime_1.jsx)("td", {}) : null, (0, jsx_runtime_1.jsx)("td", {})] }), (0, jsx_runtime_1.jsx)("td", {}), (0, jsx_runtime_1.jsx)("td", {})] }, `${leftBlockLineNumber}-${rightBlockLineNumber}`);
        };
        this.renderDiff = () => {
          const { oldValue, newValue, splitView, disableWordDiff, compareMethod, linesOffset } = this.props;
          const { lineInformation, diffLines } = (0, compute_lines_1.computeLineInformation)(oldValue, newValue, disableWordDiff, compareMethod, linesOffset, this.props.alwaysShowLines);
          const extraLines = this.props.extraLinesSurroundingDiff < 0 ? 0 : Math.round(this.props.extraLinesSurroundingDiff);
          const { lineBlocks, blocks } = (0, compute_hidden_blocks_1.computeHiddenBlocks)(lineInformation, diffLines, extraLines);
          return lineInformation.map((line, lineIndex) => {
            if (this.props.showDiffOnly) {
              const blockIndex = lineBlocks[lineIndex];
              if (blockIndex !== void 0) {
                const lastLineOfBlock = blocks[blockIndex].endLine === lineIndex;
                if (!this.state.expandedBlocks.includes(blockIndex) && lastLineOfBlock) {
                  return (0, jsx_runtime_1.jsx)(React.Fragment, { children: this.renderSkippedLineIndicator(blocks[blockIndex].lines, blockIndex, line.left.lineNumber, line.right.lineNumber) }, lineIndex);
                } else if (!this.state.expandedBlocks.includes(blockIndex)) {
                  return null;
                }
              }
            }
            const diffNodes = splitView ? this.renderSplitView(line, lineIndex) : this.renderInlineView(line, lineIndex);
            return diffNodes;
          });
        };
        this.render = () => {
          const { oldValue, newValue, useDarkTheme, leftTitle, rightTitle, splitView, hideLineNumbers, hideMarkers, nonce } = this.props;
          if (this.props.compareMethod !== compute_lines_1.DiffMethod.JSON) {
            if (typeof oldValue !== "string" || typeof newValue !== "string") {
              throw Error('"oldValue" and "newValue" should be strings');
            }
          }
          this.styles = this.computeStyles(this.props.styles, useDarkTheme, nonce);
          const nodes = this.renderDiff();
          let colSpanOnSplitView = hideLineNumbers ? 2 : 3;
          let colSpanOnInlineView = hideLineNumbers ? 2 : 4;
          if (hideMarkers) {
            colSpanOnSplitView -= 1;
            colSpanOnInlineView -= 1;
          }
          const columnExtension = this.props.renderGutter ? 1 : 0;
          const title = (leftTitle || rightTitle) && (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { colSpan: (splitView ? colSpanOnSplitView : colSpanOnInlineView) + columnExtension, className: this.styles.titleBlock, children: (0, jsx_runtime_1.jsx)("pre", { className: this.styles.contentText, children: leftTitle }) }), splitView && (0, jsx_runtime_1.jsx)("td", { colSpan: colSpanOnSplitView + columnExtension, className: this.styles.titleBlock, children: (0, jsx_runtime_1.jsx)("pre", { className: this.styles.contentText, children: rightTitle }) })] });
          return (0, jsx_runtime_1.jsx)("table", { className: (0, classnames_1.default)(this.styles.diffContainer, {
            [this.styles.splitView]: splitView
          }), children: (0, jsx_runtime_1.jsxs)("tbody", { children: [title, nodes] }) });
        };
        this.state = {
          expandedBlocks: []
        };
      }
    };
    DiffViewer.defaultProps = {
      oldValue: "",
      newValue: "",
      splitView: true,
      highlightLines: [],
      disableWordDiff: false,
      compareMethod: compute_lines_1.DiffMethod.CHARS,
      styles: {},
      hideLineNumbers: false,
      hideMarkers: false,
      extraLinesSurroundingDiff: 3,
      showDiffOnly: true,
      useDarkTheme: false,
      linesOffset: 0,
      nonce: ""
    };
    exports.default = DiffViewer;
  }
});
export default require_src();
/*! Bundled license information:

classnames/index.js:
  (*!
  	Copyright (c) 2018 Jed Watson.
  	Licensed under the MIT License (MIT), see
  	http://jedwatson.github.io/classnames
  *)
*/
//# sourceMappingURL=react-diff-viewer-continued.js.map
