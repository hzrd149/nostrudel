import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Link,
  Stat,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import { kinds } from "nostr-tools";

import { humanReadableSats } from "../../../helpers/lightning";
import trustedUserStatsService from "../../../services/trusted-user-stats";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay-context";
import useUserContactList from "../../../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../../../helpers/nostr/lists";
import Timestamp from "../../../components/timestamp";
import useEventCount from "../../../hooks/use-event-count";

export default function UserStatsAccordion({ pubkey }: { pubkey: string }) {
  const contextRelays = useAdditionalRelayContext();
  const contacts = useUserContactList(pubkey, contextRelays);

  const { value: stats } = useAsync(() => trustedUserStatsService.getUserStats(pubkey), [pubkey]);
  const followerCount = useEventCount({ "#p": [pubkey], kinds: [kinds.Contacts] });

  return (
    <Accordion allowMultiple>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left">
              Network Stats
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb="2">
          <StatGroup gap="4" whiteSpace="pre">
            <Stat>
              <StatLabel>Following</StatLabel>
              <StatNumber>{contacts ? humanReadableSats(getPubkeysFromList(contacts).length) : "Unknown"}</StatNumber>
              {contacts && (
                <StatHelpText>
                  Updated <Timestamp timestamp={contacts.created_at} />
                </StatHelpText>
              )}
            </Stat>

            {stats && (
              <>
                <Stat>
                  <StatLabel>Followers</StatLabel>
                  <StatNumber>{humanReadableSats(followerCount ?? 0) || 0}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>Notes & replies</StatLabel>
                  <StatNumber>{humanReadableSats(stats.pub_note_count) || 0}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>Reactions</StatLabel>
                  <StatNumber>{humanReadableSats(stats.pub_reaction_count) || 0}</StatNumber>
                </Stat>
              </>
            )}
          </StatGroup>
        </AccordionPanel>
      </AccordionItem>

      {(stats?.zaps_sent || stats?.zaps_received) && (
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Zap Stats
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb="2">
            <StatGroup gap="4" whiteSpace="pre">
              {stats.zaps_sent && (
                <>
                  <Stat>
                    <StatLabel>Zap Sent</StatLabel>
                    <StatNumber>{stats.zaps_sent.count}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Total Sats Sent</StatLabel>
                    <StatNumber>{humanReadableSats(stats.zaps_sent.msats / 1000)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Avg Zap Sent</StatLabel>
                    <StatNumber>{humanReadableSats(stats.zaps_sent.avg_msats / 1000)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Biggest Zap Sent</StatLabel>
                    <StatNumber>{humanReadableSats(stats.zaps_sent.max_msats / 1000)}</StatNumber>
                  </Stat>
                </>
              )}

              {stats.zaps_received && (
                <>
                  <Stat>
                    <StatLabel>Zap Received</StatLabel>
                    <StatNumber>{stats.zaps_received.count}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Total Sats Received</StatLabel>
                    <StatNumber>{humanReadableSats(stats.zaps_received.msats / 1000)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Avg Zap Received</StatLabel>
                    <StatNumber>{humanReadableSats(stats.zaps_received.avg_msats / 1000)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Biggest Zap Received</StatLabel>
                    <StatNumber>{humanReadableSats(stats.zaps_received.max_msats / 1000)}</StatNumber>
                  </Stat>
                </>
              )}
            </StatGroup>
            <Text color="slategrey">
              Stats from{" "}
              <Link href="https://nostr.band" isExternal color="blue.500">
                nostr.band
              </Link>
            </Text>
          </AccordionPanel>
        </AccordionItem>
      )}
    </Accordion>
  );
}
