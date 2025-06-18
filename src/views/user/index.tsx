import { Flex, Heading } from "@chakra-ui/react";
import { useObservableMemo } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import SimpleNavItem from "../../components/layout/presets/simple-nav-item";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import UserAvatar from "../../components/user/user-avatar";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import UserName from "../../components/user/user-name";
import { unique } from "../../helpers/array";
import { getDisplayName } from "../../helpers/nostr/profile";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelays } from "../../hooks/use-client-relays";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import useUserProfile from "../../hooks/use-user-profile";
import { AdditionalRelayProvider } from "../../providers/local/additional-relay-context";
import { profileLoader } from "../../services/loaders";
import relayScoreboardService from "../../services/relay-scoreboard";

const tabs = [
  { label: "About", path: "about" },
  { label: "Notes", path: "notes" },
  { label: "Articles", path: "articles" },
  { label: "Streams", path: "streams" },
  { label: "Media", path: "media" },
  { label: "Zaps", path: "zaps" },
  { label: "Lists", path: "lists" },
  { label: "Following", path: "following" },
  { label: "Reactions", path: "reactions" },
  { label: "Relays", path: "relays" },
  { label: "Goals", path: "goals" },
  { label: "Tracks", path: "tracks" },
  { label: "Videos", path: "videos" },
  { label: "Files", path: "files" },
  { label: "Emojis", path: "emojis" },
  { label: "Torrents", path: "torrents" },
  { label: "Reports", path: "reports" },
  { label: "Followers", path: "followers" },
  { label: "Muted by", path: "muted-by" },
];

function useUserBestOutbox(pubkey: string, count: number = 4) {
  const mailbox = useUserMailboxes(pubkey);
  const relays = useReadRelays();
  const sorted = relayScoreboardService.getRankedRelays(mailbox?.outboxes.length ? mailbox?.outboxes : relays);
  return !count ? sorted : sorted.slice(0, count);
}

export default function UserView() {
  const { pubkey, relays: pointerRelays = [] } = useParamsProfilePointer();
  const userTopRelays = useUserBestOutbox(pubkey, 4);
  const readRelays = unique([...userTopRelays, ...pointerRelays]);

  const metadata = useUserProfile({ pubkey, relays: userTopRelays });
  useAppTitle(getDisplayName(metadata, pubkey));

  // TMP: force metadata load
  useObservableMemo(
    () => profileLoader({ kind: kinds.Metadata, pubkey, relays: userTopRelays, cache: false }),
    [pubkey],
  );

  return (
    <AdditionalRelayProvider relays={readRelays}>
      <SimpleParentView path="/u/:pubkey" context={{ pubkey }}>
        <Flex
          direction="column"
          gap="2"
          p="4"
          pt="max(1rem, var(--safe-top))"
          backgroundImage={metadata?.banner && `url(${metadata?.banner})`}
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          position="relative"
          rounded="md"
        >
          <UserAvatar pubkey={pubkey} size="xl" float="left" />
        </Flex>
        <Flex direction="column" overflow="hidden">
          <Heading size="md">
            <UserName pubkey={pubkey} isTruncated />
          </Heading>
          <UserDnsIdentity pubkey={pubkey} fontSize="sm" />
        </Flex>
        {tabs.map(({ label, path }) => (
          <SimpleNavItem key={label} to={`./${path}`}>
            {label}
          </SimpleNavItem>
        ))}
      </SimpleParentView>
    </AdditionalRelayProvider>
  );
}
