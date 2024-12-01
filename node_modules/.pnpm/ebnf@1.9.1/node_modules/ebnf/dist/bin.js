#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log(`/* AUTO GENERATED CODE USING ebnf NPM MODULE ${new Date().toISOString()}`);
function printUsage() {
    console.error(`Usage:
  ebnf Grammar.ebnf >> myFile.js
       ^^^^^^^^^^^^ Source file`);
}
const path = require('path');
const fs = require('fs');
const util = require('util');
const _1 = require(".");
let source = process.argv[2];
if (!source || source.length == 0) {
    printUsage();
    throw new Error('You must provide a source file');
}
source = path.resolve(process.cwd(), source);
let sourceCode = fs.readFileSync(source).toString() + '\n';
let RULES = _1.Grammars.Custom.getRules(sourceCode);
console.log(`*/

module.exports = ${util.inspect(RULES, { depth: 20, maxArrayLength: null })};`);
//# sourceMappingURL=bin.js.map