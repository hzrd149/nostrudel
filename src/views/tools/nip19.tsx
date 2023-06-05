import {
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  useToast,
} from "@chakra-ui/react";
import { ToolsIcon } from "../../components/icons";
import { useForm } from "react-hook-form";
import { RelayUrlInput } from "../../components/relay-url-input";
import { useState } from "react";
import { normalizeToHex } from "../../helpers/nip19";
import { nip19 } from "nostr-tools";
import { normalizeRelayUrl } from "../../helpers/url";
import RawValue from "../../components/debug-modals/raw-value";

function EncodeForm() {
  const toast = useToast();
  const { handleSubmit, register, formState, setValue } = useForm({
    mode: "onBlur",
    defaultValues: {
      pubkey: "",
      relay: "",
    },
  });

  const [output, setOutput] = useState("");

  const convert = handleSubmit((values) => {
    try {
      const pubkey = normalizeToHex(values.pubkey);
      if (!pubkey) throw new Error("bad pubkey");
      const relay = normalizeRelayUrl(values.relay);

      const nprofile = nip19.nprofileEncode({
        pubkey,
        relays: [relay],
      });

      setOutput(nprofile);
    } catch (e) {
      if (e instanceof Error) {
        toast({ description: e.message });
      }
    }
  });

  return (
    <Card>
      <CardBody>
        <form onSubmit={convert}>
          <FormControl isInvalid={!!formState.errors.pubkey}>
            <FormLabel>Public key</FormLabel>
            <Input {...register("pubkey", { minLength: 8 })} placeholder="npub or hex" />
            {formState.errors.pubkey && <FormErrorMessage>{formState.errors.pubkey.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!formState.errors.pubkey}>
            <FormLabel>Relay url</FormLabel>
            <RelayUrlInput
              {...register("relay")}
              onChange={(v) => setValue("relay", v)}
              placeholder="wss://relay.example.com"
            />
            {formState.errors.pubkey && <FormErrorMessage>{formState.errors.pubkey.message}</FormErrorMessage>}
            <Button type="submit">Encode</Button>
          </FormControl>
        </form>
        {output && <RawValue heading="nprofile" value={output} />}
      </CardBody>
    </Card>
  );
}

export function Nip19ToolsView() {
  return (
    <Flex direction="column" gap="4" p="4">
      <Heading>
        <ToolsIcon /> Nip-19 Tools
      </Heading>
      <Heading size="sm">Encode</Heading>
      <EncodeForm />
    </Flex>
  );
}
