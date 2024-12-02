import { encodeDecodeResult } from "applesauce-core/helpers";

import { EmbedEventPointer } from "../../../components/embed-event";
import { getGoalEventPointers, getGoalLinks } from "../../../helpers/nostr/goal";
import { NostrEvent } from "../../../types/nostr-event";
import OpenGraphCard from "../../../components/open-graph/open-graph-card";

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
