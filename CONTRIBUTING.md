# Contributing to Lily

## Adding Pages

- Add new routes under `app/<route>/page.tsx`.
- Add local components and styles near the route when specific to it.

## Adding Features

- Create a new folder under `features/<feature-name>/`.
- Keep feature-specific components, hooks, and tests within the feature folder.
- Export only public APIs from the feature index.

## UI Components

- Shared primitives live in `components/ui/` with PascalCase filenames/exports.
- Avoid adding business logic into UI primitives.

## Types & DB

- Add or modify domain types in `lib/types.ts`.
- Update Dexie schema `lib/db.ts` with migrations when changing tables.

## Code Style

- TypeScript strict mode is enabled.
- Run `npm run lint` and `npm run format` before sending PRs.
- No Husky or pre-commit hooks.

## Testing

- Add unit tests to `tests/unit/` and smoke/integration to `tests/smoke/`.
- Run `npm run test`.
