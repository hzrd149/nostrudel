import { Text, TextProps } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useEffect } from "react";

import { formatSats, formatSatsAsCurrency } from "../helpers/lightning";
import { exchangeRates$, refreshExchangeRates } from "../services/exchange-rates";
import localSettings from "../services/preferences";

export type ValueDisplayProps = Omit<TextProps, "children"> & {
  sats: number;
};

export default function ValueDisplay({ sats, title, ...props }: ValueDisplayProps) {
  const displayCurrency = use$(localSettings.displayCurrency);
  const exchangeRates = use$(exchangeRates$);

  useEffect(() => {
    if (displayCurrency) refreshExchangeRates().catch(() => undefined);
  }, [displayCurrency]);

  const currency = displayCurrency?.toUpperCase() ?? null;
  const rate = currency ? exchangeRates?.rates[currency] : undefined;
  const fallback = formatSats(sats);
  const value = currency && rate ? formatSatsAsCurrency(sats, currency, rate) : fallback;

  return (
    <Text as="span" title={title ?? (value === fallback ? undefined : fallback)} {...props}>
      {value}
    </Text>
  );
}
