import { Alert, AlertDescription, AlertIcon } from "@chakra-ui/react";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import {
  NAPPLET_INTENT_PARAM,
  isNappletManifestKind,
  parseNappletIntent,
  parseNappletPointer,
} from "../../helpers/nostr/napplets";
import { getInstalledNappletByArchetype, getInstalledNappletForIntent } from "../../services/installed-napplets";
import { NappletRouteLoader } from "../napplets/napplet";

export default function AppView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const pointer = useMemo(() => (id ? parseNappletPointer(id) : undefined), [id]);
  const intent = useMemo(() => parseNappletIntent(searchParams.get(NAPPLET_INTENT_PARAM)), [searchParams]);
  const installedNapplet = useMemo(() => {
    if (!id) return undefined;
    if (intent?.archetype === id) return getInstalledNappletForIntent(id, intent.action);
    return getInstalledNappletByArchetype(id);
  }, [id, intent]);

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
