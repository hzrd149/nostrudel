import { forwardRef } from "react";
import { Input, InputProps, Text } from "@chakra-ui/react";
import { useAsync } from "react-use";

import { unique } from "../helpers/array";

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = forwardRef(({ nips, ...props }: { nips?: number[] } & Omit<InputProps, "type">, ref) => {
  const {
    value: relaysJson,
    loading,
    error,
  } = useAsync(async () => {
    let online = await fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>);
    if (!nips) return online;

    for (const nip of nips) {
      if (online.length === 0) break;
      const supported = await fetch("https://api.nostr.watch/v1/nip/" + nip).then(
        (res) => res.json() as Promise<string[]>,
      );
      online = online.filter((url) => supported.includes(url));
    }
    return online;
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
