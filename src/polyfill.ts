console.log("polyfill global");

// @ts-ignore
globalThis.global ||= globalThis;
