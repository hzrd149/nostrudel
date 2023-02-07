import { Button, Flex, Textarea } from "@chakra-ui/react";
import { SubmitHandler, useForm } from "react-hook-form";

export type PostFormValues = {
  content: string;
};

export type PostFormProps = {
  onSubmit: SubmitHandler<PostFormValues>;
  onCancel: () => void;
  loading?: boolean;
};

export const PostForm = ({ onSubmit, onCancel, loading }: PostFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PostFormValues>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Textarea {...register("content")} autoFocus mb="2" />

      <Flex gap="2" justifyContent="flex-end">
        <Button size="sm" onClick={onCancel} isDisabled={loading}>
          Cancel
        </Button>
        <Button colorScheme="brand" size="sm" type="submit" isLoading={loading}>
          Post
        </Button>
      </Flex>
    </form>
  );
};
