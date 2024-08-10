import { Button, Flex, FlexProps, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { safeRelayUrl } from "../../../helpers/relay";
import { RelayUrlInput } from "../../../components/relay-url-input";

export default function AddRelayForm({
  onSubmit,
  supportedNips,
  ...props
}: { onSubmit: (relay: string) => void | Promise<void>; supportedNips?: number[] } & Omit<
  FlexProps,
  "children" | "onSubmit"
>) {
  const toast = useToast();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      url: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const url = safeRelayUrl(values.url);
      if (!url) return;
      await onSubmit(url);
      reset();
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
      throw error;
    }
  });

  return (
    <Flex as="form" display="flex" gap="2" onSubmit={submit} {...props}>
      <RelayUrlInput {...register("url")} placeholder="wss://relay.example.com" nips={supportedNips} />
      <Button type="submit" colorScheme="primary">
        Add
      </Button>
    </Flex>
  );
}
