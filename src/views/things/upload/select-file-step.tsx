import { ChangeEventHandler, useCallback } from "react";
import { Button, ButtonGroup, Divider, Flex, FormControl, FormLabel, Heading, Input } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import useObjectURL from "../../../hooks/use-object-url";
import { arrayBufferToHex } from "../../../helpers/array";
import BackButton from "../../../components/back-button";

type FormValues = {
  file: Blob;
  fileURL?: string;
  hash: string;
};

// example file https://tonybox.net/objects/keystone/keystone.stl

export default function SelectFileStep({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const { register, getValues, setValue, handleSubmit, watch, resetField } = useForm<FormValues>({
    defaultValues: {
      fileURL: "",
    },
    mode: "all",
  });
  watch("file");
  watch("fileURL");

  const handleFileChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const file = e.target.files?.[0];
      if (file) setValue("file", file);
      else resetField("file");
    },
    [setValue, resetField],
  );

  const submit = handleSubmit(async (values) => {
    let file: Blob | undefined = values.file;
    if (!file && values.fileURL) file = await fetch(values.fileURL).then((res) => res.blob());
    if (!file) throw new Error("Cant access file");

    // get file hash
    const buffer = await file.arrayBuffer();
    const hash = await window.crypto.subtle.digest("SHA-256", buffer);
    onSubmit({ hash: arrayBufferToHex(hash), file, fileURL: values.fileURL });

    //   const pub = await publish("Post", draft);
  });

  const fileObjectURL = useObjectURL(getValues().file);
  const stlURL = fileObjectURL || getValues().fileURL;
  let step = 0;
  if (getValues().file) step = 1;

  return (
    <Flex as="form" onSubmit={submit} direction="column" gap="2" maxW="40rem" w="full" mx="auto">
      <Heading size="md">Upload File</Heading>
      <Input type="file" accept="model/stl" placeholder="Select STL file" onChange={handleFileChange} isDisabled />
      <Flex gap="4" alignItems="center" my="4">
        <Divider />
        <Heading size="sm">OR</Heading>
        <Divider />
      </Flex>
      <Heading size="md">Use Remote File</Heading>
      <Input
        type="url"
        {...register("fileURL", { validate: (str) => str && str.endsWith(".stl"), required: true })}
        placeholder="https://example.com/files/things/cube.stl"
        onChange={handleFileChange}
        autoComplete="off"
      />
      <ButtonGroup ml="auto">
        <BackButton />
        <Button type="submit" colorScheme="primary">
          Next
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
