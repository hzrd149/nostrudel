import {
  Box,
  Button,
  ButtonProps,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Checkbox,
  CheckboxProps,
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
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { RelayFavicon } from "../../../components/relay-favicon";
import { CodeIcon, RepostIcon } from "../../../components/icons";
import { UserLink } from "../../../components/user-link";
import { UserAvatar } from "../../../components/user-avatar";
import { useClientRelays } from "../../../hooks/use-client-relays";
import clientRelaysService from "../../../services/client-relays";
import { RelayMode } from "../../../classes/relay";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import styled from "@emotion/styled";
import { PropsWithChildren, useCallback } from "react";
import RawJson from "../../../components/debug-modals/raw-json";
import { DraftNostrEvent } from "../../../types/nostr-event";
import dayjs from "dayjs";
import { useSigningContext } from "../../../providers/signing-provider";
import { nostrPostAction } from "../../../classes/nostr-post-action";

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

  return (
    <Box>
      <Metadata name="Name">{info?.name}</Metadata>
      {info?.pubkey && (
        <Flex gap="2" alignItems="center">
          <B>Owner:</B>
          <UserAvatar pubkey={info.pubkey} size="xs" noProxy />
          <UserLink pubkey={info.pubkey} />
          <UserDnsIdentityIcon pubkey={info.pubkey} onlyIcon />
        </Flex>
      )}
      {extended && (
        <>
          <Metadata name="Software">{info?.software}</Metadata>
          <Metadata name="Version">{info?.version}</Metadata>
        </>
      )}
    </Box>
  );
}

export function RelayJoinAction({ url, ...props }: { url: string } & Omit<ButtonProps, "children" | "onClick">) {
  const account = useCurrentAccount();
  const clientRelays = useClientRelays();
  const relayConfig = clientRelays.find((r) => r.url === url);

  return relayConfig ? (
    <Button
      colorScheme="red"
      variant="outline"
      onClick={() => clientRelaysService.removeRelay(url)}
      isDisabled={!account}
      {...props}
    >
      Leave
    </Button>
  ) : (
    <Button
      colorScheme="green"
      onClick={() => clientRelaysService.addRelay(url, RelayMode.ALL)}
      isDisabled={!account}
      {...props}
    >
      Join
    </Button>
  );
}

export function RelayModeAction({
  url,
  ...props
}: { url: string } & Omit<CheckboxProps, "children" | "isChecked" | "onChange">) {
  const clientRelays = useClientRelays();
  const relayConfig = clientRelays.find((r) => r.url === url);

  return relayConfig ? (
    <Checkbox
      isChecked={!!(relayConfig.mode & RelayMode.WRITE)}
      onChange={(e) => {
        clientRelaysService.updateRelay(relayConfig.url, e.target.checked ? RelayMode.WRITE : RelayMode.READ);
      }}
      {...props}
    >
      Write
    </Checkbox>
  ) : null;
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

export function RelayShareButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const recommendRelay = useCallback(async () => {
    try {
      const writeRelays = clientRelaysService.getWriteUrls();

      const draft: DraftNostrEvent = {
        kind: 2,
        content: relay,
        tags: [],
        created_at: dayjs().unix(),
      };

      const signed = await requestSignature(draft);
      if (!signed) return;

      const post = nostrPostAction(writeRelays, signed);
      await post.onComplete;
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  }, []);

  return (
    <IconButton
      icon={<RepostIcon />}
      aria-label="Recommend Relay"
      title="Recommend Relay"
      onClick={recommendRelay}
      variant="ghost"
      {...props}
    />
  );
}

export default function RelayCard({ url, ...props }: { url: string } & Omit<CardProps, "children">) {
  const { info } = useRelayInfo(url);
  return (
    <>
      <Card variant="outline" {...props}>
        <CardHeader display="flex" gap="2" alignItems="center" p="2">
          <RelayFavicon relay={url} size="xs" />
          <Heading size="md" isTruncated>
            <RouterLink to={`/r/${encodeURIComponent(url)}`}>{url}</RouterLink>
            {info?.payments_url && (
              <Tag as="a" variant="solid" colorScheme="green" size="sm" ml="2" target="_blank" href={info.payments_url}>
                Paid
              </Tag>
            )}
          </Heading>
        </CardHeader>
        <CardBody px="2" py="0" display="flex" flexDirection="column" gap="2">
          <RelayMetadata url={url} />
        </CardBody>
        <CardFooter p="2" as={Flex} gap="2">
          <RelayJoinAction url={url} size="sm" />
          <RelayModeAction url={url} />

          <RelayShareButton relay={url} ml="auto" size="sm" />
          <RelayDebugButton url={url} size="sm" title="Show raw NIP-11 metadata" />
        </CardFooter>
      </Card>
    </>
  );
}
