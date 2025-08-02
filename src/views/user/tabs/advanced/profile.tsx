import { Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { ProfilePointer } from "nostr-tools/nip19";
import { CopyIconButton } from "../../../../components/copy-icon-button";
import useUserProfile from "../../../../hooks/use-user-profile";

function ProfileField({ label, value, copyValue }: { label: string; value?: string; copyValue?: string }) {
  if (!value) return null;

  return (
    <Flex align="flex-start" direction={{ base: "column", lg: "row" }}>
      <Text fontWeight="medium" minW="120px" color="GrayText" mr="2">
        {label}:
      </Text>
      <Text flex={1} wordBreak="break-all">
        {value}
      </Text>
      <CopyIconButton
        value={copyValue || value}
        title={`Copy ${label}`}
        aria-label={`Copy ${label}`}
        size="xs"
        variant="ghost"
        hideBelow="lg"
      />
    </Flex>
  );
}

export default function ProfileSection({ user }: { user: ProfilePointer }) {
  const metadata = useUserProfile(user);
  const npub = nip19.npubEncode(user.pubkey);

  return (
    <VStack align="stretch" spacing={3}>
      <ProfileField label="Public Key (npub)" value={npub} />
      <ProfileField label="Public Key (hex)" value={user.pubkey} />

      {metadata ? (
        Object.entries(metadata)
          .filter(([_, value]) => value !== undefined && value !== null && value !== "")
          .map(([key, value]) => (
            <ProfileField key={key} label={key} value={typeof value === "string" ? value : JSON.stringify(value)} />
          ))
      ) : (
        <Text color="gray.500" fontStyle="italic">
          No profile metadata found
        </Text>
      )}
    </VStack>
  );
}
