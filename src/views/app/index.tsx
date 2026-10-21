import { Alert, AlertDescription, AlertIcon } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import {
  NAPPLET_INTENT_PARAM,
  encodeNappletIntent,
  isNappletManifestKind,
  parseNappletIntent,
  parseNappletPointer,
} from "../../helpers/nostr/napplets";
import useInstalledNapplets from "../../hooks/use-installed-napplets";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";
import { getInstalledNappletByArchetype, getInstalledNappletForIntent } from "../../services/installed-napplets";
import { NappletRouteLoader } from "../napplets/napplet";

export default function AppView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setIntentNavigator } = useNappletShell();
  const installed = useInstalledNapplets();
  const pointer = useMemo(() => (id ? parseNappletPointer(id) : undefined), [id]);
  const intent = useMemo(() => parseNappletIntent(searchParams.get(NAPPLET_INTENT_PARAM)), [searchParams]);
  const installedNapplet = useMemo(() => {
    if (!id) return undefined;
    if (intent?.archetype === id) return getInstalledNappletForIntent(id, intent.action, installed);
    return getInstalledNappletByArchetype(id, installed);
  }, [id, intent, installed]);

  // Intents invoked by the running napplet open their handler by naddr, which is unambiguous
  useEffect(() => {
    setIntentNavigator((nextIntent, handler) => {
      navigate(`/app/${handler.address}?${NAPPLET_INTENT_PARAM}=${encodeNappletIntent(nextIntent)}`);
    });

    return () => setIntentNavigator(null);
  }, [navigate, setIntentNavigator]);

  if (id && pointer?.type === "naddr" && isNappletManifestKind(pointer.data.kind)) {
    return <NappletRouteLoader address={id} pointer={pointer} intent={intent} />;
  }

  if (id && installedNapplet) {
    const installedPointer = parseNappletPointer(installedNapplet.address);
    if (installedPointer)
      return <NappletRouteLoader address={installedNapplet.address} pointer={installedPointer} intent={intent} />;

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
