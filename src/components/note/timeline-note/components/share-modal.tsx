import {
  Button,
  Center,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { getMediaAttachmentURLsFromContent } from "applesauce-content/helpers";
import { getMediaAttachments } from "applesauce-core/helpers";
import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { BlossomClient } from "blossom-client-sdk";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { useCallback, useMemo, useState } from "react";

import useAppSettings from "../../../../hooks/use-user-app-settings";
import useUsersMediaServers from "../../../../hooks/use-user-blossom-servers";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import { EmbedEventCard } from "../../../embed-event/card";

export default function ShareModal({
  event,
  isOpen,
  onClose,
  ...props
}: Omit<ModalProps, "children"> & { event: NostrEvent }) {
  const { mirrorBlobsOnShare } = useAppSettings();
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const toast = useToast();

  const servers = useUsersMediaServers(account?.pubkey) || [];
  const [mirror, setMirror] = useState(mirrorBlobsOnShare);
  const mediaAttachments = useMemo(() => {
    const attachments = getMediaAttachments(event)
      // filter out media attachments without hashes
      .filter((media) => !!media.sha256);

    // extra media attachments from content
    const content = getMediaAttachmentURLsFromContent(event.content)
      // remove duplicates
      .filter((media) => !attachments.some((a) => a.sha256 === media.sha256));

    return [...attachments, ...content];
  }, [event]);

  const canMirror = servers.length > 0 && mediaAttachments.length > 0;

  const signer = useCallback(
    async (draft: EventTemplate) => {
      if (!account) throw new Error("No account");
      return await account.signEvent(draft);
    },
    [account],
  );

  const [loading, setLoading] = useState("");
  const share = async () => {
    if (mirror && canMirror) {
      try {
        setLoading("Requesting signature for mirroring...");
        const auth = await BlossomClient.createUploadAuth(
          signer,
          mediaAttachments.filter((m) => !!m.sha256).map((m) => m.sha256!),
        );

        setLoading("Mirror blobs...");
        for (const media of mediaAttachments) {
          // send mirror request to all servers
          await Promise.allSettled(
            servers.map((server) =>
              BlossomClient.mirrorBlob(
                server,
                {
                  sha256: media.sha256!,
                  url: media.url,
                  // TODO: these are not needed and should be removed
                  uploaded: 0,
                  size: media.size ?? 0,
                },
                { auth },
              ).catch((err) => {
                // ignore errors from individual servers
              }),
            ),
          );
        }
      } catch (error) {
        if (error instanceof Error)
          toast({ status: "error", title: `Failed to mirror media`, description: error.message });
      }
    }

    setLoading("Sharing...");
    const draft = await factory.share(event);

    setLoading("Publishing...");
    await publish("Share", draft);
    setLoading("");

    // close modal
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px="4" py="2">
          Share Note
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0">
          {loading ? (
            <Center>
              <Spinner /> {loading}
            </Center>
          ) : (
            <>
              <EmbedEventCard event={event} />

              {canMirror && (
                <>
                  <Checkbox isChecked={mirror} onChange={() => setMirror(!mirror)} mt="4">
                    Mirror media ({mediaAttachments.length}) to blossom servers ({servers.length})
                  </Checkbox>
                  <Text fontSize="sm" color="GrayText">
                    Copy media to your blossom servers so it can be found later
                  </Text>
                </>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter px="4" py="4">
          <Button variant="ghost" size="md" mr="auto" onClick={onClose} flexShrink={0}>
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            variant="solid"
            onClick={() => share()}
            size="md"
            isLoading={!!loading}
            flexShrink={0}
          >
            Share
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
