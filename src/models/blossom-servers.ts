import { Model } from "applesauce-core";
import { BLOSSOM_SERVER_LIST_KIND } from "applesauce-core/helpers";
import { UserBlossomServersModel } from "applesauce-core/models";
import { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, merge } from "rxjs";

import { AddressableQuery } from "./addressable";

/** A model that loads a users profile */
export function BlossomServersQuery(pubkey: string | ProfilePointer): Model<URL[] | undefined> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
  return (events) =>
    merge(
      events
        .model(AddressableQuery, { kind: BLOSSOM_SERVER_LIST_KIND, pubkey: pointer.pubkey, relays: pointer.relays })
        .pipe(ignoreElements()),
      events.model(UserBlossomServersModel, pointer.pubkey),
    );
}
