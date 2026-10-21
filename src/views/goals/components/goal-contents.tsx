import { ZapGoal } from "applesauce-common/casts";
import { encodeDecodeResult } from "applesauce-core/helpers";

import { EmbedEventPointerCard } from "../../../components/embed-event/card";
import OpenGraphCard from "../../../components/open-graph/open-graph-card";
import { getGoalEventPointers, getGoalLinks } from "../../../helpers/nostr/goal";

export default function GoalContents({ goal }: { goal: ZapGoal }) {
  const pointers = getGoalEventPointers(goal.event);
  const links = getGoalLinks(goal.event);

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
