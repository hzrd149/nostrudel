#!/usr/bin/env node

"use strict";

const { parse } = require("../dist/lib/index.js");

try {
    console.log(parse(".foo@example.com"));
} catch (e) {
    console.log(e);
}

console.log(parse("foo@example.com"));

console.log(parse('"foo bar"@example.com'));

console.log(parse("foo@[127.0.0.1]"));
