import {
  BehaviorSubject,
  combineLatest,
  filter,
  from,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { DomainIdentityJson } from "applesauce-loaders/helpers/dns-identity";
import { unixNow } from "applesauce-core/helpers";

import accounts from "./accounts";
import { PAYWALL_NIP05 } from "../env";
import { logger } from "../helpers/debug";

const log = logger.extend("paywall");

export const hidePaywall = new BehaviorSubject(
  localStorage.getItem("paywall-dismiss") ? parseInt(localStorage.getItem("paywall-dismiss")!) : null,
);

hidePaywall.subscribe((ts) => {
  if (ts) localStorage.setItem("paywall-dismiss", String(ts));
});

let paywall: Observable<boolean>;
if (PAYWALL_NIP05) {
  const accountPaid = accounts.active$.pipe(
    // ignore empty accounts
    filter((a) => !!a),
    // fetch the identity document
    switchMap((account) => {
      log(`Fetching NIP-05 document`);
      const document = from(fetch(PAYWALL_NIP05!).then((res) => res.json() as Promise<DomainIdentityJson>));
      return combineLatest([of(account), document]);
    }),
    // check if account is in document
    map(([account, document]) => {
      log(`Found document`, document);
      return document.names ? Object.values(document.names).includes(account.pubkey) : false;
    }),
    // start with true until document is checked
    startWith(true),
    tap((paid) => log(`Account paid ${paid}`)),
  );

  const dismiss = hidePaywall.pipe(
    map((hideUntil) => (hideUntil ? hideUntil > unixNow() : false)),
    tap((dismissed) => log(`Paywall dismissed ${dismissed}`)),
  );

  paywall = combineLatest([dismiss, accountPaid]).pipe(
    map(([dismiss, account]) => dismiss || account),
    // share results for UI
    shareReplay(1),
  );
} else {
  paywall = of(true);
}

export { paywall };
