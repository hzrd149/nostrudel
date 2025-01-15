import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Textarea } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { controlApi$, clearBakeryURL, bakery$ } from "../../../../services/bakery";
import SimpleView from "../../../../components/layout/presets/simple-view";
import { Navigate } from "react-router-dom";

function BakeryGeneralSettingsPage() {
  const bakery = useObservable(bakery$);
  const controlApi = useObservable(controlApi$);
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
    if (confirm("Disconnect from bakery?")) clearBakeryURL();
  };

  return (
    <SimpleView title="Node Settings" maxW="4xl" gap="4">
      <FormControl>
        <FormLabel>Bakery URL</FormLabel>
        <Flex maxW="lg" gap="2">
          <Input readOnly value={bakery!.url} />
          <Button colorScheme="red" onClick={disconnect} variant="ghost" flexShrink={0}>
            disconnect
          </Button>
        </Flex>
      </FormControl>

      <Flex as="form" onSubmit={submit} direction="column" maxW="lg" gap="4">
        <FormControl isRequired>
          <FormLabel>Bakery Name</FormLabel>
          <Input type="text" {...register("name", { required: true })} isRequired autoComplete="off" />
          <FormHelperText>The publicly visible name of your bakery relay</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea {...register("description")} />
          <FormHelperText>A short description about your bakery</FormHelperText>
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
  const bakery = useObservable(bakery$);

  if (!bakery) return <Navigate to="/settings/bakery/connect" />;

  return <BakeryGeneralSettingsPage />;
}
