/*
  @license
	Rollup.js v4.22.5
	Fri, 27 Sep 2024 11:47:46 GMT - commit bc7780c322e134492f40a76bf64afe561670425c

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
import 'tty';
