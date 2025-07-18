import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Select,
  Switch,
  Textarea,
} from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { Link as RouterLink } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import localSettings from "../../../services/preferences";
import useSettingsForm from "../use-settings-form";
import { safeUrl } from "../../../helpers/parse";

export default function DisplaySettings() {
  const { register, submit, formState } = useSettingsForm();

  const hideZapBubbles = useObservableEagerState(localSettings.hideZapBubbles);
  const hideUsernames = useObservableEagerState(localSettings.hideUsernames);

  return (
    <SimpleView
      title="Display"
      as="form"
      onSubmit={submit}
      gap="4"
      actions={
        <Button
          ml="auto"
          isLoading={formState.isLoading || formState.isValidating || formState.isSubmitting}
          isDisabled={!formState.isDirty}
          colorScheme="primary"
          type="submit"
          flexShrink={0}
          size="sm"
        >
          Save
        </Button>
      }
    >
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
          <option value="none">Default</option>
          <option value="full">Full</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
        </Select>
        <FormHelperText>
          <span>Setting this will restrict the width of the timeline</span>
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="maxPageWidth" mb="0">
          Show user pubkey key color
        </FormLabel>
        <Select id="maxPageWidth" maxW="sm" {...register("showPubkeyColor")}>
          <option value="none">None</option>
          <option value="avatar">Avatar</option>
          <option value="underline">Underline</option>
        </Select>
        <FormHelperText>
          <span>How the public key color should be shown on users</span>
        </FormHelperText>
      </FormControl>
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="hideUsernames" mb="0">
            Hide usernames (anon mode)
          </FormLabel>
          <Switch
            id="hideUsernames"
            isChecked={hideUsernames}
            onChange={() => localSettings.hideUsernames.next(!hideUsernames)}
          />
        </Flex>
        <FormHelperText>
          <span>
            Hides usernames and pictures on notes.{" "}
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
          <span>Removes all emojis in other users usernames and display names</span>
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
            onChange={() => localSettings.hideZapBubbles.next(!hideZapBubbles)}
          />
        </Flex>
        <FormHelperText>
          <span>Hides individual zaps on notes in the timeline</span>
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
          <span>Shows a warning for notes with NIP-36 Content Warning</span>
        </FormHelperText>
      </FormControl>
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="showReactions" mb="0">
            Show reactions
          </FormLabel>
          <Switch id="showReactions" {...register("showReactions")} />
        </Flex>
        <FormHelperText>Show reactions on notes</FormHelperText>
      </FormControl>
    </SimpleView>
  );
}
