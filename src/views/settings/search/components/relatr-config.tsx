import { Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input } from "@chakra-ui/react";
import { isHexKey, nprofileEncode } from "applesauce-core/helpers";
import { nip19 } from "nostr-tools";
import { useState } from "react";

import { useObservableEagerState } from "applesauce-react/hooks";
import useAsyncAction from "../../../../hooks/use-async-action";
import { relatrServer$ } from "../../../../services/lookup/relatr";
import localSettings from "../../../../services/preferences";
import { RelatrServerStatus } from "./relatr-server-status";

export function RelatrConfig() {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const pointer = useObservableEagerState(relatrServer$);

  const setServer = useAsyncAction(async () => {
    const value = input.trim();
    if (!value) {
      setInputError("Please enter a value");
      return;
    }

    if (isHexKey(value)) {
      localSettings.relatrServer.next({ pubkey: value, relays: [] });
      setInput("");
      setInputError(null);
    } else {
      const decoded = nip19.decode(value);
      if (decoded.type === "npub") {
        localSettings.relatrServer.next({ pubkey: decoded.data as string, relays: [] });
        setInput("");
        setInputError(null);
      } else if (decoded.type === "nprofile") {
        localSettings.relatrServer.next(decoded.data);
        setInput("");
        setInputError(null);
      } else {
        setInputError("Must be npub or nprofile");
      }
    }
  }, [input]);

  const clearServer = useAsyncAction(async () => {
    localSettings.relatrServer.next(null);
    setInput("");
    setInputError(null);
  }, []);

  return (
    <>
      <FormControl isInvalid={!!inputError}>
        <FormLabel>Relatr Server</FormLabel>
        <Flex gap="2" mb="2">
          <Input
            placeholder={pointer ? nprofileEncode(pointer) : "npub... or nprofile..."}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setInputError(null);
            }}
            fontFamily="mono"
            flex="1"
          />
          <Button colorScheme="primary" onClick={setServer.run} isLoading={setServer.loading}>
            Set
          </Button>
          <Button variant="ghost" onClick={clearServer.run} isLoading={clearServer.loading}>
            Clear
          </Button>
        </Flex>
        {inputError && <FormErrorMessage mb="2">{inputError}</FormErrorMessage>}
        <FormHelperText>Enter an npub or nprofile. Use nprofile to include relay hints.</FormHelperText>
      </FormControl>
      <RelatrServerStatus />
    </>
  );
}
