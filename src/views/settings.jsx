import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import * as settings from "../services/settings";

export const SettingsView = () => {
  const [relayUrls, setRelayUrls] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const relays = relayUrls
      .split("\n")
      .filter(Boolean)
      .map((url) => url.trim());
    if (relays.length > 0) {
      settings.setRelays(relays);
    }
  };
  const resetForm = async () => {
    const urls = await settings.getRelays();
    setRelayUrls(urls.join("\n"));
  };

  useEffect(() => {
    resetForm();
  }, []);

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
          resize="horizontal"
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
