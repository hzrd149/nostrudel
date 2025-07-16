import { Model } from "applesauce-core";
import { getTagValue, GroupPointer } from "applesauce-core/helpers";
import { map } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { groupInfoLoader } from "../services/loaders";
import { GroupInfo, parseGroupInfo } from "../helpers/groups";

/** A model that fetches the groups information from the relay */
export function GroupInfoQuery(group: GroupPointer): Model<GroupInfo> {
  return () => groupInfoLoader({ value: group.id, relays: [group.relay] }).pipe(map(parseGroupInfo));
}
