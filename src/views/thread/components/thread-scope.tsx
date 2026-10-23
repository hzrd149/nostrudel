import { Link, Text } from "@chakra-ui/react";
import { isAddressPointer } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import LoadingNostrLink from "../../../components/loading-nostr-link";
import { isExternalThreadScope, ThreadScope } from "../../../helpers/nostr/thread";
import ParentPost from "./parent-post";

export default function ThreadScopePreview({ scope, event }: { scope: ThreadScope; event?: NostrEvent }) {
  if (isExternalThreadScope(scope)) {
    return scope.kind === "web" && /^https?:\/\//i.test(scope.identifier) ? (
      <Link href={scope.identifier} isExternal wordBreak="break-word">
        {scope.identifier}
      </Link>
    ) : (
      <Text wordBreak="break-word">{scope.identifier}</Text>
    );
  }
  if (event) return <ParentPost event={event} />;
  return (
    <LoadingNostrLink
      link={isAddressPointer(scope) ? { type: "naddr", data: scope } : { type: "nevent", data: scope }}
    />
  );
}
