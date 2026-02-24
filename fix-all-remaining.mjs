#!/usr/bin/env node

/**
 * Fix all remaining v5 migration issues
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIXES = {
  // Move to applesauce-common
  GROUP_MESSAGE_KIND: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },
  GROUPS_LIST_KIND: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },
  getEventPointersFromList: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },
  getDisplayName: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },
  createConversationIdentifier: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },
  getRumorGiftWraps: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },
  isLegacyMessageUnlocked: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },
  getExpirationTimestamp: { from: "applesauce-core/helpers", to: "applesauce-common/helpers" },

  // Fix module paths
  "applesauce-core/helpers/lnurl": { to: "applesauce-common/helpers" },
  "applesauce-common/helpers/gift-wraps": { to: "applesauce-common/helpers" },
  "applesauce-core/operations/tag": { to: "applesauce-core/operations" },
  "applesauce-common/operations": { to: "applesauce-core/operations" },
};

function processImportLine(line) {
  let result = line;

  // Fix module paths
  for (const [oldPath, { to }] of Object.entries(FIXES)) {
    if (oldPath.includes("/")) {
      result = result.replace(new RegExp(`from ["']${oldPath.replace(/\//g, "\\/")}["']`, "g"), `from "${to}"`);
    }
  }

  return result;
}

function splitImportsByLocation(imports, currentLocation) {
  const importList = imports
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i);
  const groups = new Map();

  importList.forEach((imp) => {
    const name = imp.split(" as ")[0].trim();
    const fix = FIXES[name];

    if (fix && fix.from === currentLocation) {
      // This import needs to move
      if (!groups.has(fix.to)) groups.set(fix.to, []);
      groups.get(fix.to).push(imp);
    } else {
      // Keep in original location
      if (!groups.has(currentLocation)) groups.set(currentLocation, []);
      groups.get(currentLocation).push(imp);
    }
  });

  return groups;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  // Fix: getSharedAddressPointer and getSharedEventPointer are in applesauce-common
  const coreHelperRegex = /import\s+{([^}]+)}\s+from\s+["']applesauce-core\/helpers["'];?/g;

  content = content.replace(coreHelperRegex, (match, imports) => {
    const groups = splitImportsByLocation(imports, "applesauce-core/helpers");

    if (groups.size > 1) {
      modified = true;
      const lines = [];
      for (const [location, items] of groups) {
        lines.push(`import { ${items.join(", ")} } from "${location}";`);
      }
      return lines.join("\n");
    }
    return match;
  });

  // Fix module paths
  content = processImportLine(content);
  if (content !== fs.readFileSync(filePath, "utf-8")) {
    modified = true;
  }

  // Fix: ActionsProvider prop name
  if (content.includes("actionHub={")) {
    content = content.replace(/actionHub=/g, "runner=");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  }

  return false;
}

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

function main() {
  const srcDir = path.join(__dirname, "src");
  const files = getAllTypeScriptFiles(srcDir);

  console.log(`Fixing ${files.length} files...`);

  let fixedCount = 0;

  files.forEach((file) => {
    const relativePath = path.relative(__dirname, file);

    if (fixFile(file)) {
      fixedCount++;
      console.log(`✓ ${relativePath}`);
    }
  });

  console.log(`\n✅ Fixed ${fixedCount} files`);
}

main();
