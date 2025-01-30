import { BehaviorSubject, filter, mergeMap } from "rxjs";

import { logger } from "../helpers/debug";
import BakeryRelay from "../classes/bakery/bakery-connection";
import BakeryControlApi from "../classes/bakery/control-api";
import signingService from "./signing";
import localSettings from "./local-settings";
import accounts from "./accounts";

const log = logger.extend("bakery");

export function setBakeryURL(url: string) {
  localSettings.bakeryURL.next(url);
}
export function clearBakeryURL() {
  localSettings.bakeryURL.clear();
}

export const bakery$ = new BehaviorSubject<BakeryRelay | null>(null);

localSettings.bakeryURL.subscribe((url) => {
  if (!URL.canParse(url)) return bakery$.next(null);

  try {
    const bakery = new BakeryRelay(localSettings.bakeryURL.value);

    bakery$.next(bakery);
  } catch (err) {
    log("Failed to create bakery connection, clearing storage");
    localSettings.bakeryURL.clear();
  }
});

// automatically authenticate with bakery
bakery$
  .pipe(
    filter((r) => r !== null),
    mergeMap((r) => r.onChallenge),
  )
  .subscribe(async (challenge) => {
    if (!challenge) return;

    const bakery = bakery$.value;
    if (!bakery) return;

    const account = accounts.active;
    if (!account) return;

    try {
      await bakery.authenticate((draft) => signingService.requestSignature(draft, account));
    } catch (err) {
      console.log("Failed to authenticate with bakery", err);
    }
  });

export const controlApi$ = new BehaviorSubject<BakeryControlApi | null>(null);

// create a control api for the bakery
bakery$.subscribe((relay) => {
  if (!relay) return controlApi$.next(null);
  else controlApi$.next(new BakeryControlApi(relay));
});

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.bakery$ = bakery$;
  // @ts-expect-error
  window.controlApi$ = controlApi$;
}

export function getControlApi() {
  return controlApi$.value;
}
export function getBakery() {
  return bakery$.value;
}
