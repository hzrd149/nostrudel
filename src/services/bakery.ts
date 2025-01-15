import { logger } from "../helpers/debug";
import BakeryConnection from "../classes/bakery/bakery-connection";
import BakeryControlApi from "../classes/bakery/control-api";
import signingService from "./signing";
import accountService from "./account";
import relayPoolService from "./relay-pool";
import localSettings from "./local-settings";

const log = logger.extend("bakery");

export function setBakeryURL(url: string) {
  localSettings.bakeryURL.next(url);
  location.reload();
}
export function clearBakeryURL() {
  localSettings.bakeryURL.clear();
  location.reload();
}

let bakery: BakeryConnection | null = null;

if (localSettings.bakeryURL.value) {
  try {
    log("Using URL from localStorage");
    bakery = new BakeryConnection(localSettings.bakeryURL.value);
  } catch (err) {
    log("Failed to create bakery connection, clearing storage");
    localSettings.bakeryURL.clear();
  }
} else {
  log("Unable to find private node URL");
}

if (bakery) {
  // add the bakery to the relay pool and connect
  relayPoolService.relays.set(bakery.url, bakery);
  relayPoolService.requestConnect(bakery);

  // automatically authenticate with bakery
  bakery.onChallenge.subscribe(async () => {
    try {
      const savedAuth = localStorage.getItem("personal-node-auth");
      if (savedAuth) {
        if (savedAuth === "nostr") {
          const account = accountService.current.value;
          if (!account) return;

          await bakery.authenticate((draft) => signingService.requestSignature(draft, account));
        } else {
          await bakery.authenticate(savedAuth);
        }
      }
    } catch (err) {
      console.log("Failed to authenticate with bakery", err);
      localStorage.removeItem("personal-node-auth");
    }
  });
}

const controlApi = bakery ? new BakeryControlApi(bakery) : undefined;

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.bakery = bakery;
  // @ts-expect-error
  window.controlApi = controlApi;
}

export { controlApi };
export default bakery;
