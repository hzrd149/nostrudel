import { Button, Flex, FlexProps, Input } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function WikiSearchForm({ ...props }: Omit<FlexProps, "children">) {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({ defaultValues: { search: "" } });

  const onSubmit = handleSubmit((values) => {
    navigate(`/wiki/search?q=${encodeURIComponent(values.search)}`);
  });

  return (
    <Flex gap="2" as="form" maxW="md" {...props} onSubmit={onSubmit}>
      <Input
        {...register("search", { required: true })}
        type="search"
        name="search"
        autoComplete="on"
        w="sm"
        placeholder="Search Wikifreedia"
        isRequired
      />
      <Button type="submit" colorScheme="primary">
        Search
      </Button>
    </Flex>
  );
}
