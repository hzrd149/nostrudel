var index = (function (p) {
  return typeof p === 'function' ? p // fn
  : typeof p === 'string' ? function (obj) {
    return obj[p];
  } // property name
  : function (obj) {
    return p;
  };
}); // constant

export { index as default };
