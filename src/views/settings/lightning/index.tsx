import { Button as BitcoinConnectButton } from "@getalby/bitcoin-connect-react";
import {
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Switch,
  FormErrorMessage,
  Button,
} from "@chakra-ui/react";
import useSettingsForm from "../use-settings-form";
import SimpleView from "../../../components/layout/presets/simple-view";

export default function LightningSettings() {
  const { register, submit, formState } = useSettingsForm();

  return (
    <SimpleView
      as="form"
      onSubmit={submit}
      gap="4"
      title="Lightning"
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
      <BitcoinConnectButton />
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoPayWithWebLN" mb="0">
            Auto pay with WebLN
          </FormLabel>
          <Switch id="autoPayWithWebLN" {...register("autoPayWithWebLN")} />
        </Flex>

        <FormHelperText>
          <span>Enabled: Attempt to automatically pay with WebLN if its available</span>
        </FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel htmlFor="customZapAmounts" mb="0">
          Zap Amounts
        </FormLabel>
        <Input
          id="customZapAmounts"
          maxW="sm"
          autoComplete="off"
          {...register("customZapAmounts", {
            validate: (v) => {
              if (!/^[\d,]*$/.test(v)) return "Must be a list of comma separated numbers";
              return true;
            },
          })}
        />
        {formState.errors.customZapAmounts && (
          <FormErrorMessage>{formState.errors.customZapAmounts.message}</FormErrorMessage>
        )}
        <FormHelperText>
          <span>Comma separated list of custom zap amounts</span>
        </FormHelperText>
      </FormControl>
    </SimpleView>
  );
}
