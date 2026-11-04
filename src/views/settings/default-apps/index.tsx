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
  Select,
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
import useInstalledNapplets, { useIntentHandlerPreferences } from "../../../hooks/use-installed-napplets";
import {
  handlerManifests$,
  handlerPreferences$,
  handlerPreferencesError$,
  handlerPreferencesLoading$,
  refreshHandlerPreferences,
  saveHandlerEntry,
  unlockHandlerPreference,
} from "../../../services/handler-preferences";

function LegacyPreference({ archetype, address }: { archetype: string; address: string }) {
  const installed = useInstalledNapplets();
  const migrate = useAsyncAction(async () => {
    const reference = handlerReference(address);
    if (!reference) throw new Error("Invalid legacy handler reference");
    await saveHandlerEntry(archetype, { reference, private: true });
  }, [archetype, address]);
  return (
    <Flex gap="3" align="center" wrap="wrap">
      <Text flex="1">
        {archetype} · {installed.find((app) => app.address === address)?.title ?? address}
      </Text>
      <Button onClick={migrate.run} isLoading={migrate.loading}>
        Sync as private preference
      </Button>
    </Flex>
  );
}

function HandlerRow({ archetype, entry, installed }: { archetype: string; entry: HandlerEntry; installed: boolean }) {
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
        <Text>
          {installed ? "Installed" : "Not installed"}
          {!entry.reference.includes(":") ? " · Pinned snapshot" : ""}
        </Text>
      </Flex>
      <Button onClick={visibility.run} isLoading={visibility.loading}>
        {entry.private ? "Private" : "Public"}
      </Button>
      {!installed && (
        <Button as={RouterLink} to={`/napplets/${address}`}>
          View app
        </Button>
      )}
      <Button onClick={remove.run} isLoading={remove.loading}>
        Remove
      </Button>
    </Flex>
  );
}

function AddHandler() {
  const installed = useInstalledNapplets();
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
      <Select
        aria-label="Installed handler"
        placeholder="Choose installed app"
        value=""
        width="auto"
        onChange={(e) => setReference(e.target.value)}
      >
        {installed.map((app) => (
          <option key={app.address} value={app.address}>
            {app.title}
          </option>
        ))}
      </Select>
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
  const installed = useInstalledNapplets();
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
                    installed={installed.some((app) => handlerReference(app.address) === entry.reference)}
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
  const legacy = useIntentHandlerPreferences();
  const legacyEntries = Object.entries(legacy).filter(([archetype]) => !preferences.has(archetype));
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
      {!archetypes.length && !legacyEntries.length && !loading && <Text>No saved handler preferences.</Text>}
      {!!legacyEntries.length && (
        <Flex direction="column" gap="3">
          <Text fontWeight="semibold">Legacy defaults</Text>
          {legacyEntries.map(([archetype, address]) => (
            <LegacyPreference key={archetype} archetype={archetype} address={address} />
          ))}
        </Flex>
      )}
      <AddHandler />
    </SimpleView>
  );
}
