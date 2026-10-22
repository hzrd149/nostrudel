import { Badge, Box, Code, Flex, Heading, Text } from "@chakra-ui/react";
import { getNappletOptionalDomains } from "applesauce-common/helpers";
import { NostrEvent } from "nostr-tools";
import { ReactNode, useMemo } from "react";

import {
  getNappletRequiredCapabilities,
  getNappletSource,
  parseNappletManifest,
} from "../../../helpers/nostr/napplets";

function AdvancedField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Heading size="xs" mb="1">
        {label}
      </Heading>
      {children}
    </Box>
  );
}

function BadgeListField({ label, values, colorScheme }: { label: string; values: string[]; colorScheme?: string }) {
  if (values.length === 0) return null;
  return (
    <AdvancedField label={label}>
      <Flex gap="1" wrap="wrap">
        {values.map((value) => (
          <Badge key={value} colorScheme={colorScheme} textTransform="none">
            {value}
          </Badge>
        ))}
      </Flex>
    </AdvancedField>
  );
}

/** Manifest internals: file hashes, NAP requirements, capabilities and servers */
export default function NappletDetailAdvanced({ event }: { event: NostrEvent }) {
  const manifest = useMemo(() => parseNappletManifest(event), [event]);
  const optional = getNappletOptionalDomains(event);
  const capabilities = getNappletRequiredCapabilities(event);
  const source = getNappletSource(event);
  const multiFile = manifest.paths.length > 1;

  return (
    <Flex direction="column" gap="4">
      <AdvancedField label={multiFile ? "Files" : "File hash"}>
        <Flex direction="column" gap="1">
          {manifest.paths.map((entry) => (
            <Text key={entry.path} fontFamily="mono" wordBreak="break-all">
              {multiFile && <Code me="2">{entry.path}</Code>}
              {entry.sha256}
            </Text>
          ))}
        </Flex>
      </AdvancedField>
      {multiFile && (
        <AdvancedField label="Aggregate hash">
          <Text fontFamily="mono" wordBreak="break-all">
            {manifest.aggregateHash}
          </Text>
        </AdvancedField>
      )}
      <BadgeListField label="Requirements" values={manifest.requires} />
      <BadgeListField label="Optional requirements" values={optional} />
      <BadgeListField label="Capabilities" values={capabilities} colorScheme="primary" />
      <BadgeListField label="Servers" values={manifest.servers} />
      {source && (
        <AdvancedField label="Source">
          <Text fontFamily="mono" wordBreak="break-all">
            {source}
          </Text>
        </AdvancedField>
      )}
    </Flex>
  );
}
