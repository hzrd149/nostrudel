import { useMemo } from "react";
import { Spacer } from "@chakra-ui/react";
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
  SettingsIcon,
} from "../../icons";
import useCurrentAccount from "../../../hooks/use-current-account";
import PuzzlePiece01 from "../../icons/puzzle-piece-01";
import Package from "../../icons/package";
import Rocket02 from "../../icons/rocket-02";
import useRecentIds from "../../../hooks/use-recent-ids";
import { internalApps, internalTools } from "../../../views/other-stuff/apps";
import { App } from "../../../views/other-stuff/component/app-card";
import NavItem from "./nav-item";
import { QuestionIcon } from "@chakra-ui/icons";
import Plus from "../../icons/plus";

export default function NavItems() {
  const location = useLocation();
  const account = useCurrentAccount();

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
      {account && account.readonly !== false && (
        <NavItem icon={Plus} label="Create new" colorScheme="primary" to="/new" variant="solid" />
      )}
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
      <Spacer />
      <NavItem to="/support" icon={LightningIcon} label="Support" />
      <NavItem label="Settings" icon={SettingsIcon} to="/settings" />
      {/* <TaskManagerButtons mt="auto" flexShrink={0} /> */}
    </>
  );
}
