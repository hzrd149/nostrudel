'use strict';

var Observable = require('zen-observable');

function send(p, message, value) {
  if (p._observer) {
    sendMessage(p._observer, message, value);
  } else if (p._observers) {
    var list = [];
    p._observers.forEach(function(to) { list.push(to); });
    list.forEach(function(to) { sendMessage(to, message, value); });
  }
}

function sendMessage(observer, message, value) {
  if (observer.closed) {
    return;
  }
  switch (message) {
    case 'next': return observer.next(value);
    case 'error': return observer.error(value);
    case 'complete': return observer.complete();
  }
}

function hasObserver(p) {
  return p._observer || p._observers && p._observers.size > 0;
}

function addObserver(p, observer) {
  if (p._observers) {
    p._observers.add(observer);
  } else if (!p._observer) {
    p._observer = observer;
  } else {
    p._observers = new Set();
    p._observers.add(p._observer);
    p._observers.add(observer);
    p._observer = null;
  }
}

function deleteObserver(p, observer) {
  if (p._observers) {
    p._observers.delete(observer);
  } else if (p._observer === observer) {
    p._observer = null;
  }
}

function notifyStart(p, opts) {
  !hasObserver(p) && opts && opts.start && opts.start();
}

function notifyPause(p, opts) {
  !hasObserver(p) && opts && opts.pause && opts.pause();
}

class PushStream {
  constructor(opts) {
    this._observer = null;
    this._observers = null;
    this._observable = new Observable((observer) => {
      notifyStart(this, opts);
      addObserver(this, observer);
      return () => {
        deleteObserver(this, observer);
        notifyPause(this, opts);
      };
    });
  }

  get observable() {
    return this._observable;
  }

  get observed() {
    return hasObserver(this);
  }

  next(x) {
    send(this, 'next', x);
  }

  error(e) {
    send(this, 'error', e);
  }

  complete() {
    send(this, 'complete');
  }

  static multicast(observable) {
    let stream = new this();
    observable.subscribe(stream);
    return stream.observable;
  }
}

module.exports = PushStream;
