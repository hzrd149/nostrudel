{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-23.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem
      (system: {
        devShells =
          let
            pkgs = import nixpkgs { inherit system; };
            inputs = with pkgs; [ nodejs_20 yarn ];
          in
          {
            default = pkgs.mkShell {
              nativeBuildInputs = inputs;
            };
          };
      });
}
