import { ChangeEvent, FocusEventHandler, forwardRef, KeyboardEventHandler, useEffect, useState } from "react";
import { Input, InputProps, Text } from "@chakra-ui/react";
import { normalizeRelayUrl } from "applesauce-core/helpers";

import { unique } from "../helpers/array";
import nip66Discovery from "../services/nip66-relay-discovery";

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = forwardRef(({ nips, ...props }: { nips?: number[] } & Omit<InputProps, "type">, ref) => {
  const { onChange, onBlur, onKeyDown } = props;
  const [relaysJson, setRelaysJson] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const subscription = nip66Discovery.fetchRelays().subscribe({
      next: (relayMap) => {
        try {
          let relays: string[];

          if (nips && nips.length > 0) {
            relays = nip66Discovery.getRelaysByNIPs(nips);
          } else {
            relays = nip66Discovery.getOnlineRelays();
          }

          setRelaysJson(relays);
          setLoading(false);
        } catch (err) {
          setError(err as Error);
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [nips?.join("|")]);

  const relaySuggestions = unique(relaysJson ?? []);

  // Normalize the value (add wss:// if missing) and notify the form of the change
  const normalizeValue = (event: { currentTarget: HTMLInputElement }) => {
    const value = event.currentTarget.value;
    if (!value) return;

    try {
      const normalized = normalizeRelayUrl(value);
      if (normalized !== value) {
        event.currentTarget.value = normalized;
        onChange?.(event as ChangeEvent<HTMLInputElement>);
      }
    } catch (err) {
      // Ignore invalid URLs, let form validation handle them
    }
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    normalizeValue(event);
    onBlur?.(event);
  };

  // Normalize before the browser validates the URL on Enter-key form submission
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") normalizeValue(event);
    onKeyDown?.(event);
  };

  return (
    <>
      <Input
        ref={ref}
        list="relay-suggestions"
        type="url"
        aria-label="Relay URL"
        aria-describedby="relay-suggestions-description"
        aria-invalid={error ? "true" : undefined}
        aria-busy={loading}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={relaySuggestions.length > 0}
        {...props}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <Text id="relay-suggestions-description" srOnly>
        {loading
          ? "Loading relay suggestions..."
          : error
            ? "Error loading relay suggestions"
            : relaySuggestions.length > 0
              ? `Found ${relaySuggestions.length} relay suggestions`
              : "No relay suggestions available"}
      </Text>
      <datalist id="relay-suggestions" role="listbox" aria-label="Available relay suggestions">
        {relaySuggestions.map((url) => (
          <option key={url} value={url} role="option" aria-label={`Relay: ${url}`}>
            {url}
          </option>
        ))}
      </datalist>
    </>
  );
});
