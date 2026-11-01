import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { getNappletIdentity } from "../../../helpers/nostr/napplets";
import NappletPermissionControls from "../../../components/napplets/permission-controls";
import { alwaysAllowed$, identityKey } from "../../../services/napplet-shell/permissions";
import { getNappletPermissions } from "../../../services/napplet-shell/permission-types";

export default function NappletDetailPermissions({ event }: { event: NostrEvent }) {
  const identity = getNappletIdentity(event);
  const saved = use$(alwaysAllowed$)?.find((grant) => identityKey(grant) === identityKey(identity));
  const permissions = [
    ...new Set([...getNappletPermissions(event), ...(saved?.capabilities ?? []), ...(saved?.deniedCapabilities ?? [])]),
  ];
  return <NappletPermissionControls identity={identity} permissions={permissions} />;
}
