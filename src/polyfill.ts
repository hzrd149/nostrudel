console.log("polyfill global");

// @ts-ignore
window.global ||= window;
