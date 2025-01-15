import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Code, Flex, FormControl, FormLabel, Heading, Input, Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useObservable } from "applesauce-react/hooks";

import SimpleView from "../../../../components/layout/presets/simple-view";
import { bakery$, setBakeryURL } from "../../../../services/bakery";
import QRCodeScannerButton from "../../../../components/qr-code/qr-code-scanner-button";
import TextButton from "../../../../components/dashboard/text-button";

function ConnectForm() {
  const [params] = useSearchParams();
  const bakery = useObservable(bakery$);
  const { register, handleSubmit, formState, setValue } = useForm({
    defaultValues: {
      url: params.get("relay") ?? bakery?.url ?? "",
    },
    mode: "all",
  });

  const handleScanData = (data: string) => {
    setValue("url", data.replace(/^http:/, "ws:").replace(/^https:/, "wss:"));
  };

  const submit = handleSubmit(async (values) => {
    let url = values.url.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

    // automatically add a proto onto the url
    if (!url.startsWith("ws")) url = "wss://" + url;

    setBakeryURL(new URL(url).toString());
  });

  return (
    <Flex as="form" onSubmit={submit} gap="2" direction="column">
      <FormControl>
        <FormLabel>Bakery URL</FormLabel>
        <Flex gap="2">
          <Input type="text" {...register("url", { required: true })} isRequired placeholder="ws://localhost:2012" />
          <QRCodeScannerButton onData={handleScanData} />
        </Flex>
      </FormControl>

      <Button isLoading={formState.isSubmitting} type="submit" ml="auto" colorScheme="primary">
        Connect
      </Button>
    </Flex>
  );
}

function ConnectConfirmation() {
  const [params] = useSearchParams();
  const bakery = useObservable(bakery$);
  const relay = params.get("relay");
  const navigate = useNavigate();

  const connect = () => {
    if (relay) setBakeryURL(relay);
  };

  return (
    <Flex direction="column" gap="2">
      <Heading>Change Node?</Heading>
      <Box>
        <Text>You are currently connected to:</Text>
        <Code>{bakery?.url}</Code>
      </Box>
      <Box>
        <Text>Do you want to change nodes to:</Text>
        <Code>{relay}</Code>
      </Box>
      <Flex gap="2" w="sm">
        <TextButton onClick={() => navigate("/")}>[ cancel ]</TextButton>
        <TextButton colorScheme="green" onClick={connect}>
          [ connect ]
        </TextButton>
      </Flex>
    </Flex>
  );
}

export default function BakeryConnectView() {
  const location = useLocation();
  const bakery = useObservable(bakery$);
  const connected = useObservable(bakery?.connectedSub);

  const [params] = useSearchParams();
  const relayParam = params.get("relay");

  if (connected && !params.has("config") && !relayParam) {
    return <Navigate to={location.state?.back ?? "/"} replace />;
  }

  const isRelayParamEqual = bakery && relayParam && new URL(bakery.url).toString() === new URL(relayParam).toString();
  if (isRelayParamEqual) return <Navigate replace to="/" />;

  return (
    <SimpleView title="Connect bakery" maxW="4xl">
      <ConnectForm />
    </SimpleView>
  );
}
