import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import MessageDecryptionMode from "../../../components/message-decryption-mode";
import localSettings from "../../../services/preferences";
import MessageCacheSection from "./cache";
import DirectMessageRelaysSection from "./relays";

export default function MessagesSettings() {
  const defaultMessageExpirationTime = use$(localSettings.defaultMessageExpiration);

  return (
    <SimpleView gap="8" title="Messages" maxW="4xl">
      <MessageDecryptionMode />

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
      </FormControl>

      <DirectMessageRelaysSection />
      <MessageCacheSection />
    </SimpleView>
  );
}
