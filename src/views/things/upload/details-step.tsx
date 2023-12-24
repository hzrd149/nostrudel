import { Button, ButtonGroup, Flex, FormControl, FormLabel, Input, Textarea } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import BackButton from "../../../components/back-button";

type FormValues = {
  name: string;
  summary: string;
};

export default function DetailsStep({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const { register, getValues, setValue, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      name: "",
      summary: "",
    },
    mode: "all",
  });

  const submit = handleSubmit(onSubmit);

  return (
    <Flex as="form" onSubmit={submit} gap="2" direction="column" maxW="40rem" w="full" mx="auto">
      <FormControl isRequired>
        <FormLabel>Name</FormLabel>
        <Input {...register("name", { required: true })} placeholder="Thing name" autoComplete="off" />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Summary</FormLabel>
        <Textarea
          rows={3}
          isRequired
          placeholder="A short summary of the thing"
          autoComplete="off"
          {...register("summary", { required: true })}
        />
      </FormControl>
      <ButtonGroup ml="auto">
        <BackButton />
        <Button type="submit" colorScheme="primary">
          Next
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
