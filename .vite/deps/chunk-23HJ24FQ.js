import {
  require_zen_observable
} from "./chunk-OCSVJ24W.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/applesauce-core@0.7.0_typescript@5.6.2/node_modules/applesauce-core/dist/observable/stateful.js
var import_zen_observable = __toESM(require_zen_observable(), 1);
function stateful(observable, cleanup = false) {
  let subscription = void 0;
  let observers = [];
  const self = new import_zen_observable.default((observer) => {
    observers.push(observer);
    if (self.value)
      observer.next(self.value);
    if (self.error)
      observer.error(self.error);
    if (self.complete)
      observer.complete();
    if (!subscription) {
      subscription = observable.subscribe({
        next: (v) => {
          self.value = v;
          for (const observer2 of observers)
            observer2.next(v);
        },
        error: (err) => {
          self.error = err;
          for (const observer2 of observers)
            observer2.error(err);
        },
        complete: () => {
          self.complete = true;
          for (const observer2 of observers)
            observer2.complete();
        }
      });
    }
    return () => {
      let i = observers.indexOf(observer);
      if (i !== -1) {
        observers.splice(i, 1);
        if (subscription && observers.length === 0) {
          subscription.unsubscribe();
          subscription = void 0;
          if (cleanup) {
            delete self.value;
            delete self.error;
            delete self.complete;
          }
        }
      }
    };
  });
  self._stateful = true;
  return self;
}
function isStateful(observable) {
  return observable._stateful;
}

export {
  stateful,
  isStateful
};
//# sourceMappingURL=chunk-23HJ24FQ.js.map
