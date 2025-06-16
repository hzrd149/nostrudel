import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Spacer,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { EventTemplate, nip19 } from "nostr-tools";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";

import "easymde/dist/easymde.min.css";

import UserName from "../../components/user/user-name";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { WIKI_RELAYS } from "../../const";
import { getEventCoordinate } from "../../helpers/nostr/event";
import { WIKI_PAGE_KIND, getPageSummary, getPageTitle, getPageTopic } from "../../helpers/nostr/wiki";
import { removeNonASCIIChar } from "../../helpers/string";
import useCacheForm from "../../hooks/use-cache-form";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { getSharableEventAddress } from "../../services/relay-hints";
import FormatButton from "./components/format-toolbar";
import MarkdownEditor from "./components/markdown-editor";

export default function CreateWikiPageView() {
  const toast = useToast();
  const publish = usePublishEvent();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const presetTopic = search.get("topic");
  const presetTitle = search.get("title");
  const forkAddress = useMemo(() => {
    const addr = search.get("fork");
    if (addr) {
      const decode = nip19.decode(addr);
      if (decode.type === "naddr") return decode.data;
    }
  }, [search]);

  const fork = useReplaceableEvent(forkAddress ?? undefined);

  const { register, setValue, getValues, handleSubmit, watch, formState, reset } = useForm({
    defaultValues: { content: "", title: presetTitle || presetTopic || "", topic: presetTopic || "", summary: "" },
    mode: "all",
  });

  // update form when fork is loaded
  useEffect(() => {
    if (!fork) return;

    reset({
      topic: getPageTopic(fork),
      title: getPageTitle(fork) ?? "",
      summary: getPageSummary(fork, false) ?? "",
      content: fork.content,
    });
  }, [fork, reset]);

  const cacheKey = forkAddress
    ? "wiki-" + forkAddress.identifier + ":" + forkAddress.pubkey + "-fork"
    : presetTopic
      ? "wiki-" + presetTopic
      : "wiki-create-page";

  const clearFormCache = useCacheForm(
    cacheKey,
    // @ts-expect-error
    getValues,
    reset,
    formState,
  );

  watch("content");
  register("content", {
    minLength: 10,
    required: true,
  });

  const submit = handleSubmit(async (values) => {
    try {
      const draft: EventTemplate = {
        kind: WIKI_PAGE_KIND,
        content: values.content,
        tags: [
          ["d", values.topic],
          ["title", values.title],
          ["summary", values.summary],
          ["published_at", String(dayjs().unix())],
        ],
        created_at: dayjs().unix(),
      };

      if (fork) {
        draft.tags.push(["e", fork.id, WIKI_RELAYS[0], "fork"]);
        draft.tags.push(["a", getEventCoordinate(fork), WIKI_RELAYS[0], "fork"]);
      }

      const pub = await publish("Publish Page", draft, WIKI_RELAYS, false);
      clearFormCache();
      navigate(`/wiki/page/${getSharableEventAddress(pub.event)}`, { replace: true });
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
  });

  return (
    <VerticalPageLayout as="form" h="full" onSubmit={submit}>
      <Heading>Create Page</Heading>
      {fork && (
        <Alert status="info">
          <AlertIcon />
          Forking page from <UserName pubkey={fork.pubkey} ml="2" />
        </Alert>
      )}
      <Flex gap="2" wrap={{ base: "wrap", md: "nowrap" }}>
        <FormControl w={{ base: "full", md: "sm" }} isRequired flexShrink={0}>
          <FormLabel>Topic</FormLabel>
          <Input
            placeholder="banana"
            isRequired
            {...register("topic", {
              onBlur: () => {
                const v = removeNonASCIIChar(getValues().topic);
                setValue("topic", v.replaceAll(" ", "_").toLocaleLowerCase());
                if (!getValues().title) setValue("title", v, { shouldDirty: true });
              },
            })}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input {...register("title", { required: true })} autoComplete="off" />
        </FormControl>
      </Flex>
      <FormControl>
        <FormLabel>Summary</FormLabel>
        <Textarea {...register("summary", { required: true })} isRequired />
      </FormControl>
      <Flex gap="2">
        <FormatButton
          getValue={() => getValues().content}
          setValue={(content) => setValue("content", content, { shouldDirty: true })}
        />
        <Spacer />
        <Button onClick={() => navigate(-1)}>Cancel</Button>
        <Button colorScheme="primary" type="submit" isLoading={formState.isSubmitting}>
          Publish
        </Button>
      </Flex>
      <MarkdownEditor value={getValues().content} onChange={(v) => setValue("content", v)} />
    </VerticalPageLayout>
  );
}
