import { Button, Flex, FormControl, FormLabel, Heading, Input, Spinner, Textarea, useToast } from "@chakra-ui/react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { NostrEvent } from "nostr-tools";

import { WIKI_RELAYS } from "../../const";
import useCacheForm from "../../hooks/use-cache-form";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import useCurrentAccount from "../../hooks/use-current-account";
import { WIKI_PAGE_KIND, getPageSummary, getPageTitle, getPageTopic } from "../../helpers/nostr/wiki";
import { getSharableEventAddress } from "../../helpers/nip19";
import { usePublishEvent } from "../../providers/global/publish-provider";
import VerticalPageLayout from "../../components/vertical-page-layout";
import MarkdownEditor from "./components/markdown-editor";
import { ErrorBoundary } from "../../components/error-boundary";
import { cloneEvent, replaceOrAddSimpleTag } from "../../helpers/nostr/event";
import FormatToolbar from "./components/format-toolbar";
import dictionaryService from "../../services/dictionary";

function EditWikiPagePage({ page }: { page: NostrEvent }) {
  const toast = useToast();
  const publish = usePublishEvent();
  const navigate = useNavigate();

  const topic = getPageTopic(page);

  const { register, setValue, getValues, handleSubmit, watch, formState, reset } = useForm({
    defaultValues: { content: page.content, title: getPageTitle(page) ?? topic, summary: getPageSummary(page, false) },
    mode: "all",
  });

  const clearFormCache = useCacheForm(
    "wiki-" + topic,
    // @ts-expect-error
    getValues,
    setValue,
    formState,
  );

  watch("content");
  register("content", {
    minLength: 10,
    required: true,
  });

  const submit = handleSubmit(async (values) => {
    try {
      const draft = cloneEvent(WIKI_PAGE_KIND, page);
      draft.content = values.content;
      replaceOrAddSimpleTag(draft, "summary", values.summary);

      const pub = await publish("Publish Page", draft, WIKI_RELAYS, false);
      dictionaryService.handleEvent(pub.event);
      clearFormCache();
      navigate(`/wiki/page/${getSharableEventAddress(pub.event)}`, { replace: true });
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
  });

  return (
    <VerticalPageLayout as="form" h="full" onSubmit={submit}>
      <Heading>Edit Page</Heading>
      <Flex gap="2" wrap={{ base: "wrap", md: "nowrap" }}>
        <FormControl w={{ base: "full", md: "sm" }} isRequired flexShrink={0}>
          <FormLabel>Topic</FormLabel>
          <Input readOnly value={topic} />
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
      <FormatToolbar
        getValue={() => getValues().content}
        setValue={(content) => setValue("content", content, { shouldDirty: true })}
      />
      <MarkdownEditor value={getValues().content} onChange={(v) => setValue("content", v)} />
      <Flex gap="2" justifyContent="flex-end">
        {formState.isDirty && <Button onClick={() => reset()}>Clear</Button>}
        <Button onClick={() => navigate(-1)}>Cancel</Button>
        <Button colorScheme="primary" type="submit" isLoading={formState.isSubmitting}>
          Publish
        </Button>
      </Flex>
    </VerticalPageLayout>
  );
}

export default function EditWikiPageView() {
  const account = useCurrentAccount();
  if (!account) return <Navigate to="/" />;

  const topic = useParams().topic;
  if (!topic) return <Navigate to="/wiki" />;

  const page = useReplaceableEvent({ kind: WIKI_PAGE_KIND, pubkey: account.pubkey, identifier: topic });

  if (!page) return <Spinner />;

  return (
    <ErrorBoundary>
      <EditWikiPagePage page={page} />
    </ErrorBoundary>
  );
}
