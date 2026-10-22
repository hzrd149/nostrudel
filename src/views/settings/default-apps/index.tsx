import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Radio,
  RadioGroup,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";

import SimpleView from "../../../components/layout/presets/simple-view";
import InstalledNappletIcon from "../../../components/napplets/installed-napplet-icon";
import { useAppTitle } from "../../../hooks/use-app-title";
import useInstalledNapplets, { useIntentHandlerPreferences } from "../../../hooks/use-installed-napplets";
import { setDefaultIntentHandler, type InstalledNapplet } from "../../../services/installed-napplets";

type ArchetypeGroup = { archetype: string; napplets: InstalledNapplet[] };

/** Installed napplets grouped by the archetypes they handle */
function groupHandlers(installed: InstalledNapplet[]): ArchetypeGroup[] {
  const archetypes = new Map<string, InstalledNapplet[]>();

  for (const napplet of installed) {
    for (const archetype of napplet.archetypes) {
      archetypes.set(archetype.name, [...(archetypes.get(archetype.name) ?? []), napplet]);
    }
  }

  return Array.from(archetypes, ([archetype, napplets]) => ({ archetype, napplets })).sort((a, b) =>
    a.archetype.localeCompare(b.archetype),
  );
}

export default function DefaultAppsSettings() {
  useAppTitle("Default apps");
  const installed = useInstalledNapplets();
  const preferences = useIntentHandlerPreferences();
  const groups = useMemo(() => groupHandlers(installed), [installed]);

  return (
    <SimpleView title="Default apps" maxW="container.xl">
      <Accordion allowMultiple>
        {groups.map(({ archetype, napplets }) => {
          // With several handlers and no default the user is asked each time, so nothing is selected
          const current =
            napplets.find((napplet) => napplet.address === preferences[archetype]) ??
            (napplets.length === 1 ? napplets[0] : undefined);

          return (
            <AccordionItem key={archetype}>
              <AccordionButton gap="3" px="2">
                <Text flex="1" textAlign="start" fontWeight="semibold">
                  {archetype}
                </Text>
                {current && <InstalledNappletIcon napplet={current} boxSize="8" />}
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px="2">
                <RadioGroup
                  value={current?.address ?? ""}
                  onChange={(address) => setDefaultIntentHandler(archetype, address)}
                >
                  <Flex direction="column" gap="3">
                    {napplets.map((napplet) => (
                      <Radio key={napplet.address} value={napplet.address}>
                        <Flex gap="2" alignItems="center">
                          <InstalledNappletIcon napplet={napplet} boxSize="8" />
                          <Text>{napplet.title}</Text>
                        </Flex>
                      </Radio>
                    ))}
                  </Flex>
                </RadioGroup>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </SimpleView>
  );
}
