import { Button, Flex, FlexProps } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { safeRelayUrl } from "../../../helpers/relay";
import { RelayUrlInput } from "../../../components/relay-url-input";

export default function AddRelayForm({
  onSubmit,
  ...props
}: { onSubmit: (relay: string) => void } & Omit<FlexProps, "children" | "onSubmit">) {
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
    <Flex as="form" display="flex" gap="2" onSubmit={submit} {...props}>
      <RelayUrlInput {...register("url")} placeholder="wss://relay.example.com" />
      <Button type="submit" colorScheme="primary">
        Add
      </Button>
    </Flex>
  );
}
