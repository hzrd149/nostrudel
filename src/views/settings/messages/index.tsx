import { Flex, FormControl, FormHelperText, FormLabel, Switch } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import localSettings from "../../../services/local-settings";
import MessageCacheSection from "./cache";
import DirectMessageRelaysSection from "./relays";

// Direct Message Relay List Kind (NIP-17)
const DM_RELAY_LIST_KIND = 10050;

export default function MessagesSettings() {
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);

  return (
    <SimpleView gap="8" title="Messages" maxW="4xl">
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoDecryptMessages" mb="0">
            Automatically decrypt messages
          </FormLabel>
          <Switch
            id="autoDecryptMessages"
            isChecked={autoDecryptMessages}
            onChange={(e) => localSettings.autoDecryptMessages.next(e.target.checked)}
          />
        </Flex>
        <FormHelperText>Automatically decrypt direct messages when they are loaded or received.</FormHelperText>
      </FormControl>

      <DirectMessageRelaysSection />
      <MessageCacheSection />
    </SimpleView>
  );
}
