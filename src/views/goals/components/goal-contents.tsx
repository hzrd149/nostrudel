import { encodeDecodeResult } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import { EmbedEventPointer } from "../../../components/embed-event";
import OpenGraphCard from "../../../components/open-graph/open-graph-card";
import { getGoalEventPointers, getGoalLinks } from "../../../helpers/nostr/goal";

export default function GoalContents({ goal }: { goal: NostrEvent }) {
  const pointers = getGoalEventPointers(goal);
  const links = getGoalLinks(goal);

  return (
    <>
      {pointers.map((pointer) => (
        <EmbedEventPointer key={encodeDecodeResult(pointer)} pointer={pointer} />
      ))}
      {links.map((link) => (
        <OpenGraphCard key={link} url={new URL(link)} />
      ))}
    </>
  );
}
