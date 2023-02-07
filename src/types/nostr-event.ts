export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: any[];
  content: string;
  sig: string;
};

export type IncomingNostrEvent =
  | ["EVENT", string, NostrEvent]
  | ["NOTICE", string];
