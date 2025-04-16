import {
  Button,
  Flex,
  FlexProps,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { parseBolt11 } from "applesauce-core/helpers";
import { useCallback, useState } from "react";
import { useInterval } from "react-use";

import { V4VStopIcon, V4VStreamIcon } from "../../../components/icons";
import useUserLNURLMetadata from "../../../hooks/use-user-lnurl-metadata";

export default function StreamSatsPerMinute({ pubkey, ...props }: { pubkey: string } & FlexProps) {
  const [enabled, setEnabled] = useState(false);
  const [amountStr, setAmountStr] = useState("4");

  const { metadata } = useUserLNURLMetadata(pubkey);

  const isAvailable = !!window.webln;
  const isEnabled = isAvailable && enabled && !!metadata?.callback;

  const sendSats = useCallback(async () => {
    if (isEnabled && window.webln) {
      try {
        if (!window.webln.enabled) await window.webln.enable();

        const amountMsats = parseInt(amountStr) * 1000;
        if (!Number.isFinite(amountMsats)) throw new Error("invalid amount");

        const callbackUrl = new URL(metadata.callback);
        callbackUrl.searchParams.append("amount", String(amountMsats));

        const { pr: payRequest } = await fetch(callbackUrl).then((res) => res.json());

        if (payRequest as string) {
          const parsed = parseBolt11(payRequest);
          if (parsed.amount !== amountMsats) throw new Error("incorrect amount");
        } else throw new Error("Failed to get invoice");

        await window.webln.sendPayment(payRequest);
      } catch (e) {
        setEnabled(false);
      }
    }
  }, [metadata?.callback, enabled, isEnabled]);

  useInterval(sendSats, 1000 * 60);

  return (
    <Flex gap="2">
      <Popover>
        <PopoverTrigger>
          <Button rightIcon={isEnabled ? <Spinner size="sm" /> : undefined}>Stream sats</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>Stream {amountStr} sats per minute</PopoverHeader>
          <PopoverBody>
            {isAvailable ? (
              <Flex gap="2">
                <NumberInput
                  step={1}
                  min={1}
                  value={amountStr}
                  onChange={(v) => setAmountStr(v)}
                  isDisabled={!isAvailable}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button
                  leftIcon={isEnabled ? <V4VStopIcon /> : <V4VStreamIcon />}
                  onClick={() => setEnabled((v) => !v)}
                  isDisabled={!isAvailable}
                >
                  {isEnabled ? "Stop" : "Start"}
                </Button>
              </Flex>
            ) : (
              <Text colorScheme="orange">Missing WebLN</Text>
            )}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}
