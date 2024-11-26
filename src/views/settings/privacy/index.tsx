import {
  Flex,
  FormControl,
  FormHelperText,
  Input,
  Link,
  FormErrorMessage,
  Code,
  Switch,
  Select,
  Button,
  Heading,
  FormLabel,
  Text,
} from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { safeUrl } from "../../../helpers/parse";
import { createRequestProxyUrl } from "../../../helpers/request";
import { RelayAuthMode } from "../../../classes/relay-pool";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useSettingsForm from "../use-settings-form";
import localSettings from "../../../services/local-settings";

async function validateInvidiousUrl(url?: string) {
  if (!url) return true;
  try {
    const res = await fetch(new URL("/api/v1/stats", url));
    return res.ok || "Cant reach instance";
  } catch (e) {
    return "Cant reach instance";
  }
}

async function validateRequestProxy(url?: string) {
  if (!url) return true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(createRequestProxyUrl("https://example.com", url), { signal: controller.signal });
    return res.ok || "Cant reach instance";
  } catch (e) {
    return "Cant reach instance";
  }
}

export default function PrivacySettings() {
  const { register, submit, formState } = useSettingsForm();

  const defaultAuthenticationMode = useObservable(localSettings.defaultAuthenticationMode);
  const proactivelyAuthenticate = useObservable(localSettings.proactivelyAuthenticate);
  const debugApi = useObservable(localSettings.debugApi);

  return (
    <VerticalPageLayout as="form" onSubmit={submit} flex={1}>
      <Heading size="md">Privacy Settings</Heading>
      <Flex direction="column" gap="4">
        <FormControl>
          <FormLabel>Default authorization behavior</FormLabel>
          <Select
            w="xs"
            rounded="md"
            flexShrink={0}
            value={defaultAuthenticationMode}
            onChange={(e) => localSettings.defaultAuthenticationMode.next(e.target.value as RelayAuthMode)}
          >
            <option value="always">Always authenticate</option>
            <option value="ask">Ask every time</option>
            <option value="never">Never authenticate</option>
          </Select>
          <FormHelperText>How should the app handle relays requesting identification</FormHelperText>
        </FormControl>

        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="proactivelyAuthenticate" mb="0">
              Proactively authenticate to relays
            </FormLabel>
            <Switch
              id="proactivelyAuthenticate"
              isChecked={proactivelyAuthenticate}
              onChange={(e) => localSettings.proactivelyAuthenticate.next(e.currentTarget.checked)}
            />
          </Flex>
          <FormHelperText>
            <span>Authenticate to relays as soon as they send the authentication challenge</span>
          </FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.twitterRedirect}>
          <FormLabel>Nitter instance</FormLabel>
          <Input
            type="url"
            maxW="sm"
            placeholder="https://nitter.net/"
            {...register("twitterRedirect", { setValueAs: safeUrl })}
          />
          {formState.errors.twitterRedirect && (
            <FormErrorMessage>{formState.errors.twitterRedirect.message}</FormErrorMessage>
          )}
          <FormHelperText>
            Nitter is a privacy focused UI for twitter.{" "}
            <Link href="https://github.com/zedeus/nitter/wiki/Instances" isExternal color="blue.500">
              Nitter instances
            </Link>
          </FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.youtubeRedirect}>
          <FormLabel>Invidious instance</FormLabel>
          <Input
            type="url"
            maxW="sm"
            placeholder="Invidious instance url"
            {...register("youtubeRedirect", {
              validate: validateInvidiousUrl,
              setValueAs: safeUrl,
            })}
          />
          {formState.errors.youtubeRedirect && (
            <FormErrorMessage>{formState.errors.youtubeRedirect.message}</FormErrorMessage>
          )}
          <FormHelperText>
            Invidious is a privacy focused UI for youtube.{" "}
            <Link href="https://docs.invidious.io/instances" isExternal color="blue.500">
              Invidious instances
            </Link>
          </FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.redditRedirect}>
          <FormLabel>Teddit / Libreddit instance</FormLabel>
          <Input
            type="url"
            placeholder="https://nitter.net/"
            maxW="sm"
            {...register("redditRedirect", { setValueAs: safeUrl })}
          />
          {formState.errors.redditRedirect && (
            <FormErrorMessage>{formState.errors.redditRedirect.message}</FormErrorMessage>
          )}
          <FormHelperText>
            Libreddit and Teddit are both privacy focused UIs for reddit.{" "}
            <Link
              href="https://github.com/libreddit/libreddit-instances/blob/master/instances.md"
              isExternal
              color="blue.500"
            >
              Libreddit instances
            </Link>
            {", "}
            <Link href="https://codeberg.org/teddit/teddit#instances" isExternal color="blue.500">
              Teddit instances
            </Link>
          </FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.corsProxy}>
          <FormLabel>Request Proxy</FormLabel>
          {window.REQUEST_PROXY ? (
            <>
              <Input type="url" value={window.REQUEST_PROXY} onChange={() => {}} readOnly isDisabled />
              <FormHelperText color="red.500">
                This noStrudel version has the request proxy hard coded to <Code>{window.REQUEST_PROXY}</Code>
              </FormHelperText>
            </>
          ) : (
            <Input
              type="url"
              maxW="sm"
              placeholder="https://corsproxy.io/?<encoded_url>"
              {...register("corsProxy", { validate: validateRequestProxy })}
            />
          )}
          {formState.errors.corsProxy && <FormErrorMessage>{formState.errors.corsProxy.message}</FormErrorMessage>}
          <FormHelperText>
            This is used as a fallback ( to bypass CORS restrictions ) or to make requests to .onion and .i2p domains
            <br />
            This can either point to an instance of{" "}
            <Link href="https://github.com/Rob--W/cors-anywhere" isExternal color="blue.500">
              cors-anywhere
            </Link>{" "}
            or{" "}
            <Link href="https://corsproxy.io/" isExternal color="blue.500">
              corsproxy.io
            </Link>{" "}
            <br />
            <Code fontSize="0.9em">{`<url>`}</Code> or <Code fontSize="0.9em">{`<encoded_url>`}</Code> can be used to
            inject the raw or the encoded url into the proxy url ( example:{" "}
            <Code fontSize="0.9em" userSelect="all">{`https://corsproxy.io/?<encoded_url>`}</Code> )
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="loadOpenGraphData" mb="0">
              Load Open Graph data
            </FormLabel>
            <Switch id="loadOpenGraphData" {...register("loadOpenGraphData")} />
          </Flex>
          <FormHelperText>
            <span>
              Whether to load{" "}
              <Link href="https://ogp.me/" isExternal color="blue.500">
                Open Graph
              </Link>{" "}
              data for links
            </span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="debugApi" mb="0">
              Enable debug api
            </FormLabel>
            <Switch
              id="debugApi"
              isChecked={debugApi}
              onChange={(e) => localSettings.debugApi.next(e.currentTarget.checked)}
            />
          </Flex>
          <FormHelperText>
            <Text>
              Adds a window.noStrudel to the page with access to internal methods{" "}
              <Link
                href="https://github.com/hzrd149/nostrudel/blob/master/src/services/page-api.ts"
                target="_blank"
                color="blue.500"
              >
                see source
              </Link>
            </Text>
            <Text color="orange.500" mt="1">
              WARNING: this can expose your secret keys and signer.
            </Text>
          </FormHelperText>
        </FormControl>
        <Button
          ml="auto"
          isLoading={formState.isLoading || formState.isValidating || formState.isSubmitting}
          isDisabled={!formState.isDirty}
          colorScheme="primary"
          type="submit"
        >
          Save Settings
        </Button>
      </Flex>
    </VerticalPageLayout>
  );
}
