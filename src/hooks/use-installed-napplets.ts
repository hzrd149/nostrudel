import { use$ } from "applesauce-react/hooks";

import { installedNapplets$, intentHandlerPreferences$ } from "../services/installed-napplets";

/** Installed napplets, most recently opened first. Re-renders on install, uninstall, and open. */
export default function useInstalledNapplets() {
  return use$(installedNapplets$);
}

/** Default intent handler addresses keyed by `archetype/action` */
export function useIntentHandlerPreferences() {
  return use$(intentHandlerPreferences$);
}
