import {
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Stack,
  Switch,
  Textarea,
  useColorMode,
} from "@chakra-ui/react";
import { SyntheticEvent, useState } from "react";
import useSubject from "../hooks/use-subject";
import settings from "../services/settings";

export const SettingsView = () => {
  const relays = useSubject(settings.relays);
  const [relayUrls, setRelayUrls] = useState(relays.join("\n"));

  const { colorMode, setColorMode } = useColorMode();

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newRelays = relayUrls
      .split("\n")
      .filter(Boolean)
      .map((url) => url.trim());

    if (newRelays.length > 0) {
      settings.relays.next(newRelays);
    }
  };

  const resetForm = async () => {
    setRelayUrls(relays.join("\n"));
  };

  return (
    <Flex direction="column" gap="4" pt="2" pb="2" overflow="auto">
      <Heading>Settings</Heading>
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="use-dark-theme" mb="0">
          Use dark theme
        </FormLabel>
        <Switch
          id="use-dark-theme"
          isChecked={colorMode === "dark"}
          onChange={(v) => setColorMode(v.target.checked ? "dark" : "light")}
        />
      </FormControl>
      <Divider />
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
          <Button type="submit" colorScheme="teal">
            Save
          </Button>
        </Stack>
      </form>
    </Flex>
  );
};
