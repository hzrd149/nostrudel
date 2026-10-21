import { readFile } from "node:fs/promises";
import ts from "typescript";

const modules = new Map();

/** Load standalone TypeScript helpers for Node benchmarks without browser service initialization. */
export async function loadTypescript(url) {
  return import(await compile(url));
}

export { compile as compileTypescript };

function compile(url) {
  if (!modules.has(url.href)) modules.set(url.href, compileModule(url));
  return modules.get(url.href);
}

async function compileModule(url) {
  const source = await readFile(url, "utf8");
  let code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
  }).outputText;
  const imports = [...code.matchAll(/from\s+["']([^"']+)["']/g)];
  for (const match of imports) {
    const name = match[1];
    const resolved = name.startsWith(".") ? await compile(new URL(`${name}.ts`, url)) : import.meta.resolve(name);
    code = code.replace(match[0], `from ${JSON.stringify(resolved)}`);
  }
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}
