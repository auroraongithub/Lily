# Project Context

## Environment
- **Language**: TypeScript
- **Runtime**: Node.js 18.17+ with Next.js 14.2.5
- **Build**: `npm run build`
- **Test**: `npm run test` (Vitest)
- **Package Manager**: npm

## Project Type
- **Application**: Web-based story-writing platform (PWA-ready)
- **Architecture**: Offline-first with local-first principles
- **Database**: Dexie.js (IndexedDB wrapper)

## Infrastructure
- **Container**: None
- **CI/CD**: GitHub Actions (`.github/` exists)
- **Cloud**: None yet (sync will require)

## Structure
- **Source**: `app/` (Next.js App Router pages)
- **Features**: `features/` (modular feature folders)
- **Components**: `components/ui/` and `components/layout/`
- **Library**: `lib/` (database, types, utilities)
- **Tests**: `tests/` (smoke and unit tests)

## Core Features Implemented
| Feature | Status | Technology |
|---------|--------|------------|
| Story Projects | ✅ | Dexie, custom schema |
| Lexical Editor | ✅ | @lexical/react, autosave |
| Worldbuilding | ✅ | Custom canvas (Konva/Fabric) |
| Mind Maps | ✅ | React Flow |
| Moodboard | ✅ | Custom grid/freeform |
| Import/Export | 🔄 | pdf-lib, pdfmake |
| Themes | ✅ | Tailwind + custom |
| Suggestions Bank | ✅ | Custom feature |
| Codex (Mentions) | ✅ | Entity tracking |
| Progress Tracking | ✅ | Chapter-level entity progress |

## Current Sync Status
- **Offline-first**: All data stored locally in IndexedDB
- **No sync**: Export/Import via JSON is the only data transfer method
- **PWA-ready**: Foundation exists but not configured

## Technical Notes
- Heavy libraries lazy-loaded (Lexical, React Flow, Konva, Fabric, pdf-lib)
- IndexedDB schema at v11 with proper indexing
- Strict TypeScript with comprehensive type definitions
- TailwindCSS with shadcn/ui-inspired components

## Identified Feature Gaps
1. ❌ Cross-device sync
2. ❌ Real-time collaboration
3. ❌ Cloud backup
4. ❌ Account/auth system
5. ❌ Version history
6. ❌ Publishing to web

## Minimalism Principles
- Keep initial bundle small (heavy libs lazy-loaded)
- Modular feature architecture
- Offline-first defaults
- Local storage as source of truth
