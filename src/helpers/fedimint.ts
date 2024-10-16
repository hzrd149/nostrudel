import { Transformer } from "unified";
import { Root, findAndReplace, Node } from "applesauce-content/nast";

declare module "applesauce-content/nast" {
  export interface FedimintToken extends Node {
    type: "fedimint";
    token: string;
  }

  export interface ContentMap {
    fedimint: FedimintToken;
  }
}

export function FedimintTokensTransformer(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        /([A-Za-z0-9_+/-]{100,10000}={0,3})/gi,
        (_: string, $1: string) => {
          try {
            return {
              type: "fedimint",
              token: $1,
            };
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}
