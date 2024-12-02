import {
  require_react_dom
} from "./chunk-NDWYSDRJ.js";
import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __commonJS,
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/textarea-caret@3.0.2/node_modules/textarea-caret/index.js
var require_textarea_caret = __commonJS({
  "node_modules/.pnpm/textarea-caret@3.0.2/node_modules/textarea-caret/index.js"(exports, module) {
    (function() {
      var properties = [
        "direction",
        // RTL support
        "boxSizing",
        "width",
        // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
        "height",
        "overflowX",
        "overflowY",
        // copy the scrollbar for IE
        "borderTopWidth",
        "borderRightWidth",
        "borderBottomWidth",
        "borderLeftWidth",
        "borderStyle",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        // https://developer.mozilla.org/en-US/docs/Web/CSS/font
        "fontStyle",
        "fontVariant",
        "fontWeight",
        "fontStretch",
        "fontSize",
        "fontSizeAdjust",
        "lineHeight",
        "fontFamily",
        "textAlign",
        "textTransform",
        "textIndent",
        "textDecoration",
        // might not make a difference, but better be safe
        "letterSpacing",
        "wordSpacing",
        "tabSize",
        "MozTabSize"
      ];
      var isBrowser = typeof window !== "undefined";
      var isFirefox = isBrowser && window.mozInnerScreenX != null;
      function getCaretCoordinates2(element, position, options) {
        if (!isBrowser) {
          throw new Error("textarea-caret-position#getCaretCoordinates should only be called in a browser");
        }
        var debug = options && options.debug || false;
        if (debug) {
          var el = document.querySelector("#input-textarea-caret-position-mirror-div");
          if (el) {
            el.parentNode.removeChild(el);
          }
        }
        var div = document.createElement("div");
        div.id = "input-textarea-caret-position-mirror-div";
        document.body.appendChild(div);
        var style = div.style;
        var computed = window.getComputedStyle ? getComputedStyle(element) : element.currentStyle;
        style.whiteSpace = "pre-wrap";
        if (element.nodeName !== "INPUT")
          style.wordWrap = "break-word";
        style.position = "absolute";
        if (!debug)
          style.visibility = "hidden";
        properties.forEach(function(prop) {
          style[prop] = computed[prop];
        });
        if (isFirefox) {
          if (element.scrollHeight > parseInt(computed.height))
            style.overflowY = "scroll";
        } else {
          style.overflow = "hidden";
        }
        div.textContent = element.value.substring(0, position);
        if (element.nodeName === "INPUT")
          div.textContent = div.textContent.replace(/\s/g, " ");
        var span = document.createElement("span");
        span.textContent = element.value.substring(position) || ".";
        div.appendChild(span);
        var coordinates = {
          top: span.offsetTop + parseInt(computed["borderTopWidth"]),
          left: span.offsetLeft + parseInt(computed["borderLeftWidth"])
        };
        if (debug) {
          span.style.backgroundColor = "#aaa";
        } else {
          document.body.removeChild(div);
        }
        return coordinates;
      }
      if (typeof module != "undefined" && typeof module.exports != "undefined") {
        module.exports = getCaretCoordinates2;
      } else if (isBrowser) {
        window.getCaretCoordinates = getCaretCoordinates2;
      }
    })();
  }
});

// node_modules/.pnpm/custom-event@1.0.1/node_modules/custom-event/index.js
var require_custom_event = __commonJS({
  "node_modules/.pnpm/custom-event@1.0.1/node_modules/custom-event/index.js"(exports, module) {
    var NativeCustomEvent = global.CustomEvent;
    function useNative() {
      try {
        var p = new NativeCustomEvent("cat", { detail: { foo: "bar" } });
        return "cat" === p.type && "bar" === p.detail.foo;
      } catch (e) {
      }
      return false;
    }
    module.exports = useNative() ? NativeCustomEvent : (
      // IE >= 9
      "undefined" !== typeof document && "function" === typeof document.createEvent ? function CustomEvent2(type, params) {
        var e = document.createEvent("CustomEvent");
        if (params) {
          e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
        } else {
          e.initCustomEvent(type, false, false, void 0);
        }
        return e;
      } : (
        // IE <= 8
        function CustomEvent2(type, params) {
          var e = document.createEventObject();
          e.type = type;
          if (params) {
            e.bubbles = Boolean(params.bubbles);
            e.cancelable = Boolean(params.cancelable);
            e.detail = params.detail;
          } else {
            e.bubbles = false;
            e.cancelable = false;
            e.detail = void 0;
          }
          return e;
        }
      )
    );
  }
});

