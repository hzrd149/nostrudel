import { Box, Button, ButtonProps, Link, Text, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { nip19 } from "nostr-tools";

import {
  BadgeIcon,
  DirectMessagesIcon,
  CommunityIcon,
  EmojiPacksIcon,
  GoalIcon,
  ListsIcon,
  LiveStreamIcon,
  NotificationsIcon,
  ProfileIcon,
  RelayIcon,
  SearchIcon,
  SettingsIcon,
  ToolsIcon,
  LogoutIcon,
  NotesIcon,
  LightningIcon,
  ChannelsIcon,
  ThingsIcon,
} from "../icons";
import useCurrentAccount from "../../hooks/use-current-account";
import accountService from "../../services/account";
import { useLocalStorage } from "react-use";
import ZapModal from "../event-zap-modal";
import dayjs from "dayjs";
import PuzzlePiece01 from "../icons/puzzle-piece-01";

export default function NavItems() {
  const location = useLocation();
  const account = useCurrentAccount();

  const donateModal = useDisclosure();
  const [lastDonate, setLastDonate] = useLocalStorage<number>("last-donate");

  const buttonProps: ButtonProps = {
    py: "2",
    justifyContent: "flex-start",
    variant: "link",
  };

  let active = "notes";
  if (location.pathname.startsWith("/notifications")) active = "notifications";
  else if (location.pathname.startsWith("/dvm")) active = "dvm";
  else if (location.pathname.startsWith("/dm")) active = "dm";
  else if (location.pathname.startsWith("/streams")) active = "streams";
  else if (location.pathname.startsWith("/relays")) active = "relays";
  else if (location.pathname.startsWith("/lists")) active = "lists";
  else if (location.pathname.startsWith("/communities")) active = "communities";
  else if (location.pathname.startsWith("/channels")) active = "channels";
  else if (location.pathname.startsWith("/c/")) active = "communities";
  else if (location.pathname.startsWith("/goals")) active = "goals";
  else if (location.pathname.startsWith("/badges")) active = "badges";
  else if (location.pathname.startsWith("/emojis")) active = "emojis";
  else if (location.pathname.startsWith("/things")) active = "things";
  else if (location.pathname.startsWith("/settings")) active = "settings";
  else if (location.pathname.startsWith("/tools")) active = "tools";
  else if (location.pathname.startsWith("/search")) active = "search";
  else if (location.pathname.startsWith("/t/")) active = "search";
  else if (location.pathname.startsWith("/torrents")) active = "tools";
  else if (location.pathname.startsWith("/map")) active = "tools";
  else if (location.pathname.startsWith("/profile")) active = "profile";
  else if (
    account &&
    (location.pathname.startsWith("/u/" + nip19.npubEncode(account.pubkey)) ||
      location.pathname.startsWith("/u/" + account.pubkey))
  ) {
    active = "profile";
  }

  return (
    <>
      <Button
        as={RouterLink}
        to="/"
        leftIcon={<NotesIcon boxSize={6} />}
        colorScheme={active === "notes" ? "primary" : undefined}
        {...buttonProps}
      >
        Notes
      </Button>
      <Button
        as={RouterLink}
        to="/dvm"
        leftIcon={<PuzzlePiece01 boxSize={6} />}
        colorScheme={active === "dvm" ? "primary" : undefined}
        {...buttonProps}
      >
        Discover
      </Button>
      {account && (
        <>
          <Button
            as={RouterLink}
            to="/notifications"
            leftIcon={<NotificationsIcon boxSize={6} />}
            colorScheme={active === "notifications" ? "primary" : undefined}
            {...buttonProps}
          >
            Notifications
          </Button>
          <Button
            as={RouterLink}
            to={"/dm"}
            leftIcon={<DirectMessagesIcon boxSize={6} />}
            colorScheme={active === "dm" ? "primary" : undefined}
            {...buttonProps}
          >
            Messages
          </Button>
        </>
      )}
      <Button
        as={RouterLink}
        to="/search"
        leftIcon={<SearchIcon boxSize={6} />}
        colorScheme={active === "search" ? "primary" : undefined}
        {...buttonProps}
      >
        Search
      </Button>
      {account?.pubkey && (
        <Button
          as={RouterLink}
          to={"/u/" + nip19.npubEncode(account.pubkey)}
          leftIcon={<ProfileIcon boxSize={6} />}
          colorScheme={active === "profile" ? "primary" : undefined}
          {...buttonProps}
        >
          Profile
        </Button>
      )}
      <Button
        as={RouterLink}
        to="/relays"
        leftIcon={<RelayIcon boxSize={6} />}
        colorScheme={active === "relays" ? "primary" : undefined}
        {...buttonProps}
      >
        Relays
      </Button>
      <Text position="relative" py="2" color="GrayText">
        Other Stuff
      </Text>
      <Button
        as={RouterLink}
        to="/streams"
        leftIcon={<LiveStreamIcon boxSize={6} />}
        colorScheme={active === "streams" ? "primary" : undefined}
        {...buttonProps}
      >
        Streams
      </Button>
      <Button
        as={RouterLink}
        to="/communities"
        leftIcon={<CommunityIcon boxSize={6} />}
        colorScheme={active === "communities" ? "primary" : undefined}
        {...buttonProps}
      >
        Communities
      </Button>
      <Button
        as={RouterLink}
        to="/channels"
        leftIcon={<ChannelsIcon boxSize={6} />}
        colorScheme={active === "channels" ? "primary" : undefined}
        {...buttonProps}
      >
        Channels
      </Button>
      <Button
        as={RouterLink}
        to="/lists"
        leftIcon={<ListsIcon boxSize={6} />}
        colorScheme={active === "lists" ? "primary" : undefined}
        {...buttonProps}
      >
        Lists
      </Button>
      <Button
        as={RouterLink}
        to="/goals"
        leftIcon={<GoalIcon boxSize={6} />}
        colorScheme={active === "goals" ? "primary" : undefined}
        {...buttonProps}
      >
        Goals
      </Button>
      <Button
        as={RouterLink}
        to="/badges"
        leftIcon={<BadgeIcon boxSize={6} />}
        colorScheme={active === "badges" ? "primary" : undefined}
        {...buttonProps}
      >
        Badges
      </Button>
      <Button
        as={RouterLink}
        to="/emojis"
        leftIcon={<EmojiPacksIcon boxSize={6} />}
        colorScheme={active === "emojis" ? "primary" : undefined}
        {...buttonProps}
      >
        Emojis
      </Button>
      <Button
        as={RouterLink}
        to="/things"
        leftIcon={<ThingsIcon boxSize={6} />}
        colorScheme={active === "things" ? "primary" : undefined}
        {...buttonProps}
      >
        Things
      </Button>
      <Button
        as={RouterLink}
        to="/tools"
        leftIcon={<ToolsIcon boxSize={6} />}
        colorScheme={active === "tools" ? "primary" : undefined}
        {...buttonProps}
      >
        Tools
      </Button>
      <Box h="4" />
      <Button
        as={RouterLink}
        to="/settings"
        leftIcon={<SettingsIcon boxSize={6} />}
        colorScheme={active === "settings" ? "primary" : undefined}
        {...buttonProps}
      >
        Settings
      </Button>
      {(lastDonate === undefined || dayjs.unix(lastDonate).isBefore(dayjs().subtract(1, "week"))) && (
        <Button
          as={Link}
          leftIcon={<LightningIcon boxSize={6} color="yellow.400" />}
          href="https://geyser.fund/project/nostrudel"
          isExternal
          onClick={(e) => {
            e.preventDefault();
            donateModal.onOpen();
          }}
          {...buttonProps}
        >
          Donate
        </Button>
      )}
      {donateModal.isOpen && (
        <ZapModal
          isOpen
          pubkey="713978c3094081b34fcf2f5491733b0c22728cd3b7a6946519d40f5f08598af8"
          onClose={donateModal.onClose}
          onZapped={() => setLastDonate(dayjs().unix())}
        />
      )}
      {account && (
        <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon boxSize={6} />} {...buttonProps}>
          Logout
        </Button>
      )}
    </>
  );
}
