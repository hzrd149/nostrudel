import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Checkbox,
  Flex,
  Input,
  Link,
  Text,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import NappletIcon from "../../../components/napplets/napplet-icon";
import {
  handlerAddress,
  handlerEntries,
  handlerReference,
  isHandlerConvention,
  type HandlerEntry,
} from "../../../helpers/nostr/handler-preferences";
import { getNappletTitle } from "../../../helpers/nostr/napplets";
import { useAppTitle } from "../../../hooks/use-app-title";
import useAsyncAction from "../../../hooks/use-async-action";
import {
  handlerManifests$,
  handlerPreferences$,
  handlerPreferencesError$,
  handlerPreferencesLoading$,
  refreshHandlerPreferences,
  saveHandlerEntry,
  unlockHandlerPreference,
  localHandlerPreferences$,
  setLocalHandlerPreference,
} from "../../../services/handler-preferences";

function LocalPreference({ scope, reference }: { scope: string; reference: string }) {
  const manifests = use$(handlerManifests$);
  const event = manifests.get(reference);
  const migrate = useAsyncAction(async () => {
    const convention = scope.startsWith("napplet:") ? scope : undefined;
    const archetype = convention ? scope.slice(8).split("/")[0] : scope;
    await saveHandlerEntry(archetype, { reference, convention, private: true });
    setLocalHandlerPreference(scope);
  }, [scope, reference]);
  return (
    <Flex gap="3" align="center" wrap="wrap">
      <Text flex="1">
        {scope} · {event ? getNappletTitle(event) : reference}
      </Text>
      <Button onClick={migrate.run} isLoading={migrate.loading}>
        Sync as private preference
      </Button>
      <Button onClick={() => setLocalHandlerPreference(scope)}>Remove</Button>
    </Flex>
  );
}

function HandlerRow({ archetype, entry }: { archetype: string; entry: HandlerEntry }) {
  const manifests = use$(handlerManifests$);
  const event = manifests.get(entry.reference);
  const address = handlerAddress(entry.reference);
  const remove = useAsyncAction(() => saveHandlerEntry(archetype, entry, true), [archetype, entry]);
  const visibility = useAsyncAction(
    () => saveHandlerEntry(archetype, { ...entry, private: !entry.private }),
    [archetype, entry],
  );
  return (
    <Flex gap="3" align="center" wrap="wrap">
      <NappletIcon event={event} boxSize="10" />
      <Flex direction="column" flex="1" minW="0">
        <Link as={RouterLink} to={`/napplets/${address}`} fontWeight="semibold" overflowWrap="anywhere">
          {event ? getNappletTitle(event) : entry.reference}
        </Link>
        {!entry.reference.includes(":") && <Text>Pinned snapshot</Text>}
      </Flex>
      <Button onClick={visibility.run} isLoading={visibility.loading}>
        {entry.private ? "Private" : "Public"}
      </Button>
      <Button as={RouterLink} to={`/app/${address}`}>
        Open
      </Button>
      <Button onClick={remove.run} isLoading={remove.loading}>
        Remove
      </Button>
    </Flex>
  );
}

function AddHandler() {
  const [archetype, setArchetype] = useState("");
  const [convention, setConvention] = useState("");
  const [reference, setReference] = useState("");
  const [hidden, setHidden] = useState(true);
  const { loading, run } = useAsyncAction(async () => {
    if (!archetype || (convention && !isHandlerConvention(convention, archetype)))
      throw new Error("Enter a matching archetype and convention");
    const ref = handlerReference(reference);
    if (!ref) throw new Error("Enter a manifest coordinate or snapshot id");
    await saveHandlerEntry(archetype, { reference: ref, convention: convention || undefined, private: hidden });
    setReference("");
  }, [archetype, convention, reference, hidden]);
  return (
    <Flex gap="3" wrap="wrap" align="center">
      <Input
        aria-label="Archetype"
        placeholder="Archetype"
        value={archetype}
        onChange={(e) => setArchetype(e.target.value)}
        width="auto"
      />
      <Input
        aria-label="Intent convention"
        placeholder="napplet:profile/edit (optional)"
        value={convention}
        onChange={(e) => setConvention(e.target.value)}
        width="auto"
      />
      <Input
        aria-label="Handler reference"
        placeholder="Manifest coordinate or snapshot id"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <Checkbox colorScheme="primary" isChecked={hidden} onChange={(e) => setHidden(e.target.checked)}>
        Private
      </Checkbox>
      <Button onClick={run} isLoading={loading} isDisabled={!archetype || !reference}>
        Add handler
      </Button>
    </Flex>
  );
}

function ArchetypePreferences({ archetype }: { archetype: string }) {
  const preferences = use$(handlerPreferences$);
  const preference = preferences.get(archetype)!;
  const entries = handlerEntries(preference);
  const scopes = [...new Set(entries.map((entry) => entry.convention ?? ""))];
  const unlock = useAsyncAction(() => unlockHandlerPreference(archetype), [archetype]);
  return (
    <AccordionItem>
      <AccordionButton gap="3" px="2">
        <Text flex="1" textAlign="start" fontWeight="semibold">
          {archetype}
        </Text>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel px="2">
        <Flex direction="column" gap="4">
          {preference.locked && (
            <Button onClick={unlock.run} isLoading={unlock.loading}>
              Unlock private preferences
            </Button>
          )}
          {scopes.map((scope) => (
            <Flex key={scope} direction="column" gap="3">
              <Text fontWeight="semibold">{scope || "Archetype defaults"}</Text>
              {entries
                .filter((entry) => (entry.convention ?? "") === scope)
                .map((entry, index) => (
                  <HandlerRow
                    key={`${entry.reference}:${entry.private}:${index}`}
                    archetype={archetype}
                    entry={entry}
                  />
                ))}
            </Flex>
          ))}
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}

export default function DefaultAppsSettings() {
  useAppTitle("Default apps");
  const preferences = use$(handlerPreferences$);
  const loading = use$(handlerPreferencesLoading$);
  const error = use$(handlerPreferencesError$);
  const local = use$(localHandlerPreferences$);
  const localEntries = Object.entries(local);
  const archetypes = [...preferences]
    .filter(([, preference]) => preference.locked || handlerEntries(preference).length)
    .map(([archetype]) => archetype)
    .sort();
  const refresh = useAsyncAction(refreshHandlerPreferences, []);
  return (
    <SimpleView title="Default apps" maxW="container.xl">
      <Flex justify="end">
        <Button onClick={refresh.run} isLoading={loading || refresh.loading}>
          Refresh
        </Button>
      </Flex>
      {error && <Text role="alert">{error}</Text>}
      <Accordion allowMultiple>
        {archetypes.map((archetype) => (
          <ArchetypePreferences key={archetype} archetype={archetype} />
        ))}
      </Accordion>
      {!archetypes.length && !localEntries.length && !loading && <Text>No saved handler preferences.</Text>}
      {!!localEntries.length && (
        <Flex direction="column" gap="3">
          <Text fontWeight="semibold">Device preferences</Text>
          {localEntries.map(([scope, reference]) => (
            <LocalPreference key={scope} scope={scope} reference={reference} />
          ))}
        </Flex>
      )}
      <AddHandler />
    </SimpleView>
  );
}
