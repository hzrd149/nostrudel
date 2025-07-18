import { Flex, FormControl, FormHelperText, FormLabel, Select, Switch } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import localSettings from "../../../services/preferences";
import MessageCacheSection from "./cache";
import DirectMessageRelaysSection from "./relays";

export default function MessagesSettings() {
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);
  const defaultMessageExpirationTime = useObservableEagerState(localSettings.defaultMessageExpiration);

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

      <FormControl>
        <FormLabel htmlFor="messageExpiration">Default message expiration time</FormLabel>
        <Select
          id="messageExpiration"
          maxW="sm"
          value={defaultMessageExpirationTime ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            localSettings.defaultMessageExpiration.next(value === "" ? null : parseInt(value));
          }}
        >
          <option value="">Never</option>
          <option value={60 * 60}>1 hour</option>
          <option value={60 * 60 * 24}>1 day</option>
          <option value={60 * 60 * 24 * 7}>1 week</option>
          <option value={60 * 60 * 24 * 30}>1 month</option>
          <option value={60 * 60 * 24 * 90}>3 months</option>
          <option value={60 * 60 * 24 * 365}>1 year</option>
        </Select>
        <FormHelperText>
          Set a default expiration time for new messages. Messages will automatically be deleted after this time.
        </FormHelperText>
      </FormControl>

      <DirectMessageRelaysSection />
      <MessageCacheSection />
    </SimpleView>
  );
}
