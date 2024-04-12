import { Button, Input } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useRef, useState } from "react";
import Download01 from "../../../../../components/icons/download-01";

export default function ImportEventsButton({ onLoad }: { onLoad: (events: NostrEvent[]) => Promise<void> }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const importFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.readAsText(file, "utf8");
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      const lines = reader.result.split("\n");
      const events: NostrEvent[] = [];
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as NostrEvent;
          events.push(event);
        } catch (e) {}
      }
      await onLoad(events);
      alert(`Imported ${events.length} events`);
      setLoading(false);
    };
  };

  return (
    <>
      <Button onClick={() => ref.current?.click()} isLoading={loading} leftIcon={<Download01 />}>
        Import events
      </Button>
      <Input
        hidden
        type="file"
        accept=".jsonl"
        onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
        ref={ref}
      />
    </>
  );
}
