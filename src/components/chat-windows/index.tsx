import { Flex, IconButton } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useLocalStorage } from "react-use";

import ContactsWindow from "./contacts-window";
import { DirectMessagesIcon } from "../icons";
import ChatWindow from "./chat-window";
import { useCurrentAccount } from "../../hooks/use-current-account";

export default function ChatWindows() {
  const account = useCurrentAccount();
  const [pubkeys, setPubkeys] = useState<string[]>([]);
  const [show, setShow] = useLocalStorage("show-chat-windows", false);

  const openPubkey = useCallback(
    (pubkey: string) => {
      setPubkeys((keys) => (keys.includes(pubkey) ? keys : keys.concat(pubkey)));
    },
    [setPubkeys],
  );

  const closePubkey = useCallback(
    (pubkey: string) => {
      setPubkeys((keys) => keys.filter((key) => key !== pubkey));
    },
    [setPubkeys],
  );

  if (!account) {
    return null;
  }

  if (!show) {
    return (
      <IconButton
        icon={<DirectMessagesIcon boxSize={6} />}
        aria-label="Show Contacts"
        onClick={() => setShow(true)}
        position="fixed"
        bottom="0"
        right="0"
        size="lg"
        zIndex={1}
      />
    );
  }

  return (
    <Flex direction="row-reverse" position="fixed" bottom="0" right="0" gap="4" alignItems="flex-end" zIndex={1}>
      <ContactsWindow onClose={() => setShow(false)} onSelectPubkey={openPubkey} />
      {pubkeys.map((pubkey) => (
        <ChatWindow key={pubkey} pubkey={pubkey} onClose={() => closePubkey(pubkey)} />
      ))}
    </Flex>
  );
}
