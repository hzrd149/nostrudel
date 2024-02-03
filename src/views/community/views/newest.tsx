import { useOutletContext } from "react-router-dom";

import { COMMUNITY_APPROVAL_KIND, buildApprovalMap, getCommunityMods } from "../../../helpers/nostr/communities";
import useSubject from "../../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import useUserMuteFilter from "../../../hooks/use-user-mute-filter";
import ApprovedEvent from "../components/community-approved-post";
import { RouterContext } from "../community-home";

export default function CommunityNewestView() {
  const { community, timeline } = useOutletContext<RouterContext>();
  const muteFilter = useUserMuteFilter();
  const mods = getCommunityMods(community);

  const events = useSubject(timeline.timeline);
  const approvalMap = buildApprovalMap(events, mods);

  const approved = events
    .filter((e) => e.kind !== COMMUNITY_APPROVAL_KIND && approvalMap.has(e.id))
    .map((event) => ({ event, approvals: approvalMap.get(event.id) }))
    .filter((e) => !muteFilter(e.event));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <>
      <IntersectionObserverProvider callback={callback}>
        {approved.map(({ event, approvals }) => (
          <ApprovedEvent key={event.id} event={event} approvals={approvals ?? []} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
