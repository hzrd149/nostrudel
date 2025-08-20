import {
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  EditableProps,
  Flex,
  Heading,
  IconButton,
  Input,
  Link,
  Spinner,
  Text,
  useEditableControls,
  useToast,
} from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { getProfileContent, mergeRelaySets, parseNIP05Address, ProfileContent } from "applesauce-core/helpers";
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import { kinds } from "nostr-tools";
import { setContent } from "applesauce-factory/operations/content";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { useAsync } from "react-use";

import SimpleView from "../../../components/layout/presets/simple-view";
import { useActiveAccount, useEventFactory, useEventStore } from "applesauce-react/hooks";
import useUserProfile from "../../../hooks/use-user-profile";
import dnsIdentityLoader from "../../../services/dns-identity-loader";
import WikiLink from "../../../components/markdown/wiki-link";
import RawValue from "../../../components/debug-modal/raw-value";
import { ExternalLinkIcon } from "../../../components/icons";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { useWriteRelays } from "../../../hooks/use-client-relays";
import { DEFAULT_LOOKUP_RELAYS } from "../../../const";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RouterLink from "../../../components/router-link";

function EditableControls() {
  const { isEditing, getSubmitButtonProps, getCancelButtonProps, getEditButtonProps } = useEditableControls();

  return isEditing ? (
    <ButtonGroup justifyContent="center" size="sm">
      <IconButton icon={<CheckIcon />} {...getSubmitButtonProps()} aria-label="save" />
      <IconButton icon={<CloseIcon />} {...getCancelButtonProps()} aria-label="Cancel" />
    </ButtonGroup>
  ) : (
    <IconButton size="sm" icon={<EditIcon />} {...getEditButtonProps()} aria-label="Edit" />
  );
}

function EditableIdentity() {
  const factory = useEventFactory();
  const eventStore = useEventStore();
  const account = useActiveAccount();
  const toast = useToast();
  const publish = usePublishEvent();

  const profile = useUserProfile(account?.pubkey);
  const mailboxes = useUserMailboxes();
  const publishRelays = useWriteRelays();

  const onSubmit: EditableProps["onSubmit"] = async (value) => {
    if (!account) return;
    try {
      const metadata = eventStore.getReplaceable(kinds.Metadata, account.pubkey);
      if (!metadata) throw new Error("Failed to find profile");

      const profile = getProfileContent(metadata);
      const newProfile = { ...profile, nip05: value };
      const draft = await factory.modify(metadata, setContent(JSON.stringify(newProfile)));
      const signed = await account.signEvent(draft);

      await publish("Update NIP-05", signed, mergeRelaySets(publishRelays, mailboxes?.outboxes, DEFAULT_LOOKUP_RELAYS));
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  };

  return (
    <Editable
      alignItems="center"
      defaultValue={profile?.nip05}
      fontSize="2xl"
      isPreviewFocusable={false}
      onSubmit={onSubmit}
    >
      <EditablePreview mr="2" />
      {/* Here is the custom input */}
      <Input as={EditableInput} w="xs" mr="2" />
      <EditableControls />
    </Editable>
  );
}

function IdentityDetails({ pubkey, profile }: { pubkey: string; profile: ProfileContent }) {
  const { value: identity, loading } = useAsync(async () => {
    if (!profile?.nip05) return null;
    const parsed = parseNIP05Address(profile.nip05);
    if (!parsed) return null;
    return await dnsIdentityLoader.fetchIdentity(parsed.name, parsed.domain);
  }, [profile?.nip05]);

  const renderDetails = () => {
    if (!identity) return null;

    switch (identity.status) {
      case IdentityStatus.Missing:
        return <Text color="red.500">Unable to find DNS Identity in nostr.json file</Text>;
      case IdentityStatus.Error:
        return (
          <Text color="yellow.500">
            Unable to check DNS identity due to CORS error{" "}
            <Link
              color="blue.500"
              href={`https://cors-test.codehappy.dev/?url=${encodeURIComponent(`https://${identity.domain}/.well-known/nostr.json?name=${identity.name}`)}&method=get`}
              isExternal
            >
              Test
              <ExternalLinkIcon ml="1" />
            </Link>
          </Text>
        );
      case IdentityStatus.Found:
        if (identity.pubkey !== pubkey)
          return (
            <Text color="red.500" fontWeight="bold">
              Invalid DNS Identity! <CloseIcon />
            </Text>
          );
        else
          return (
            <Text color="green.500" fontWeight="bold">
              DNS identity matches pubkey <CheckIcon />
            </Text>
          );
      default:
        return null;
    }
  };

  return (
    <>
      <EditableIdentity />
      {renderDetails()}
      {loading && <Spinner />}
      <RawValue heading="Your pubkey" value={pubkey} />

      {identity?.status === IdentityStatus.Found && (
        <>
          <Heading size="md" mt="4">
            Relays
          </Heading>
          <Text fontStyle="italic" mt="-2">
            You have {identity.relays?.length ?? 0} relays set in your DNS identity
          </Text>

          {identity?.relays?.map((url) => (
            <Flex gap="2" alignItems="center" key={url}>
              <RelayFavicon relay={url} size="sm" />
              <Link as={RouterLink} to={`/relays/${encodeURIComponent(url)}`} isTruncated>
                {url}
              </Link>
            </Flex>
          ))}
        </>
      )}
    </>
  );
}

export default function DnsIdentityView() {
  const account = useActiveAccount();
  if (!account) return <Navigate to="/" />;

  const profile = useUserProfile(account.pubkey);

  return (
    <SimpleView
      title="DNS Identity"
      actions={
        <Link
          href="https://nostr.how/en/guides/get-verified#self-hosted"
          isExternal
          color="blue.500"
          fontStyle="initial"
        >
          What is this?
        </Link>
      }
    >
      {profile?.nip05 ? (
        <IdentityDetails pubkey={account.pubkey} profile={profile} />
      ) : (
        <>
          <Heading>No DNS identity setup</Heading>
          <RawValue heading="Your pubkey" value={account.pubkey} />
          <Text>
            or read the details on the wiki: <WikiLink topic="nip-05">NIP-05</WikiLink>
          </Text>
        </>
      )}
    </SimpleView>
  );
}
