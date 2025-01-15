import { useMemo } from "react";
import { Box, Button, ButtonProps, Text } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { nip19 } from "nostr-tools";

import {
  DirectMessagesIcon,
  NotificationsIcon,
  ProfileIcon,
  RelayIcon,
  SearchIcon,
  SettingsIcon,
  LogoutIcon,
  NotesIcon,
  LightningIcon,
} from "../icons";
import useCurrentAccount from "../../hooks/use-current-account";
import accountService from "../../services/account";
import PuzzlePiece01 from "../icons/puzzle-piece-01";
import Package from "../icons/package";
import Rocket02 from "../icons/rocket-02";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import KeyboardShortcut from "../keyboard-shortcut";
import useRecentIds from "../../hooks/use-recent-ids";
import { internalApps, internalTools } from "../../views/other-stuff/apps";
import { App, AppIcon } from "../../views/other-stuff/component/app-card";

export default function NavItems() {
  const location = useLocation();
  const account = useCurrentAccount();

  const showShortcuts = useBreakpointValue({ base: false, md: true });

  const buttonProps: ButtonProps = {
    py: "2",
    justifyContent: "flex-start",
    variant: "link",
  };

  let active = "";
  if (location.pathname.startsWith("/n/")) active = "notes";
  else if (location.pathname === "/") active = "notes";
  else if (location.pathname.startsWith("/notifications")) active = "notifications";
  else if (location.pathname.startsWith("/launchpad")) active = "launchpad";
  else if (location.pathname.startsWith("/discovery")) active = "discovery";
  else if (location.pathname.startsWith("/wallet")) active = "wallet";
  else if (location.pathname.startsWith("/dm")) active = "dm";
  else if (location.pathname.startsWith("/streams")) active = "streams";
  else if (location.pathname.startsWith("/relays")) active = "relays";
  else if (location.pathname.startsWith("/r/")) active = "relays";
  else if (location.pathname.startsWith("/lists")) active = "lists";
  else if (location.pathname.startsWith("/channels")) active = "channels";
  else if (location.pathname.startsWith("/goals")) active = "goals";
  else if (location.pathname.startsWith("/badges")) active = "badges";
  else if (location.pathname.startsWith("/emojis")) active = "emojis";
  else if (location.pathname.startsWith("/settings")) active = "settings";
  else if (location.pathname.startsWith("/tools")) active = "tools";
  else if (location.pathname.startsWith("/search")) active = "search";
  else if (location.pathname.startsWith("/tracks")) active = "tracks";
  else if (location.pathname.startsWith("/t/")) active = "search";
  else if (location.pathname.startsWith("/torrents")) active = "tools";
  else if (location.pathname.startsWith("/map")) active = "tools";
  else if (location.pathname.startsWith("/profile")) active = "profile";
  else if (location.pathname.startsWith("/support")) active = "support";
  else if (location.pathname.startsWith("/other-stuff")) active = "other-stuff";
  else if (
    account &&
    (location.pathname.startsWith("/u/" + nip19.npubEncode(account.pubkey)) ||
      location.pathname.startsWith("/u/" + account.pubkey))
  ) {
    active = "profile";
  }

  const { recent: recentApps } = useRecentIds("apps");
  const otherStuff = useMemo(() => {
    const internal = [...internalApps, ...internalTools];
    const apps = recentApps.map((id) => internal.find((app) => app.id === id)).filter(Boolean) as App[];
    if (apps.length > 3) {
      apps.length = 3;
    } else {
      if (apps.length < 3 && !apps.some((a) => a.id === "streams")) {
        apps.push(internal.find((app) => app.id === "streams")!);
      }
      if (apps.length < 3 && !apps.some((a) => a.id === "articles")) {
        apps.push(internal.find((app) => app.id === "articles")!);
      }
      if (apps.length < 3 && !apps.some((a) => a.id === "channels")) {
        apps.push(internal.find((app) => app.id === "channels")!);
      }
    }
    return apps;
  }, [recentApps]);

  return (
    <>
      <Button
        as={RouterLink}
        to="/launchpad"
        leftIcon={<Rocket02 boxSize={6} />}
        colorScheme={active === "launchpad" ? "primary" : undefined}
        {...buttonProps}
      >
        Launchpad
        {showShortcuts && <KeyboardShortcut letter="l" requireMeta ml="auto" />}
      </Button>
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
        to="/discovery"
        leftIcon={<PuzzlePiece01 boxSize={6} />}
        colorScheme={active === "discovery" ? "primary" : undefined}
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
            {showShortcuts && <KeyboardShortcut letter="i" requireMeta ml="auto" />}
          </Button>
          <Button
            as={RouterLink}
            to={"/dm"}
            leftIcon={<DirectMessagesIcon boxSize={6} />}
            colorScheme={active === "dm" ? "primary" : undefined}
            {...buttonProps}
          >
            Messages
            {showShortcuts && <KeyboardShortcut letter="m" requireMeta ml="auto" />}
          </Button>
          {/* <Button
            as={RouterLink}
            to="/wallet"
            leftIcon={<Wallet02 boxSize={6} />}
            colorScheme={active === "wallet" ? "primary" : undefined}
            {...buttonProps}
          >
            Wallet
          </Button> */}
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
        {showShortcuts && <KeyboardShortcut letter="k" requireMeta ml="auto" />}
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
      {otherStuff.map((app) => (
        <Button
          key={app.id}
          as={RouterLink}
          to={app.to}
          leftIcon={<AppIcon size="6" app={app} />}
          colorScheme={typeof app.to === "string" && location.pathname.startsWith(app.to) ? "primary" : undefined}
          {...buttonProps}
        >
          {app.title}
        </Button>
      ))}
      <Button
        as={RouterLink}
        to="/other-stuff"
        leftIcon={<Package boxSize={6} />}
        colorScheme={active === "other-stuff" ? "primary" : undefined}
        {...buttonProps}
      >
        More
        {showShortcuts && <KeyboardShortcut letter="o" requireMeta ml="auto" />}
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
      <Button
        as={RouterLink}
        to="/support"
        leftIcon={<LightningIcon boxSize={6} color="yellow.400" />}
        colorScheme={active === "support" ? "primary" : undefined}
        {...buttonProps}
      >
        Support
      </Button>
      {account && (
        <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon boxSize={6} />} {...buttonProps}>
          Logout
        </Button>
      )}
    </>
  );
}
