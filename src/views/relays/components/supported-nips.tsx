import { Flex, FlexProps, Tag, Tooltip } from "@chakra-ui/react";
import { NIP_NAMES } from "../../../const";

function NipTag({ nip, name }: { nip: number; name?: boolean }) {
  const nipStr = String(nip).padStart(2, "0");
  const nipNumber = `NIP-${nip}`;

  return (
    <Tooltip label={NIP_NAMES[nipStr]}>
      <Tag as="a" target="_blank" href={`https://github.com/nostr-protocol/nips/blob/master/${nipStr}.md`}>
        {name ? (NIP_NAMES[nipStr] ?? nipNumber) : nipNumber}
      </Tag>
    </Tooltip>
  );
}

export default function SupportedNIPs({
  nips,
  names,
  ...props
}: Omit<FlexProps, "children"> & { nips: number[]; names?: boolean }) {
  return (
    <Flex gap="2" wrap="wrap" {...props}>
      {nips.map((nip) => (
        <NipTag key={nip} nip={nip} name={names} />
      ))}
    </Flex>
  );
}
