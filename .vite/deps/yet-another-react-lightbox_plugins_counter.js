import {
  MODULE_CONTROLLER,
  PLUGIN_COUNTER,
  clsx,
  createModule,
  cssClass,
  useLightboxState
} from "./chunk-C2CIVEXT.js";
import "./chunk-NDWYSDRJ.js";
import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/yet-another-react-lightbox@3.21.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/yet-another-react-lightbox/dist/plugins/counter/index.js
var React = __toESM(require_react());
var defaultCounterProps = {
  separator: "/",
  container: {}
};
var resolveCounterProps = (counter) => ({
  ...defaultCounterProps,
  ...counter
});
function CounterComponent({ counter }) {
  const { slides, currentIndex } = useLightboxState();
  const { separator, container: { className, ...rest }, className: legacyClassName, ...legacyRest } = resolveCounterProps(counter);
  if (slides.length === 0)
    return null;
  return React.createElement(
    "div",
    { className: clsx(cssClass("counter"), className || legacyClassName), ...legacyRest, ...rest },
    currentIndex + 1,
    " ",
    separator,
    " ",
    slides.length
  );
}
function Counter({ augment, addChild }) {
  augment(({ counter, ...restProps }) => ({
    counter: resolveCounterProps(counter),
    ...restProps
  }));
  addChild(MODULE_CONTROLLER, createModule(PLUGIN_COUNTER, CounterComponent));
}
export {
  Counter as default
};
//# sourceMappingURL=yet-another-react-lightbox_plugins_counter.js.map
