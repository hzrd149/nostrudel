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
} from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import { safeUrl } from "../../../helpers/parse";
import localSettings from "../../../services/local-settings";
import useSettingsForm from "../use-settings-form";

function VerifyEventSettings() {
  const verifyEventMethod = useObservableEagerState(localSettings.verifyEventMethod);

  return (
    <>
      <FormControl>
        <FormLabel htmlFor="verifyEventMethod" mb="0">
          Verify event method
        </FormLabel>
        <Select
          value={verifyEventMethod}
          onChange={(e) => localSettings.verifyEventMethod.next(e.target.value)}
          maxW="sm"
        >
          <option value="wasm">WebAssembly</option>
          <option value="internal">Internal</option>
          <option value="none">None</option>
        </Select>
        <FormHelperText>Default: All events signatures are checked</FormHelperText>
        <FormHelperText>WebAssembly: Events signatures are checked in a separate thread</FormHelperText>
        <FormHelperText>None: Only Profiles, Follows, and replaceable event signatures are checked</FormHelperText>
      </FormControl>
    </>
  );
}

export default function PerformanceSettings() {
  const { register, submit, formState } = useSettingsForm();

  return (
    <SimpleView
      as="form"
      onSubmit={submit}
      gap="4"
      title="Performance"
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
        <Flex alignItems="center">
          <FormLabel htmlFor="proxy-user-media" mb="0">
            Proxy user media
          </FormLabel>
          <Switch id="proxy-user-media" {...register("proxyUserMedia")} />
        </Flex>
        <FormHelperText>
          <span>Enabled: Use media.nostr.band to get smaller profile pictures (saves ~50Mb of data)</span>
          <br />
          <span>Side Effect: Some user pictures may not load or may be outdated</span>
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="imageProxy" mb="0">
          Image proxy service
        </FormLabel>
        <Input
          id="imageProxy"
          maxW="sm"
          type="url"
          {...register("imageProxy", {
            setValueAs: (v) => safeUrl(v) || v,
          })}
        />
        {formState.errors.imageProxy && <FormErrorMessage>{formState.errors.imageProxy.message}</FormErrorMessage>}
        <FormHelperText>
          <span>
            A URL to an instance of{" "}
            <Link href="https://github.com/willnorris/imageproxy" isExternal target="_blank">
              willnorris/imageproxy
            </Link>
          </span>
        </FormHelperText>
      </FormControl>
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoShowMedia" mb="0">
            Show embeds
          </FormLabel>
          <Switch id="autoShowMedia" {...register("autoShowMedia")} />
        </Flex>
        <FormHelperText>Disabled: Embeds will show an expandable button</FormHelperText>
      </FormControl>
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="showReactions" mb="0">
            Show reactions
          </FormLabel>
          <Switch id="showReactions" {...register("showReactions")} />
        </Flex>
        <FormHelperText>Enabled: Show reactions on notes</FormHelperText>
      </FormControl>
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoDecryptDMs" mb="0">
            Automatically decrypt DMs
          </FormLabel>
          <Switch id="autoDecryptDMs" {...register("autoDecryptDMs")} />
        </Flex>
        <FormHelperText>Enabled: automatically decrypt direct messages</FormHelperText>
      </FormControl>
      <VerifyEventSettings />
    </SimpleView>
  );
}
