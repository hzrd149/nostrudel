import { BehaviorSubject, combineLatest, filter, lastValueFrom, map, of, shareReplay, switchMap } from "rxjs";
import { nip42 } from "nostr-tools";
import { Relay } from "applesauce-relay";

import { logger } from "../helpers/debug";
import BakeryControlApi from "../classes/bakery/bakery-control";
import localSettings from "./local-settings";
import accounts from "./accounts";

const log = logger.extend("bakery");

export function setBakeryURL(url: string) {
  localSettings.bakeryURL.next(url);
}
export function clearBakeryURL() {
  localSettings.bakeryURL.clear();
}

export const bakery$ = new BehaviorSubject<Relay | null>(null);

// connect to the bakery when the URL changes
localSettings.bakeryURL.subscribe((url) => {
  if (!URL.canParse(url)) return bakery$.next(null);

  try {
    bakery$.next(new Relay(localSettings.bakeryURL.value));
  } catch (err) {
    log("Failed to create bakery connection, clearing storage");
    localSettings.bakeryURL.clear();
  }
});

// automatically authenticate with bakery
bakery$
  .pipe(
    // ignore when bakery is not created
    filter((b) => b !== null),
    // watch for auth challenge and account
    switchMap((b) => combineLatest([of(b), b.challenge$, accounts.active$])),
  )
  .subscribe(async ([bakery, challenge, account]) => {
    if (!account || !challenge) return;

    try {
      const draft = nip42.makeAuthEvent(bakery.url, challenge);
      const result = await lastValueFrom(bakery.auth(await account.signEvent(draft)));
      console.log("Authenticated to relay", result);
    } catch (err) {
      console.log("Failed to authenticate with bakery", err);
    }
  });

// create the bakery control api
export const controlApi$ = bakery$.pipe(
  filter((b) => !!b),
  map((bakery) => new BakeryControlApi(bakery)),
  shareReplay(1),
);

controlApi$.pipe(switchMap((api) => api.config)).subscribe((config) => {
  console.log("config", config);
});

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.bakery$ = bakery$;
  // @ts-expect-error
  window.controlApi$ = controlApi$;
}
