import { useCallback, useState } from "react";
import {
  Button,
  IconButtonProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  useDisclosure,
} from "@chakra-ui/react";
import { isRTag } from "../types/nostr-event";
import useCurrentAccount from "../hooks/use-current-account";
import useUserRelaySets from "../hooks/use-user-relay-sets";
import { getEventCoordinate } from "../helpers/nostr/events";
import { getListName } from "../helpers/nostr/lists";
import { relayListAddRelay, relayListRemoveRelay } from "../helpers/nostr/relay-list";
import { AddIcon, CheckIcon, ChevronDownIcon, InboxIcon, OutboxIcon, PlusCircleIcon } from "./icons";
import { usePublishEvent } from "../providers/global/publish-provider";

export default function RelayListButton({ relay, ...props }: { relay: string } & Omit<IconButtonProps, "icon">) {
  const publish = usePublishEvent();
  const newListModal = useDisclosure();
  const account = useCurrentAccount();
  const [isLoading, setLoading] = useState(false);

  const sets = useUserRelaySets(account?.pubkey);

  const inSets = sets.filter((set) => set.tags.some((t) => isRTag(t) && t[1] === relay));

  const handleChange = useCallback(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      setLoading(true);
      const addToSet = sets.find((set) => !inSets.includes(set) && cords.includes(getEventCoordinate(set)));
      const removeFromList = sets.find((set) => inSets.includes(set) && !cords.includes(getEventCoordinate(set)));

      if (addToSet) {
        const draft = relayListAddRelay(addToSet, relay);
        await publish("Add to list", draft);
      } else if (removeFromList) {
        const draft = relayListRemoveRelay(removeFromList, relay);
        await publish("Remove from list", draft);
      }
      setLoading(false);
    },
    [sets, relay, publish],
  );

  return (
    <>
      <Menu isLazy closeOnSelect={false}>
        <MenuButton
          as={Button}
          icon={inSets.length > 0 ? <CheckIcon /> : <AddIcon />}
          isDisabled={account?.readonly ?? true}
          rightIcon={<ChevronDownIcon />}
          {...props}
        >
          Add to set
        </MenuButton>
        <MenuList minWidth="240px">
          <MenuItem icon={<InboxIcon />}>Inbox</MenuItem>
          <MenuItem icon={<OutboxIcon />}>Outbox</MenuItem>
          {sets.length > 0 && (
            <MenuOptionGroup
              type="checkbox"
              value={inSets.map((list) => getEventCoordinate(list))}
              onChange={handleChange}
            >
              {sets.map((list) => (
                <MenuItemOption
                  key={getEventCoordinate(list)}
                  value={getEventCoordinate(list)}
                  isDisabled={account?.readonly || isLoading}
                  isTruncated
                  maxW="90vw"
                >
                  {getListName(list)}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          )}
          <MenuDivider />
          <MenuItem icon={<PlusCircleIcon />} onClick={newListModal.onOpen}>
            New relay set
          </MenuItem>
        </MenuList>
      </Menu>
      {/* {newListModal.isOpen && (
        <NewListModal
          onClose={newListModal.onClose}
          isOpen
          onCreated={newListModal.onClose}
          initKind={NOTE_LIST_KIND}
          allowSelectKind={false}
        />
      )} */}
    </>
  );
}
