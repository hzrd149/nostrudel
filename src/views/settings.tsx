import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import React, { SyntheticEvent, useState } from "react";
import { useRelays } from "../providers/relay-provider";

export const SettingsView = () => {
  const { relays, overwriteRelays } = useRelays();
  const [relayUrls, setRelayUrls] = useState(relays.join("\n"));

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newRelays = relayUrls
      .split("\n")
      .filter(Boolean)
      .map((url) => url.trim());

    if (newRelays.length > 0) {
      await overwriteRelays(newRelays);
    }
  };

  const resetForm = async () => {
    setRelayUrls(relays.join("\n"));
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl>
        <FormLabel>Relays</FormLabel>
        <Textarea
          value={relayUrls}
          onChange={(e) => setRelayUrls(e.target.value)}
          required
          size="md"
          rows={10}
          resize="vertical"
        />
        <FormHelperText>One relay per line</FormHelperText>
      </FormControl>
      <Stack direction="row" spacing={4}>
        <Button onClick={resetForm}>Reset</Button>
        <Button type="submit">Save</Button>
      </Stack>
    </form>
  );
};
