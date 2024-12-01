#!/usr/bin/env node
import { test, suite } from 'uvu';
import * as fs from 'fs/promises';
import * as path from 'path';
import glob from 'glob';
import { fileURLToPath } from 'url';
import { parser } from '../dist/index.es.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = ['arrays', 'comments', 'misc', 'new-lines', 'numbers', 'objects', 'strings'];

function makeTest(suite, filename, expectFailure) {
  let testName = path.basename(filename);
  suite(testName, async () => {
    let contents = await fs.readFile(filename);
    let p = parser.configure({
      strict: true,
    });

    try {
      p.parse(contents.toString());
      if(expectFailure) {
        throw new Error(`Parsed should have failed but did not`);
      }
    } catch(e) {
      if(expectFailure) {
        return;
      } else {
        throw e;
      }
    }
  });

}


function createTests(dir) {
  let testExtensions = /\.(json|json5|txt|js)$/;
  let filenames = glob.sync(path.join(__dirname, dir,  '*')).filter((f) => testExtensions.test(f));
  let s = suite(dir);

  for(let filename of filenames) {
    let expectFailure = filename.endsWith('.js') || filename.endsWith('.txt');
    makeTest(s, filename, expectFailure);
  }

  s.run();
}

for(let dir of dirs) {
  createTests(dir);
}
