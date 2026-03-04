import { NostrEvent } from "nostr-tools";
import { getNip10References } from "applesauce-common/helpers";

import { getThreadReferences } from "../../../helpers/nostr/event";
import RawJson from "../raw-json";

export default function DebugThreadingPage({ event }: { event: NostrEvent }) {
  return (
    <>
      <RawJson heading="Legacy" json={getThreadReferences(event)} />
      <RawJson heading="NIP-10" json={getNip10References(event)} />
    </>
  );
}