// node_modules/.pnpm/@webscopeio+react-textarea-autocomplete@4.9.2_prop-types@15.8.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@webscopeio/react-textarea-autocomplete/dist/react-textarea-autocomplete.es.js
var import_react_dom = __toESM(require_react_dom());
var import_textarea_caret = __toESM(require_textarea_caret());
var import_custom_event = __toESM(require_custom_event());
var import_react = __toESM(require_react());
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);
    if (typeof Object.getOwnPropertySymbols === "function") {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }
    ownKeys.forEach(function(key) {
      _defineProperty(target, key, source[key]);
    });
  }
  return target;
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _typeof2(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof2 = function _typeof22(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof2 = function _typeof22(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof2(obj);
}
function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof3(obj2) {
      return _typeof2(obj2);
    };
  } else {
    _typeof = function _typeof3(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : _typeof2(obj2);
    };
  }
  return _typeof(obj);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  }
}
function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}
var KEY_CODES = {
  ESC: 27,
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  ENTER: 13,
  TAB: 9
};
var Listener = function Listener2() {
  var _this = this;
  _classCallCheck(this, Listener2);
  this.startListen = function(ref) {
    if (!ref) return;
    ref.addEventListener("keydown", _this.f);
  };
  this.stopListen = function(ref) {
    if (!ref) return;
    ref.removeEventListener("keydown", _this.f);
  };
  this.add = function(keyCodes, fn) {
    var keyCode = keyCodes;
    if (typeof keyCode !== "object") keyCode = [keyCode];
    _this.listeners[_this.index] = {
      keyCode,
      fn
    };
    return _this.index++;
  };
  this.remove = function(id) {
    delete _this.listeners[id];
  };
  this.removeAll = function() {
    _this.listeners = {};
    _this.index = 1;
  };
  this.index = 1;
  this.listeners = {};
  this.f = function(e) {
    if (!e) return;
    var code = e.keyCode || e.which;
    Object.values(_this.listeners).forEach(function(_ref) {
      var keyCode = _ref.keyCode, fn = _ref.fn;
      if (keyCode.includes(code)) {
        e.stopPropagation();
        e.preventDefault();
        fn(e);
      }
    });
  };
};
var Listeners = new Listener();
var Item = function(_React$Component) {
  _inherits(Item2, _React$Component);
  function Item2() {
    var _getPrototypeOf2;
    var _this;
    _classCallCheck(this, Item2);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(Item2)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.selectItem = function() {
      var _this$props = _this.props, item = _this$props.item, onSelectHandler = _this$props.onSelectHandler;
      onSelectHandler(item);
    };
    return _this;
  }
  _createClass(Item2, [{
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps) {
      if (this.props.item !== nextProps.item || this.props.selected !== nextProps.selected || this.props.style !== nextProps.style || this.props.className !== nextProps.className) {
        return true;
      }
      return false;
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;
      var _this$props2 = this.props, Component = _this$props2.component, style = _this$props2.style, onClickHandler = _this$props2.onClickHandler, item = _this$props2.item, selected = _this$props2.selected, className = _this$props2.className, innerRef = _this$props2.innerRef;
      return import_react.default.createElement("li", {
        className: "rta__item  ".concat(selected === true ? "rta__item--selected" : "", " ").concat(className || ""),
        style
      }, import_react.default.createElement("div", {
        className: "rta__entity ".concat(selected === true ? "rta__entity--selected" : ""),
        role: "button",
        tabIndex: 0,
        onClick: onClickHandler,
        onFocus: this.selectItem,
        onMouseEnter: this.selectItem,
        onTouchStart: function onTouchStart() {
          _this2.clicked = true;
          _this2.selectItem();
        },
        onTouchEnd: function onTouchEnd(e) {
          e.preventDefault();
          if (_this2.clicked) {
            onClickHandler(e);
          }
        },
        onTouchMove: function onTouchMove() {
          _this2.clicked = false;
        },
        onTouchCancel: function onTouchCancel() {
          _this2.clicked = false;
        },
        ref: innerRef
      }, import_react.default.createElement(Component, {
        selected,
        entity: item
      })));
    }
  }]);
  return Item2;
}(import_react.default.Component);
var List = function(_React$Component) {
  _inherits(List2, _React$Component);
  function List2() {
    var _getPrototypeOf2;
    var _this;
    _classCallCheck(this, List2);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(List2)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.state = {
      selectedItem: null
    };
    _this.cachedIdOfItems = /* @__PURE__ */ new Map();
    _this.onPressEnter = function(e) {
      if (typeof e !== "undefined") {
        e.preventDefault();
      }
      var values = _this.props.values;
      _this.modifyText(values[_this.getPositionInList()]);
    };
    _this.getPositionInList = function() {
      var values = _this.props.values;
      var selectedItem = _this.state.selectedItem;
      if (!selectedItem) return 0;
      return values.findIndex(function(a) {
        return _this.getId(a) === _this.getId(selectedItem);
      });
    };
    _this.getId = function(item) {
      if (_this.cachedIdOfItems.has(item)) {
        return _this.cachedIdOfItems.get(item);
      }
      var textToReplace = _this.props.getTextToReplace(item);
      var computeId = function computeId2() {
        if (textToReplace) {
          if (textToReplace.key) {
            return textToReplace.key;
          }
          if (typeof item === "string" || !item.key) {
            return textToReplace.text;
          }
        }
        if (!item.key) {
          throw new Error("Item ".concat(JSON.stringify(item), ' has to have defined "key" property'));
        }
        return item.key;
      };
      var id = computeId();
      _this.cachedIdOfItems.set(item, id);
      return id;
    };
    _this.listeners = [];
    _this.itemsRef = {};
    _this.modifyText = function(value) {
      if (!value) return;
      var onSelect = _this.props.onSelect;
      onSelect(value);
    };
    _this.selectItem = function(item) {
      var keyboard = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      var onItemHighlighted = _this.props.onItemHighlighted;
      if (_this.state.selectedItem === item) return;
      _this.setState({
        selectedItem: item
      }, function() {
        onItemHighlighted(item);
        if (keyboard) {
          _this.props.dropdownScroll(_this.itemsRef[_this.getId(item)]);
        }
      });
    };
    _this.scroll = function(e) {
      e.preventDefault();
      var values = _this.props.values;
      var code = e.keyCode || e.which;
      var oldPosition = _this.getPositionInList();
      var newPosition;
      switch (code) {
        case KEY_CODES.DOWN:
          newPosition = oldPosition + 1;
          break;
        case KEY_CODES.UP:
          newPosition = oldPosition - 1;
          break;
        default:
          newPosition = oldPosition;
          break;
      }
      newPosition = (newPosition % values.length + values.length) % values.length;
      _this.selectItem(values[newPosition], [KEY_CODES.DOWN, KEY_CODES.UP].includes(code));
    };
    _this.isSelected = function(item) {
      var selectedItem = _this.state.selectedItem;
      if (!selectedItem) return false;
      return _this.getId(selectedItem) === _this.getId(item);
    };
    return _this;
  }
  _createClass(List2, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.listeners.push(Listeners.add([KEY_CODES.DOWN, KEY_CODES.UP], this.scroll), Listeners.add([KEY_CODES.ENTER, KEY_CODES.TAB], this.onPressEnter));
      var values = this.props.values;
      if (values && values[0]) this.selectItem(values[0]);
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(_ref) {
      var _this2 = this;
      var oldValues = _ref.values;
      var values = this.props.values;
      var oldValuesSerialized = oldValues.map(function(val) {
        return _this2.getId(val);
      }).join("");
      var newValuesSerialized = values.map(function(val) {
        return _this2.getId(val);
      }).join("");
      if (oldValuesSerialized !== newValuesSerialized && values && values[0]) {
        this.selectItem(values[0]);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      var listener;
      while (this.listeners.length) {
        listener = this.listeners.pop();
        Listeners.remove(listener);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;
      var _this$props = this.props, values = _this$props.values, component = _this$props.component, style = _this$props.style, itemClassName = _this$props.itemClassName, className = _this$props.className, itemStyle = _this$props.itemStyle;
      return import_react.default.createElement("ul", {
        className: "rta__list ".concat(className || ""),
        style
      }, values.map(function(item) {
        return import_react.default.createElement(Item, {
          key: _this3.getId(item),
          innerRef: function innerRef(ref) {
            _this3.itemsRef[_this3.getId(item)] = ref;
          },
          selected: _this3.isSelected(item),
          item,
          className: itemClassName,
          style: itemStyle,
          onClickHandler: _this3.onPressEnter,
          onSelectHandler: _this3.selectItem,
          component
        });
      }));
    }
  }]);
  return List2;
}(import_react.default.Component);
function defaultScrollToItem(container, item) {
  var itemHeight = parseInt(getComputedStyle(item).getPropertyValue("height"), 10);
  var containerHight = parseInt(getComputedStyle(container).getPropertyValue("height"), 10) - itemHeight;
  var itemOffsetTop = item.offsetTop;
  var actualScrollTop = container.scrollTop;
  if (itemOffsetTop < actualScrollTop + containerHight && actualScrollTop < itemOffsetTop) {
    return;
  }
  container.scrollTop = itemOffsetTop;
}
var DEFAULT_CARET_POSITION = "next";
var POSITION_CONFIGURATION = {
  X: {
    LEFT: "rta__autocomplete--left",
    RIGHT: "rta__autocomplete--right"
  },
  Y: {
    TOP: "rta__autocomplete--top",
    BOTTOM: "rta__autocomplete--bottom"
  }
};
var errorMessage = function errorMessage2(message) {
  return console.error("RTA: dataProvider fails: ".concat(message, "\n    \nCheck the documentation or create issue if you think it's bug. https://github.com/webscopeio/react-textarea-autocomplete/issues"));
};
var reservedRegexChars = [".", "^", "$", "*", "+", "-", "?", "(", ")", "[", "]", "{", "}", "\\", "|"];
var escapeRegex = function escapeRegex2(text) {
  return _toConsumableArray(text).map(function(character) {
    return reservedRegexChars.includes(character) ? "\\".concat(character) : character;
  }).join("");
};
var Autocomplete = function(_React$Component) {
  _inherits(Autocomplete2, _React$Component);
  function Autocomplete2() {
    _classCallCheck(this, Autocomplete2);
    return _possibleConstructorReturn(this, _getPrototypeOf(Autocomplete2).apply(this, arguments));
  }
  _createClass(Autocomplete2, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var boundariesElement = this.props.boundariesElement;
      if (typeof boundariesElement === "string") {
        var elem = document.querySelector(boundariesElement);
        if (!elem) {
          throw new Error("RTA: Invalid prop boundariesElement: it has to be string or HTMLElement.");
        }
        this.containerElem = elem;
      } else if (boundariesElement instanceof HTMLElement) {
        this.containerElem = boundariesElement;
      } else {
        throw new Error("RTA: Invalid prop boundariesElement: it has to be string or HTMLElement.");
      }
      if (!this.containerElem || !this.containerElem.contains(this.ref)) {
        if (true) {
          throw new Error("RTA: Invalid prop boundariesElement: it has to be one of the parents of the RTA.");
        }
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      var _this$ref$classList, _this$ref$classList2;
      var top = this.props.top || 0;
      var left = this.props.left || 0;
      var usedClasses = [];
      var unusedClasses = [];
      var topPosition = 0;
      var leftPosition = 0;
      var containerBounds = this.containerElem.getBoundingClientRect();
      var dropdownBounds = this.ref.getBoundingClientRect();
      var textareaBounds = this.props.textareaRef.getBoundingClientRect();
      var computedStyle = window.getComputedStyle(this.ref);
      var marginTop = parseInt(computedStyle.getPropertyValue("margin-top"), 10);
      var marginBottom = parseInt(computedStyle.getPropertyValue("margin-bottom"), 10);
      var marginLeft = parseInt(computedStyle.getPropertyValue("margin-left"), 10);
      var marginRight = parseInt(computedStyle.getPropertyValue("margin-right"), 10);
      var dropdownBottom = marginTop + marginBottom + textareaBounds.top + top + dropdownBounds.height;
      var dropdownRight = marginLeft + marginRight + textareaBounds.left + left + dropdownBounds.width;
      if (dropdownRight > containerBounds.right && textareaBounds.left + left > dropdownBounds.width) {
        leftPosition = left - dropdownBounds.width;
        usedClasses.push(POSITION_CONFIGURATION.X.LEFT);
        unusedClasses.push(POSITION_CONFIGURATION.X.RIGHT);
      } else {
        leftPosition = left;
        usedClasses.push(POSITION_CONFIGURATION.X.RIGHT);
        unusedClasses.push(POSITION_CONFIGURATION.X.LEFT);
      }
      if (dropdownBottom > containerBounds.bottom && textareaBounds.top + top > dropdownBounds.height) {
        topPosition = top - dropdownBounds.height;
        usedClasses.push(POSITION_CONFIGURATION.Y.TOP);
        unusedClasses.push(POSITION_CONFIGURATION.Y.BOTTOM);
      } else {
        topPosition = top;
        usedClasses.push(POSITION_CONFIGURATION.Y.BOTTOM);
        unusedClasses.push(POSITION_CONFIGURATION.Y.TOP);
      }
      if (this.props.renderToBody) {
        topPosition += textareaBounds.top;
        leftPosition += textareaBounds.left;
      }
      this.ref.style.top = "".concat(topPosition, "px");
      this.ref.style.left = "".concat(leftPosition, "px");
      (_this$ref$classList = this.ref.classList).remove.apply(_this$ref$classList, unusedClasses);
      (_this$ref$classList2 = this.ref.classList).add.apply(_this$ref$classList2, usedClasses);
    }
  }, {
    key: "render",
    value: function render() {
      var _this = this;
      var _this$props = this.props, style = _this$props.style, className = _this$props.className, innerRef = _this$props.innerRef, children = _this$props.children, renderToBody = _this$props.renderToBody;
      var body = document.body;
      var autocompleteContainer = import_react.default.createElement("div", {
        ref: function ref(_ref) {
          _this.ref = _ref;
          innerRef(_ref);
        },
        className: "rta__autocomplete ".concat(className || ""),
        style
      }, children);
      return renderToBody && body !== null ? import_react_dom.default.createPortal(autocompleteContainer, body) : autocompleteContainer;
    }
  }]);
  return Autocomplete2;
}(import_react.default.Component);
var ReactTextareaAutocomplete = function(_React$Component2) {
  _inherits(ReactTextareaAutocomplete2, _React$Component2);
  function ReactTextareaAutocomplete2(_props) {
    var _this2;
    _classCallCheck(this, ReactTextareaAutocomplete2);
    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(ReactTextareaAutocomplete2).call(this, _props));
    _this2.state = {
      top: null,
      left: null,
      currentTrigger: null,
      actualToken: "",
      data: null,
      value: "",
      dataLoading: false,
      selectionEnd: 0,
      component: null,
      textToReplace: null
    };
    _this2.escListenerInit = function() {
      if (!_this2.escListener) {
        _this2.escListener = Listeners.add(KEY_CODES.ESC, _this2._closeAutocomplete);
      }
    };
    _this2.escListenerDestroy = function() {
      if (_this2.escListener) {
        Listeners.remove(_this2.escListener);
        _this2.escListener = null;
      }
    };
    _this2.getSelectionPosition = function() {
      if (!_this2.textareaRef) return null;
      return {
        selectionStart: _this2.textareaRef.selectionStart,
        selectionEnd: _this2.textareaRef.selectionEnd
      };
    };
    _this2.getSelectedText = function() {
      if (!_this2.textareaRef) return null;
      var _this2$textareaRef = _this2.textareaRef, selectionStart = _this2$textareaRef.selectionStart, selectionEnd = _this2$textareaRef.selectionEnd;
      if (selectionStart === selectionEnd) return null;
      return _this2.state.value.substr(selectionStart, selectionEnd - selectionStart);
    };
    _this2.setCaretPosition = function() {
      var position = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
      if (!_this2.textareaRef) return;
      _this2.textareaRef.focus();
      _this2.textareaRef.setSelectionRange(position, position);
    };
    _this2.getCaretPosition = function() {
      if (!_this2.textareaRef) {
        return 0;
      }
      var position = _this2.textareaRef.selectionEnd;
      return position;
    };
    _this2._handleCaretChange = function(e) {
      var cleanLastTrigger = function cleanLastTrigger2() {
        var beforeHandle = _this2.getCaretPosition() - 1;
        _this2.lastTrigger = _this2.lastTrigger ? beforeHandle : 0;
      };
      if (e.type === "keydown") {
        var code = e.keyCode || e.which;
        switch (code) {
          case KEY_CODES.UP:
          case KEY_CODES.DOWN:
            if (!_this2._isAutocompleteOpen()) {
              cleanLastTrigger();
            }
            break;
          case KEY_CODES.LEFT:
          case KEY_CODES.RIGHT:
            cleanLastTrigger();
            break;
          default:
        }
        return;
      }
      cleanLastTrigger();
    };
    _this2._onSelect = function(item) {
      var _this2$state = _this2.state, selectionEnd = _this2$state.selectionEnd, currentTrigger = _this2$state.currentTrigger, textareaValue = _this2$state.value;
      var onItemSelected = _this2.props.onItemSelected;
      if (!currentTrigger) return;
      var getTextToReplaceForCurrentTrigger = _this2._getTextToReplace(currentTrigger);
      if (!getTextToReplaceForCurrentTrigger) {
        _this2._closeAutocomplete();
        return;
      }
      var newToken = getTextToReplaceForCurrentTrigger(item);
      if (!newToken) {
        _this2._closeAutocomplete();
        return;
      }
      if (onItemSelected) {
        onItemSelected({
          currentTrigger,
          item
        });
      }
      var computeCaretPosition = function computeCaretPosition2(position, token, startToken) {
        switch (position) {
          case "start":
            return startToken;
          case "next":
          case "end":
            return startToken + token.length;
          default:
            if (!Number.isInteger(position)) {
              throw new Error('RTA: caretPosition should be "start", "next", "end" or number.');
            }
            return position;
        }
      };
      var textToModify = textareaValue.slice(0, selectionEnd);
      var escapedCurrentTrigger = escapeRegex(currentTrigger);
      var triggerOffset = textToModify.length - textToModify.lastIndexOf(currentTrigger);
      var startOfTokenPosition = textToModify.search(new RegExp("(?!".concat(escapedCurrentTrigger, ")$"))) - triggerOffset;
      var newTokenString = newToken.caretPosition === "next" ? "".concat(newToken.text, " ") : newToken.text;
      var newCaretPosition = computeCaretPosition(newToken.caretPosition, newTokenString, startOfTokenPosition);
      var modifiedText = textToModify.substring(0, startOfTokenPosition) + newTokenString;
      var newValue = textareaValue.replace(textToModify, modifiedText);
      _this2.setState({
        value: newValue,
        dataLoading: false
      }, function() {
        var insertedTrigger = _this2.tokenRegExpEnding.exec(newTokenString);
        var insertedTriggerModifier = insertedTrigger ? insertedTrigger[0].length : 1;
        _this2.lastTrigger = newCaretPosition ? newCaretPosition - insertedTriggerModifier : newCaretPosition;
        _this2.textareaRef.value = newValue;
        _this2.textareaRef.selectionEnd = newCaretPosition;
        _this2._changeHandler();
        var scrollTop = _this2.textareaRef.scrollTop;
        _this2.setCaretPosition(newCaretPosition);
        if (window.chrome) {
          _this2.textareaRef.scrollTop = scrollTop;
        }
      });
    };
    _this2._getTextToReplace = function(currentTrigger) {
      var triggerSettings = _this2.props.trigger[currentTrigger];
      if (!currentTrigger || !triggerSettings) return null;
      var output = triggerSettings.output;
      return function(item) {
        if (typeof item === "object" && (!output || typeof output !== "function")) {
          throw new Error('Output functor is not defined! If you are using items as object you have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type');
        }
        if (output) {
          var textToReplace = output(item, currentTrigger);
          if (textToReplace === void 0 || typeof textToReplace === "number") {
            throw new Error('Output functor should return string or object in shape {text: string, caretPosition: string | number}.\nGot "'.concat(String(textToReplace), '". Check the implementation for trigger "').concat(currentTrigger, '"\n\nSee https://github.com/webscopeio/react-textarea-autocomplete#trigger-type for more information.\n'));
          }
          if (textToReplace === null) return null;
          if (typeof textToReplace === "string") {
            return {
              text: textToReplace,
              caretPosition: DEFAULT_CARET_POSITION
            };
          }
          if (!textToReplace.text && typeof textToReplace.text !== "string") {
            throw new Error('Output "text" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger "'.concat(currentTrigger, '"\n'));
          }
          if (!textToReplace.caretPosition) {
            throw new Error('Output "caretPosition" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger "'.concat(currentTrigger, '"\n'));
          }
          return textToReplace;
        }
        if (typeof item !== "string") {
          throw new Error("Output item should be string\n");
        }
        return {
          text: "".concat(currentTrigger).concat(item).concat(currentTrigger),
          caretPosition: DEFAULT_CARET_POSITION
        };
      };
    };
    _this2._getCurrentTriggerSettings = function() {
      var currentTrigger = _this2.state.currentTrigger;
      if (!currentTrigger) return null;
      return _this2.props.trigger[currentTrigger];
    };
    _this2._getValuesFromProvider = function() {
      var _this2$state2 = _this2.state, currentTrigger = _this2$state2.currentTrigger, actualToken = _this2$state2.actualToken;
      var triggerSettings = _this2._getCurrentTriggerSettings();
      if (!currentTrigger || !triggerSettings) {
        return;
      }
      var dataProvider = triggerSettings.dataProvider, component = triggerSettings.component;
      if (typeof dataProvider !== "function") {
        throw new Error("Trigger provider has to be a function!");
      }
      _this2.setState({
        dataLoading: true
      });
      var providedData = dataProvider(actualToken);
      if (!(providedData instanceof Promise)) {
        providedData = Promise.resolve(providedData);
      }
      providedData.then(function(data) {
        if (!Array.isArray(data)) {
          throw new Error("Trigger provider has to provide an array!");
        }
        if (typeof component !== "function") {
          throw new Error("Component should be defined!");
        }
        if (currentTrigger !== _this2.state.currentTrigger) return;
        if (!data.length) {
          _this2._closeAutocomplete();
          return;
        }
        _this2.setState({
          dataLoading: false,
          data,
          component
        });
      }).catch(function(e) {
        return errorMessage(e.message);
      });
    };
    _this2._getSuggestions = function() {
      var _this2$state3 = _this2.state, currentTrigger = _this2$state3.currentTrigger, data = _this2$state3.data;
      if (!currentTrigger || !data || data && !data.length) return null;
      return data;
    };
    _this2._createRegExp = function() {
      var trigger = _this2.props.trigger;
      _this2.tokenRegExp = new RegExp("(".concat(Object.keys(trigger).sort(function(a, b) {
        if (a < b) {
          return 1;
        }
        if (a > b) {
          return -1;
        }
        return 0;
      }).map(function(a) {
        return escapeRegex(a);
      }).join("|"), ")((?:(?!\\1)[^\\s])*$)"));
      _this2.tokenRegExpEnding = new RegExp("(".concat(Object.keys(trigger).sort(function(a, b) {
        if (a < b) {
          return 1;
        }
        if (a > b) {
          return -1;
        }
        return 0;
      }).map(function(a) {
        return escapeRegex(a);
      }).join("|"), ")$"));
    };
    _this2._closeAutocomplete = function() {
      var currentTrigger = _this2.state.currentTrigger;
      _this2.escListenerDestroy();
      _this2.setState({
        data: null,
        dataLoading: false,
        currentTrigger: null
      }, function() {
        if (currentTrigger) _this2._onItemHighlightedHandler(null);
      });
    };
    _this2._cleanUpProps = function() {
      var props = _objectSpread({}, _this2.props);
      var notSafe = ["loadingComponent", "boundariesElement", "containerStyle", "minChar", "scrollToItem", "ref", "innerRef", "onChange", "onCaretPositionChange", "className", "value", "trigger", "listStyle", "itemStyle", "containerStyle", "loaderStyle", "className", "containerClassName", "listClassName", "itemClassName", "loaderClassName", "dropdownStyle", "dropdownClassName", "movePopupAsYouType", "textAreaComponent", "renderToBody", "onItemSelected", "onItemHighlighted"];
      for (var prop in props) {
        if (notSafe.includes(prop)) delete props[prop];
      }
      return props;
    };
    _this2._changeHandler = function(e) {
      var _this2$props = _this2.props, trigger = _this2$props.trigger, onChange = _this2$props.onChange, minChar = _this2$props.minChar, onCaretPositionChange = _this2$props.onCaretPositionChange, movePopupAsYouType = _this2$props.movePopupAsYouType;
      var _this2$state4 = _this2.state, top = _this2$state4.top, left = _this2$state4.left;
      var event = e;
      if (!event) {
        event = new import_custom_event.default("change", {
          bubbles: true
        });
        _this2.textareaRef.dispatchEvent(event);
      }
      var textarea = event.target || _this2.textareaRef;
      var selectionEnd = textarea.selectionEnd;
      var value = textarea.value;
      _this2.lastValueBubbledEvent = value;
      if (onChange && event) {
        event.persist && event.persist();
        onChange(new Proxy(event, {
          get: function get(original, prop, receiver) {
            if (prop === "target") {
              return textarea;
            }
            return Reflect.get(original, prop, receiver);
          }
        }));
      }
      if (onCaretPositionChange) {
        var caretPosition = _this2.getCaretPosition();
        onCaretPositionChange(caretPosition);
      }
      _this2.setState({
        value
      });
      var setTopLeft = function setTopLeft2() {
        var _getCaretCoordinates = (0, import_textarea_caret.default)(textarea, selectionEnd), newTop = _getCaretCoordinates.top, newLeft = _getCaretCoordinates.left;
        _this2.setState({
          // make position relative to textarea
          top: newTop - _this2.textareaRef.scrollTop || 0,
          left: newLeft
        });
      };
      var cleanLastTrigger = function cleanLastTrigger2(triggerLength) {
        _this2.lastTrigger = selectionEnd - triggerLength;
        _this2._closeAutocomplete();
        setTopLeft();
      };
      if (selectionEnd <= _this2.lastTrigger) {
        var _affectedTextareaValue = value.slice(0, selectionEnd);
        var _newTrigger = _this2.tokenRegExp.exec(_affectedTextareaValue);
        cleanLastTrigger(_newTrigger ? _newTrigger[0].length : 0);
      }
      var affectedTextareaValue = value.slice(_this2.lastTrigger, selectionEnd);
      var tokenMatch = _this2.tokenRegExp.exec(affectedTextareaValue);
      var lastToken = tokenMatch && tokenMatch[0];
      var currentTrigger = tokenMatch && tokenMatch[1] || null;
      var currentTriggerLength = currentTrigger ? currentTrigger.length - 1 : 0;
      var newTrigger = _this2.tokenRegExpEnding.exec(affectedTextareaValue);
      if (newTrigger) {
        cleanLastTrigger(newTrigger[0].length);
      } else if (!_this2._isAutocompleteOpen()) {
        _this2._closeAutocomplete();
      }
      if ((!lastToken || lastToken.length <= minChar + currentTriggerLength) && // check if our current trigger disallows whitespace
      (_this2.state.currentTrigger && !trigger[_this2.state.currentTrigger].allowWhitespace || !_this2.state.currentTrigger)) {
        _this2._closeAutocomplete();
        return;
      }
      if (currentTrigger && trigger[currentTrigger].afterWhitespace && !/\s/.test(value[selectionEnd - lastToken.length - 1]) && value[selectionEnd - lastToken.length - 1] !== void 0) {
        _this2._closeAutocomplete();
        return;
      }
      if (_this2.state.currentTrigger && trigger[_this2.state.currentTrigger].allowWhitespace) {
        tokenMatch = new RegExp("".concat(escapeRegex(_this2.state.currentTrigger), ".*$")).exec(value.slice(0, selectionEnd));
        lastToken = tokenMatch && tokenMatch[0];
        if (!lastToken) {
          _this2._closeAutocomplete();
          return;
        }
        currentTrigger = Object.keys(trigger).find(function(a) {
          return a.slice(0, currentTriggerLength + 1) === lastToken.slice(0, currentTriggerLength + 1);
        }) || null;
      }
      var actualToken = lastToken.slice(1);
      if (!currentTrigger) {
        return;
      }
      if (movePopupAsYouType || top === null && left === null || // if the trigger got changed, let's reposition the autocomplete
      _this2.state.currentTrigger !== currentTrigger) {
        setTopLeft();
      }
      _this2.escListenerInit();
      var textToReplace = _this2._getTextToReplace(currentTrigger);
      _this2.setState({
        selectionEnd,
        currentTrigger,
        textToReplace,
        actualToken
      }, function() {
        try {
          _this2._getValuesFromProvider();
        } catch (err) {
          errorMessage(err.message);
        }
      });
    };
    _this2._selectHandler = function(e) {
      var _this2$props2 = _this2.props, onCaretPositionChange = _this2$props2.onCaretPositionChange, onSelect = _this2$props2.onSelect;
      if (onCaretPositionChange) {
        var caretPosition = _this2.getCaretPosition();
        onCaretPositionChange(caretPosition);
      }
      if (onSelect) {
        e.persist();
        onSelect(e);
      }
    };
    _this2._shouldStayOpen = function(e) {
      var el = e.relatedTarget;
      if (el === null) {
        el = document.activeElement;
      }
      if (_this2.dropdownRef && el instanceof Node && _this2.dropdownRef.contains(el)) {
        return true;
      }
      return false;
    };
    _this2._onClick = function(e) {
      var onClick = _this2.props.onClick;
      if (onClick) {
        e.persist();
        onClick(e);
      }
      if (_this2._shouldStayOpen(e)) {
        return;
      }
      _this2._closeAutocomplete();
    };
    _this2._onBlur = function(e) {
      var onBlur = _this2.props.onBlur;
      if (onBlur) {
        e.persist();
        onBlur(e);
      }
      if (_this2._shouldStayOpen(e)) {
        return;
      }
      _this2._closeAutocomplete();
    };
    _this2._onScrollHandler = function() {
      _this2._closeAutocomplete();
    };
    _this2._onItemHighlightedHandler = function(item) {
      var onItemHighlighted = _this2.props.onItemHighlighted;
      var currentTrigger = _this2.state.currentTrigger;
      if (onItemHighlighted) {
        if (typeof onItemHighlighted === "function") {
          onItemHighlighted({
            currentTrigger,
            item
          });
        } else {
          throw new Error("`onItemHighlighted` has to be a function");
        }
      }
    };
    _this2._dropdownScroll = function(item) {
      var scrollToItem = _this2.props.scrollToItem;
      if (!scrollToItem) return;
      if (scrollToItem === true) {
        defaultScrollToItem(_this2.dropdownRef, item);
        return;
      }
      if (typeof scrollToItem !== "function" || scrollToItem.length !== 2) {
        throw new Error("`scrollToItem` has to be boolean (true for default implementation) or function with two parameters: container, item.");
      }
      scrollToItem(_this2.dropdownRef, item);
    };
    _this2._isAutocompleteOpen = function() {
      var _this2$state5 = _this2.state, dataLoading = _this2$state5.dataLoading, currentTrigger = _this2$state5.currentTrigger;
      var suggestionData = _this2._getSuggestions();
      return !!((dataLoading || suggestionData) && currentTrigger);
    };
    _this2._textareaRef = function(ref) {
      _this2.props.innerRef && _this2.props.innerRef(ref);
      _this2.textareaRef = ref;
    };
    _this2.lastTrigger = 0;
    _this2.escListener = null;
    var _this2$props3 = _this2.props, loadingComponent = _this2$props3.loadingComponent, _trigger = _this2$props3.trigger, _value = _this2$props3.value;
    if (_value) _this2.state.value = _value;
    _this2._createRegExp();
    if (!loadingComponent) {
      throw new Error("RTA: loadingComponent is not defined");
    }
    if (!_trigger) {
      throw new Error("RTA: trigger is not defined");
    }
    return _this2;
  }
  _createClass(ReactTextareaAutocomplete2, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      Listeners.startListen(this.textareaRef);
      this.textareaRef && this.textareaRef.addEventListener("focus", this._handleCaretChange);
      this.textareaRef && this.textareaRef.addEventListener("click", this._handleCaretChange);
      this.textareaRef && this.textareaRef.addEventListener("keydown", this._handleCaretChange);
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(_ref2) {
      var oldTrigger = _ref2.trigger, oldValue = _ref2.value;
      var _this$props2 = this.props, trigger = _this$props2.trigger, value = _this$props2.value;
      if (Object.keys(trigger).join("") !== Object.keys(oldTrigger).join("")) {
        this._createRegExp();
      }
      if (oldValue !== value && this.lastValueBubbledEvent !== value) {
        this.lastTrigger = 0;
        this._changeHandler();
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.escListenerDestroy();
      Listeners.stopListen(this.textareaRef);
      this.textareaRef && this.textareaRef.removeEventListener("focus", this._handleCaretChange);
      this.textareaRef && this.textareaRef.removeEventListener("click", this._handleCaretChange);
      this.textareaRef && this.textareaRef.removeEventListener("keydown", this._handleCaretChange);
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;
      var _this$props3 = this.props, Loader = _this$props3.loadingComponent, style = _this$props3.style, className = _this$props3.className, listStyle = _this$props3.listStyle, itemStyle = _this$props3.itemStyle, boundariesElement = _this$props3.boundariesElement, movePopupAsYouType = _this$props3.movePopupAsYouType, listClassName = _this$props3.listClassName, itemClassName = _this$props3.itemClassName, dropdownClassName = _this$props3.dropdownClassName, dropdownStyle = _this$props3.dropdownStyle, containerStyle = _this$props3.containerStyle, containerClassName = _this$props3.containerClassName, loaderStyle = _this$props3.loaderStyle, loaderClassName = _this$props3.loaderClassName, textAreaComponent = _this$props3.textAreaComponent, renderToBody = _this$props3.renderToBody;
      var _this$state = this.state, left = _this$state.left, top = _this$state.top, dataLoading = _this$state.dataLoading, component = _this$state.component, value = _this$state.value, textToReplace = _this$state.textToReplace;
      var isAutocompleteOpen = this._isAutocompleteOpen();
      var suggestionData = this._getSuggestions();
      var extraAttrs = {};
      var TextAreaComponent;
      if (textAreaComponent.component) {
        TextAreaComponent = textAreaComponent.component;
        extraAttrs[textAreaComponent.ref] = this._textareaRef;
      } else {
        TextAreaComponent = textAreaComponent;
        extraAttrs.ref = this._textareaRef;
      }
      return import_react.default.createElement("div", {
        className: "rta ".concat(dataLoading === true ? "rta--loading" : "", " ").concat(containerClassName || ""),
        style: containerStyle
      }, import_react.default.createElement(TextAreaComponent, Object.assign({}, this._cleanUpProps(), {
        className: "rta__textarea ".concat(className || ""),
        onChange: this._changeHandler,
        onSelect: this._selectHandler,
        onScroll: this._onScrollHandler,
        onClick: (
          // The textarea itself is outside the autoselect dropdown.
          this._onClick
        ),
        onBlur: this._onBlur,
        value,
        style
      }, extraAttrs)), isAutocompleteOpen && import_react.default.createElement(Autocomplete, {
        innerRef: function innerRef(ref) {
          _this3.dropdownRef = ref;
        },
        top,
        left,
        style: dropdownStyle,
        className: dropdownClassName,
        movePopupAsYouType,
        boundariesElement,
        textareaRef: this.textareaRef,
        renderToBody
      }, suggestionData && component && textToReplace && import_react.default.createElement(List, {
        values: suggestionData,
        component,
        style: listStyle,
        className: listClassName,
        itemClassName,
        itemStyle,
        getTextToReplace: textToReplace,
        onItemHighlighted: this._onItemHighlightedHandler,
        onSelect: this._onSelect,
        dropdownScroll: this._dropdownScroll
      }), dataLoading && import_react.default.createElement("div", {
        className: "rta__loader ".concat(suggestionData !== null ? "rta__loader--suggestion-data" : "rta__loader--empty-suggestion-data", " ").concat(loaderClassName || ""),
        style: loaderStyle
      }, import_react.default.createElement(Loader, {
        data: suggestionData
      }))));
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(_ref3) {
      var value = _ref3.value;
      if (value === null || value === void 0) return null;
      return {
        value
      };
    }
  }]);
  return ReactTextareaAutocomplete2;
}(import_react.default.Component);
ReactTextareaAutocomplete.defaultProps = {
  movePopupAsYouType: false,
  value: null,
  minChar: 1,
  boundariesElement: "body",
  scrollToItem: true,
  textAreaComponent: "textarea",
  renderToBody: false
};
var react_textarea_autocomplete_es_default = ReactTextareaAutocomplete;
export {
  react_textarea_autocomplete_es_default as default
};
//# sourceMappingURL=@webscopeio_react-textarea-autocomplete.js.map
