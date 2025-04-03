import _throttle from "lodash.throttle";
import { UserSetsLoader } from "applesauce-loaders";

import { eventStore } from "./event-store";
import { nostrRequest } from "./rx-nostr";
import { cacheRequest } from "./cache-relay";

const userSetsLoader = new UserSetsLoader(nostrRequest, { cacheRequest });

userSetsLoader.subscribe((event) => eventStore.add(event));

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.userSetsLoader = userSetsLoader;
}

export default userSetsLoader;
