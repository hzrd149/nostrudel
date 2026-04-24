import { Button, Flex } from "@chakra-ui/react";

import useAppSettings from "../../hooks/use-user-app-settings";
import { LightningIcon } from "../icons";
import ValueDisplay from "../value-display";

export default function CustomZapAmountOptions({ onSelect }: { onSelect: (value: number) => void }) {
  const { customZapAmounts } = useAppSettings();

  return (
    <Flex gap="2" alignItems="center" wrap="wrap">
      {customZapAmounts
        .split(",")
        .map((v) => parseInt(v))
        .filter((amount) => Number.isFinite(amount) && amount > 0)
        .map((amount, i) => (
          <Button
            key={amount + i}
            onClick={() => onSelect(amount)}
            leftIcon={<LightningIcon />}
            variant="solid"
            size="sm"
          >
            <ValueDisplay sats={amount} />
          </Button>
        ))}
    </Flex>
  );
}
