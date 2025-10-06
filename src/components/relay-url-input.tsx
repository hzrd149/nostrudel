import { forwardRef, useEffect, useState } from "react";
import { Input, InputProps, Text } from "@chakra-ui/react";

import { unique } from "../helpers/array";
import nip66Discovery from "../services/nip66-relay-discovery";

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = forwardRef(({ nips, ...props }: { nips?: number[] } & Omit<InputProps, "type">, ref) => {
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
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [nips?.join("|")]);

  const relaySuggestions = unique(relaysJson ?? []);

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
