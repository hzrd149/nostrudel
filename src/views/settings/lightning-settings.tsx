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
import { useState } from "react";
import settings, { LightningPayMode } from "../../services/settings";
import useSubject from "../../hooks/use-subject";
import { LightningIcon } from "../../components/icons";

export default function LightningSettings() {
  const lightningPayMode = useSubject(settings.lightningPayMode);
  const zapAmounts = useSubject(settings.zapAmounts);

  const [zapInput, setZapInput] = useState(zapAmounts.join(","));

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
              onChange={(e) => settings.lightningPayMode.next(e.target.value as LightningPayMode)}
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

                settings.zapAmounts.next(amounts);
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
