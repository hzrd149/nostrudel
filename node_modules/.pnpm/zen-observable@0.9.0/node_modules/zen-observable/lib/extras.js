"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.merge = merge;
exports.combineLatest = combineLatest;
exports.zip = zip;

var _Observable = require("./Observable.js");

// Emits all values from all inputs in parallel
function merge(...sources) {
  return new _Observable.Observable(observer => {
    if (sources.length === 0) return _Observable.Observable.from([]);
    let count = sources.length;
    let subscriptions = sources.map(source => _Observable.Observable.from(source).subscribe({
      next(v) {
        observer.next(v);
      },

      error(e) {
        observer.error(e);
      },

      complete() {
        if (--count === 0) observer.complete();
      }

    }));
    return () => subscriptions.forEach(s => s.unsubscribe());
  });
} // Emits arrays containing the most current values from each input


function combineLatest(...sources) {
  return new _Observable.Observable(observer => {
    if (sources.length === 0) return _Observable.Observable.from([]);
    let count = sources.length;
    let seen = new Set();
    let seenAll = false;
    let values = sources.map(() => undefined);
    let subscriptions = sources.map((source, index) => _Observable.Observable.from(source).subscribe({
      next(v) {
        values[index] = v;

        if (!seenAll) {
          seen.add(index);
          if (seen.size !== sources.length) return;
          seen = null;
          seenAll = true;
        }

        observer.next(Array.from(values));
      },

      error(e) {
        observer.error(e);
      },

      complete() {
        if (--count === 0) observer.complete();
      }

    }));
    return () => subscriptions.forEach(s => s.unsubscribe());
  });
} // Emits arrays containing the matching index values from each input


function zip(...sources) {
  return new _Observable.Observable(observer => {
    if (sources.length === 0) return _Observable.Observable.from([]);
    let queues = sources.map(() => []);

    function done() {
      return queues.some((q, i) => q.length === 0 && subscriptions[i].closed);
    }

    let subscriptions = sources.map((source, index) => _Observable.Observable.from(source).subscribe({
      next(v) {
        queues[index].push(v);

        if (queues.every(q => q.length > 0)) {
          observer.next(queues.map(q => q.shift()));
          if (done()) observer.complete();
        }
      },

      error(e) {
        observer.error(e);
      },

      complete() {
        if (done()) observer.complete();
      }

    }));
    return () => subscriptions.forEach(s => s.unsubscribe());
  });
}