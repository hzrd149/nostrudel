import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Code,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { useObservable } from "applesauce-react/hooks";

import bakery, { setBakeryURL } from "../../../services/bakery";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import TextButton from "../../../components/dashboard/text-button";

function ConnectForm() {
  const [params] = useSearchParams();
  const { register, handleSubmit, formState, setValue } = useForm({
    defaultValues: {
      url: params.get("relay") ?? bakery?.url ?? "",
    },
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
      <Heading size="lg">Bakery</Heading>
      <FormControl>
        <FormLabel>Bakery URL</FormLabel>
        <Flex gap="2">
          <Input type="text" {...register("url", { required: true })} isRequired placeholder="ws://127.0.0.1:2012" />
          <QRCodeScannerButton onData={handleScanData} />
        </Flex>
        <FormHelperText>This is the URL to your bakery</FormHelperText>
      </FormControl>
      <Flex>
        {params.has("config") && (
          <Button as={RouterLink} to="/" p="2" variant="link">
            Back
          </Button>
        )}
        <Button isLoading={formState.isSubmitting} type="submit" ml="auto" colorScheme="brand">
          Connect
        </Button>
      </Flex>
    </Flex>
  );
}

function ConnectConfirmation() {
  const [params] = useSearchParams();
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

export default function ConnectView() {
  const location = useLocation();
  const connected = useObservable(bakery?.connectedSub);

  const [params] = useSearchParams();
  const relayParam = params.get("relay");

  if (connected && !params.has("config") && !relayParam) {
    return <Navigate to={location.state?.back ?? "/"} replace />;
  }

  const isRelayParamEqual = bakery && relayParam && new URL(bakery.url).toString() === new URL(relayParam).toString();
  if (isRelayParamEqual) return <Navigate replace to="/" />;

  return (
    <Flex w="full" h="full" alignItems="center" justifyContent="center">
      <Flex direction="column" gap="2" w="full" maxW="sm" m="4">
        {relayParam ? <ConnectConfirmation /> : <ConnectForm />}
      </Flex>
    </Flex>
  );
}
