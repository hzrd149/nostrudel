#!/usr/bin/env node

/**
 * Fix final v5 migration issues
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
  const original = content;

  // Fix: insertEventIntoDescendingList is re-exported from applesauce-core/helpers
  content = content.replace(/from\s+["']applesauce-common\/helpers["'];?\s*$/gm, (match) => {
    if (content.includes("insertEventIntoDescendingList")) {
      return 'from "applesauce-core/helpers";';
    }
    return match;
  });

  // Fix: getSharedEventPointer and getSharedAddressPointer are in applesauce-common
  content = content.replace(/from\s+["']applesauce-core\/helpers["'];?\s*$/gm, (match, offset) => {
    const beforeMatch = content.substring(Math.max(0, offset - 200), offset);
    if (beforeMatch.includes("getSharedEventPointer") || beforeMatch.includes("getSharedAddressPointer")) {
      return 'from "applesauce-common/helpers";';
    }
    return match;
  });

  // Fix: Mutes type location (in applesauce-common)
  content = content.replace(
    /import\s+{([^}]*\bMutes\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    'import {$1} from "applesauce-common/helpers";',
  );

  // Fix: includeSingletonTag is in applesauce-core/operations
  content = content.replace(/from\s+["']applesauce-common\/operations["']/g, 'from "applesauce-core/operations"');

  // Fix: lnurl helpers moved
  content = content.replace(/from\s+["']applesauce-core\/helpers\/lnurl["']/g, 'from "applesauce-common/helpers"');

  // Fix: ActionsProvider prop name changed from actionHub to runner
  content = content.replace(/<ActionsProvider\s+actionHub=/g, "<ActionsProvider runner=");

  return content !== original ? content : null;
}

function main() {
  const srcDir = path.join(__dirname, "src");
  const files = getAllTypeScriptFiles(srcDir);

  console.log(`Fixing ${files.length} TypeScript files...`);

  let fixedCount = 0;

  files.forEach((file) => {
    const relativePath = path.relative(__dirname, file);
    const newContent = fixFile(file);

    if (newContent) {
      fs.writeFileSync(file, newContent, "utf-8");
      fixedCount++;
      console.log(`✓ Fixed: ${relativePath}`);
    }
  });

  console.log(`\n✅ Fix complete!`);
  console.log(`   Files fixed: ${fixedCount}/${files.length}`);
}

main();
