import { useMemo } from "react";
import { Divider, Spacer } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { ReadonlyAccount } from "applesauce-accounts/accounts";
import { QuestionIcon } from "@chakra-ui/icons";

import { LightningIcon, SettingsIcon } from "../../icons";
import Package from "../../icons/package";
import useRecentIds from "../../../hooks/use-recent-ids";
import { defaultFavoriteApps, internalApps, internalTools } from "../../navigation/apps";
import NavItem from "./nav-item";
import Plus from "../../icons/plus";
import useFavoriteInternalIds from "../../../hooks/use-favorite-internal-ids";

export default function NavItems() {
  const account = useActiveAccount();

  const { ids: favorites = defaultFavoriteApps } = useFavoriteInternalIds("apps", "app");
  const { recent } = useRecentIds("apps", 3);

  const favoriteApps = useMemo(() => {
    const internal = [...internalApps, ...internalTools];
    return favorites.map((id) => internal.find((app) => app.id === id)).filter((a) => !!a);
  }, [favorites]);

  const recentApps = useMemo(() => {
    const internal = [...internalApps, ...internalTools];
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
