import { Query } from "applesauce-core";
import { isSafeRelayURL } from "applesauce-core/helpers";
import { map } from "rxjs/operators";

type TrustedMints = {
  mints: string[];
  relays: Set<string>;
  pubkey?: string;
};

export default function TrustedMintsQuery(pubkey: string): Query<TrustedMints | undefined> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(10019, pubkey).pipe(
        map((event) => {
          if (!event) return undefined;

          const relays = new Set<string>();
          const mints: string[] = [];
          let pubkey: string | undefined = undefined;

          for (const tag of event.tags) {
            switch (tag[0]) {
              case "mint":
                if (tag[1]) mints.push(tag[1]);
                break;

              case "relay":
                if (tag[1] && isSafeRelayURL(tag[1])) {
                  mints.push(tag[1]);
                }
                break;

              case "pubkey":
                if (tag[1]) pubkey = tag[1];
                break;
            }
          }

          return { relays, mints, pubkey };
        }),
      ),
  };
}
