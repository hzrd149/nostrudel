import { Button, Spinner, Text } from "@chakra-ui/react";
import { use$, useActiveAccount } from "applesauce-react/hooks";
import type { IntentRequest } from "@kehto/services";
import type { NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import NappletDiscovery from "../../components/napplets/napplet-discovery";
import { getNappletCatalogId, parseNappletPointer } from "../../helpers/nostr/napplets";
import { isHandlerConvention } from "../../helpers/nostr/handler-preferences";
import { logger } from "../../helpers/debug";
import useAsyncAction from "../../hooks/use-async-action";
import {
  handlerManifests$,
  handlerPreferences$,
  localHandlerPreferences$,
  prepareHandlerPreferences,
} from "../../services/handler-preferences";
import { preferredNappletHandlers } from "../../services/napplet-handlers";
import { acceptIntent } from "../../services/napplet-intent-targets";
import { NappletRouteLoader } from "../napplets/napplet";

function IntentView({ request }: { request: IntentRequest }) {
  use$(handlerManifests$);
  use$(handlerPreferences$);
  use$(localHandlerPreferences$);
  const [ready, setReady] = useState(false);
  const launched = useRef(false);
  const { run: prepare, loading: preparing } = useAsyncAction(async () => {
    await prepareHandlerPreferences(request.archetype);
    setReady(true);
  }, [request.archetype]);
  useEffect(() => {
    void prepare();
  }, [prepare]);
  const launch = useCallback(
    (event: NostrEvent) => {
      const acceptance = acceptIntent({ ...request, sender: "nostrudel", handler: getNappletCatalogId(event) });
      void acceptance.completion.catch((error) => logger.extend("NappletNavigation")("Intent delivery failed", error));
    },
    [request],
  );
  const { run: open } = useAsyncAction(async (event: NostrEvent) => launch(event), [launch]);
  const preferred = preferredNappletHandlers(request.archetype, request.convention);
  const defaultHandler = ready && preferred.length === 1 ? preferred[0] : undefined;
  useEffect(() => {
    if (!defaultHandler || launched.current) return;
    launched.current = true;
    void open(defaultHandler);
  }, [defaultHandler, open]);
  if (!ready)
    return (
      <SimpleView title="Napplet">
        {preparing ? <Spinner /> : <Button onClick={prepare}>Load preferences</Button>}
      </SimpleView>
    );
  return (
    <SimpleView title={`Choose a napplet for ${request.archetype}`}>
      <NappletDiscovery request={request} onSelect={launch} />
    </SimpleView>
  );
}

export default function AppView() {
  const { id = "", action = "open" } = useParams<{ id: string; action: string }>();
  const [search] = useSearchParams();
  const account = useActiveAccount();
  const pointer = useMemo(() => parseNappletPointer(id), [id]);
  const request = useMemo(
    () => ({
      archetype: id,
      action,
      convention: `napplet:${id}/${action}`,
      ...(search.size ? { payload: Object.fromEntries(search) } : {}),
    }),
    [id, action, search],
  );
  if (pointer) return <NappletRouteLoader address={id} pointer={pointer} />;
  if (!isHandlerConvention(request.convention, id))
    return (
      <SimpleView title="Napplet">
        <Text>Invalid napplet intent.</Text>
      </SimpleView>
    );
  return <IntentView key={`${account?.pubkey ?? "device"}:${request.convention}:${search}`} request={request} />;
}
