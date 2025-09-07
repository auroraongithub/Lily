# Architecture & Conventions

## Folder Structure

- `app/`
  - `layout.tsx` – Root layout with collapsible left sidebar and mode toggle
  - `page.tsx` – Landing/dashboard
  - `editor/`, `worldbuilding/`, `mindmap/`, `notes/`, `projects/`, `settings/`, `import-export/` – Route groups
- `components/`
  - `ui/` – Reusable UI primitives (PascalCase exports)
  - `layout/` – Shared layout wrappers
- `features/`
  - `import-export/`, `themes/`, `suggestions/` – Each feature keeps its own components, hooks, styles, and tests
- `lib/`
  - `db.ts` – Dexie schema
  - `types.ts` – Domain types (Project, Story, Chapter, Volume, Character, Location, Faction, Item, Note, MindMap, Theme, SuggestionBank)
  - `utils.ts` – Shared small utilities
- `tests/`
  - `smoke/`, `unit/`
- `public/assets/`

## Conventions

- Components: PascalCase filenames and exports
- Hooks/utilities: camelCase filenames and exports
- UI vs data vs serialization vs export kept separate
- Types live in `lib/types.ts`

## Performance & UX

- Initial bundle is minimal; heavy libraries are lazy imported on demand
- Sidebar is responsive with GPU-accelerated transforms
- Long-doc readiness: Foundation laid for Lexical integration and offline storage

## Future Expansion

- Lexical editor under `features/editor/` with autosave using Dexie
- Mind map via React Flow/Konva/Fabric – lazy chunks
- Import/export additions (pdfmake, epub)
