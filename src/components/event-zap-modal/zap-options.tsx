import { Button, Flex } from "@chakra-ui/react";

import useAppSettings from "../../hooks/use-user-app-settings";
import { LightningIcon } from "../icons";

export default function CustomZapAmountOptions({ onSelect }: { onSelect: (value: number) => void }) {
  const { customZapAmounts } = useAppSettings();

  return (
    <Flex gap="2" alignItems="center" wrap="wrap">
      {customZapAmounts
        .split(",")
        .map((v) => parseInt(v))
        .map((amount, i) => (
          <Button
            key={amount + i}
            onClick={() => onSelect(amount)}
            leftIcon={<LightningIcon />}
            variant="solid"
            size="sm"
          >
            {amount}
          </Button>
        ))}
    </Flex>
  );
}
