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
  Select,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import appSettings, { updateSettings } from "../../services/app-settings";
import useSubject from "../../hooks/use-subject";
import { LightningIcon } from "../../components/icons";
import { LightningPayMode } from "../../services/user-app-settings";

export default function LightningSettings() {
  const { lightningPayMode, zapAmounts } = useSubject(appSettings);

  const [zapInput, setZapInput] = useState(zapAmounts.join(","));
  useEffect(() => setZapInput(zapAmounts.join(",")), [zapAmounts.join(",")]);

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
          <FormControl>
            <FormLabel htmlFor="lightning-payment-mode" mb="0">
              Payment mode
            </FormLabel>
            <Select
              id="lightning-payment-mode"
              value={lightningPayMode}
              onChange={(e) => updateSettings({ lightningPayMode: e.target.value as LightningPayMode })}
            >
              <option value="prompt">Prompt</option>
              <option value="webln">WebLN</option>
              <option value="external">External</option>
            </Select>
            <FormHelperText>
              <span>Prompt: Ask every time</span>
              <br />
              <span>WebLN: Use browser extension</span>
              <br />
              <span>External: Open an external app using "lightning:" link</span>
            </FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="zap-amounts" mb="0">
              Zap Amounts
            </FormLabel>
            <Input
              id="zap-amounts"
              value={zapInput}
              onChange={(e) => setZapInput(e.target.value)}
              onBlur={() => {
                const amounts = zapInput
                  .split(",")
                  .map((v) => parseInt(v))
                  .filter(Boolean)
                  .sort((a, b) => a - b);

                updateSettings({ zapAmounts: amounts });
                setZapInput(amounts.join(","));
              }}
            />
            <FormHelperText>
              <span>Comma separated list of custom zap amounts</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
