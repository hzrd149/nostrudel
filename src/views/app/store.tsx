import { useNavigate } from "react-router-dom";
import SimpleView from "../../components/layout/presets/simple-view";
import NappletDiscovery from "../../components/napplets/napplet-discovery";
import { getNappletAddress } from "../../helpers/nostr/napplets";

export default function NappletDiscoveryView() {
  const navigate = useNavigate();
  return (
    <SimpleView title="Discover napplets">
      <NappletDiscovery onSelect={(event) => navigate(`/app/${getNappletAddress(event)}`)} />
    </SimpleView>
  );
}
