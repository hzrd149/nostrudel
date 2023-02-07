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

export type Kind0ParsedContent = {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
};
