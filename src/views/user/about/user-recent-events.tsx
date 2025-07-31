import { Badge, Button, ButtonProps, ComponentWithAs, Flex, IconProps, useDisclosure } from "@chakra-ui/react";
import { Filter, kinds, nip19, NostrEvent } from "nostr-tools";
import { Link as RouteLink, To } from "react-router-dom";

import {
  ArticleIcon,
  BookmarkIcon,
  ChannelsIcon,
  DirectMessagesIcon,
  EmojiPacksIcon,
  ListsIcon,
  NotesIcon,
  RelayIcon,
  RepostIcon,
} from "../../../components/icons";
import AnnotationQuestion from "../../../components/icons/annotation-question";
import { getSharableEventAddress } from "../../../services/relay-hints";
import { npubEncode } from "nostr-tools/nip19";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import { useReadRelays } from "../../../hooks/use-client-relays";
import AlertTriangle from "../../../components/icons/alert-triangle";
import MessageSquare02 from "../../../components/icons/message-square-02";
import Camera01 from "../../../components/icons/camera-01";
import { PICTURE_POST_KIND } from "applesauce-core/helpers";

type KnownKind = {
  kind: number;
  name?: string;
  icon?: ComponentWithAs<"svg", IconProps>;
  link?: (events: NostrEvent[], pubkey: string) => LinkNav | undefined;
  single?: (event: NostrEvent, pubkey: string) => LinkNav | undefined;
  multiple?: (events: NostrEvent[], pubkey: string) => LinkNav | undefined;
};

type LinkNav = string | { to: To; state: any };

function singleLink(event: NostrEvent, _pubkey: string) {
  const address = getSharableEventAddress(event);
  return address ? `/l/${address}` : undefined;
}
function consoleLink(events: NostrEvent[], pubkey: string) {
  const kinds = new Set(events.map((e) => e.kind));
  return {
    to: "/tools/console",
    state: { filter: { kinds: Array.from(kinds), authors: [pubkey] } satisfies Filter },
  };
}

const KnownKinds: KnownKind[] = [
  {
    kind: kinds.ShortTextNote,
    name: "Notes",
    icon: NotesIcon,
    link: (_, p) => `/u/${npubEncode(p)}/notes`,
  },
  {
    kind: kinds.Repost,
    name: "Repost",
    icon: RepostIcon,
    link: (_e, p) => `/u/${npubEncode(p)}/notes`,
  },
  {
    kind: kinds.GenericRepost,
    name: "Generic Repost",
    icon: RepostIcon,
    link: (_e, p) => `/u/${npubEncode(p)}/notes`,
  },

  {
    kind: kinds.LongFormArticle,
    name: "Articles",
    icon: ArticleIcon,
    link: (_, p) => `/u/${npubEncode(p)}/articles`,
  },

  {
    kind: PICTURE_POST_KIND,
    name: "Pictures",
    icon: Camera01,
    link: (_, p) => `/u/${npubEncode(p)}/pictures`,
  },

  {
    kind: kinds.EncryptedDirectMessage,
    name: "Legacy DMs",
    icon: DirectMessagesIcon,
    link: (_e, p) => `/u/${nip19.npubEncode(p)}/dms`,
  },

  {
    kind: kinds.PublicChatsList,
    icon: ChannelsIcon,
    name: "Public Chats",
    link: (_e, p) => `/u/${npubEncode(p)}/lists`,
  },

  { kind: kinds.Followsets, name: "People Lists", icon: ListsIcon, link: (_e, p) => `/u/${npubEncode(p)}/lists` },
  { kind: kinds.Genericlists, icon: ListsIcon, name: "Generic Lists", link: (_e, p) => `/u/${npubEncode(p)}/lists` },
  { kind: kinds.Relaysets, icon: RelayIcon, name: "Relay Sets" },
  { kind: kinds.Bookmarksets, icon: BookmarkIcon, name: "Bookmarks", link: (_e, p) => `/u/${npubEncode(p)}/lists` },

  { kind: kinds.Report, name: "Report", icon: AlertTriangle, link: (_e, p) => `/u/${npubEncode(p)}/reports` },

  { kind: kinds.Emojisets, name: "Emojis", icon: EmojiPacksIcon, link: (_e, p) => `/u/${npubEncode(p)}/emojis` },

  { kind: kinds.Handlerinformation, name: "Application" },
  { kind: kinds.Handlerrecommendation, name: "App recommendation" },

  { kind: kinds.BadgeAward, name: "Badge Award" },

  { kind: kinds.LiveChatMessage, icon: MessageSquare02, name: "Stream Chat" },

  // common kinds
  { kind: kinds.Metadata, name: "Metadata" },
  { kind: kinds.Contacts, name: "Contacts" },
  { kind: kinds.EventDeletion, name: "Deletion" },
  { kind: kinds.Reaction, name: "Reaction" },

  // NIP-51 lists
  { kind: kinds.RelayList, name: "Relay List" },
  { kind: kinds.BookmarkList, name: "Bookmark List" },
  { kind: kinds.InterestsList, name: "Interests List" },
  { kind: kinds.Pinlist, name: "Pin List" },
  { kind: kinds.UserEmojiList, name: "User Emoji List" },
  { kind: kinds.Mutelist, name: "Mute List" },
  { kind: kinds.CommunitiesList, name: "Communities List" },
  { kind: kinds.SearchRelaysList, name: "Search Relays List" },
  { kind: kinds.BlockedRelaysList, name: "Blocked Relays List" },

  { kind: 30008, name: "Badges" }, // profile badges

  { kind: kinds.Application, name: "App data" },
];

