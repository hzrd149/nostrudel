import { Transformer } from "unified";
import { Root, findAndReplace, Node } from "applesauce-content/nast";

export interface MoneroAddressToken extends Node {
  type: "monero";
  address: string;
  value: string;
}

declare module "applesauce-content/nast" {
  export interface MoneroAddressToken extends Node {
    type: "monero";
    address: string;
    value: string;
  }

  export interface ContentMap {
    monero: MoneroAddressToken;
  }
}

// Monero addresses are base58 encoded (Bitcoin alphabet, no 0/O/I/l).
// Standard and subaddresses are 95 chars (start with 4 or 8), integrated addresses are 106 chars.
const BASE58 = "[1-9A-HJ-NP-Za-km-z]";
const MONERO_ADDRESS = new RegExp(
  `(?<!${BASE58})([48][0-9AB]${BASE58}{93}(?:${BASE58}{11})?)(?!${BASE58})`,
  "g",
);

export function moneroAddresses(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        MONERO_ADDRESS,
        (match: string) => ({
          type: "monero",
          address: match,
          value: match,
        }),
      ],
    ]);
  };
}
