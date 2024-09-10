import { Flex, FlexProps, Tag, Tooltip } from "@chakra-ui/react";

// copied from github
export const NIP_NAMES: Record<string, string> = {
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
  "14": "Subject tag in Text events",
  "15": "Nostr Marketplace",
  "16": "Event Treatment",
  "17": "Private Direct Messages",
  "18": "Reposts",
  "19": "bech32-encoded entities",
  "20": "Command Results",
  "21": "nostr: URI scheme",
  "23": "Long-form Content",
  "24": "Extra metadata fields and tags",
  "25": "Reactions",
  "26": "Delegated Event Signing",
  "27": "Text Note References",
  "28": "Public Chat",
  "29": "Relay-based Groups",
  "30": "Custom Emoji",
  "31": "Dealing with Unknown Events",
  "32": "Labeling",
  "33": "Parameterized Replaceable Events",
  "34": "git stuff",
  "35": "Torrents",
  "36": "Sensitive Content / Content Warning",
  "38": "User Statuses",
  "39": "External Identities in Profiles",
  "40": "Expiration Timestamp",
  "42": "Authentication of clients to relays",
  "44": "Encrypted Payloads (Versioned)",
  "45": "Counting results",
  "46": "Nostr Remote Signing",
  "47": "Nostr Wallet Connect",
  "48": "Proxy Tags",
  "49": "Private Key Encryption",
  "50": "Search Capability",
  "51": "Lists",
  "52": "Calendar Events",
  "53": "Live Activities",
  "54": "Wiki",
  "55": "Android Signer Application",
  "56": "Reporting",
  "57": "Lightning Zaps",
  "58": "Badges",
  "59": "Gift Wrap",
  "64": "Chess",
  "65": "Relay List Metadata",
  "70": "Protected Events",
  "71": "Video Events",
  "72": "Moderated Communities",
  "73": "External Content IDs",
  "75": "Zap Goals",
  "78": "Application-specific data",
  "84": "Highlights",
  "89": "Recommended Application Handlers",
  "90": "Data Vending Machines",
  "92": "Media Attachments",
  "94": "File Metadata",
  "96": "HTTP File Storage Integration",
  "98": "HTTP Auth",
  "99": "Classified Listings",
};

function NipTag({ nip, name }: { nip: number; name?: boolean }) {
  const nipStr = String(nip).padStart(2, "0");
  const nipNumber = `NIP-${nip}`;

  return (
    <Tooltip label={NIP_NAMES[nipStr]}>
      <Tag as="a" target="_blank" href={`https://github.com/nostr-protocol/nips/blob/master/${nipStr}.md`}>
        {name ? NIP_NAMES[nipStr] ?? nipNumber : nipNumber}
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
