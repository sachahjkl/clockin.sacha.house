{
	description = "Clock-in — Angular SPA + Fastify backend, packaged as a NixOS service";

	inputs = {
		nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
		flake-utils.url = "github:numtide/flake-utils";
	};

	outputs = { self, nixpkgs, flake-utils }:
		flake-utils.lib.eachDefaultSystem (system:
			let
				pkgs = nixpkgs.legacyPackages.${system};

				clockin = pkgs.buildNpmPackage {
					pname = "clockin";
					version = "0.0.1";
					src = ./.;

					nativeBuildInputs = with pkgs; [
						python3
						gnumake
						gcc
					];
					buildInputs = with pkgs; [
						sqlite
					];

					npmDepsHash = "sha256-nGWLFOpTiNjl33yAOg5ftp2zWcVhTW9p3d9aGkKL+ks=";

					preBuild = ''
						export npm_config_build_from_source=true
						export NG_CLI_ANALYTICS=false
					'';

					installPhase = ''
						npm prune --omit=dev
						mkdir -p $out/bin $out/apps/api $out/apps/web/dist/web
						cp package.json package-lock.json $out/
						cp -r node_modules $out/
						cp -r apps/api/dist apps/api/drizzle $out/apps/api/
						cp -r apps/web/dist/web/browser $out/apps/web/dist/web/
					cat > $out/bin/clockin <<EOF
#!${pkgs.bash}/bin/bash
set -euo pipefail
export WEB_DIST="$out/apps/web/dist/web/browser"
cd "$out"
exec ${pkgs.nodejs}/bin/node apps/api/dist/server.js "\$@"
EOF
					chmod +x $out/bin/clockin
					'';
				};
			in
			{
				packages.default = clockin;

				devShells.default = pkgs.mkShell {
					packages = with pkgs; [
						nodejs
						corepack
						python3
						gnumake
						gcc
						sqlite
						node-gyp
					];

					shellHook = ''
						echo "Clock-in dev shell"
						echo "  npm run dev        -> start API + Angular dev server"
						echo "  npm run build      -> build API (tsc) + web"
						echo "  npm run lint       -> oxlint"
						echo "  npm run format     -> oxfmt"
						echo "  npx tsc -p apps/api/tsconfig.json -> compile API with tsc"
				'';
			};
		}
	)
	// {
			nixosModules.default = { config, lib, pkgs, ... }:
				with lib;
				let
					cfg = config.services.clockin;
					pkg = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
				in
				{
					options.services.clockin = {
						enable = mkEnableOption "Clock-in web service";

						host = mkOption {
							type = types.str;
							default = "127.0.0.1";
							description = "Host address to bind the HTTP server to.";
						};

						port = mkOption {
							type = types.port;
							default = 3000;
							description = "Port to listen on.";
						};

						databaseDir = mkOption {
							type = types.path;
							default = "/var/lib/clockin";
							description = "Directory where the SQLite database is stored.";
						};

						openFirewall = mkOption {
							type = types.bool;
							default = false;
							description = "Open the configured port in the firewall.";
						};
					};

					config = mkIf cfg.enable {
						users.users.clockin = {
							isSystemUser = true;
							group = "clockin";
							home = cfg.databaseDir;
							createHome = true;
						};
						users.groups.clockin = { };

						systemd.services.clockin = {
							description = "Clock-in badgeage service";
							after = [ "network.target" ];
							wantedBy = [ "multi-user.target" ];

							serviceConfig = {
								Type = "simple";
								User = "clockin";
								Group = "clockin";
								WorkingDirectory = cfg.databaseDir;
								ExecStart = "${pkg}/bin/clockin";
								Restart = "on-failure";
								RestartSec = 5;
								NoNewPrivileges = true;
								PrivateTmp = true;
								ProtectHome = true;
								ProtectSystem = "strict";
								ReadWritePaths = [ cfg.databaseDir ];
								Environment = [
									"HOST=${cfg.host}"
									"PORT=${toString cfg.port}"
									"DATABASE_URL=${cfg.databaseDir}/clockin.sqlite"
								];
							};
						};

						networking.firewall.allowedTCPPorts = mkIf cfg.openFirewall [ cfg.port ];
					};
				};
		};
}