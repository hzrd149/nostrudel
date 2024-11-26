import accountService from "./account";
import channelMetadataService from "./channel-metadata";
import { eventStore, queryStore } from "./event-store";
import { localRelay } from "./local-relay";
import localSettings from "./local-settings";
import readStatusService from "./read-status";
import relayInfoService from "./relay-info";
import relayPoolService from "./relay-pool";
import replaceableEventsService from "./replaceable-events";
import signingService from "./signing";
import timelineCacheService from "./timeline-cache";
import { userSearchDirectory } from "./username-search";

const noStrudel = {
  /**
   * Internal applesauce EventStore
   * @see https://hzrd149.github.io/applesauce/classes/applesauce_core.EventStore.html
   */
  eventStore,
  /**
   * Internal applesauce QueryStore
   * @see https://hzrd149.github.io/applesauce/classes/applesauce_core.QueryStore.html
   */
  queryStore,

  /** Account management */
  accountService,

  /** Signing queue */
  signingService,

  /**
   * Cache relay interface
   * @type MemoryRelay|WasmRelay|CacheRelay|Relay|undefined
   */
  cacheRelay: localRelay,

  // other internal services
  replaceableEventsService,
  userSearchDirectory,
  readStatusService,
  relayInfoService,
  relayPoolService,
  channelMetadataService,
  timelineCacheService,
  localSettings,
};

localSettings.debugApi.subscribe((enabled) => {
  if (enabled) Reflect.set(window, "noStrudel", noStrudel);
  // @ts-expect-error
  else delete window.noStrudel;
});
