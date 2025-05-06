import { encodeDecodeResult } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import { EmbedEventPointerCard } from "../../../components/embed-event/card";
import OpenGraphCard from "../../../components/open-graph/open-graph-card";
import { getGoalEventPointers, getGoalLinks } from "../../../helpers/nostr/goal";

export default function GoalContents({ goal }: { goal: NostrEvent }) {
  const pointers = getGoalEventPointers(goal);
  const links = getGoalLinks(goal);

  return (
    <>
      {pointers.map((pointer) => (
        <EmbedEventPointerCard key={encodeDecodeResult(pointer)} pointer={pointer} />
      ))}
      {links.map((link) => (
        <OpenGraphCard key={link} url={new URL(link)} />
      ))}
    </>
  );
}
