import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Spacer,
  Text,
} from "@chakra-ui/react";
import relayPoolService from "../../../services/relay-pool";
import { RelayFavicon } from "../../../components/relay-favicon";
import { RelayStatus } from "../../../components/relay-status";

export default function TaskManagerNetwork() {
  return (
    <Accordion>
      {Array.from(relayPoolService.relays.values()).map((relay) => (
        <AccordionItem key={relay.url}>
          <h2>
            <AccordionButton>
              <RelayFavicon relay={relay.url} size="sm" mr="2" />
              <Text isTruncated>{relay.url}</Text>
              <Spacer />
              <RelayStatus url={relay.url} />
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
