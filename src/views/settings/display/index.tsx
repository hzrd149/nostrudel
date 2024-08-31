import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  FormHelperText,
  Input,
  Select,
  Textarea,
  Link,
  Heading,
  Button,
} from "@chakra-ui/react";

import useSubject from "../../../hooks/use-subject";
import localSettings from "../../../services/local-settings";
import useSettingsForm from "../use-settings-form";
import VerticalPageLayout from "../../../components/vertical-page-layout";

export default function DisplaySettings() {
  const { register, submit, formState } = useSettingsForm();

  const hideZapBubbles = useSubject(localSettings.hideZapBubbles);
  const enableNoteDrawer = useSubject(localSettings.enableNoteThreadDrawer);

  return (
    <VerticalPageLayout flex={1}>
      <Heading size="md">Display Settings</Heading>
      <Flex as="form" onSubmit={submit} direction="column" gap="4">
        <FormControl>
          <FormLabel htmlFor="theme" mb="0">
            Theme
          </FormLabel>
          <Select id="theme" {...register("theme")} maxW="sm">
            <option value="default">Default</option>
            <option value="chakraui">ChakraUI</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="colorMode" mb="0">
            Color Mode
          </FormLabel>
          <Select id="colorMode" {...register("colorMode")} maxW="sm">
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="primaryColor" mb="0">
              Primary Color
            </FormLabel>
            <Input id="primaryColor" type="color" maxW="120" size="sm" {...register("primaryColor")} />
          </Flex>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="maxPageWidth" mb="0">
            Max Page width
          </FormLabel>
          <Select id="maxPageWidth" {...register("maxPageWidth")} maxW="sm">
            <option value="none">None</option>
            <option value="md">Medium (~768px)</option>
            <option value="lg">Large (~992px)</option>
            <option value="xl">Extra Large (~1280px)</option>
          </Select>
          <FormHelperText>
            <span>Setting this will restrict the width of app on desktop</span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="blurImages" mb="0">
              Blur media from strangers
            </FormLabel>
            <Switch id="blurImages" {...register("blurImages")} />
          </Flex>
          <FormHelperText>
            <span>Enabled: blur media from people you aren't following</span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="hideUsernames" mb="0">
              Hide usernames (anon mode)
            </FormLabel>
            <Switch id="hideUsernames" {...register("hideUsernames")} />
          </Flex>
          <FormHelperText>
            <span>
              Enabled: hides usernames and pictures.{" "}
              <Link
                as={RouterLink}
                color="blue.500"
                to="/n/nevent1qqsxvkjgpc6zhydj4rxjpl0frev7hmgynruq027mujdgy2hwjypaqfspzpmhxue69uhkummnw3ezuamfdejszythwden5te0dehhxarjw4jjucm0d5sfntd0"
              >
                Details
              </Link>
            </span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="removeEmojisInUsernames" mb="0">
              Hide Emojis in usernames
            </FormLabel>
            <Switch id="removeEmojisInUsernames" {...register("removeEmojisInUsernames")} />
          </Flex>
          <FormHelperText>
            <span>Enabled: Removes all emojis in other users usernames and display names</span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="hideZapBubbles" mb="0">
              Hide individual zaps on notes
            </FormLabel>
            <Switch
              id="hideZapBubbles"
              isChecked={hideZapBubbles}
              onChange={() => localSettings.hideZapBubbles.next(!localSettings.hideZapBubbles.value)}
            />
          </Flex>
          <FormHelperText>
            <span>Enabled: Hides individual zaps on notes in the timeline</span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="show-content-warning" mb="0">
              Show content warning
            </FormLabel>
            <Switch id="show-content-warning" {...register("showContentWarning")} />
          </Flex>
          <FormHelperText>
            <span>Enabled: shows a warning for notes with NIP-36 Content Warning</span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <Flex alignItems="center">
            <FormLabel htmlFor="enableNoteDrawer" mb="0">
              Open embedded notes in side drawer
            </FormLabel>
            <Switch
              id="enableNoteDrawer"
              isChecked={enableNoteDrawer}
              onChange={() => localSettings.enableNoteThreadDrawer.next(!localSettings.enableNoteThreadDrawer.value)}
            />
          </Flex>
          <FormHelperText>
            <span>Enabled: Clicking on an embedded note will open it in a side drawer</span>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="muted-words" mb="0">
            Muted words
          </FormLabel>
          <Textarea
            id="muted-words"
            {...register("mutedWords")}
            placeholder="Broccoli, Spinach, Artichoke..."
            maxW="2xl"
          />
          <FormHelperText>
            <span>
              Comma separated list of words, phrases or hashtags you never want to see in notes. (case insensitive)
            </span>
            <br />
            <span>Be careful its easy to hide all notes if you add common words.</span>
          </FormHelperText>
        </FormControl>
      </Flex>
      <Button
        ml="auto"
        isLoading={formState.isLoading || formState.isValidating || formState.isSubmitting}
        isDisabled={!formState.isDirty}
        colorScheme="primary"
        type="submit"
      >
        Save Settings
      </Button>
    </VerticalPageLayout>
  );
}
