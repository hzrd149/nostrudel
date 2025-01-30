import rxNostr from "./rx-nostr";
import accounts from "./accounts";
import channelMetadataService from "./channel-metadata";
import { eventStore, queryStore } from "./event-store";
import localSettings from "./local-settings";
import readStatusService from "./read-status";
import relayInfoService from "./relay-info";
import replaceableEventLoader from "./replaceable-loader";
import timelineCacheService from "./timeline-cache";
import { userSearchDirectory } from "./username-search";

const noStrudel = {
  rxNostr,

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
  accounts,

  // other internal services
  replaceableEventLoader,
  userSearchDirectory,
  readStatusService,
  relayInfoService,
  channelMetadataService,
  timelineCacheService,
  localSettings,
};

localSettings.debugApi.subscribe((enabled) => {
  if (enabled) Reflect.set(window, "noStrudel", noStrudel);
  // @ts-expect-error debug
  else delete window.noStrudel;
});
