import { Alert, AlertDescription, AlertIcon } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import { isNappletManifestKind, parseNappletPointer } from "../../helpers/nostr/napplets";
import useInstalledNapplets from "../../hooks/use-installed-napplets";
import { getInstalledNappletByCatalogId, getInstalledNappletForArchetype } from "../../services/installed-napplets";
import { setIntentTargetOpener } from "../../services/napplet-intent-targets";
import { NappletRouteLoader } from "../napplets/napplet";

export default function AppView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const installed = useInstalledNapplets();
  const pointer = useMemo(() => (id ? parseNappletPointer(id) : undefined), [id]);
  const installedNapplet = useMemo(() => id && getInstalledNappletForArchetype(id, installed), [id, installed]);

  // Intents invoked by the running napplet open their handler by naddr, which is unambiguous
  useEffect(() => {
    setIntentTargetOpener((catalogId) => {
      const handler = getInstalledNappletByCatalogId(catalogId);
      if (!handler) return false;

      navigate(`/app/${handler.address}`);
      return true;
    });

    return () => setIntentTargetOpener(null);
  }, [navigate]);

  if (id && pointer?.type === "naddr" && isNappletManifestKind(pointer.data.kind)) {
    return <NappletRouteLoader address={id} pointer={pointer} />;
  }

  if (id && installedNapplet) {
    const installedPointer = parseNappletPointer(installedNapplet.address);
    if (installedPointer) return <NappletRouteLoader address={installedNapplet.address} pointer={installedPointer} />;

    return (
      <SimpleView title="App">
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Installed app has an invalid address.</AlertDescription>
        </Alert>
      </SimpleView>
    );
  }

  return (
    <SimpleView title="App not found">
      <Alert status="warning">
        <AlertIcon />
        <AlertDescription>Could not find an installed app or NIP-5D manifest for this route.</AlertDescription>
      </Alert>
    </SimpleView>
  );
}
