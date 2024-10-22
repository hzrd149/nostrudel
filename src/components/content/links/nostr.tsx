import { Link, Tooltip } from "@chakra-ui/react";

import { EmbedableContent, embedJSX } from "../../../helpers/embeds";
import { NIP_NAMES } from "../../../views/relays/components/supported-nips";

export function embedNipDefinitions(content: EmbedableContent) {
  return embedJSX(content, {
    name: "nip-definition",
    regexp: /nip-?(\d\d)/gi,
    render: (match) => {
      if (NIP_NAMES[match[1]]) {
        return (
          <Tooltip label={NIP_NAMES[match[1]]} aria-label="NIP Definition">
            <Link
              isExternal
              href={`https://github.com/nostr-protocol/nips/blob/master/${match[1]}.md`}
              textDecoration="underline"
            >
              {match[0]}
            </Link>
          </Tooltip>
        );
      }
      return null;
    },
  });
}
