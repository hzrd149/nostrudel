// Version 2.4.0 react-kapsule - https://github.com/vasturiano/react-kapsule
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react')) :
  typeof define === 'function' && define.amd ? define(['react'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.fromKapsule = factory(global.React));
})(this, (function (React) { 'use strict';

  function _iterableToArrayLimit$1(arr, i) {
    var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"];
    if (null != _i) {
      var _s,
        _e,
        _x,
        _r,
        _arr = [],
        _n = !0,
        _d = !1;
      try {
        if (_x = (_i = _i.call(arr)).next, 0 === i) {
          if (Object(_i) !== _i) return;
          _n = !1;
        } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0);
      } catch (err) {
        _d = !0, _e = err;
      } finally {
        try {
          if (!_n && null != _i.return && (_r = _i.return(), Object(_r) !== _r)) return;
        } finally {
          if (_d) throw _e;
        }
      }
      return _arr;
    }
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _slicedToArray$1(arr, i) {
    return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _unsupportedIterableToArray$1(arr, i) || _nonIterableRest$1();
  }
  function _toConsumableArray$1(arr) {
    return _arrayWithoutHoles$1(arr) || _iterableToArray$1(arr) || _unsupportedIterableToArray$1(arr) || _nonIterableSpread$1();
  }
  function _arrayWithoutHoles$1(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray$1(arr);
  }
  function _arrayWithHoles$1(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function _iterableToArray$1(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }
  function _unsupportedIterableToArray$1(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray$1(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen);
  }
  function _arrayLikeToArray$1(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableSpread$1() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableRest$1() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _iterableToArrayLimit(arr, i) {
    var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"];
    if (null != _i) {
      var _s,
        _e,
        _x,
        _r,
        _arr = [],
        _n = !0,
        _d = !1;
      try {
        if (_x = (_i = _i.call(arr)).next, 0 === i) {
          if (Object(_i) !== _i) return;
          _n = !1;
        } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0);
      } catch (err) {
        _d = !0, _e = err;
      } finally {
        try {
          if (!_n && null != _i.return && (_r = _i.return(), Object(_r) !== _r)) return;
        } finally {
          if (_d) throw _e;
        }
      }
      return _arr;
    }
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }
  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }
  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }
  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }
  var omit = function omit(obj, keys) {
    var keySet = new Set(keys);
    return Object.assign.apply(Object, [{}].concat(_toConsumableArray(Object.entries(obj).filter(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 1),
        key = _ref3[0];
      return !keySet.has(key);
    }).map(function (_ref4) {
      var _ref5 = _slicedToArray(_ref4, 2),
        key = _ref5[0],
        val = _ref5[1];
      return _defineProperty({}, key, val);
    }))));
  };

  /*! fromentries. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

  var fromentries = function fromEntries (iterable) {
    return [...iterable].reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj
    }, {})
  };

  function index (kapsuleComponent, comboParam) {
    var _ref = _typeof(comboParam) === 'object' ? comboParam : {
        // support old schema for backwards compatibility
        wrapperElementType: comboParam,
        methodNames: (arguments.length <= 2 ? undefined : arguments[2]) || undefined,
        initPropNames: (arguments.length <= 3 ? undefined : arguments[3]) || undefined
      },
      _ref$wrapperElementTy = _ref.wrapperElementType,
      wrapperElementType = _ref$wrapperElementTy === void 0 ? 'div' : _ref$wrapperElementTy,
      _ref$nodeMapper = _ref.nodeMapper,
      nodeMapper = _ref$nodeMapper === void 0 ? function (node) {
        return node;
      } : _ref$nodeMapper,
      _ref$methodNames = _ref.methodNames,
      methodNames = _ref$methodNames === void 0 ? [] : _ref$methodNames,
      _ref$initPropNames = _ref.initPropNames,
      initPropNames = _ref$initPropNames === void 0 ? [] : _ref$initPropNames;
    return /*#__PURE__*/React.forwardRef(function (props, ref) {
      var domEl = React.useRef();
      var _useState = React.useState({}),
        _useState2 = _slicedToArray$1(_useState, 2),
        prevProps = _useState2[0],
        setPrevProps = _useState2[1];
      React.useEffect(function () {
        return setPrevProps(props);
      }); // remember previous props

      // instantiate the inner kapsule component with the defined initPropNames
      var comp = React.useMemo(function () {
        var configOptions = fromentries(initPropNames.filter(function (p) {
          return props.hasOwnProperty(p);
        }).map(function (prop) {
          return [prop, props[prop]];
        }));
        return kapsuleComponent(configOptions);
      }, []);
      useEffectOnce(function () {
        comp(nodeMapper(domEl.current)); // mount kapsule synchronously on this element ref, optionally mapped into an object that the kapsule understands
      }, React.useLayoutEffect);
      useEffectOnce(function () {
        // invoke destructor on unmount, if it exists
        return comp._destructor instanceof Function ? comp._destructor : undefined;
      });

      // Call a component method
      var _call = React.useCallback(function (method) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        return comp[method] instanceof Function ? comp[method].apply(comp, args) : undefined;
      } // method not found
      , [comp]);

      // propagate component props that have changed
      var dynamicProps = omit(props, [].concat(_toConsumableArray$1(methodNames), _toConsumableArray$1(initPropNames))); // initPropNames or methodNames should not be called
      Object.keys(dynamicProps).filter(function (p) {
        return prevProps[p] !== props[p];
      }).forEach(function (p) {
        return _call(p, props[p]);
      });

      // bind external methods to parent ref
      React.useImperativeHandle(ref, function () {
        return fromentries(methodNames.map(function (method) {
          return [method, function () {
            for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              args[_key2] = arguments[_key2];
            }
            return _call.apply(void 0, [method].concat(args));
          }];
        }));
      });
      return /*#__PURE__*/React.createElement(wrapperElementType, {
        ref: domEl
      });
    });
  }

  //

  // Handle R18 strict mode double mount at init
  function useEffectOnce(effect) {
    var useEffectFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : React.useEffect;
    var destroyFunc = React.useRef();
    var effectCalled = React.useRef(false);
    var renderAfterCalled = React.useRef(false);
    var _useState3 = React.useState(0),
      _useState4 = _slicedToArray$1(_useState3, 2);
      _useState4[0];
      var setVal = _useState4[1];
    if (effectCalled.current) {
      renderAfterCalled.current = true;
    }
    useEffectFn(function () {
      // only execute the effect first time around
      if (!effectCalled.current) {
        destroyFunc.current = effect();
        effectCalled.current = true;
      }

      // this forces one render after the effect is run
      setVal(function (val) {
        return val + 1;
      });
      return function () {
        // if the comp didn't render since the useEffect was called,
        // we know it's the dummy React cycle
        if (!renderAfterCalled.current) return;
        if (destroyFunc.current) destroyFunc.current();
      };
    }, []);
  }

  return index;

}));
//# sourceMappingURL=react-kapsule.js.map
