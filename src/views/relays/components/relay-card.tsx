import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  useDisclosure,
} from "@chakra-ui/react";
import styled from "@emotion/styled";
import { PropsWithChildren } from "react";

import RawJson from "../../../components/debug-modal/raw-json";
import { CodeIcon } from "../../../components/icons";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayLink from "../../../components/relay/relay-link";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import { getNetwork } from "../../../helpers/nostr/relay-stats";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import useRelayStats from "../../../hooks/use-relay-stats";

const B = styled.span`
  font-weight: bold;
`;
export const Metadata = ({ name, children }: { name: string } & PropsWithChildren) =>
  children ? (
    <div>
      <B>{name}: </B>
      <span>{children}</span>
    </div>
  ) : null;

export function RelayMetadata({ url, extended }: { url: string; extended?: boolean }) {
  const { info } = useRelayInfo(url);
  const stats = useRelayStats(url);

  return (
    <Box>
      <Metadata name="Name">{info?.name}</Metadata>
      {info?.pubkey && (
        <Flex gap="2" alignItems="center">
          <B>Owner:</B>
          <UserAvatar pubkey={info.pubkey} size="xs" noProxy />
          <UserLink pubkey={info.pubkey} />
          <UserDnsIdentity pubkey={info.pubkey} onlyIcon />
        </Flex>
      )}
      {extended && (
        <>
          {stats && <Metadata name="Network">{getNetwork(stats)}</Metadata>}
          <Metadata name="Software">{info?.software}</Metadata>
          <Metadata name="Version">{info?.version}</Metadata>
        </>
      )}
    </Box>
  );
}

export function RelayDebugButton({ url, ...props }: { url: string } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const { info } = useRelayInfo(url);
  const debugModal = useDisclosure();
  return (
    <>
      <IconButton icon={<CodeIcon />} aria-label="Show JSON" onClick={debugModal.onToggle} variant="ghost" {...props} />
      {debugModal.isOpen && (
        <Modal isOpen onClose={debugModal.onClose} size="4xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Relay Info</ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" pt="0" pb="4">
              <RawJson heading="Info" json={info} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export function RelayPaidTag({ url }: { url: string }) {
  const { info } = useRelayInfo(url);

  return (
    info?.payments_url && (
      <Tag as="a" variant="solid" colorScheme="green" size="sm" ml="2" target="_blank" href={info.payments_url}>
        Paid relay
      </Tag>
    )
  );
}

export default function RelayCard({
  relay,
  to,
  ...props
}: { relay: string; to?: string } & Omit<CardProps, "children">) {
  return (
    <>
      <Card variant="outline" {...props}>
        <CardHeader display="flex" gap="2" alignItems="center" p="2">
          <RelayFavicon relay={relay} size="sm" />
          <Heading size="md" isTruncated>
            <RelayLink relay={relay} isTruncated />
            <RelayPaidTag url={relay} />
          </Heading>
        </CardHeader>
        <CardBody px="2" py="0" display="flex" flexDirection="column" gap="2">
          <RelayMetadata url={relay} />
        </CardBody>
        <CardFooter p="2" as={Flex} gap="2">
          {/* <RelayJoinAction url={url} size="sm" /> */}
          {/* <RelayModeAction url={url} /> */}

          {/* <RelayShareButton relay={url} ml="auto" size="sm" /> */}
        </CardFooter>
      </Card>
    </>
  );
}
