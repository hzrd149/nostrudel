import { useMemo } from "react";
import { ButtonProps } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { nip19 } from "nostr-tools";

import {
  DirectMessagesIcon,
  NotificationsIcon,
  ProfileIcon,
  RelayIcon,
  SearchIcon,
  NotesIcon,
  LightningIcon,
} from "../../icons";
import useCurrentAccount from "../../../hooks/use-current-account";
import PuzzlePiece01 from "../../icons/puzzle-piece-01";
import Package from "../../icons/package";
import Rocket02 from "../../icons/rocket-02";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import useRecentIds from "../../../hooks/use-recent-ids";
import { internalApps, internalTools } from "../../../views/other-stuff/apps";
import { App } from "../../../views/other-stuff/component/app-card";
import NavItem from "./nav-item";
import { QuestionIcon } from "@chakra-ui/icons";

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
      <NavItem to="/launchpad" icon={Rocket02} label="Launchpad" />
      <NavItem to="/" icon={NotesIcon} colorScheme={location.pathname === "/" ? "primary" : "gray"} label="Notes" />
      <NavItem label="Discover" to="/discovery" icon={PuzzlePiece01} />
      {account && (
        <>
          <NavItem to="/notifications" icon={NotificationsIcon} label="Notifications" />
          <NavItem to="/messages" icon={DirectMessagesIcon} label="Messages" />
        </>
      )}
      <NavItem to="/search" icon={SearchIcon} label="Search" />
      {account?.pubkey && <NavItem to={"/u/" + nip19.npubEncode(account.pubkey)} icon={ProfileIcon} label="Profile" />}
      <NavItem to="/relays" icon={RelayIcon} label="Relays" />
      {otherStuff.map((app) => (
        <NavItem key={app.id} to={app.to} icon={app.icon || QuestionIcon} label={app.title} />
      ))}
      <NavItem to="/other-stuff" icon={Package} label="More" />
      <NavItem to="/support" icon={LightningIcon} label="Support" />
    </>
  );
}
