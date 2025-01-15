import accountService from "./account";
import channelMetadataService from "./channel-metadata";
import { eventStore, queryStore } from "./event-store";
import localSettings from "./local-settings";
import readStatusService from "./read-status";
import relayInfoService from "./relay-info";
import relayPoolService from "./relay-pool";
import replaceableEventLoader from "./replaceable-event-loader";
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

  // other internal services
  replaceableEventLoader,
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
  // @ts-expect-error debug
  else delete window.noStrudel;
});
