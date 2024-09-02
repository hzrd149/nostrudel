import { Button as BitcoinConnectButton } from "@getalby/bitcoin-connect-react";
import {
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Switch,
  FormErrorMessage,
  Heading,
  Button,
} from "@chakra-ui/react";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useSettingsForm from "../use-settings-form";

export default function LightningSettings() {
  const { register, submit, formState } = useSettingsForm();

  return (
    <VerticalPageLayout as="form" onSubmit={submit} flex={1}>
      <Heading size="md">Lightning Settings</Heading>
      <Flex direction="column" gap="4">
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
