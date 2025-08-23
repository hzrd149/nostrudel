import { CloseIcon } from "@chakra-ui/icons";
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
import {
  AddBlossomServer,
  NewBlossomServers,
  RemoveBlossomServer,
  SetDefaultBlossomServer,
} from "applesauce-actions/actions";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { areServersEqual, USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { useForm } from "react-hook-form";

import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import BlossomServerFavicon from "../../../components/blossom/blossom-server-favicon";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import useAsyncAction from "../../../hooks/use-async-action";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useAppSettings from "../../../hooks/use-user-app-settings";
import useUsersBlossomServers from "../../../hooks/use-user-blossom-servers";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import BlossomServerLink from "../../../components/blossom/blossom-server-link";

function ServerRow({ server, index }: { server: string | URL; index: number }) {
  const actions = useActionHub();
  const publish = usePublishEvent();

  const removeServer = useAsyncAction(
    async (server: string) => {
      await actions.exec(RemoveBlossomServer, server).forEach((event) => publish("Remove media server", event));
    },
    [actions, publish],
  );
  const makeDefault = useAsyncAction(
    async (server: string) => {
      await actions
        .exec(SetDefaultBlossomServer, server)
        .forEach((event) => publish("Set default media server", event));
    },
    [actions, publish],
  );

  return (
    <Flex
      gap="2"
      p="2"
      alignItems="center"
      borderWidth="1px"
      borderRadius="lg"
      key={server.toString()}
      borderColor={index === 0 ? "primary.500" : undefined}
    >
      <BlossomServerFavicon server={server} size="sm" />
      <BlossomServerLink server={server} fontSize="lg" />

      <ButtonGroup size="sm" ml="auto">
        <Button
          variant={index === 0 ? "solid" : "ghost"}
          colorScheme={index === 0 ? "primary" : undefined}
          onClick={() => makeDefault.run(server.toString())}
          isDisabled={index === 0}
          isLoading={makeDefault.loading}
        >
          Default
        </Button>
        <IconButton
          aria-label="Remove server"
          icon={<CloseIcon />}
          colorScheme="red"
          onClick={() => removeServer.run(server.toString())}
          isLoading={removeServer.loading}
          variant="ghost"
        />
      </ButtonGroup>
    </Flex>
  );
}

function AddServerForm() {
  const account = useActiveAccount()!;
  const toast = useToast();
  const servers = useUsersBlossomServers(account.pubkey);
  const publish = usePublishEvent();
  const actions = useActionHub();

  const { register, handleSubmit, reset } = useForm({ defaultValues: { server: "" } });

  const event = useReplaceableEvent({ kind: USER_BLOSSOM_SERVER_LIST_KIND, pubkey: account.pubkey });
  const addServer = useAsyncAction(
    async (server: string) => {
      if (event) await actions.exec(AddBlossomServer, server).forEach((event) => publish("Add media server", event));
      else await actions.exec(NewBlossomServers, [server]).forEach((event) => publish("Add media server", event));
    },
    [actions, publish, event],
  );

  const submit = handleSubmit(async (values) => {
    const url = new URL(values.server.startsWith("http") ? values.server : "https://" + values.server).toString();

    if (servers?.some((s) => areServersEqual(s, url)))
      return toast({ status: "error", description: "Server already in list" });

    try {
      // test server
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to connect to server");

      await addServer.run(url);
      reset();
    } catch (error) {
      toast({ status: "error", description: "Cant reach server" });
    }
  });

  return (
    <Flex as="form" onSubmit={submit} gap="2">
      <Input {...register("server", { required: true })} required placeholder="https://nostr.download" />
      <Button type="submit" colorScheme="primary">
        Add
      </Button>
    </Flex>
  );
}

function MissingServers() {
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const actions = useActionHub();

  const event = useReplaceableEvent({ kind: USER_BLOSSOM_SERVER_LIST_KIND, pubkey: account.pubkey });
  const addServer = useAsyncAction(
    async (server: string) => {
      if (event) await actions.exec(AddBlossomServer, server).forEach((event) => publish("Add media server", event));
      else await actions.exec(NewBlossomServers, [server]).forEach((event) => publish("Add media server", event));
    },
    [actions, publish, event],
  );

  return (
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
      <Flex gap="2" direction="column" maxW="sm">
        <Button
          onClick={() => addServer.run("https://nostr.download/")}
          isLoading={addServer.loading}
          leftIcon={<BlossomServerFavicon server="https://nostr.download/" size="sm" />}
          variant="link"
          w="full"
          justifyContent="flex-start"
        >
          nostr.download
        </Button>
        <Button
          onClick={() => addServer.run("https://blossom.primal.net/")}
          isLoading={addServer.loading}
          leftIcon={<BlossomServerFavicon server="https://blossom.primal.net/" size="sm" />}
          variant="link"
          w="full"
          justifyContent="flex-start"
        >
          blossom.primal.net
        </Button>
      </Flex>
    </Alert>
  );
}

function MediaServersPage() {
  const account = useActiveAccount()!;
  const { mediaUploadService, updateSettings } = useAppSettings();
  const servers = useUsersBlossomServers(account.pubkey);
  const event = useReplaceableEvent({ kind: USER_BLOSSOM_SERVER_LIST_KIND, pubkey: account.pubkey });

  const switchToBlossom = useAsyncAction(async () => {
    await updateSettings({ mediaUploadService: "blossom" });
  }, [updateSettings]);

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
            <Button size="sm" variant="outline" onClick={switchToBlossom.run} isLoading={switchToBlossom.loading}>
              Switch to Blossom
            </Button>
          </Box>
        </Alert>
      )}

      {(!servers || servers.length === 0) && mediaUploadService === "blossom" && <MissingServers />}

      <Flex direction="column" gap="2">
        {servers?.map((server, i) => (
          <ServerRow key={server.toString()} server={server} index={i} />
        ))}
      </Flex>

      {mediaUploadService === "blossom" && <AddServerForm />}
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
