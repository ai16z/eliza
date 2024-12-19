{
  description = "Your project description";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    pnpm2nix.url = "github:nzbr/pnpm2nix-nzbr";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    pnpm2nix,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
        pnpm2nix-lib = pnpm2nix.packages.${system};
      in {
        packages.default = pnpm2nix-lib.mkPnpmPackage {
          src = ./.;

          # Install dependencies in source directory for workspace support
          installInPlace = true;

          # Run recursive build across all workspace packages
          script = "-r build";

          # Copy all build outputs
          distDir = ".";

          buildPhase = ''
            export HOME=$(mktemp -d)
            pnpm install --frozen-lockfile
            pnpm -r build
          '';

          installPhase = ''
            mkdir -p $out
            cp -r . $out/
          '';
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodePackages.pnpm
            cairo
            pango
            libpng
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            export PKG_CONFIG_PATH="${pkgs.cairo}/lib/pkgconfig:${pkgs.pango}/lib/pkgconfig:${pkgs.libpng}/lib/pkgconfig:$PKG_CONFIG_PATH"

            echo "🤖 Eliza development environment loaded 🚀"
            echo "------------------------------------------"
            echo "Using:"
            echo "      - Node.js $(node --version)"
            echo "      - pnpm $(pnpm --version)"

            echo """
            🏗️  Quickstart Guide:
            ------------------------
            ┌─> 1. pnpm i      (Install dependencies)
            │   2. pnpm build  (Build project)
            └─  3. pnpm clean  (Clear Artifacts, for a fresh start)
                4. pnpm test   (Run tests)

            For more commands, run: pnpm --help
            ------------------------
            """
          '';
        };
      }
    );
}
