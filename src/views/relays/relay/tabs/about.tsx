import {
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Link,
  Tag,
  Text,
  VStack,
  Divider,
  SimpleGrid,
  Badge,
} from "@chakra-ui/react";
import { normalizeURL } from "applesauce-core/helpers";
import { useMemo } from "react";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import ScrollLayout from "../../../../components/layout/presets/scroll-layout";
import { useRelayInfo } from "../../../../hooks/use-relay-info";
import useRelayStats from "../../../../hooks/use-relay-stats";
import { RelayDebugButton } from "../../components/relay-card";
import { RelayScoreBreakdown } from "../../../../components/relay-score-breakdown";
import SupportedNIPs from "../../components/supported-nips";
import { getNetwork } from "../../../../helpers/nostr/relay-stats";
import UserLink from "../../../../components/user/user-link";
import UserAvatar from "../../../../components/user/user-avatar";
import useRelayUrlParam from "../use-relay-url-param";

const B = ({ children }: { children: React.ReactNode }) => (
  <Text as="span" fontWeight="bold">
    {children}
  </Text>
);

function RelayDetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="outline">
      <CardHeader pb="2">
        <Heading size="sm">{title}</Heading>
      </CardHeader>
      <CardBody pt="0">{children}</CardBody>
    </Card>
  );
}

