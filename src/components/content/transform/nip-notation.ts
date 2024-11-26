import { Transformer } from "unified";
import { Root, findAndReplace, Node } from "applesauce-content/nast";

import { NIP_NAMES } from "../../../views/relays/components/supported-nips";

export interface NIPToken extends Node {
  type: "nip";
  nip: string;
  name: string;
  value: string;
}

declare module "applesauce-content/nast" {
  export interface NIPToken extends Node {
    type: "nip";
    nip: string;
    name: string;
    value: string;
  }

  export interface ContentMap {
    nip: NIPToken;
  }
}

export function nipDefinitions(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        /(?<=^|[^\p{L}])nip-?(\d{2,3})/giu,
        (match: string, $1: string) => {
          try {
            const nip = $1;
            const name = NIP_NAMES[nip];
            if (!name) return false;

            return {
              type: "nip",
              nip,
              value: match,
              name,
            };
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}
