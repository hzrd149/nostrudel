import { useCallback, useMemo } from "react";
import { Flex, Heading, Spacer, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { kinds, NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useActiveAccount } from "applesauce-react/hooks";
import useUserContactList from "../../../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../../../helpers/nostr/lists";
import { useReadRelays } from "../../../hooks/use-client-relays";
import TimelinePage, { useTimelinePageEventFilter } from "../../../components/timeline-page";
import KindSelectionProvider, { useKindSelectionContext } from "../../../providers/local/kind-selection-provider";
import NoteFilterTypeButtons from "../../../components/note-filter-type-buttons";
import TimelineViewTypeButtons from "../../../components/timeline-page/timeline-view-type";
import Telescope from "../../../components/icons/telescope";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import BackButton from "../../../components/router/back-button";
import UserLink from "../../../components/user/user-link";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import { isReply, isRepost } from "../../../helpers/nostr/event";
import SimpleView from "../../../components/layout/presets/simple-view";
import UserName from "../../../components/user/user-name";

function BlindspotFeedPage({ pubkey }: { pubkey: string }) {
  const account = useActiveAccount()!;
  const contacts = useUserContactList(account.pubkey);
  const otherContacts = useUserContactList(pubkey);
  const readRelays = useReadRelays();

  const blindspot = useMemo(() => {
    if (!contacts || !otherContacts) return [];

    const mine = new Set(getPubkeysFromList(contacts).map((p) => p.pubkey));
    const other = new Set(getPubkeysFromList(otherContacts).map((p) => p.pubkey));

    return Array.from(other).filter((p) => !mine.has(p) && p !== account.pubkey);
  }, [contacts, otherContacts, account.pubkey]);

  const showReplies = useDisclosure({ defaultIsOpen: localStorage.getItem("show-replies") === "true" });
  const showReposts = useDisclosure({ defaultIsOpen: localStorage.getItem("show-reposts") !== "false" });

  const timelinePageEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelinePageEventFilter(event);
    },
    [timelinePageEventFilter, showReplies.isOpen, showReposts.isOpen, muteFilter],
  );

  const { kinds } = useKindSelectionContext();
  const { loader, timeline } = useTimelineLoader(
    `blnidspot-${account.pubkey}-${pubkey}-${kinds.join(",")}`,
    readRelays,
    blindspot.length > 0 ? [{ authors: blindspot, kinds }] : undefined,
    { eventFilter },
  );

  if (!contacts)
    return (
      <Flex gap="4" alignItems="center" justifyContent="center" flex={1}>
        <Spinner />
        <Heading size="lg">Loading your contacts...</Heading>
      </Flex>
    );
  if (!otherContacts)
    return (
      <Flex gap="4" alignItems="center" justifyContent="center" flex={1}>
        <Spinner />
        <Heading size="lg">Loading other users contacts...</Heading>
      </Flex>
    );

  return (
    <SimpleView
      title={
        <Text>
          Blindspot with <UserName pubkey={pubkey} />
        </Text>
      }
    >
      <TimelinePage loader={loader} timeline={timeline} />
    </SimpleView>
  );
}

const defaultKinds = [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost];

export default function BlindspotFeedView() {
  const pointer = useParamsProfilePointer("pubkey");

  if (!pointer) return <Navigate to="/discovery/blindspot" />;

  return (
    <KindSelectionProvider initKinds={defaultKinds}>
      <BlindspotFeedPage pubkey={pointer.pubkey} />
    </KindSelectionProvider>
  );
}
