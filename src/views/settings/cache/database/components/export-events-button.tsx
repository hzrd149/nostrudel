import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import stringify from "json-stringify-deterministic";
import Upload01 from "../../../../../components/icons/upload-01";

export default function ExportEventsButton({ getEvents }: { getEvents: () => Promise<NostrEvent[]> }) {
  const [loading, setLoading] = useState(false);
  const exportDatabase = async () => {
    setLoading(true);
    const rows = await getEvents();
    const lines = rows.map((event) => stringify(event));
    const file = new File([lines.join("\n")], "noStrudel-export.jsonl", {
      type: "application/jsonl",
    });
    const url = URL.createObjectURL(file);
    window.open(url);
    setLoading(false);
  };

  return (
    <Button onClick={exportDatabase} isLoading={loading} leftIcon={<Upload01 />}>
      Export database
    </Button>
  );
}