function EventKindButton({
  kind,
  events,
  pubkey,
  known,
}: { kind: number; events: NostrEvent[]; pubkey: string; known?: KnownKind } & Omit<ButtonProps, "icon">) {
  const Icon = known?.icon;
  const icon = Icon ? <Icon boxSize={10} mb="4" /> : <AnnotationQuestion boxSize={10} mb="4" />;

  let nav = known?.link?.(events, pubkey);
  if (!nav) {
    if (events.length === 1) {
      nav = known?.single?.(events[0], pubkey) || singleLink(events[0], pubkey);
    } else {
      nav = known?.multiple?.(events, pubkey) || consoleLink(events, pubkey);
    }
  }

  const linkProps = typeof nav === "string" ? { to: nav } : nav;

  return (
    <Button
      as={RouteLink}
      {...linkProps}
      variant="outline"
      leftIcon={icon}
      h="36"
      w="36"
      flexDirection="column"
      position="relative"
    >
      <Badge position="absolute" top="2" right="2" fontSize="md">
        {events.length}
      </Badge>
      {known?.name || kind}
    </Button>
  );
}

export default function UserRecentEvents({ pubkey }: { pubkey: string }) {
  const outbox = useUserOutbox(pubkey);
  const readRelays = useReadRelays();
  const { timeline: recent } = useTimelineLoader(`${pubkey}-recent-events`, outbox || readRelays, {
    authors: [pubkey],
    limit: 100,
  });
  const all = useDisclosure();

  // const recent = useStoreQuery(TimelineQuery, [{ authors: [pubkey], limit: 100 }]);

  const byKind = recent?.reduce(
    (dir, event) => {
      if (dir[event.kind]) dir[event.kind].events.push(event);
      else
        dir[event.kind] = {
          known: KnownKinds.find((k) => k.kind === event.kind),
          events: [event],
        };

      return dir;
    },
    {} as Record<number, { events: NostrEvent[]; known?: KnownKind }>,
  );

  return (
    <Flex gap="2" wrap="wrap">
      {byKind &&
        Object.entries(byKind)
          .filter(([_, { known }]) => !!known || all.isOpen)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([kind, { events, known }]) => (
            <EventKindButton key={kind} kind={parseInt(kind)} events={events} pubkey={pubkey} known={known} />
          ))}
      {!all.isOpen && (
        <Button variant="link" p="4" onClick={all.onOpen}>
          Show more ({Object.entries(byKind).filter(([_, { known }]) => !!known).length})
        </Button>
      )}
    </Flex>
  );
}
