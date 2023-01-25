# clockin.sacha.house

A small, self-hosted clock-in app for tracking daily badgeages. Built as an Angular SPA served by a Fastify backend, with Drizzle ORM on SQLite, packaged for NixOS.

## Stack

- **Frontend**: Angular 22.0.1, TypeScript 6.0, Tailwind CSS 4.3.1, oxlint, oxfmt
- **Backend**: Fastify 5.8.5, Drizzle ORM 0.45.2, `@libsql/client` 0.17.4, compiled with **TypeScript** (`tsc`)
- **Database**: SQLite file
- **Identity**: sqids-generated user id stored in `localStorage` (no passwords)
- **Build / deploy**: npm workspaces, Nix flake, NixOS service module

> Note: the project uses **npm workspaces** rather than pnpm because Nix's `buildNpmPackage` has first-class support for npm lockfiles and deterministic native-addon builds. Using npm everywhere keeps the same tool for dev and deployment.

## Project layout

```
.
├── apps/api/          Fastify backend + Drizzle schema/migrations
├── apps/web/          Angular SPA
├── flake.nix          Nix package, devShell, and NixOS module
└── package.json       npm workspaces root
```

## Local development

Requirements: Node.js `^22.22.3 || ^24.15.0 || >=26`, npm >= 10.

```bash
npm install
npm run dev
```

This starts:

- API on `http://127.0.0.1:3000`
- Angular Vite dev server on `http://127.0.0.1:4200`, proxying `/api` to the backend

The database defaults to `./apps/api/data/clockin.sqlite`.
If you want browser CORS access without the Angular proxy, set `CORS_ORIGIN` in `apps/api/.env`.

## Building

```bash
npm run build
```

Builds the API into `apps/api/dist/` with **tsc** and the web app into `apps/web/dist/web/browser/` with Angular CLI.

Run the production bundle:

```bash
cd apps/api
DATABASE_URL=./data/clockin.sqlite WEB_DIST=../web/dist/web/browser node dist/server.js
```

## Lint / format

```bash
npm run lint   # oxlint
npm run format # oxfmt
```

## Nix

Build and run:

```bash
nix build .#default
DATABASE_URL=/tmp/clockin.sqlite ./result/bin/clockin
```

Enter the dev shell:

```bash
nix develop
npm run dev
```

### NixOS service

Import the flake module and enable the service:

```nix
{
  inputs.clockin.url = "github:your-user/clockin.sacha.house";

  outputs = { self, nixpkgs, clockin }: {
    nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
      modules = [
        clockin.nixosModules.default
        {
          services.clockin = {
            enable = true;
            host = "127.0.0.1";
            port = 3000;
            databaseDir = "/var/lib/clockin";
          };
        }
      ];
    };
  };
}
```

The service runs as a `clockin` system user and stores data in `databaseDir/clockin.sqlite`.

## Identity model

There are no passwords. When a user clicks "Créer un compte", the backend generates a short sqid, stores it, and returns it. The id is kept in the browser's `localStorage` and sent as a `Authorization: Bearer <id>` header. Clearing local storage means creating or pasting in an existing id on the `/account` page.

## Database migrations

Migrations are committed in `apps/api/drizzle/`. They are applied automatically on server startup. To regenerate after schema changes:

```bash
npm run db:generate
```

## Decisions & notes

- **npm instead of pnpm**: pnpm is great for local development, but Nix's `buildNpmPackage` has mature, deterministic support for npm lockfiles and native-addon builds. Using npm everywhere keeps the same tool for dev and deployment.
- **No SSR**: the frontend is a pure SPA; the backend serves `index.html` for every non-API path. This keeps the architecture simple and the Nix package a single Node process.
- **sqids for user ids**: the user asked for generated ids instead of passwords. sqids produce short, URL-safe ids.
- **One TypeScript compiler for the whole repo**: both the API and Angular use the regular TypeScript compiler. Angular's `ngc` requires it, so the API is also compiled with `tsc` rather than pulling in a separate experimental compiler.
- **Tailwind CSS 4.3 with Angular 22**: Tailwind is configured using the official Angular guide with `.postcssrc.json`, and the stylesheet sets an explicit Tailwind source base so utility detection works from the npm workspace root in both dev and production.
- **oxlint / oxfmt instead of ESLint / Prettier**: faster, unified toolchain from the Oxc project.
- **Native addons in Nix**: the `@libsql/client` package falls back to compiling `libsql` from source when `npm_config_build_from_source=true`. The flake provides `python3`, `gnumake`, `gcc`, and `sqlite` so this succeeds in a sandboxed build.

## License

MIT
