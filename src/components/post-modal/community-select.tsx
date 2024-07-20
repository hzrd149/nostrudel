import { forwardRef } from "react";
import { Select, SelectProps } from "@chakra-ui/react";

import useUserCommunitiesList from "../../hooks/use-user-communities-list";
import useCurrentAccount from "../../hooks/use-current-account";
import { getCommunityName } from "../../helpers/nostr/communities";
import { AddressPointer } from "nostr-tools/nip19";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { getEventCoordinate } from "../../helpers/nostr/event";

function CommunityOption({ pointer }: { pointer: AddressPointer }) {
  const community = useReplaceableEvent(pointer);
  if (!community) return;

  return <option value={getEventCoordinate(community)}>{getCommunityName(community)}</option>;
}

const CommunitySelect = forwardRef<HTMLSelectElement, Omit<SelectProps, "children">>(({ ...props }, ref) => {
  const account = useCurrentAccount();
  const { pointers } = useUserCommunitiesList(account?.pubkey);

  return (
    <Select placeholder="Select community" {...props} ref={ref}>
      {pointers.map((pointer) => (
        <CommunityOption key={pointer.identifier + pointer.pubkey} pointer={pointer} />
      ))}
    </Select>
  );
});
export default CommunitySelect;
