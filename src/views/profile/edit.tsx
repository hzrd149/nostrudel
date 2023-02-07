import { Avatar, Button, Flex, FormControl, FormLabel, Input, SkeletonText, Textarea } from "@chakra-ui/react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import useSubject from "../../hooks/use-subject";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import identity from "../../services/identity";

type FormData = {
  displayName?: string;
  username?: string;
  picture?: string;
  about?: string;
};

type MetadataFormProps = {
  defaultValues?: FormData;
  onSubmit: (data: FormData) => void;
};

const MetadataForm = ({ defaultValues, onSubmit }: MetadataFormProps) => {
  const { register, reset, handleSubmit, getValues } = useForm<FormData>({
    defaultValues,
  });

  const submit = handleSubmit(onSubmit);

  return (
    <form onSubmit={submit}>
      <Flex direction="column" gap="2" pt="4">
        <Flex gap="2">
          <FormControl>
            <FormLabel>Display Name</FormLabel>
            <Input {...register("displayName", { maxLength: 100 })} />
          </FormControl>
          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input {...register("username", { maxLength: 100 })} />
          </FormControl>
        </Flex>
        <Flex gap="2" alignItems="center">
          <FormControl>
            <FormLabel>Picture</FormLabel>
            <Input {...register("picture", { maxLength: 150 })} />
          </FormControl>
          <Avatar src={getValues("picture")} size="md" />
        </Flex>
        <FormControl>
          <FormLabel>About</FormLabel>
          <Textarea placeholder="A short description" resize="vertical" rows={6} {...register("about")} />
        </FormControl>
        <Flex alignSelf="flex-end" gap="2">
          <Button onClick={() => reset()}>Reset</Button>
          <Button colorScheme="brand" disabled>
            Save
          </Button>
        </Flex>
      </Flex>
    </form>
  );
};

export const ProfileEditView = () => {
  const pubkey = useSubject(identity.pubkey);
  const metadata = useUserMetadata(pubkey);

  const defaultValues = useMemo<FormData>(
    () => ({
      displayName: metadata?.display_name,
      username: metadata?.name,
      picture: metadata?.picture,
      about: metadata?.about,
    }),
    [metadata]
  );

  if (!metadata) return <SkeletonText />;

  const handleSubmit = (data: FormData) => {};

  return <MetadataForm defaultValues={defaultValues} onSubmit={handleSubmit} />;
};
