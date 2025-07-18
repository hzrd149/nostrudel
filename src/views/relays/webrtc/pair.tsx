import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Text,
  useDisclosure,
  useInterval,
} from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { getPublicKey, kinds, nip19 } from "nostr-tools";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useAsync } from "react-use";

import { useActiveAccount } from "applesauce-react/hooks";
import { CopyIconButton } from "../../../components/copy-icon-button";
import { QrCodeIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import useForceUpdate from "../../../hooks/use-force-update";
import useUserProfile from "../../../hooks/use-user-profile";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import localSettings from "../../../services/preferences";
import webRtcRelaysService from "../../../services/webrtc-relays";

function NameForm() {
  const publish = usePublishEvent();
  const { register, handleSubmit, formState, reset } = useForm({ defaultValues: { name: "" }, mode: "all" });

  const { value: pubkey } = useAsync(async () => webRtcRelaysService.broker.signer.getPublicKey());
  const metadata = useUserProfile(pubkey);
  useEffect(() => {
    if (metadata?.name) reset({ name: metadata.name }, { keepDirty: false, keepTouched: false });
  }, [metadata?.name]);

  const submit = handleSubmit(async (values) => {
    const event = await webRtcRelaysService.broker.signer.signEvent({
      kind: kinds.Metadata,
      created_at: dayjs().unix(),
      tags: [],
      content: JSON.stringify({ name: values.name }),
    });

    await publish("Set WebRTC name", event);
  });

  return (
    <Flex direction="column" gap="2" as="form" onSubmit={submit}>
      <FormControl isRequired>
        <FormLabel>Local relay name</FormLabel>
        <Flex gap="2">
          <Input {...register("name", { required: true })} isRequired autoComplete="off" />
          <Button type="submit" isLoading={formState.isSubmitting}>
            Set
          </Button>
        </Flex>
        <FormHelperText>The name that will be shown to other peers</FormHelperText>
      </FormControl>
    </Flex>
  );
}

export default function WebRtcPairView() {
  const update = useForceUpdate();
  useInterval(update, 1000);
  useEffect(() => {
    webRtcRelaysService.broker.on("call", update);

    return () => {
      webRtcRelaysService.broker.off("call", update);
    };
  }, [update]);

  const account = useActiveAccount();
  const showQrCode = useDisclosure();

  const identity = useObservableEagerState(localSettings.webRtcLocalIdentity);
  const pubkey = useMemo(() => getPublicKey(identity), [identity]);
  const npub = useMemo(() => nip19.npubEncode(pubkey), [pubkey]);

  const uri = "webrtc+nostr:" + npub;

  return (
    <SimpleView title="Pair with WebRTC relay">
      <Text fontStyle="italic" mt="-2">
        Share this URI with other users to allow them to connect to your local relay
      </Text>

      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={pubkey} size="sm" />
        <Input readOnly userSelect="all" value={uri} />
        <IconButton icon={<QrCodeIcon boxSize="1.5em" />} aria-label="Show QR Code" onClick={showQrCode.onToggle} />
        <CopyIconButton value={uri} aria-label="Copy Npub" />
      </Flex>

      {showQrCode.isOpen && (
        <Box w="full" maxW="sm" mx="auto">
          <QrCodeSvg content={uri} />
        </Box>
      )}

      {pubkey !== account?.pubkey && <NameForm />}

      <Heading size="md" mt="4">
        Connection Requests:
      </Heading>
      {webRtcRelaysService.pendingIncoming.length > 0 ? (
        <>
          {webRtcRelaysService.pendingIncoming.map((event) => (
            <Flex key={event.id} borderWidth="1px" rounded="md" p="2" alignItems="center" gap="2">
              <UserAvatar pubkey={event.pubkey} size="sm" />
              <UserName pubkey={event.pubkey} />
              <Button
                size="sm"
                ml="auto"
                colorScheme="green"
                onClick={() => {
                  webRtcRelaysService.acceptCall(event);
                  update();
                }}
              >
                Accept
              </Button>
            </Flex>
          ))}
        </>
      ) : (
        <Alert status="info">
          <AlertIcon />
          No connections requests
        </Alert>
      )}
    </SimpleView>
  );
}
