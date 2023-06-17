import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  FormHelperText,
  Input,
  Link,
  Button,
  FormErrorMessage,
} from "@chakra-ui/react";
import useAppSettings from "../../hooks/use-app-settings";
import { useForm } from "react-hook-form";
import { useAsync } from "react-use";

async function validateInvidiousUrl(url?: string) {
  if (!url) return true;
  try {
    const res = await fetch(new URL("/api/v1/stats", url));
    return res.ok || "Catch reach instance";
  } catch (e) {
    return "Catch reach instance";
  }
}

export default function PrivacySettings() {
  const { youtubeRedirect, twitterRedirect, redditRedirect, corsProxy, updateSettings } = useAppSettings();

  const { register, handleSubmit, formState } = useForm({
    mode: "onBlur",
    defaultValues: {
      youtubeRedirect,
      twitterRedirect,
      redditRedirect,
      corsProxy,
    },
  });

  const save = handleSubmit(async (values) => {
    await updateSettings(values);
  });

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Privacy
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <form onSubmit={save}>
          <Flex direction="column" gap="4">
            <FormControl isInvalid={!!formState.errors.twitterRedirect}>
              <FormLabel>Nitter instance</FormLabel>
              <Input type="url" placeholder="https://nitter.net/" {...register("twitterRedirect")} />
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
                placeholder="Invidious instance url"
                {...register("youtubeRedirect", {
                  validate: validateInvidiousUrl,
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
              <Input type="url" placeholder="https://nitter.net/" {...register("redditRedirect")} />
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
              <FormLabel>CORS Proxy</FormLabel>
              <Input type="url" placeholder="https://cors.example.com/" {...register("corsProxy")} />
              {formState.errors.corsProxy && <FormErrorMessage>{formState.errors.corsProxy.message}</FormErrorMessage>}
              <FormHelperText>
                This is used as a fallback when verifying NIP-05 ids and fetching open-graph metadata. URL to an
                instance of{" "}
                <Link href="https://github.com/Rob--W/cors-anywhere" isExternal color="blue.500">
                  cors-anywhere
                </Link>
              </FormHelperText>
            </FormControl>

            <Button
              colorScheme="brand"
              ml="auto"
              isLoading={formState.isSubmitting}
              type="submit"
              isDisabled={!formState.isDirty}
            >
              Save
            </Button>
          </Flex>
        </form>
      </AccordionPanel>
    </AccordionItem>
  );
}
