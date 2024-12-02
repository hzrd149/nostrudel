import {
  isStateful
} from "./chunk-23HJ24FQ.js";
import {
  require_zen_observable
} from "./chunk-OCSVJ24W.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/observable/throttle.js
var import_zen_observable = __toESM(require_zen_observable(), 1);
function throttle(source, interval) {
  return new import_zen_observable.default((observer) => {
    let lastEmissionTime = 0;
    let subscription = source.subscribe({
      next(value) {
        const currentTime = Date.now();
        if (currentTime - lastEmissionTime >= interval) {
          lastEmissionTime = currentTime;
          observer.next(value);
        }
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      }
    });
    return () => subscription.unsubscribe();
  });
}

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/observable/getValue.js
function getValue(observable) {
  if (isStateful(observable) && observable.value !== void 0)
    return observable.value;
  return new Promise((res) => {
    const sub = observable.subscribe((v) => {
      res(v);
      sub.unsubscribe();
    });
  });
}

export {
  throttle,
  getValue
};
//# sourceMappingURL=chunk-TMD2PESA.js.map
