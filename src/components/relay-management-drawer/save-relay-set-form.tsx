import { Button, Flex, FormControl, FormLabel, Input, Textarea, useToast } from "@chakra-ui/react";
import { NostrEvent, kinds } from "nostr-tools";
import { useForm } from "react-hook-form";

import { getListDescription, getListName, setListDescription, setListName } from "../../helpers/nostr/lists";
import { isRTag } from "../../types/nostr-event";
import { cloneEvent, ensureDTag } from "../../helpers/nostr/events";
import { createRTagsFromRelaySets } from "../../helpers/nostr/mailbox";
import NostrPublishAction from "../../classes/nostr-publish-action";
import clientRelaysService from "../../services/client-relays";
import { useSigningContext } from "../../providers/global/signing-provider";

export function SaveRelaySetForm({
  relaySet,
  onCancel,
  onSaved,
  writeRelays,
  readRelays,
}: {
  relaySet?: NostrEvent;
  onCancel: () => void;
  onSaved?: (event: NostrEvent) => void;
  writeRelays: Iterable<string>;
  readRelays: Iterable<string>;
}) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const { register, formState, handleSubmit } = useForm({
    defaultValues: {
      name: relaySet ? getListName(relaySet) ?? "" : "",
      description: relaySet ? getListDescription(relaySet) ?? "" : "",
    },
    mode: "all",
    resetOptions: { keepDirtyValues: true },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const draft = cloneEvent(kinds.Relaysets, relaySet);
      ensureDTag(draft);
      setListName(draft, values.name);
      setListDescription(draft, values.description);

      draft.tags = draft.tags.filter((t) => !isRTag(t));
      draft.tags.push(...createRTagsFromRelaySets(readRelays, writeRelays));

      const signed = await requestSignature(draft);
      new NostrPublishAction("Save Relay Set", clientRelaysService.outbox, signed);
      if (onSaved) onSaved(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <Flex as="form" onSubmit={submit} direction="column" gap="2">
      <FormControl isInvalid={!!formState.errors.name} isRequired>
        <FormLabel>Name</FormLabel>
        <Input type="text" {...register("name", { required: true })} isRequired autoComplete="off" />
      </FormControl>
      <FormControl isInvalid={!!formState.errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register("description")} />
      </FormControl>
      <Flex justifyContent="space-between">
        <Button onClick={onCancel}>Cancel</Button>
        <Button colorScheme="primary" type="submit" isLoading={formState.isSubmitting}>
          Save
        </Button>
      </Flex>
    </Flex>
  );
}
