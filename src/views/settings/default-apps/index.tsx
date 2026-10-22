import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Heading,
  Radio,
  RadioGroup,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";

import SimpleView from "../../../components/layout/presets/simple-view";
import NappletIconImage from "../../../components/napplets/napplet-icon";
import { getNappletEventPointer, parseNappletPointer } from "../../../helpers/nostr/napplets";
import { useAppTitle } from "../../../hooks/use-app-title";
import useEvent from "../../../hooks/use-event";
import useInstalledNapplets, { useIntentHandlerPreferences } from "../../../hooks/use-installed-napplets";
import { intentKey, setDefaultIntentHandler, type InstalledNapplet } from "../../../services/installed-napplets";

type ArchetypeGroup = { archetype: string; actions: { action: string; napplets: InstalledNapplet[] }[] };

/** Installed napplets grouped by archetype, then by the actions they handle */
function groupHandlers(installed: InstalledNapplet[]): ArchetypeGroup[] {
  const archetypes = new Map<string, Map<string, InstalledNapplet[]>>();

  for (const napplet of installed) {
    for (const archetype of napplet.archetypes) {
      const actions = archetypes.get(archetype.name) ?? new Map<string, InstalledNapplet[]>();
      for (const action of archetype.actions) actions.set(action, [...(actions.get(action) ?? []), napplet]);
      archetypes.set(archetype.name, actions);
    }
  }

  return Array.from(archetypes, ([archetype, actions]) => ({
    archetype,
    actions: Array.from(actions, ([action, napplets]) => ({ action, napplets })).sort((a, b) =>
      a.action.localeCompare(b.action),
    ),
  })).sort((a, b) => a.archetype.localeCompare(b.archetype));
}

function NappletIcon({ napplet, ...props }: { napplet: InstalledNapplet; boxSize: string }) {
  const pointer = useMemo(() => {
    const decoded = parseNappletPointer(napplet.address);
    return decoded && getNappletEventPointer(decoded);
  }, [napplet.address]);
  const manifest = useEvent(pointer);

  return <NappletIconImage event={manifest} {...props} />;
}

function ActionHandlers({
  archetype,
  action,
  napplets,
  selected,
  showAction,
}: {
  archetype: string;
  action: string;
  napplets: InstalledNapplet[];
  selected: string;
  showAction: boolean;
}) {
  return (
    <Flex direction="column" gap="2">
      {showAction && <Heading size="sm">{action}</Heading>}
      <RadioGroup value={selected} onChange={(address) => setDefaultIntentHandler(archetype, action, address)}>
        <Flex direction="column" gap="3">
          {napplets.map((napplet) => (
            <Radio key={napplet.address} value={napplet.address}>
              <Flex gap="2" alignItems="center">
                <NappletIcon napplet={napplet} boxSize="8" />
                <Text>{napplet.title}</Text>
              </Flex>
            </Radio>
          ))}
        </Flex>
      </RadioGroup>
    </Flex>
  );
}

export default function DefaultAppsSettings() {
  useAppTitle("Default apps");
  const installed = useInstalledNapplets();
  const preferences = useIntentHandlerPreferences();
  const groups = useMemo(() => groupHandlers(installed), [installed]);

  const getSelected = (archetype: string, action: string, napplets: InstalledNapplet[]) => {
    const preferred = preferences[intentKey(archetype, action)];
    return napplets.some((napplet) => napplet.address === preferred) ? preferred : napplets[0].address;
  };

  return (
    <SimpleView title="Default apps" maxW="container.xl">
      <Accordion allowMultiple>
        {groups.map((group) => {
          const first = group.actions[0];
          const current = first.napplets.find(
            (napplet) => napplet.address === getSelected(group.archetype, first.action, first.napplets),
          );

          return (
            <AccordionItem key={group.archetype}>
              <AccordionButton gap="3" px="2">
                <Text flex="1" textAlign="start" fontWeight="semibold">
                  {group.archetype}
                </Text>
                {current && <NappletIcon napplet={current} boxSize="8" />}
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px="2" display="flex" flexDirection="column" gap="4">
                {group.actions.map(({ action, napplets }) => (
                  <Box key={action}>
                    <ActionHandlers
                      archetype={group.archetype}
                      action={action}
                      napplets={napplets}
                      selected={getSelected(group.archetype, action, napplets)}
                      showAction={group.actions.length > 1}
                    />
                  </Box>
                ))}
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </SimpleView>
  );
}
