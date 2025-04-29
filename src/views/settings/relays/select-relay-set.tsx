import { Select } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { useActiveAccount } from "applesauce-react/hooks";
import useUserRelaySets from "../../../hooks/use-user-relay-sets";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import { getListTitle } from "../../../helpers/nostr/lists";

export default function SelectRelaySet({
  value,
  onChange,
  pubkey,
}: {
  value?: string;
  onChange: (cord: string, set?: NostrEvent) => void;
  pubkey?: string;
}) {
  const account = useActiveAccount();
  const relaySets = useUserRelaySets(pubkey || account?.pubkey) ?? [];

  return (
    <Select
      size="sm"
      borderRadius="md"
      placeholder="Select set"
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value,
          relaySets.find((set) => getEventCoordinate(set) === e.target.value),
        )
      }
    >
      {relaySets.map((set) => (
        <option key={set.id} value={getEventCoordinate(set)}>
          {getListTitle(set)}
        </option>
      ))}
    </Select>
  );
}
