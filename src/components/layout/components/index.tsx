import { useMemo } from "react";
import { Divider, Spacer } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { ReadonlyAccount } from "applesauce-accounts/accounts";
import { QuestionIcon } from "@chakra-ui/icons";

import { LightningIcon, SettingsIcon } from "../../icons";
import Package from "../../icons/package";
import useRecentIds from "../../../hooks/use-recent-ids";
import { defaultAnonFavoriteApps, defaultUserFavoriteApps, internalApps, internalTools } from "../../navigation/apps";
import NavItem from "./nav-item";
import Plus from "../../icons/plus";
import useFavoriteInternalIds from "../../../hooks/use-favorite-internal-ids";
import { getInstalledNappletPath, getInstalledNapplets } from "../../../services/installed-napplets";

export default function NavItems() {
  const account = useActiveAccount();

  const defaultApps = account ? defaultUserFavoriteApps : defaultAnonFavoriteApps;
  const { ids: favorites = defaultApps } = useFavoriteInternalIds("apps", "app");
  const { recent } = useRecentIds("apps", 3);

  const favoriteApps = useMemo(() => {
    const internal = [...internalApps, ...internalTools];
    return favorites.map((id) => internal.find((app) => app.id === id)).filter((a) => !!a);
  }, [favorites]);

  const recentApps = useMemo(() => {
    const installedNapplets = getInstalledNapplets().map((napplet) => ({
      id: `napplet:${napplet.address}`,
      title: napplet.title,
      description: napplet.description || "Installed NIP-5D napplet",
      icon: undefined,
      to: getInstalledNappletPath(napplet),
    }));
    const internal = [...internalApps, ...internalTools, ...installedNapplets];
    return recent
      .filter((id) => !favorites.includes(id))
      .map((id) => internal.find((app) => app.id === id))
      .filter((a) => !!a);
  }, [recent, favorites]);

  return (
    <>
      {account && !(account instanceof ReadonlyAccount) && (
        <NavItem icon={Plus} label="Create new" colorScheme="primary" to="/new" variant="solid" />
      )}
      {favoriteApps.map((app) => (
        <NavItem key={app.id} to={app.to} icon={app.icon || QuestionIcon} label={app.title} />
      ))}
      <NavItem to="/other-stuff" icon={Package} label="All Apps" />
      {recentApps.length > 0 && (
        <>
          <Divider />
          {recentApps.map((app) => (
            <NavItem key={app.id} to={app.to} icon={app.icon || QuestionIcon} label={app.title} />
          ))}
        </>
      )}
      <Spacer />
      <NavItem to="/support" icon={LightningIcon} label="Support" />
      <NavItem label="Settings" icon={SettingsIcon} to="/settings" />
    </>
  );
}
