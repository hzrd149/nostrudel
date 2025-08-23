import { Model } from "applesauce-core";
import { GroupPointer } from "applesauce-core/helpers";
import { map } from "rxjs";

import { GroupInfo, parseGroupInfo } from "../helpers/groups";
import { groupInfoLoader } from "../services/loaders";

/** A model that fetches the groups information from the relay */
export function GroupInfoQuery(group: GroupPointer): Model<GroupInfo> {
  return () => groupInfoLoader({ value: group.id, relays: [group.relay] }).pipe(map(parseGroupInfo));
}
