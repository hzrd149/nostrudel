#!/usr/bin/env node

/**
 * Fix imports that were incorrectly migrated
 *
 * This script reverts helpers that stayed in applesauce-core
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helpers that STAYED in applesauce-core (not moved to common)
const STAY_IN_CORE = new Set([
  "ProfileContent",
  "getProfileContent",
  "getProfilePicture",
  "parseNIP05Address",
  "getSeenRelays",
  "mergeRelaySets",
  "getOutboxes",
  "createOutboxMap",
  "selectOptimalRelays",
  "groupPubkeysByRelay",
  "getRelaysFromContactsEvent",
  "Expressions",
]);

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

  // Fix: Move incorrectly migrated helpers back to applesauce-core
  const commonHelperImportRegex = /import\s+{([^}]+)}\s+from\s+["']applesauce-common\/helpers(?:\/([a-z-]+))?["'];?/g;

  content = content.replace(commonHelperImportRegex, (match, imports, subpath) => {
    const importList = imports.split(",").map((i) => i.trim());
    const toCore = [];
    const toCommon = [];

    importList.forEach((imp) => {
      const name = imp.split(" as ")[0].trim();

      if (STAY_IN_CORE.has(name)) {
        toCore.push(imp);
      } else {
        toCommon.push(imp);
      }
    });

    if (toCore.length > 0) {
      modified = true;
    }

    let result = [];

    if (toCore.length > 0) {
      const corePath = subpath ? `applesauce-core/helpers/${subpath}` : "applesauce-core/helpers";
      result.push(`import { ${toCore.join(", ")} } from "${corePath}";`);
    }

    if (toCommon.length > 0) {
      const commonPath = subpath ? `applesauce-common/helpers/${subpath}` : "applesauce-common/helpers";
      result.push(`import { ${toCommon.join(", ")} } from "${commonPath}";`);
    }

    return result.join("\n");
  });

  // Fix: applesauce-content/helpers → applesauce-content
  content = content.replace(/from\s+["']applesauce-content\/helpers["']/g, 'from "applesauce-content"');
  if (content.includes('from "applesauce-content"')) {
    modified = true;
  }

  // Fix: useActionHub → useActionRunner
  if (content.includes("useActionHub")) {
    content = content.replace(/useActionHub/g, "useActionRunner");
    modified = true;
  }

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
