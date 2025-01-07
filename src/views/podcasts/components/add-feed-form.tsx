import { Button, Flex, FormControl, FormHelperText, FormLabel, Input, Switch, useToast } from "@chakra-ui/react";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { useForm } from "react-hook-form";
import useUserPodcasts from "../../../hooks/use-user-podcasts";
import { ErrorBoundary } from "../../../components/error-boundary";
import PodcastFeedCard from "./podcast-feed-card";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { getFeedPointers, getPodcastGUID, PODCASTS_LIST_KIND } from "../../../helpers/nostr/podcasts";
import { xmlFeedsService } from "../../../services/xml-feeds";
import { unixNow } from "applesauce-core/helpers";

export default function AddFeedForm({ onAdded }: { onAdded?: (list: NostrEvent) => void }) {
  const toast = useToast();
  const publish = usePublishEvent();
  const { register, formState, handleSubmit, watch, getValues } = useForm({ defaultValues: { url: "", public: true } });
  const list = useUserPodcasts();

  watch("url");

  const submit = handleSubmit(async (values) => {
    try {
      const url = new URL(values.url).toString();
      const xml = await xmlFeedsService.requestFeed(url);
      if (!xml) throw new Error("Failed to fetch feed");

      const guid = getPodcastGUID(xml);

      let draft: EventTemplate;
      if (list) {
        if (getFeedPointers(list).some((f) => f.guid === guid)) throw new Error("Already subscribed");

        draft = {
          kind: PODCASTS_LIST_KIND,
          created_at: unixNow(),
          content: list.content,
          tags: [...list.tags, ["i", guid, url]],
        };
      } else {
        draft = {
          kind: PODCASTS_LIST_KIND,
          tags: [["i", guid, url]],
          created_at: unixNow(),
          content: "",
        };
      }

      const pub = await publish("Add Podcast", draft);
      if (pub) onAdded?.(pub?.event);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  });

  const url = getValues("url");

  return (
    <Flex as="form" gap="2" direction="column" onSubmit={submit}>
      <FormControl>
        <FormLabel>Feed URL</FormLabel>
        <Input
          type="url"
          {...register("url", { required: true })}
          isRequired
          placeholder="https://best-podcast.com/feed.xml"
        />
        <FormHelperText>Enter the feed URL of a podcast</FormHelperText>
      </FormControl>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="public" mb="0">
            Public subscription
          </FormLabel>
          <Switch id="public" {...register("public")} isDisabled />
        </Flex>
      </FormControl>

      {url && URL.canParse(url) && (
        <ErrorBoundary>
          <PodcastFeedCard pointer={{ guid: "", url: new URL(url) }} />
        </ErrorBoundary>
      )}

      <Flex justifyContent="flex-end">
        <Button type="submit" isLoading={formState.isLoading} colorScheme="primary">
          Add
        </Button>
      </Flex>
    </Flex>
  );
}
