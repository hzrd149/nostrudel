import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  IconButton,
  Input,
  Link,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useForm } from "react-hook-form";

import RequireActiveAccount from "../../../components/router/require-active-account";
import { useActiveAccount } from "applesauce-react/hooks";
import MediaServerFavicon from "../../../components/favicon/media-server-favicon";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import useUsersMediaServers from "../../../hooks/use-user-media-servers";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { cloneEvent } from "../../../helpers/nostr/event";
import useAppSettings from "../../../hooks/use-user-app-settings";
import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";
import { isServerTag } from "../../../helpers/nostr/blossom";
import { USER_BLOSSOM_SERVER_LIST_KIND, areServersEqual } from "blossom-client-sdk";
import SimpleView from "../../../components/layout/presets/simple-view";

function MediaServersPage() {
  const toast = useToast();
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const { mediaUploadService, updateSettings } = useAppSettings();
  const { event, servers } = useUsersMediaServers(account.pubkey, undefined, true);

  const addServer = async (server: string) => {
    const draft = cloneEvent(USER_BLOSSOM_SERVER_LIST_KIND, event);
    draft.tags = [
      ...draft.tags.filter((t) => !isServerTag(t)),
      ...servers.map((server) => ["server", server.toString()]),
      ["server", server],
    ];
    await publish("Add media server", draft);
  };
  const removeServer = async (server: string) => {
    const draft = cloneEvent(USER_BLOSSOM_SERVER_LIST_KIND, event);
    draft.tags = [
      ...draft.tags.filter((t) => !isServerTag(t)),
      ...servers.filter((s) => !areServersEqual(s, server)).map((server) => ["server", server.toString()]),
    ];
    await publish("Remove media server", draft);
  };
  const makeDefault = async (server: string) => {
    const draft = cloneEvent(USER_BLOSSOM_SERVER_LIST_KIND, event);
    draft.tags = [
      ...draft.tags.filter((t) => !isServerTag(t)),
      ["server", server.toString()],
      ...servers.filter((s) => !areServersEqual(s, server)).map((server) => ["server", server.toString()]),
    ];
    await publish("Remove media server", draft);
  };

  const { run: switchToBlossom } = useAsyncErrorHandler(async () => {
    await updateSettings({ mediaUploadService: "blossom" });
  }, [updateSettings]);

  const { register, handleSubmit, reset, setValue } = useForm({ defaultValues: { server: "" } });

  const submit = handleSubmit(async (values) => {
    const url = new URL(values.server.startsWith("http") ? values.server : "https://" + values.server).toString();

    if (event?.tags.some((t) => isServerTag(t) && areServersEqual(t[1], url)))
      return toast({ status: "error", description: "Server already in list" });

    try {
      // test server
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to connect to server");

      await addServer(url);
      reset();
    } catch (error) {
      toast({ status: "error", description: "Cant reach server" });
    }
  });

  return (
    <SimpleView
      gap="2"
      title="Media Servers"
      actions={event && <DebugEventButton event={event} size="sm" ml="auto" />}
      maxW="4xl"
    >
      <Text fontStyle="italic" mt="-2">
        <Link href="https://github.com/hzrd149/blossom" target="_blank" color="blue.500">
          Blossom
        </Link>{" "}
        media servers are used to host your images and videos when making a post
      </Text>

      {mediaUploadService !== "blossom" && (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>Blossom not selected</AlertTitle>
            <AlertDescription>
              These servers wont be used for anything unless you set "Media upload service" to "Blossom" in the settings
            </AlertDescription>
            <br />
            <Button size="sm" variant="outline" onClick={switchToBlossom}>
              Switch to Blossom
            </Button>
          </Box>
        </Alert>
      )}

      {servers.length === 0 && mediaUploadService === "blossom" && (
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="xs"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No media servers!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            You need to add at least one media server in order to upload images and videos
          </AlertDescription>
          <Divider maxW="96" w="full" my="2" />
          <Button onClick={() => setValue("server", "https://nostr.download/")}>Add nostr.download</Button>
        </Alert>
      )}

      <Flex direction="column" gap="2">
        {servers.map((server, i) => (
          <Flex
            gap="2"
            p="2"
            alignItems="center"
            borderWidth="1px"
            borderRadius="lg"
            key={server.toString()}
            borderColor={i === 0 ? "primary.500" : undefined}
          >
            <MediaServerFavicon server={server.toString()} size="sm" />
            <Link href={server.toString()} target="_blank" fontSize="lg">
              {new URL(server).hostname}
            </Link>

            <ButtonGroup size="sm" ml="auto">
              <Button
                variant={i === 0 ? "solid" : "ghost"}
                colorScheme={i === 0 ? "primary" : undefined}
                onClick={() => makeDefault(server.toString())}
                isDisabled={i === 0}
              >
                Default
              </Button>
              <IconButton
                aria-label="Remove server"
                icon={<CloseIcon />}
                colorScheme="red"
                onClick={() => removeServer(server.toString())}
                variant="ghost"
              />
            </ButtonGroup>
          </Flex>
        ))}
      </Flex>

      {mediaUploadService === "blossom" && (
        <>
          <Flex as="form" onSubmit={submit} gap="2">
            <Input {...register("server", { required: true })} required placeholder="https://nostr.download" />
            <Button type="submit" colorScheme="primary">
              Add
            </Button>
          </Flex>
        </>
      )}
    </SimpleView>
  );
}

export default function MediaServersView() {
  return (
    <RequireActiveAccount>
      <MediaServersPage />
    </RequireActiveAccount>
  );
}
