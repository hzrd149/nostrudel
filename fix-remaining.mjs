#!/usr/bin/env node

/**
 * Fix remaining import issues
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAllTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!["node_modules", "dist", ".git", "build"].includes(file)) {
        getAllTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  // Fix: applesauce-factory/operations/tag → applesauce-core/operations/tag
  if (content.includes("applesauce-factory/operations/tag") || content.includes("applesauce-common/operations/tag")) {
    content = content.replace(
      /from\s+["']applesauce-factory\/operations\/tag["']/g,
      'from "applesauce-core/operations/tag"',
    );
    content = content.replace(
      /from\s+["']applesauce-common\/operations\/tag["']/g,
      'from "applesauce-core/operations/tag"',
    );
    modified = true;
  }

  // Fix: getInvoice is in applesauce-common/helpers, not applesauce-core
  content = content.replace(
    /import\s+{([^}]*\bgetInvoice\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    (match, imports) => {
      modified = true;
      return `import {${imports}} from "applesauce-common/helpers";`;
    },
  );

  // Fix: ZapEvent is in applesauce-common/helpers
  content = content.replace(
    /import\s+{([^}]*\bZapEvent\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    (match, imports) => {
      modified = true;
      return `import {${imports}} from "applesauce-common/helpers";`;
    },
  );

  // Fix: getZapAddressPointer is in applesauce-common/helpers, not applesauce-core
  content = content.replace(
    /import\s+{([^}]*\bgetZapAddressPointer\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    (match, imports) => {
      modified = true;
      return `import {${imports}} from "applesauce-common/helpers";`;
    },
  );

  // Fix: ZapSplit might need special handling - check if it exists
  // For now, let's not touch it and handle manually

  // Fix: getPackName - need to check where it actually is
  // Will handle manually

  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  }

  return false;
}

function main() {
  const srcDir = path.join(__dirname, "src");
  const files = getAllTypeScriptFiles(srcDir);

  console.log(`Fixing ${files.length} TypeScript files...`);

  let fixedCount = 0;

  files.forEach((file) => {
    const relativePath = path.relative(__dirname, file);

    if (fixFile(file)) {
      fixedCount++;
      console.log(`✓ Fixed: ${relativePath}`);
    }
  });

  console.log(`\n✅ Fix complete!`);
  console.log(`   Files fixed: ${fixedCount}/${files.length}`);
}

main();
