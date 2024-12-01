function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o,
    r,
    i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(e);
    for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (e.includes(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r );
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (String )(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

var index = (function () {
  var list = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var keyAccessors = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var multiItem = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var flattenKeys = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var keys = (keyAccessors instanceof Array ? keyAccessors.length ? keyAccessors : [undefined] : [keyAccessors]).map(function (key) {
    return {
      keyAccessor: key,
      isProp: !(key instanceof Function)
    };
  });
  var indexedResult = list.reduce(function (res, item) {
    var iterObj = res;
    var itemVal = item;
    keys.forEach(function (_ref, idx) {
      var keyAccessor = _ref.keyAccessor,
        isProp = _ref.isProp;
      var key;
      if (isProp) {
        var _itemVal = itemVal,
          propVal = _itemVal[keyAccessor],
          rest = _objectWithoutProperties(_itemVal, [keyAccessor].map(_toPropertyKey));
        key = propVal;
        itemVal = rest;
      } else {
        key = keyAccessor(itemVal, idx);
      }
      if (idx + 1 < keys.length) {
        if (!iterObj.hasOwnProperty(key)) {
          iterObj[key] = {};
        }
        iterObj = iterObj[key];
      } else {
        // Leaf key
        if (multiItem) {
          if (!iterObj.hasOwnProperty(key)) {
            iterObj[key] = [];
          }
          iterObj[key].push(itemVal);
        } else {
          iterObj[key] = itemVal;
        }
      }
    });
    return res;
  }, {});
  if (multiItem instanceof Function) {
    // Reduce leaf multiple values
    (function reduce(node) {
      var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      if (level === keys.length) {
        Object.keys(node).forEach(function (k) {
          return node[k] = multiItem(node[k]);
        });
      } else {
        Object.values(node).forEach(function (child) {
          return reduce(child, level + 1);
        });
      }
    })(indexedResult); // IIFE
  }
  var result = indexedResult;
  if (flattenKeys) {
    // flatten into array
    result = [];
    (function flatten(node) {
      var accKeys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      if (accKeys.length === keys.length) {
        result.push({
          keys: accKeys,
          vals: node
        });
      } else {
        Object.entries(node).forEach(function (_ref2) {
          var _ref3 = _slicedToArray(_ref2, 2),
            key = _ref3[0],
            val = _ref3[1];
          return flatten(val, [].concat(_toConsumableArray(accKeys), [key]));
        });
      }
    })(indexedResult); //IIFE

    if (keyAccessors instanceof Array && keyAccessors.length === 0 && result.length === 1) {
      // clear keys if there's no key accessors (single result)
      result[0].keys = [];
    }
  }
  return result;
});

export { index as default };
