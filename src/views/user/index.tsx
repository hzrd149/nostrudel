import useUserProfile from "../../hooks/use-user-profile";
import { getDisplayName } from "../../helpers/nostr/profile";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelays } from "../../hooks/use-client-relays";
import relayScoreboardService from "../../services/relay-scoreboard";
import { AdditionalRelayProvider } from "../../providers/local/additional-relay-context";
import { unique } from "../../helpers/array";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import SimpleNavItem from "../../components/layout/presets/simple-nav-item";
import { Box, Flex, Heading, IconButton } from "@chakra-ui/react";
import UserAvatar from "../../components/user/user-avatar";
import { DirectMessagesIcon } from "../../components/icons";
import RouterLink from "../../components/router-link";
import UserName from "../../components/user/user-name";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import UserAboutContent from "../../components/user/user-about-content";

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

  const metadata = useUserProfile(pubkey, userTopRelays, true);
  useAppTitle(getDisplayName(metadata, pubkey));

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
          {/* <IconButton
            icon={<DirectMessagesIcon boxSize={5} />}
            as={RouterLink}
            to={`/messages/${pubkey}`}
            aria-label="Direct Message"
            colorScheme="blue"
            rounded="full"
            position="absolute"
            bottom="-6"
            right="4"
            size="lg"
          /> */}
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
