import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { SyntheticEvent, useState } from "react";
import useSubject from "../hooks/use-subject";
import settings from "../services/settings";

export const SettingsView = () => {
  const relays = useSubject(settings.relays);
  // const corsProxy = useSubject(settings.corsProxy);
  const [relayUrls, setRelayUrls] = useState(relays.join("\n"));
  // const [newCorsProxy, setNewCorsProxy] = useState(corsProxy);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newRelays = relayUrls
      .split("\n")
      .filter(Boolean)
      .map((url) => url.trim());

    if (newRelays.length > 0) {
      settings.relays.next(newRelays);
    }

    // try {
    //   const corsUrl = new URL("https://cors.rdfriedl.com").toString();
    //   settings.corsProxy.next(corsUrl);
    // } catch (e) {}
  };

  const resetForm = async () => {
    setRelayUrls(relays.join("\n"));
    // setNewCorsProxy(corsProxy);
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
      {/* <FormControl>
        <FormLabel>CORS Proxy</FormLabel>
        <Input
          value={newCorsProxy}
          onChange={(e) => setNewCorsProxy(e.target.value)}
          required
        />
        <FormHelperText>One relay per line</FormHelperText>
      </FormControl> */}
      <Stack direction="row" spacing={4}>
        <Button onClick={resetForm}>Reset</Button>
        <Button type="submit">Save</Button>
      </Stack>
    </form>
  );
};
