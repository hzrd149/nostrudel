import { Transformer } from "unified";
import { Root, findAndReplace, Node } from "applesauce-content/nast";
import { BIP_NAMES } from "../../../const";

export interface BIPToken extends Node {
  type: "bip";
  bip: number;
  name: string;
  value: string;
}

declare module "applesauce-content/nast" {
  export interface BIPToken extends Node {
    type: "bip";
    bip: number;
    name: string;
    value: string;
  }

  export interface ContentMap {
    bip: BIPToken;
  }
}

export function bipDefinitions(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        /(?<=^|[^\p{L}])bip[-\s]?(\d{1,3})/giu,
        (match: string, $1: string) => {
          try {
            const bip = parseInt($1);
            const name = BIP_NAMES[bip];
            if (!name) return false;

            return {
              type: "bip",
              bip,
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
