import { CheckIcon, CloseIcon, ExternalLinkIcon, WarningIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  ButtonGroup,
  Code,
  Flex,
  Heading,
  HStack,
  IconButton,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { ProfilePointer } from "nostr-tools/nip19";

import { CopyIconButton } from "../../../../components/copy-icon-button";
import { ErrorBoundary } from "../../../../components/error-boundary";
import useDnsIdentity from "../../../../hooks/use-dns-identity";
import useUserProfile from "../../../../hooks/use-user-profile";

function StatusBadge({ status }: { status: IdentityStatus }) {
  switch (status) {
    case IdentityStatus.Found:
      return (
        <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
          <CheckIcon boxSize={3} />
          Valid
        </Badge>
      );
    case IdentityStatus.Missing:
      return (
        <Badge colorScheme="red" display="flex" alignItems="center" gap={1}>
          <CloseIcon boxSize={3} />
          Not Found
        </Badge>
      );
    case IdentityStatus.Error:
      return (
        <Badge colorScheme="yellow" display="flex" alignItems="center" gap={1}>
          <WarningIcon boxSize={3} />
          Error
        </Badge>
      );
    default:
      return <Badge colorScheme="gray">Unknown</Badge>;
  }
}

function InfoField({ label, value }: { label: string; value?: string | string[] }) {
  if (!value) return null;

  const displayValue = Array.isArray(value) ? value.join(", ") : value;

  return (
    <Flex align="flex-start" direction={{ base: "column", lg: "row" }}>
      <Text fontWeight="medium" minW="120px" color="GrayText" mr="2">
        {label}:
      </Text>
      <Text flex={1} wordBreak="break-all" fontFamily={label.includes("Key") ? "mono" : "inherit"}>
        {displayValue}
      </Text>
    </Flex>
  );
}

export default function NIP05DebugSection({ user }: { user: ProfilePointer }) {
  const metadata = useUserProfile(user);
  const identity = useDnsIdentity(metadata?.nip05);

  const renderIdentityDetails = () => {
    if (!identity) {
      return (
        <Text color="gray.500" fontStyle="italic" fontSize="sm">
          No NIP-05 identity information available
        </Text>
      );
    }

    const wellKnownUrl = `https://${identity.domain}/.well-known/nostr.json?name=${identity.name}`;

    return (
      <VStack align="stretch" spacing={1}>
        <HStack justify="space-between" align="center">
          <Heading size="xs">Identity Status</Heading>
          <StatusBadge status={identity.status} />
        </HStack>

        <InfoField label="Name" value={identity.name} />
        <InfoField label="Domain" value={identity.domain} />
        <InfoField label="Full Address" value={metadata?.nip05} />

        {identity.status === IdentityStatus.Found && (
          <>
            <InfoField label="Resolved Pubkey" value={identity.pubkey} />
            <InfoField label="Pubkey Match" value={identity.pubkey === user.pubkey ? "✅ Matches" : "❌ Mismatch"} />
            <InfoField label="Has NIP-46" value={identity.hasNip46 ? "Yes" : "No"} />

            {identity.relays && identity.relays.length > 0 && <InfoField label="Relays" value={identity.relays} />}

            {identity.nip46Relays && identity.nip46Relays.length > 0 && (
              <InfoField label="NIP-46 Relays" value={identity.nip46Relays} />
            )}
          </>
        )}

        {identity.status === IdentityStatus.Error && (
          <Alert status="warning">
            <AlertIcon />
            <Box flex={1}>
              <AlertTitle>Unable to verify NIP-05 identity</AlertTitle>
              <AlertDescription>
                Try testing the CORS settings of the well-known URL:
                <br />
                <Link
                  href={`https://cors-test.codehappy.dev/?url=${encodeURIComponent(wellKnownUrl)}&method=get`}
                  isExternal
                  color="blue.500"
                >
                  {wellKnownUrl}
                </Link>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {identity.status === IdentityStatus.Missing && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>The NIP-05 identity was not found in the domain's nostr.json file.</AlertTitle>
          </Alert>
        )}

        <Box mt={4}>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Well-Known URL:
          </Text>
          <HStack>
            <Code fontSize="sm" flex={1} p={2} wordBreak="break-all" userSelect="all">
              {wellKnownUrl}
            </Code>
            <ButtonGroup variant="ghost" size="sm">
              <IconButton
                as={Link}
                href={wellKnownUrl}
                isExternal
                aria-label="Open well-known URL"
                icon={<ExternalLinkIcon boxSize={4} />}
              />
              <CopyIconButton value={wellKnownUrl} title="Copy well-known URL" aria-label="Copy well-known URL" />
            </ButtonGroup>
          </HStack>
        </Box>
      </VStack>
    );
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Box mb={2}>
          <Heading size="sm">NIP-05 DNS Identity</Heading>
          <Text fontSize="sm" color="GrayText">
            Debug information for the user's NIP-05 DNS-based identity verification.
          </Text>
        </Box>

        {metadata?.nip05 ? (
          <ErrorBoundary>{renderIdentityDetails()}</ErrorBoundary>
        ) : (
          <Text color="GrayText" fontStyle="italic" fontSize="sm">
            No NIP-05 address configured in user's profile
          </Text>
        )}
      </Box>
    </VStack>
  );
}
