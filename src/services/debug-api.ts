import accounts from "./accounts";
import { eventCache$ } from "./event-cache";
import { eventStore } from "./event-store";
import {
  addressLoader,
  channelMetadataLoader,
  eventLoader,
  profileLoader,
  reactionsLoader,
  userSetsLoader,
  zapsLoader,
} from "./loaders";
import pool from "./pool";
import localSettings from "./preferences";
import readStatusService from "./read-status";
import relayInfoService from "./relay-info";
import timelineCacheService from "./timeline-cache";
import { userSearchDirectory } from "./username-search";

const noStrudel = {
  /** Connection pool */
  pool,

  /**
   * Internal applesauce EventStore
   * @see https://hzrd149.github.io/applesauce/classes/applesauce_core.EventStore.html
   */
  eventStore,

  /** Account management */
  accounts,

  get eventCache() {
    return eventCache$.value;
  },

  // other internal services
  profileLoader,
  addressLoader,
  eventLoader,
  zapsLoader,
  reactionsLoader,
  userSetsLoader,
  channelMetadataLoader,
  userSearchDirectory,
  readStatusService,
  relayInfoService,
  timelineCacheService,
  localSettings: localSettings,
};

localSettings.enableDebugApi.subscribe((enabled) => {
  if (enabled) Reflect.set(window, "noStrudel", noStrudel);
  // @ts-expect-error debug
  else delete window.noStrudel;
});
