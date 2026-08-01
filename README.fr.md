[English](README.md) | [Français](README.fr.md)

# clockin.sacha.house

Une petite application auto-hébergée qui enregistre les pointages quotidiens. Il s'agit d'une application monopage Angular servie par un backend Fastify. Elle utilise Drizzle ORM avec SQLite et est empaquetée pour NixOS.

## Technologies

- **Frontend** : Angular 22.0.1, TypeScript 6.0, Tailwind CSS 4.3.1, oxlint, oxfmt
- **Backend** : Fastify 5.8.5, Drizzle ORM 0.45.2, `@libsql/client` 0.17.4, compilé avec **TypeScript** (`tsc`)
- **Base de données** : fichier SQLite
- **Identité** : identifiant utilisateur généré par sqids et stocké dans `localStorage` (sans mot de passe)
- **Compilation et déploiement** : npm workspaces, flake Nix, module de service NixOS

> Note : le projet utilise **npm workspaces** plutôt que pnpm, car `buildNpmPackage` de Nix prend directement en charge les fichiers de verrouillage npm et la compilation déterministe des modules natifs. L'utilisation de npm partout conserve le même outil pour le développement et le déploiement.

## Structure du projet

```
.
├── apps/api/          Fastify backend + Drizzle schema/migrations
├── apps/web/          Angular SPA
├── flake.nix          Nix package, devShell, and NixOS module
└── package.json       npm workspaces root
```

## Développement local

Prérequis : Node.js `^22.22.3 || ^24.15.0 || >=26`, npm >= 10.

```bash
npm install
npm run dev
```

Cette commande démarre :

- l'API sur `http://127.0.0.1:3000` ;
- le serveur de développement Angular Vite sur `http://127.0.0.1:4200`, qui transmet `/api` au backend.

Par défaut, la base de données se trouve dans `./apps/api/data/clockin.sqlite`.
Pour autoriser l'accès CORS du navigateur sans le proxy Angular, définissez `CORS_ORIGIN` dans `apps/api/.env`.

## Compilation

```bash
npm run build
```

Cette commande compile l'API dans `apps/api/dist/` avec **tsc**. Elle compile aussi l'application web dans `apps/web/dist/web/browser/` avec Angular CLI.

Exécutez le paquet de production :

```bash
cd apps/api
DATABASE_URL=./data/clockin.sqlite WEB_DIST=../web/dist/web/browser node dist/server.js
```

## Analyse et formatage

```bash
npm run lint   # oxlint
npm run format # oxfmt
```

## Nix

Compilez et exécutez l'application :

```bash
nix build .#default
DATABASE_URL=/tmp/clockin.sqlite ./result/bin/clockin
```

Ouvrez l'environnement de développement :

```bash
nix develop
npm run dev
```

### Service NixOS

Importez le module de la flake et activez le service :

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

Le service utilise l'utilisateur système `clockin`. Il stocke les données dans `databaseDir/clockin.sqlite`.

## Modèle d'identité

L'application n'utilise aucun mot de passe. Quand une personne clique sur « Créer un compte », le backend génère, stocke et renvoie un sqid court. L'identifiant reste dans le `localStorage` du navigateur. Le navigateur l'envoie dans un en-tête `Authorization: Bearer <id>`. Après la suppression du stockage local, créez ou collez un identifiant existant sur la page `/account`.

## Migrations de la base de données

Les migrations sont enregistrées dans `apps/api/drizzle/`. Le serveur les applique automatiquement au démarrage. Après une modification du schéma, régénérez-les avec cette commande :

```bash
npm run db:generate
```

## Décisions et notes

- **npm plutôt que pnpm** : pnpm convient au développement local, mais `buildNpmPackage` de Nix prend en charge les fichiers de verrouillage npm et la compilation déterministe des modules natifs. L'utilisation de npm partout conserve le même outil pour le développement et le déploiement.
- **Pas de SSR** : le frontend est une application monopage. Le backend sert `index.html` pour chaque chemin hors API. Cette architecture conserve un paquet Nix qui contient un seul processus Node.
- **sqids pour les identifiants utilisateur** : la demande porte sur des identifiants générés plutôt que sur des mots de passe. sqids produit des identifiants courts et compatibles avec les URL.
- **Un seul compilateur TypeScript pour tout le dépôt** : l'API et Angular utilisent le compilateur TypeScript standard. `ngc` d'Angular en dépend. L'API utilise donc aussi `tsc` au lieu d'un compilateur expérimental distinct.
- **Tailwind CSS 4.3 avec Angular 22** : la configuration de Tailwind suit le guide Angular officiel avec `.postcssrc.json`. La feuille de style définit une base source Tailwind explicite. La détection des utilitaires fonctionne ainsi depuis la racine de npm workspaces en développement et en production.
- **oxlint et oxfmt plutôt que ESLint et Prettier** : ces deux outils forment une chaîne unifiée issue du projet Oxc.
- **Modules natifs dans Nix** : le paquet `@libsql/client` compile `libsql` depuis les sources quand `npm_config_build_from_source=true`. La flake fournit `python3`, `gnumake`, `gcc` et `sqlite` pour effectuer cette compilation dans un bac à sable.

## Licence

MIT
