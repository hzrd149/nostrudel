import {
  Box,
  Flex,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND, AppSettings } from "../../../helpers/app-settings";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { safeJson } from "../../../helpers/parse";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import Timestamp from "../../../components/timestamp";
import useCurrentAccount from "../../../hooks/use-current-account";
import { GhostIcon } from "../../../components/icons";
import accountService from "../../../services/account";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

function UserRow({ event, settings }: { event: NostrEvent; settings: Partial<AppSettings> }) {
  const account = useCurrentAccount();
  const isSelf = event.pubkey === account?.pubkey;
  const ref = useEventIntersectionRef<HTMLTableRowElement>(event);

  return (
    <Tr ref={ref}>
      <Td>
        <Flex alignItems="center" gap="2">
          <UserAvatarLink pubkey={event.pubkey} size="sm" />
          <UserLink pubkey={event.pubkey} />
        </Flex>
      </Td>
      <Td>{settings.primaryColor && <Box w="6" h="6" rounded="md" bg={settings.primaryColor} />}</Td>
      <Td isNumeric>
        <Timestamp timestamp={event.created_at} />
      </Td>
      <Td isNumeric>
        {!isSelf && (
          <IconButton
            icon={<GhostIcon />}
            size="sm"
            aria-label="ghost user"
            title="ghost user"
            onClick={() => accountService.startGhost(event.pubkey)}
          />
        )}
      </Td>
    </Tr>
  );
}

export default function NoStrudelUsersView() {
  const readRelays = useReadRelays();
  const { loader, timeline } = useTimelineLoader("nostrudel-users", readRelays, {
    kinds: [APP_SETTINGS_KIND],
    "#d": [APP_SETTING_IDENTIFIER],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  const users = timeline
    .map((event) => ({ event, settings: safeJson<Partial<AppSettings>>(event.content) }))
    .filter((s) => !!s.settings) as { event: NostrEvent; settings: Partial<AppSettings> }[];

  const colors = new Set(users.map((u) => u.settings.primaryColor).filter((c) => !!c) as string[]);
  const colorModes = users.reduce<Record<string, number>>((dir, u) => {
    if (u.settings.colorMode) dir[u.settings.colorMode] = (dir[u.settings.colorMode] ?? 0) + 1;
    return dir;
  }, {});

  return (
    <VerticalPageLayout>
      <IntersectionObserverProvider callback={callback}>
        <Flex gap="4" wrap="wrap">
          <Stat maxW={{ base: "50%", md: "xs" }}>
            <StatLabel>Users</StatLabel>
            <StatNumber>{timeline.length}</StatNumber>
          </Stat>

          <Stat maxW={{ base: "50%", md: "xs" }}>
            <StatLabel>Unique Colors</StatLabel>
            <StatNumber>{colors.size}</StatNumber>
          </Stat>

          <TableContainer w={{ base: "full", sm: "xs" }}>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Color Mode</Th>
                  <Th isNumeric>Count</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.entries(colorModes).map(([mode, count]) => (
                  <Tr key={mode}>
                    <Td>{mode}</Td>
                    <Td isNumeric>{count}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Flex>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Color</Th>
                <Th isNumeric>Last updated</Th>
                <Th isNumeric></Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <UserRow key={user.event.pubkey} event={user.event} settings={user.settings} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
