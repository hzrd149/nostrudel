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
import { LightningIcon } from "../../components/icons";
import { AppSettings } from "../../services/user-app-settings";
import { useFormContext } from "react-hook-form";

export default function LightningSettings() {
  const { register } = useFormContext<AppSettings>();

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
            <FormLabel htmlFor="lightningPayMode" mb="0">
              Payment mode
            </FormLabel>
            <Select id="lightningPayMode" {...register("lightningPayMode")}>
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
              autoComplete="off"
              {...register("zapAmounts", {
                setValueAs: (value: number[] | string) => {
                  if (Array.isArray(value)) {
                    return Array.from(value).join(",");
                  } else {
                    return value
                      .split(",")
                      .map((v) => parseInt(v))
                      .filter(Boolean)
                      .sort((a, b) => a - b);
                  }
                },
              })}
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
