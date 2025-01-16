import { Button, Flex, Heading, Input, Text, Textarea } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { ProfileContent } from "applesauce-core/helpers";
import { Link as RouterLink, useLocation } from "react-router";

import { AppIcon, containerProps } from "./common";

export default function NameStep({ onSubmit }: { onSubmit: (metadata: ProfileContent) => void }) {
  const location = useLocation();
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      name: "",
      about: "",
    },
    mode: "all",
  });
  const submit = handleSubmit((values) => {
    const displayName = values.name;
    const username = values.name.toLocaleLowerCase().replaceAll(/(\p{Z}|\p{P}|\p{C}|\p{M})/gu, "_");

    onSubmit({
      name: username,
      displayName: displayName,
      about: values.about,
    });
  });

  return (
    <Flex as="form" gap="2" onSubmit={submit} {...containerProps}>
      <AppIcon />
      <Heading size="lg" mb="2">
        Sign up
      </Heading>
      <Text>What should we call you?</Text>
      <Input placeholder="Jane" {...register("name", { required: true })} autoComplete="off" autoFocus />
      <Textarea placeholder="Short description about yourself." w="full" mb="2" {...register("about")} />
      <Button w="full" colorScheme="primary" mb="4" isDisabled={!formState.isValid} type="submit">
        Next
      </Button>
      <Text fontWeight="bold">Already have an account?</Text>
      <Button as={RouterLink} to="/signin" state={location.state} variant="outline" w="xs" colorScheme="primary">
        Sign in
      </Button>
    </Flex>
  );
}