function RelayPage({ relay }: { relay: string }) {
  const { info, loading } = useRelayInfo(relay, true);
  const stats = useRelayStats(relay);

  const uiURL = useMemo(() => {
    const url = new URL(relay);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    return url.toString();
  }, [relay]);

  return (
    <ScrollLayout maxW="6xl" center>
      <VStack spacing="6" align="stretch">
        {/* Header Section */}
        <Card variant="outline">
          <CardBody>
            <Flex gap="4" alignItems="center" wrap="wrap">
              <RelayFavicon relay={relay} size="lg" />
              <VStack align="flex-start" spacing="2" flex="1" minW="0">
                <Heading size={{ base: "md", sm: "lg" }} isTruncated>
                  {info?.name || relay}
                </Heading>
                <Flex gap="2" align="center" wrap="wrap">
                  {info?.payments_url && (
                    <Tag as="a" variant="solid" colorScheme="green" size="sm" target="_blank" href={info.payments_url}>
                      Paid Relay
                    </Tag>
                  )}
                  {stats && (
                    <Badge colorScheme="blue">
                      Score: <RelayScoreBreakdown relay={relay} />
                    </Badge>
                  )}
                </Flex>
                {info?.description && <Text>{info.description}</Text>}
              </VStack>
              <ButtonGroup size={["sm", "md"]}>
                <RelayDebugButton url={relay} />
              </ButtonGroup>
            </Flex>
          </CardBody>
        </Card>

        {/* Two-column layout for details */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6">
          {/* Basic Information */}
          <RelayDetailCard title="Basic Information">
            <VStack align="stretch" spacing="2">
              {info?.name && (
                <Flex>
                  <B>Name:</B>
                  <Text ml="2">{info.name}</Text>
                </Flex>
              )}
              {info?.pubkey && (
                <Flex align="center" gap="2">
                  <B>Owner:</B>
                  <UserAvatar pubkey={info.pubkey} size="xs" noProxy />
                  <UserLink pubkey={info.pubkey} />
                </Flex>
              )}
              {info?.contact && (
                <Flex>
                  <B>Contact:</B>
                  <Text ml="2">{info.contact}</Text>
                </Flex>
              )}
              {info?.software && (
                <Flex>
                  <B>Software:</B>
                  <Text ml="2">
                    {info.software}
                    {info.version && ` v${info.version}`}
                  </Text>
                </Flex>
              )}
              {stats && (
                <Flex>
                  <B>Network:</B>
                  <Text ml="2">{getNetwork(stats)}</Text>
                </Flex>
              )}
            </VStack>
          </RelayDetailCard>

          {/* Connection & Fees */}
          <RelayDetailCard title="Connection Details">
            <VStack align="stretch" spacing="2">
              <Flex>
                <B>URL:</B>
                <Text ml="2" isTruncated>
                  {relay}
                </Text>
              </Flex>
              {info?.payments_url && (
                <Flex>
                  <B>Payment URL:</B>
                  <Link ml="2" href={info.payments_url} isExternal color="green.500">
                    {info.payments_url}
                  </Link>
                </Flex>
              )}
              {info?.fees && (
                <VStack align="stretch" spacing="1">
                  <B>Fees:</B>
                  {info.fees.admission && (
                    <Text fontSize="sm">
                      Admission: {info.fees.admission.map((fee) => `${fee.amount} ${fee.unit}`).join(", ")}
                    </Text>
                  )}
                  {info.fees.subscription && (
                    <Text fontSize="sm">
                      Subscription:{" "}
                      {info.fees.subscription.map((fee) => `${fee.amount} ${fee.unit}/${fee.period}`).join(", ")}
                    </Text>
                  )}
                  {info.fees.publication && (
                    <Text fontSize="sm">
                      Publication: {info.fees.publication.map((fee) => `${fee.amount} ${fee.unit}`).join(", ")}
                    </Text>
                  )}
                </VStack>
              )}
              {uiURL !== relay && (
                <Flex>
                  <B>Web Interface:</B>
                  <Link ml="2" href={uiURL} isExternal color="blue.500">
                    {uiURL}
                  </Link>
                </Flex>
              )}
            </VStack>
          </RelayDetailCard>
        </SimpleGrid>

        {/* Supported NIPs */}
        {info?.supported_nips && info.supported_nips.length > 0 && (
          <RelayDetailCard title="Supported NIPs">
            <SupportedNIPs nips={info.supported_nips} />
          </RelayDetailCard>
        )}

        {/* Limitations & Policies */}
        {(info?.limitation || info?.retention) && (
          <RelayDetailCard title="Limitations & Policies">
            <VStack align="stretch" spacing="3">
              {info.limitation && (
                <VStack align="stretch" spacing="1">
                  <B>Limitations:</B>
                  {info.limitation.max_message_length && (
                    <Text fontSize="sm">Max message length: {info.limitation.max_message_length}</Text>
                  )}
                  {info.limitation.max_subscriptions && (
                    <Text fontSize="sm">Max subscriptions: {info.limitation.max_subscriptions}</Text>
                  )}
                  {info.limitation.max_filters && <Text fontSize="sm">Max filters: {info.limitation.max_filters}</Text>}
                  {info.limitation.max_subid_length && (
                    <Text fontSize="sm">Max subscription ID length: {info.limitation.max_subid_length}</Text>
                  )}
                  {info.limitation.min_pow_difficulty && (
                    <Text fontSize="sm">Min PoW difficulty: {info.limitation.min_pow_difficulty}</Text>
                  )}
                  {info.limitation.auth_required && (
                    <Text fontSize="sm" color="orange.500">
                      Authentication required
                    </Text>
                  )}
                  {info.limitation.payment_required && (
                    <Text fontSize="sm" color="green.500">
                      Payment required
                    </Text>
                  )}
                </VStack>
              )}
              {info.retention && info.retention.length > 0 && (
                <VStack align="stretch" spacing="1">
                  <B>Retention Policies:</B>
                  {info.retention.map((policy, index) => (
                    <Text key={index} fontSize="sm">
                      {policy.kinds ? `Kinds ${policy.kinds.join(", ")}: ` : "Default: "}
                      {policy.time ? `${policy.time}s` : "Permanent"}
                      {policy.count && ` (max ${policy.count} events)`}
                    </Text>
                  ))}
                </VStack>
              )}
            </VStack>
          </RelayDetailCard>
        )}

        {/* Additional Information */}
        {(info?.language_tags || info?.tags || info?.posting_policy || info?.icon) && (
          <RelayDetailCard title="Additional Information">
            <VStack align="stretch" spacing="3">
              {info.language_tags && info.language_tags.length > 0 && (
                <Flex>
                  <B>Languages:</B>
                  <Text ml="2">{info.language_tags.join(", ")}</Text>
                </Flex>
              )}
              {info.tags && info.tags.length > 0 && (
                <Flex>
                  <B>Tags:</B>
                  <Text ml="2">{info.tags.join(", ")}</Text>
                </Flex>
              )}
              {info.posting_policy && (
                <Flex>
                  <B>Posting Policy:</B>
                  <Link ml="2" href={info.posting_policy} isExternal color="blue.500">
                    View Policy
                  </Link>
                </Flex>
              )}
              {info.icon && (
                <Flex>
                  <B>Custom Icon:</B>
                  <Link ml="2" href={info.icon} isExternal color="blue.500">
                    View Icon
                  </Link>
                </Flex>
              )}
            </VStack>
          </RelayDetailCard>
        )}
      </VStack>
    </ScrollLayout>
  );
}

export default function RelayAboutView() {
  const relay = useRelayUrlParam();
  return <RelayPage relay={normalizeURL(relay)} />;
}
