import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Textarea } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import personalNode, { controlApi, clearBakeryURL } from "../../../../services/bakery";
import SimpleView from "../../../../components/layout/presets/simple-view";

function NodeGeneralSettingsPage() {
  const config = useObservable(controlApi?.config);
  const { register, handleSubmit, formState, reset } = useForm({
    defaultValues: config || {},
    mode: "all",
  });

  useEffect(() => reset(config, { keepDirty: false }), [config]);

  const submit = handleSubmit(async (values) => {
    await controlApi?.send(["CONTROL", "CONFIG", "SET", "name", values.name]);
    await controlApi?.send(["CONTROL", "CONFIG", "SET", "description", values.description]);
    await controlApi?.send(["CONTROL", "CONFIG", "SET", "hyperEnabled", values.hyperEnabled]);

    // wait for control api to send config back
    await new Promise<void>((res) => {
      const sub = controlApi?.config.subscribe(() => {
        res();
        sub?.unsubscribe();
      });
    });
  });

  const disconnect = () => {
    if (confirm("Disconnect from personal node?")) {
      clearBakeryURL();
    }
  };

  return (
    <SimpleView title="Node Settings">
      <FormControl>
        <FormLabel>Node URL</FormLabel>
        <Flex gap="2">
          <Input readOnly value={personalNode!.url} maxW="xs" />
          <Button isDisabled>Change</Button>
        </Flex>
        <Button variant="link" colorScheme="red" mt="2" onClick={disconnect}>
          disconnect
        </Button>
      </FormControl>

      <Flex as="form" onSubmit={submit} direction="column" maxW="lg" gap="4">
        <FormControl isRequired>
          <FormLabel>Node Name</FormLabel>
          <Input type="text" {...register("name", { required: true })} isRequired autoComplete="off" />
          <FormHelperText>The publicly visible name of your node</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea {...register("description")} />
          <FormHelperText>A short description about your node</FormHelperText>
        </FormControl>

        <Button
          isDisabled={!formState.isDirty}
          isLoading={formState.isLoading}
          colorScheme="green"
          ml="auto"
          type="submit"
        >
          Save
        </Button>
      </Flex>
    </SimpleView>
  );
}

export default function BakeryGeneralSettingsView() {
  return <>{personalNode ? <NodeGeneralSettingsPage /> : <Heading>Missing personal node connection</Heading>}</>;
}
