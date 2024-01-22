import { useCallback, useState } from "react";
import {
  Button,
  IconButton,
  IconButtonProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { isRTag } from "../types/nostr-event";
import useCurrentAccount from "../hooks/use-current-account";
import { useSigningContext } from "../providers/global/signing-provider";
import useUserRelaySets from "../hooks/use-user-relay-sets";
import { useWriteRelays } from "../hooks/use-client-relays";
import { useUserOutbox } from "../hooks/use-user-mailboxes";
import { getEventCoordinate } from "../helpers/nostr/events";
import { getListName } from "../helpers/nostr/lists";
import { relayListAddRelay, relayListRemoveRelay } from "../helpers/nostr/relay-list";
import NostrPublishAction from "../classes/nostr-publish-action";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import { AddIcon, CheckIcon, ChevronDownIcon, DownloadIcon, InboxIcon, OutboxIcon, PlusCircleIcon } from "./icons";

export default function RelayListButton({ relay, ...props }: { relay: string } & Omit<IconButtonProps, "icon">) {
  const toast = useToast();
  const newListModal = useDisclosure();
  const account = useCurrentAccount();
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelays(useUserOutbox(account?.pubkey));
  const [isLoading, setLoading] = useState(false);

  const sets = useUserRelaySets(account?.pubkey);

  const inSets = sets.filter((set) => set.tags.some((t) => isRTag(t) && t[1] === relay));

  const handleChange = useCallback(
    async (cords: string | string[]) => {
      if (!Array.isArray(cords)) return;

      setLoading(true);
      try {
        const addToSet = sets.find((set) => !inSets.includes(set) && cords.includes(getEventCoordinate(set)));
        const removeFromList = sets.find((set) => inSets.includes(set) && !cords.includes(getEventCoordinate(set)));

        if (addToSet) {
          const draft = relayListAddRelay(addToSet, relay);
          const signed = await requestSignature(draft);
          new NostrPublishAction("Add to list", writeRelays, signed);
          replaceableEventLoaderService.handleEvent(signed);
        } else if (removeFromList) {
          const draft = relayListRemoveRelay(removeFromList, relay);
          const signed = await requestSignature(draft);
          new NostrPublishAction("Remove from list", writeRelays, signed);
          replaceableEventLoaderService.handleEvent(signed);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    },
    [sets, relay, writeRelays, requestSignature],
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
