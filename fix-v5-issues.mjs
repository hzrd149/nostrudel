#!/usr/bin/env node

/**
 * Comprehensive v5 migration fixes
 * Handles:
 * - Pointer null checks
 * - Missing export fixes
 * - API changes
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

  // Fix: parseCoordinate was renamed to parseReplaceableAddress
  content = content.replace(
    /import\s+{([^}]*\bparseCoordinate\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    (match, imports) => {
      return `import {${imports.replace("parseCoordinate", "parseReplaceableAddress as parseCoordinate")}} from "applesauce-core/helpers";`;
    },
  );

  // Fix: EventStore.updated -> EventStore.update
  content = content.replace(/\.updated\$/g, ".update$");
  content = content.replace(/\.updated\(/g, ".update(");

  // Fix: getEncryptedContent is in applesauce-core, not applesauce-common
  content = content.replace(/from\s+["']applesauce-common\/helpers\/messages["']/g, 'from "applesauce-core/helpers"');

  // Fix: Mutes type location
  content = content.replace(
    /import\s+{([^}]*\bMutes\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    (match, imports) => {
      // Mutes is actually in applesauce-common/helpers
      return `import {${imports}} from "applesauce-common/helpers";`;
    },
  );

  // Fix: BLOSSOM_SERVER_LIST_KIND location
  content = content.replace(
    /import\s+{([^}]*\bBLOSSOM_SERVER_LIST_KIND\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    (match, imports) => {
      return `import {${imports}} from "applesauce-common/helpers";`;
    },
  );

  // Fix: ChannelMetadataContent location
  content = content.replace(
    /import\s+{([^}]*\bChannelMetadataContent\b[^}]*)}\s+from\s+["']applesauce-core\/helpers["'];?/g,
    (match, imports) => {
      return `import {${imports}} from "applesauce-common/helpers";`;
    },
  );

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
