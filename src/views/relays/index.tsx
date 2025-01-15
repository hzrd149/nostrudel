import useCurrentAccount from "../../hooks/use-current-account";
import Database01 from "../../components/icons/database-01";
import { AtIcon, RelayIcon, SearchIcon } from "../../components/icons";
import Mail02 from "../../components/icons/mail-02";
import { useUserDNSIdentity } from "../../hooks/use-user-dns-identity";
import UserSquare from "../../components/icons/user-square";
import Image01 from "../../components/icons/image-01";
import Server05 from "../../components/icons/server-05";
import SimpleNavItem from "../../components/layout/presets/simple-nav-item";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";

export default function RelaysView() {
  const account = useCurrentAccount();
  const nip05 = useUserDNSIdentity(account?.pubkey);

  return (
    <SimpleParentView title="Relays" path="/relays">
      <SimpleNavItem to="/relays/app" leftIcon={<RelayIcon boxSize={6} />}>
        App Relays
      </SimpleNavItem>
      <SimpleNavItem to="/relays/cache" leftIcon={<Database01 boxSize={6} />}>
        Cache Relay
      </SimpleNavItem>
      {account && (
        <>
          <SimpleNavItem to="/relays/mailboxes" leftIcon={<Mail02 boxSize={6} />}>
            Mailboxes
          </SimpleNavItem>
          <SimpleNavItem to="/relays/media-servers" leftIcon={<Image01 boxSize={6} />}>
            Media Servers
          </SimpleNavItem>
          <SimpleNavItem to="/relays/search" leftIcon={<SearchIcon boxSize={6} />}>
            Search Relays
          </SimpleNavItem>
        </>
      )}
      <SimpleNavItem to="/relays/webrtc" leftIcon={<Server05 boxSize={6} />}>
        WebRTC Relays
      </SimpleNavItem>
      {nip05?.exists && (
        <SimpleNavItem to="/relays/nip05" leftIcon={<AtIcon boxSize={6} />}>
          NIP-05 Relays
        </SimpleNavItem>
      )}
      {account && (
        <>
          <SimpleNavItem to="/relays/contacts" leftIcon={<UserSquare boxSize={6} />}>
            Contact List Relays
          </SimpleNavItem>
        </>
      )}
    </SimpleParentView>
  );
}
