import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { defer, ignoreElements, map, mergeWith } from "rxjs";

import { isJunkList, SET_KINDS } from "../helpers/nostr/lists";
import { userSetsLoader } from "../services/loaders";

export function UserListsQuery(user: ProfilePointer): Model<NostrEvent[]> {
  return (events) =>
    defer(() => userSetsLoader(user)).pipe(
      ignoreElements(),
      mergeWith(events.timeline({ authors: [user.pubkey], kinds: SET_KINDS })),
      map((events) => events.filter((e) => !isJunkList(e))),
    );
}
