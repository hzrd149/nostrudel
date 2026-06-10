import { Button, Flex, FlexProps, Input, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

/** A form for adding a cashu mint by url, mirrors AddRelayForm */
export default function AddMintForm({
  onSubmit,
  ...props
}: { onSubmit: (mint: string) => void | Promise<void> } & Omit<FlexProps, "children" | "onSubmit">) {
  const toast = useToast();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      url: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      let input = values.url.trim();
      if (!input) return;
      if (!input.includes("://")) input = "https://" + input;

      const url = new URL(input);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Mint URL must be http(s)");

      await onSubmit(url.toString());
      reset();
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
      throw error;
    }
  });

  return (
    <Flex as="form" display="flex" gap="2" onSubmit={submit} {...props}>
      <Input {...register("url", { required: true })} placeholder="https://mint.example.com" />
      <Button type="submit" colorScheme="primary">
        Add
      </Button>
    </Flex>
  );
}
