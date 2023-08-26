import { Button } from "@getalby/bitcoin-connect-react";
import {
  Flex,
  FormControl,
  FormLabel,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  FormHelperText,
  Input,
  Switch,
  FormErrorMessage,
} from "@chakra-ui/react";
import { LightningIcon } from "../../components/icons";
import { useFormContext } from "react-hook-form";
import { AppSettings } from "../../services/settings/migrations";

export default function LightningSettings() {
  const { register, formState } = useFormContext<AppSettings>();

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Lightning <LightningIcon color="yellow.400" />
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
          <Button />
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
      </AccordionPanel>
    </AccordionItem>
  );
}
