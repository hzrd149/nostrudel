import { Flex, FormHelperText, Input, InputProps, Select } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useEffect, useMemo, useState } from "react";

import { currencyToSats, satsToBtc } from "../helpers/lightning";
import { exchangeRates$, refreshExchangeRates } from "../services/exchange-rates";
import localSettings from "../services/preferences";

const SATS_CURRENCY = "SAT";

function formatInputValue(value: number) {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 100) / 100);
}

function satsToInputValue(sats: number, currency: string, rates?: Record<string, number>) {
  if (!Number.isFinite(sats)) return "";
  if (currency === SATS_CURRENCY) return String(Math.round(sats));

  const rate = rates?.[currency];
  if (!rate) return "";

  return formatInputValue(satsToBtc(sats) * rate);
}

export type SatsInputProps = Omit<InputProps, "value" | "onChange" | "children"> & {
  value: number;
  onChange: (value: number) => void;
};

export default function SatsInput({ value, onChange, isInvalid, ...props }: SatsInputProps) {
  const displayCurrency = use$(localSettings.displayCurrency);
  const exchangeRates = use$(exchangeRates$);
  const [currency, setCurrency] = useState(displayCurrency?.toUpperCase() ?? SATS_CURRENCY);
  const [inputValue, setInputValue] = useState(() => satsToInputValue(value, currency, exchangeRates?.rates));

  const rates = exchangeRates?.rates;
  const currencyOptions = useMemo(
    () =>
      Array.from(new Set([currency, ...Object.keys(rates ?? {})]))
        .filter((option) => option !== SATS_CURRENCY)
        .sort(),
    [currency, rates],
  );

  const canConvert = currency === SATS_CURRENCY || !!rates?.[currency];

  useEffect(() => {
    refreshExchangeRates().catch(() => undefined);
  }, []);

  useEffect(() => {
    setInputValue(satsToInputValue(value, currency, rates));
  }, [value, currency, rates]);

  function handleInputChange(nextValue: string) {
    setInputValue(nextValue);

    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) {
      onChange(0);
      return;
    }

    if (currency === SATS_CURRENCY) onChange(Math.round(parsed));
    else {
      const rate = rates?.[currency];
      if (rate) onChange(Math.round(currencyToSats(parsed, rate)));
    }
  }

  return (
    <Flex direction="column" flex="1" gap="1">
      <Flex gap="2">
        <Input
          type="number"
          inputMode="decimal"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          isInvalid={isInvalid || !canConvert}
          isDisabled={!canConvert}
          {...props}
        />
        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          w="8rem"
          flexShrink={0}
          aria-label="Zap amount currency"
        >
          <option value={SATS_CURRENCY}>sats</option>
          {currencyOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Flex>
      {!canConvert && (
        <FormHelperText mt="0">Waiting for {currency} exchange rate. Select sats to enter directly.</FormHelperText>
      )}
    </Flex>
  );
}
