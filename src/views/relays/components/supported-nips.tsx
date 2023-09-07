import { Flex, Tag, Tooltip } from "@chakra-ui/react";

// copied from github
const NIP_NAMES: Record<string, string> = {
  "01": "Basic protocol",
  "02": "Contact List and Petnames",
  "03": "OpenTimestamps Attestations for Events",
  "04": "Encrypted Direct Message",
  "05": "Mapping Nostr keys to DNS-based internet identifiers",
  "06": "Basic key derivation from mnemonic seed phrase",
  "07": "window.nostr capability for web browsers",
  "08": "Handling Mentions",
  "09": "Event Deletion",
  "10": "Conventions for clients' use of e and p tags in text events",
  "11": "Relay Information Document",
  "12": "Generic Tag Queries",
  "13": "Proof of Work",
  "14": "Subject tag in text events",
  "15": "Nostr Marketplace",
  "16": "Event Treatment",
  "18": "Reposts",
  "19": "bech32-encoded entities",
  "20": "Command Results",
  "21": "nostr: URI scheme",
  "22": "Event created_at Limits",
  "23": "Long-form Content",
  "25": "Reactions",
  "26": "Delegated Event Signing",
  "27": "Text Note References",
  "28": "Public Chat",
  "30": "Custom Emoji",
  "31": "Dealing with Unknown Events",
  "32": "Labeling",
  "33": "Parameterized Replaceable Events",
  "36": "Sensitive Content",
  "39": "External Identities in Profiles",
  "40": "Expiration Timestamp",
  "42": "Authentication of clients to relays",
  "45": "Counting results",
  "46": "Nostr Connect",
  "47": "Wallet Connect",
  "50": "Keywords filter",
  "51": "Lists",
  "52": "Calendar Events",
  "53": "Live Activities",
  "56": "Reporting",
  "57": "Lightning Zaps",
  "58": "Badges",
  "65": "Relay List Metadata",
  "78": "Application-specific data",
  "89": "Recommended Application Handlers",
  "94": "File Metadata",
  "98": "HTTP Auth",
  "99": "Classified Listings",
};

function NipTag({ nip }: { nip: number }) {
  const nipStr = String(nip).padStart(2, "0");

  return (
    <Tooltip label={NIP_NAMES[nipStr]}>
      <Tag as="a" target="_blank" href={`https://github.com/nostr-protocol/nips/blob/master/${nipStr}.md`}>
        NIP-{nip}
      </Tag>
    </Tooltip>
  );
}

export default function SupportedNIPs({ nips }: { nips: number[] }) {
  return (
    <Flex gap="2" wrap="wrap">
      {nips.map((nip) => (
        <NipTag key={nip} nip={nip} />
      ))}
    </Flex>
  );
}
