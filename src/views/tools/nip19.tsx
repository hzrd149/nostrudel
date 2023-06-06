import {
  Button,
  Card,
  CardBody,
  Code,
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

  const encode = handleSubmit((values) => {
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
    <Card size="sm">
      <CardBody>
        <form onSubmit={encode}>
          <FormControl isInvalid={!!formState.errors.pubkey}>
            <FormLabel>Public key</FormLabel>
            <Input {...register("pubkey", { minLength: 8, required: true })} placeholder="npub or hex" />
            {formState.errors.pubkey && <FormErrorMessage>{formState.errors.pubkey.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!formState.errors.pubkey}>
            <FormLabel>Relay url</FormLabel>
            <RelayUrlInput
              {...register("relay", { required: true })}
              onChange={(v) => setValue("relay", v)}
              placeholder="wss://relay.example.com"
            />
            {formState.errors.pubkey && <FormErrorMessage>{formState.errors.pubkey.message}</FormErrorMessage>}
          </FormControl>
          <Button type="submit">Encode</Button>
        </form>
        {output && <RawValue heading="nprofile" value={output} />}
      </CardBody>
    </Card>
  );
}

function DecodeForm() {
  const toast = useToast();
  const { handleSubmit, register, formState, setValue } = useForm({
    mode: "onBlur",
    defaultValues: {
      input: "",
    },
  });

  const [output, setOutput] = useState<Object>();

  const decode = handleSubmit((values) => {
    try {
      setOutput(nip19.decode(values.input));
    } catch (e) {
      if (e instanceof Error) {
        toast({ description: e.message });
      }
    }
  });

  return (
    <Card size="sm">
      <CardBody>
        <form onSubmit={decode}>
          <FormControl isInvalid={!!formState.errors.input}>
            <FormLabel>Encoded id</FormLabel>
            <Input
              {...register("input", { minLength: 8, required: true })}
              placeholder="npub, note1, nevent, nprofile..."
            />
            {formState.errors.input && <FormErrorMessage>{formState.errors.input.message}</FormErrorMessage>}
          </FormControl>
          <Button type="submit">Decode</Button>
        </form>
        {output && (
          <Code whiteSpace="pre" overflowX="auto" width="100%">
            {JSON.stringify(output, null, 2)}
          </Code>
        )}
      </CardBody>
    </Card>
  );
}

export default function Nip19ToolsView() {
  return (
    <Flex direction="column" gap="4" p="4">
      <Heading>
        <ToolsIcon /> Nip-19 Tools
      </Heading>
      <Heading size="sm">Encode</Heading>
      <EncodeForm />
      <Heading size="sm">Decode</Heading>
      <DecodeForm />
    </Flex>
  );
}
