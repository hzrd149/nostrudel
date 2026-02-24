#!/usr/bin/env node

/**
 * Applesauce v4 → v5 Migration Script
 *
 * This script automatically migrates imports from applesauce-core and applesauce-factory
 * to their new locations in v5 (applesauce-common).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// NIP-specific helpers that moved to applesauce-common
const HELPERS_TO_MIGRATE = new Set([
  // Profile helpers
  "getDisplayName",
  "getProfileContent",
  "getProfilePicture",
  "getProfilePointersFromList",
  "ProfileContent",
  "parseNIP05Address",

  // Zap helpers
  "getZapPayment",
  "getZapSender",
  "getZapRequest",
  "isValidZap",
  "getZapSplits",
  "getZapRecipient",
  "getZapEventPointer",
  "getZapAmount",

  // Thread/Comment helpers
  "getNip10References",
  "COMMENT_KIND",
  "interpretThreadTags",
  "getCommentEventPointer",
  "getCommentReplyPointer",
  "getCommentRootPointer",

  // Relay helpers
  "getSeenRelays",
  "mergeRelaySets",
  "getOutboxes",
  "selectOptimalRelays",
  "groupPubkeysByRelay",
  "getRelaysFromContactsEvent",
  "createOutboxMap",

  // List helpers
  "getAddressPointersFromList",
  "isEventInList",
  "isProfilePointerInList",
  "isAddressPointerInList",
  "isEventPointerInList",
  "getListTags",
  "getRelaysFromList",
  "FAVORITE_RELAYS_KIND",
  "ReadListTags",

  // Media helpers
  "getMediaAttachments",
  "FileMetadata",
  "PICTURE_POST_KIND",

  // Group helpers
  "encodeGroupPointer",
  "decodeGroupPointer",
  "getPublicGroups",
  "GroupPointer",
  "groupMessageEvents",

  // Emoji helpers
  "getEmojis",
  "Emoji",

  // Gift wrap helpers
  "getGiftWrapRumor",
  "unlockGiftWrap",
  "isGiftWrapUnlocked",
  "Rumor",

  // Message helpers
  "getConversationParticipants",
  "getEncryptedContent",
  "unlockLegacyMessage",

  // Article helpers
  "getArticleImage",
  "getArticlePublished",
  "getArticleSummary",
  "getArticleTitle",

  // Highlight helpers
  "getHighlightText",
  "getHighlightContext",
  "getHighlightSourceEventPointer",
  "getHighlightSourceAddressPointer",

  // Calendar helpers
  "CALENDAR_EVENT_RSVP_KIND",
  "DATE_BASED_CALENDAR_EVENT_KIND",
  "TIME_BASED_CALENDAR_EVENT_KIND",
  "getCalendarEventStart",
  "getCalendarEventEnd",
  "getCalendarEventTitle",
  "getCalendarAddressPointers",

  // Poll helpers
  "POLL_KIND",
  "POLL_RESPONSE_KIND",

  // Stream helpers
  "getStream",
  "getStreamTitle",
  "getStreamStatus",

  // Bookmark/mute helpers
  "getBookmarks",
  "getMutedThings",
  "mergeBookmarks",
  "matchMutes",

  // Handler helpers
  "getHandler",

  // Blossom helpers
  "mergeBlossomServers",

  // External ID helpers
  "parseExternalPointer",
  "isValidExternalPointer",
  "getExternalPointerFromTag",
  "ExternalIdentifiers",
  "ExternalPointer",

  // Other NIP-specific
  "getContentWarning",
  "getExpirationTimestamp",
  "parseBolt11",
]);

// Models that moved to applesauce-common
const MODELS_TO_MIGRATE = new Set([
  // Threading
  "ThreadModel",
  "ThreadItem",
  "CommentsModel",
  "RepliesModel",

  // Messages
  "GiftWrapsModel",
  "WrappedMessagesGroup",
  "LegacyMessagesGroup",
  "WrappedMessagesModel",
  "LegacyMessagesThreads",
  "LegacyMessageReplies",

  // Zaps
  "EventZapsModel",
  "ReceivedZapsModel",
  "SentZapsModel",

  // Channels
  "ChannelMessagesModel",
  "ChannelMetadataModel",
  "ChannelHiddenModel",
  "ChannelMutedModel",

  // Relays
  "FavoriteRelaysModel",
  "FavoriteRelaySetsModel",
  "SearchRelaysModel",
  "BlockedRelaysModel",

  // Calendar
  "CalendarEventsModel",
  "CalendarEventRSVPsModel",

  // User data
  "UserBookmarkModel",
  "UserHiddenBookmarkModel",
  "UserPublicBookmarkModel",
  "UserPinnedModel",
  "UserBlossomServersModel",
]);

// Blueprints that moved to applesauce-common
const BLUEPRINTS_TO_MIGRATE = new Set([
  "LiveChatMessageBlueprint",
  "ChannelMessageBlueprint",
  "ChannelMessageReplyBlueprint",
  "GroupMessageBlueprint",
  "PicturePostBlueprint",
  "CommentBlueprint",
  "NoteBlueprint",
  "NoteReplyBlueprint",
  "HighlightBlueprint",
  "ProfileBlueprint",
  "ReactionBlueprint",
  "PollBlueprint",
  "PollResponseBlueprint",
  "SingleChoicePollResponseBlueprint",
  "WrappedMessageBlueprint",
  "WrappedMessageReplyBlueprint",
  "LegacyMessageBlueprint",
  "LegacyMessageReplyBlueprint",
  "GiftWrapBlueprint",
  "DeleteBlueprint",
  "AppDataBlueprint",
  "CalendarBlueprint",
  "FileMetadataBlueprint",
  "FollowSetBlueprint",
  "ShareBlueprint",
  "TorrentBlueprint",
  "StreamChatMessage",
  // NIP-29 Group Management
  "GroupJoinRequestBlueprint",
  "GroupLeaveRequestBlueprint",
  "GroupCreateBlueprint",
  "GroupDeleteBlueprint",
  "GroupEditMetadataBlueprint",
  "GroupPutUserBlueprint",
  "GroupRemoveUserBlueprint",
]);

// Operations that moved to applesauce-common
const OPERATIONS_TO_MIGRATE = new Set([
  "AppData",
  "Calendar",
  "CalendarEvent",
  "CalendarRsvp",
  "Channel",
  "Comment",
  "FileMetadata",
  "Geohash",
  "GiftWrap",
  "Groups",
  "Hashtags",
  "Highlight",
  "LegacyMessage",
  "List",
  "LiveStream",
  "MediaAttachment",
  "Note",
  "PicturePost",
  "Poll",
  "PollResponse",
  "Reaction",
  "Stream",
  "StreamChat",
  "TagOperations",
  "Torrent",
  "WrappedMessage",
  "Zap",
  // Tag operations
  "addRelayTag",
  "removeRelayTag",
  "addCoordinateTag",
  "removeCoordinateTag",
  "addNameValueTag",
  "removeNameValueTag",
  "removePubkeyTag",
  "modifyPublicTags",
  "setContent",
  "includeSingletonTag",
]);

function getAllTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist
      if (!["node_modules", "dist", ".git", "build"].includes(file)) {
        getAllTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  // Track what we're importing from each module
  const coreHelperImports = new Set();
  const commonHelperImports = new Set();
  const coreModelImports = new Set();
  const commonModelImports = new Set();

  // Pattern 1: Migrate helpers from applesauce-core/helpers
  const helperImportRegex = /import\s+{([^}]+)}\s+from\s+["']applesauce-core\/helpers(?:\/([a-z-]+))?["'];?/g;

  content = content.replace(helperImportRegex, (match, imports, subpath) => {
    const importList = imports.split(",").map((i) => i.trim());
    const toCore = [];
    const toCommon = [];

    importList.forEach((imp) => {
      // Handle "X as Y" syntax
      const name = imp.split(" as ")[0].trim();

      if (HELPERS_TO_MIGRATE.has(name)) {
        toCommon.push(imp);
        commonHelperImports.add(imp);
      } else {
        toCore.push(imp);
        coreHelperImports.add(imp);
      }
    });

    modified = true;
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

  // Pattern 2: Migrate models from applesauce-core/models
  const modelImportRegex = /import\s+{([^}]+)}\s+from\s+["']applesauce-core\/models["'];?/g;

  content = content.replace(modelImportRegex, (match, imports) => {
    const importList = imports.split(",").map((i) => i.trim());
    const toCore = [];
    const toCommon = [];

    importList.forEach((imp) => {
      const name = imp.split(" as ")[0].trim();

      if (MODELS_TO_MIGRATE.has(name)) {
        toCommon.push(imp);
        commonModelImports.add(imp);
      } else {
        toCore.push(imp);
        coreModelImports.add(imp);
      }
    });

    modified = true;
    let result = [];

    if (toCore.length > 0) {
      result.push(`import { ${toCore.join(", ")} } from "applesauce-core/models";`);
    }

    if (toCommon.length > 0) {
      result.push(`import { ${toCommon.join(", ")} } from "applesauce-common/models";`);
    }

    return result.join("\n");
  });

  // Pattern 3: Migrate EventFactory from applesauce-factory
  content = content.replace(
    /import\s+{\s*EventFactory\s*}\s+from\s+["']applesauce-factory["'];?/g,
    'import { EventFactory } from "applesauce-core/event-factory";',
  );
  if (content.includes("applesauce-core/event-factory")) {
    modified = true;
  }

  // Pattern 4: Migrate blueprints from applesauce-factory/blueprints
  const blueprintImportRegex = /import\s+{([^}]+)}\s+from\s+["']applesauce-factory\/blueprints["'];?/g;

  content = content.replace(blueprintImportRegex, (match, imports) => {
    modified = true;
    return `import { ${imports} } from "applesauce-common/blueprints";`;
  });

  // Pattern 5: Migrate operations from applesauce-factory/operations
  const operationImportRegex = /import\s+{([^}]+)}\s+from\s+["']applesauce-factory\/operations(?:\/([a-z-]+))?["'];?/g;

  content = content.replace(operationImportRegex, (match, imports, subpath) => {
    modified = true;
    const targetPath = subpath ? `applesauce-common/operations/${subpath}` : "applesauce-common/operations";
    return `import { ${imports} } from "${targetPath}";`;
  });

  // Pattern 6: Migrate applesauce-core/helpers/lists → applesauce-common/helpers/lists
  content = content.replace(
    /from\s+["']applesauce-core\/helpers\/(lists|emoji|groups|messages|gift-wraps|file-metadata|highlight|share|zap|article|external-id)["']/g,
    (match, subpath) => {
      modified = true;
      return `from "applesauce-common/helpers/${subpath}"`;
    },
  );

  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  }

  return false;
}

function main() {
  const srcDir = path.join(__dirname, "src");
  const files = getAllTypeScriptFiles(srcDir);

  console.log(`Found ${files.length} TypeScript files to process...`);

  let migratedCount = 0;

  files.forEach((file) => {
    const relativePath = path.relative(__dirname, file);

    if (migrateFile(file)) {
      migratedCount++;
      console.log(`✓ Migrated: ${relativePath}`);
    }
  });

  console.log(`\n✅ Migration complete!`);
  console.log(`   Files modified: ${migratedCount}/${files.length}`);
  console.log(`\nNext steps:`);
  console.log(`1. Run: pnpm run build`);
  console.log(`2. Fix any remaining errors`);
  console.log(`3. Test the application`);
}

main();
