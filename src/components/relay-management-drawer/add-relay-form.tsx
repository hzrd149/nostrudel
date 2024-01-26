import { Button, Flex } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { safeRelayUrl } from "../../helpers/relay";
import { RelayUrlInput } from "../relay-url-input";

export default function AddRelayForm({ onSubmit }: { onSubmit: (relay: string) => void }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      url: "",
    },
  });

  const submit = handleSubmit((values) => {
    const url = safeRelayUrl(values.url);
    if (!url) return;
    onSubmit(url);
    reset();
  });

  return (
    <Flex as="form" display="flex" gap="2" onSubmit={submit}>
      <RelayUrlInput {...register("url")} placeholder="wss://relay.example.com" size="sm" borderRadius="md" />
      <Button type="submit" size="sm">
        Add
      </Button>
    </Flex>
  );
}
