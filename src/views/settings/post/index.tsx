import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Button,
  Select,
  Link,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
  Switch,
} from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import useUsersMediaServers from "../../../hooks/use-user-media-servers";
import useCurrentAccount from "../../../hooks/use-current-account";
import useSettingsForm from "../use-settings-form";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import localSettings from "../../../services/local-settings";
import SimpleView from "../../../components/layout/presets/simple-view";

export default function PostSettings() {
  const account = useCurrentAccount();
  const { register, getValues, watch, submit, formState } = useSettingsForm();
  const { servers: mediaServers } = useUsersMediaServers(account?.pubkey);

  watch("mediaUploadService");

  const addClientTag = useObservable(localSettings.addClientTag);

  return (
    <SimpleView
      as="form"
      onSubmit={submit}
      title="Post Settings"
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
          Media upload service
        </FormLabel>
        <Select id="mediaUploadService" w="sm" {...register("mediaUploadService")}>
          <option value="nostr.build">nostr.build</option>
          <option value="blossom">Blossom</option>
        </Select>

        {getValues().mediaUploadService === "nostr.build" && (
          <>
            <FormHelperText>
              Its a good idea to sign up and pay for an account on{" "}
              <Link href="https://nostr.build/login/" target="_blank" color="blue.500">
                nostr.build
              </Link>
            </FormHelperText>
          </>
        )}

        {getValues().mediaUploadService === "blossom" && (!mediaServers || mediaServers.length === 0) && (
          <Alert status="error" mt="2" flexWrap="wrap">
            <AlertIcon />
            <AlertTitle>Missing media servers!</AlertTitle>
            <AlertDescription>Looks like you don't have any media servers setup</AlertDescription>
            <Button as={RouterLink} colorScheme="primary" ml="auto" size="sm" to="/relays/media-servers">
              Setup servers
            </Button>
          </Alert>
        )}
      </FormControl>

      <FormControl>
        <FormLabel htmlFor="noteDifficulty" mb="0">
          Proof of work
        </FormLabel>
        <Input
          id="noteDifficulty"
          {...register("noteDifficulty", { min: 0, max: 64, valueAsNumber: true })}
          step={1}
          maxW="sm"
        />
        <FormHelperText>
          <span>How much Proof of work to mine when writing notes. setting this to 0 will disable it</span>
        </FormHelperText>
      </FormControl>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="addClientTag" mb="0">
            Add client tag
          </FormLabel>
          <Switch
            id="addClientTag"
            isChecked={addClientTag}
            onChange={() => localSettings.addClientTag.next(!localSettings.addClientTag.value)}
          />
        </Flex>
        <FormHelperText>
          Enabled: Attach the{" "}
          <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/89.md#client-tag">
            NIP-89
          </Link>{" "}
          client tags on events
        </FormHelperText>
      </FormControl>
    </SimpleView>
  );
}
