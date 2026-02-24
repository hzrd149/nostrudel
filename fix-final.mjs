#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Map of imports that moved from core to common or vice versa
const IMPORT_MOVES = {
  // Stayed in core
  'DecodeResult': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'KnownEvent': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'getInboxes': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'getReplaceableAddress': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'isDTag': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'isReplaceable': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'AddressPointer': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'EventPointer': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'isETag': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'isPTag': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'parseNIP05Address': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'parseCoordinate': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'BLOSSOM_SERVER_LIST_KIND': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'ChannelMetadataContent': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  'Mutes': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
  
  // Moved to common
  'ZapSplit': { from: 'applesauce-core/helpers', to: 'applesauce-common/helpers' },
  'getPackName': { from: 'applesauce-core/helpers', to: 'applesauce-common/helpers' },
  'getEncryptedContent': { from: 'applesauce-common/helpers', to: 'applesauce-core/helpers' },
};

function getAllTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'build'].includes(file)) {
        getAllTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Fix import moves
  for (const [symbol, { from, to }] of Object.entries(IMPORT_MOVES)) {
    const regex = new RegExp(`(import\\s+{[^}]*\\b${symbol}\\b[^}]*})\\s+from\\s+["']${from.replace(/\//g, '\\/')}["'];?`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, (match, imports) => {
        modified = true;
        return `${imports} from "${to}";`;
      });
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  const srcDir = path.join(__dirname, 'src');
  const files = getAllTypeScriptFiles(srcDir);
  
  console.log(`Fixing ${files.length} TypeScript files...`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
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
