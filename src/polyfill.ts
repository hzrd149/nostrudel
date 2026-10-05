console.log("polyfill global");

globalThis.global ||= globalThis;
