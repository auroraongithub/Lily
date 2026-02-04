# Lily Feature Exploration & Sync Strategy

## Executive Summary

This document explores **sync solutions** and **additional features** for Lily while preserving its minimalist, offline-first philosophy. The goal is to enhance functionality without compromising the lightweight nature that makes Lily special.

---

## Part 1: Cross-Device Sync Solutions

### Option A: ElectricSQL (Recommended for Local-First)

**Philosophy**: True local-first sync with Postgres as source of truth.

| Aspect | Details |
|--------|---------|
| **Approach** | CRDT-based sync between local PGlite (WASM Postgres) and cloud Postgres |
| **Conflict Resolution** | Automatic via CRDTs, works offline |
| **Backend** | Requires Postgres database (Supabase, Neon, Railway, or self-hosted) |
| **Offline Support** | Full offline - local database works without connection |
| **Real-time Sync** | Yes, with low latency |
| **Open Source** | Yes (Apache 2.0) |
| **Pricing** | Free tier available; Electric Cloud has paid plans |

**Integration with Lily**:
- Replace Dexie with PGlite for local storage
- Existing IndexedDB data would need migration
- Leverages existing Postgres knowledge in ecosystem
- Works with existing schema with minimal changes

**Pros**:
- True offline-first with automatic sync
- No custom sync logic needed
- Strong consistency guarantees
- Can work with existing cloud Postgres

**Cons**:
- Requires database migration from IndexedDB to PGlite
- More complex initial setup
- Learning curve for CRDT concepts

---

### Option B: Supabase + Realtime

**Philosophy**: Cloud-first approach with real-time subscriptions.

| Aspect | Details |
|--------|---------|
| **Approach** | Direct Postgres sync via Realtime Broadcast/Presence |
| **Conflict Resolution** | Server wins (simplest) or custom logic |
| **Backend** | Supabase (managed Postgres + Auth) |
| **Offline Support** | Limited - requires connection for writes |
| **Real-time Sync** | Excellent via websockets |
| **Open Source** | Realtime server is open source |
| **Pricing** | Free tier available; scales with usage |

**Integration with Lily**:
- Keep Dexie for local cache
- Sync changes to Supabase on connection
- Listen for changes via Postgres Changes subscription
- Use Supabase Auth for user accounts

**Pros**:
- Mature, well-documented platform
- Built-in Auth simplifies user management
- Excellent real-time capabilities
- Large community and ecosystem

**Cons**:
- Not true offline-first (needs connection to write)
- More server-side logic for conflict resolution
- Vendor lock-in to Supabase ecosystem

---

### Option C: Replicache

**Philosophy**: Client-side sync engine with optimistic UI.

| Aspect | Details |
|--------|---------|
| **Approach** | Client holds full data copy, sync via push/pull mutations |
| **Conflict Resolution** | Deterministic with server as arbiter |
| **Backend** | Any - sync server you build/host |
| **Offline Support** | Full offline with optimistic mutations |
| **Real-time Sync** | Eventual (poll-based) unless combined with websockets |
| **Open Source** | Client is MIT licensed; server reference implementations |
| **Pricing** | Free for most use cases |

**Integration with Lily**:
- Wrap Dexie with Replicache sync layer
- Define mutations for each operation type
- Build simple sync server (or use Replicache Cloud)
- Works with any backend

**Pros**:
- Excellent offline story with optimistic UI
- Minimal server logic required
- Proven at scale (used by Figma)

**Cons**:
- Requires building/maintaining sync server
- More complex client integration
- Less opinionated than ElectricSQL

---

### Option D: Liveblocks (Simplest for Real-Time)

**Philosophy**: Building blocks for collaboration, including AI.

| Aspect | Details |
|--------|---------|
| **Approach** | Managed infrastructure for realtime + AI |
| **Conflict Resolution** | Built-in with Yjs integration |
| **Backend** | Liveblocks Cloud (managed) |
| **Offline Support** | Limited (improving) |
| **Real-time Sync** | Excellent with presence/broadcast |
| **Open Source** | Client SDKs open source |
| **Pricing** | Free tier; pay for scale |

**Integration with Lily**:
- Use @liveblocks/lexical for editor collaboration
- Store project metadata in Liveblocks Storage
- Use Liveblocks Auth for access control
- Great for multiplayer writing sessions

**Pros**:
- Excellent Lexical integration
- Built-in AI features (AI Agents)
- Comments, presence, notifications included
- Very quick to implement

**Cons**:
- Less control over data
- Recurring subscription costs
- Not true offline-first

---

### Option E: Yjs + Custom Provider (Most Flexible)

**Philosophy**: CRDT library with pluggable sync providers.

| Aspect | Details |
|--------|---------|
| **Approach** | Yjs for data sync, choose provider (WebRTC, WebSocket, etc.) |
| **Conflict Resolution** | CRDT-based automatic merging |
| **Backend** | Any - implement or use existing provider |
| **Offline Support** | Depends on provider (WebRTC = peer-to-peer offline) |
| **Real-time Sync** | Yes with WebSocket provider |
| **Open Source** | Yes (MIT) |
| **Pricing** | Free (self-hosted) or use managed services |

**Integration with Lily**:
- Wrap editor content in Yjs for sync
- Use y-indexeddb for offline persistence
- Choose provider based on needs (Hocuspocus for websockets, etc.)
- Can add collaboration to editor specifically

**Pros**:
- Maximum flexibility
- Excellent editor collaboration support
- Large ecosystem of providers
- Battle-tested (used by Notion, Figma, etc.)

**Cons**:
- More pieces to assemble
- Requires sync server implementation
- Limited to Yjs data types (though extensible)

---

### Sync Solution Comparison Matrix

| Criteria | ElectricSQL | Supabase | Replicache | Liveblocks | Yjs+Custom |
|----------|-------------|----------|------------|------------|------------|
| **Offline-First** | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ |
| **Real-Time** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Ease of Setup** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Cost** | Low | Low | Low | Medium | Low |
| **Control** | High | Medium | High | Low | High |
| **Lexical Support** | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Vendor Lock-in** | Low | High | Low | High | None |
| **Maturity** | Growing | Mature | Mature | Mature | Mature |

---

### Recommended Sync Approach

**For Lily's Philosophy (Offline-First + Minimalism)**:

**Phase 1: ElectricSQL (Long-term)**
- Best fit for offline-first apps
- Minimal vendor lock-in
- Strong consistency
- Open source

**Phase 1 Alternative: Liveblocks (Quick wins)**
- Fastest to implement
- Built-in AI features
- Great for collaboration features

**Hybrid Approach**:
- Use **ElectricSQL** for project data (stories, worldbuilding)
- Use **Liveblocks** for real-time collaboration (if needed)
- Keep **Dexie** as fallback/local cache during transition

---

## Part 2: Additional Feature Ideas

### Category A: Writing Enhancement Features

#### 1. **Writing Goals & Streaks**
- Daily word count goals
- Writing streaks with gamification
- Session timers (Pomodoro)
- Weekly/monthly statistics
- Minimal UI - just numbers and a streak flame icon

#### 2. **Session Notes & Quick Capture**
- Sidebar "scratchpad" for mid-writing notes
- Quick capture hotkey (cmd+shift+space)
- Capture thoughts without leaving editor
- Syncs with project notes automatically

#### 3. **Outliner / Story Structure**
- Hierarchical outline view alongside editor
- Drag-and-drop chapter reorganization
- Show outline as navigation sidebar
- Collapsible sections for volumes/parts

#### 4. **Revision Mode**
- Track changes like "Track Changes" in Word
- Accept/reject individual revisions
- Compare versions side-by-side
- Visual diff for editing review

#### 5. **Writing Templates**
- Story structure templates (Hero's Journey, 3-Act, etc.)
- Genre-specific templates (Mystery, Romance beats)
- Character interview templates
- Scene setting templates
- Minimal UI - just dropdown selection

#### 6. **Spellcheck & Grammar**
- Browser-native spellcheck (free, offline)
- Optional LanguageTool integration (rules-based, privacy-focused)
- Custom dictionary per project
- Ignore patterns for world-specific terms

---

### Category B: Worldbuilding Enhancements

#### 7. **Relationship Maps**
- Auto-generate relationship diagrams between characters
- Define relationship types (family, romantic, rival)
- Visual graph view with filtering
- Export as image for reference

#### 8. **Timeline Builder**
- Chronological timeline of story events
- Character age tracking across chapters
- Historical events with worldbuilding entities
- Visual timeline with drag-to-reorder

#### 9. **Entity Search & Filter**
- Global search across all worldbuilding
- Filter by type, tags, relationships
- Recent entities quick access
- Search within descriptions

#### 10. **Connection Dashboard**
- Visual overview of entity connections
- Orphan detection (entities with no connections)
- Tag cloud for quick filtering
- Export connection data

---

### Category C: AI-Assisted Features (Privacy-First)

#### 11. **Local LLM Integration** (Ollama/Llama.cpp)
- Offline AI suggestions via local models
- No data leaves device
- Writing suggestions, expansions, alternatives
- Requires powerful local machine

#### 12. **API-Based AI** (Optional, user-provided key)
- Integration with OpenAI, Anthropic APIs
- Generate character names, plot suggestions
- Rewrite sentences, expand descriptions
- User provides own API key

#### 13. **AI Worldbuilding Assistant**
- Generate character descriptions from prompts
- Suggest locations based on genre
- Name generation with filters
- All AI optional and local-first

#### 14. **Writing Statistics AI**
- Analyze writing style (sentence length, vocabulary)
- Suggest readability improvements
- Identify pacing issues
- Genre consistency checks

---

### Category D: Version & Backup Management

#### 15. **Auto-Snapshots**
- Automatic periodic snapshots (hourly, per-chapter)
- No storage limit (store only deltas)
- One-click restore to any point
- Compare current to snapshot

#### 16. **Manual Versions**
- Named checkpoints ("Finished Chapter 3", "Before rewrite")
- Add notes to versions
- Export versions as backup files
- Delete old versions to save space

#### 17. **Export to Multiple Formats**
- **EPUB3** - Standard ebook format
- **Markdown** - Plain text with frontmatter
- **HTML** - Single file for web reading
- **DOCX** - Microsoft Word format
- **PDF** - Print-ready (via pdf-lib)

#### 18. **Project Backup**
- Export entire project (JSON)
- Selective export (only worldbuilding, only chapters)
- Import from backup with merge options
- Cloud backup via sync (future)

---

### Category E: Collaboration Features

#### 19. **Project Sharing** (Read-Only)
- Generate shareable read-only link
- Viewer mode for beta readers
- Password protection optional
- No account needed for viewers

#### 20. **Collaborator Permissions**
- Editor (full access)
- Commenter (can add notes only)
- Viewer (read-only)
- Per-project permissions

#### 21. **Comment System**
- Inline comments on text selection
- Threaded discussions
- Resolve/reopen threads
- Comment notifications

#### 22. **Writing Sprints**
- Timer-based writing sessions
- Shared word count goals
- Sprint leaderboard (optional)
- No real-time editing (async collaboration)

---

### Category F: Publishing & Export

#### 23. **Direct Publishing**
- Publish to **Wattpad** (API)
- Publish to **Medium** (API)
- Publish to **Substack** (API)
- Export to **Amazon KDP** (PDF format)

#### 24. **Series Management**
- Link multiple projects as series
- Character reuse across series
- Cross-series timeline
- Series-level statistics

#### 25. **Chapter Notes**
- Private notes per chapter (author's eyes only)
- Chapter-specific reminders
- Track which chapters need revision
- Export chapter notes with manuscript

#### 26. **Target Platform Formatting**
- Wattpad-optimized export
- AO3 (Archive of Our Own) HTML export
- Kindle formatting presets
- Custom formatting profiles

---

### Category G: Mobile & Accessibility

#### 27. **PWA Enhancement**
- Offline app mode
- Background sync when online
- Mobile-optimized UI views
- Home screen installable

#### 28. **Voice Input**
- Browser-native dictation support
- Voice commands for formatting
- Audio recording for ideas
- Optional external service integration

#### 29. **Dark/Light Mode**
- Already implemented via themes
- Automatic system preference
- Per-project theme override
- E-ink mode (high contrast, minimal blue)

#### 30. **Keyboard Shortcuts**
- Comprehensive shortcut system
- Customizable shortcuts
- Cheat sheet overlay
- Vim mode for power users

---

## Part 3: Feature Prioritization Matrix

### Features by Implementation Effort vs Impact

| Feature | Effort | Impact | Recommendation |
|---------|--------|--------|----------------|
| **Writing Goals & Streaks** | Low | Medium | Quick win |
| **Session Notes** | Low | Medium | Quick win |
| **Auto-Snapshots** | Medium | High | Essential |
| **EPUB Export** | Medium | High | Essential |
| **Offline LLM** | High | Medium | Later |
| **Relationship Maps** | Medium | Medium | Consider |
| **Sync (ElectricSQL)** | High | Very High | Long-term |
| **Project Sharing** | Medium | High | Essential |
| **Timeline Builder** | Medium | Medium | Consider |

### Recommended Implementation Order

1. **Immediate** (Low effort, high value)
   - Writing goals & streak tracking
   - Session quick capture notes
   - Enhanced spellcheck (LanguageTool)

2. **Short-term** (Medium effort)
   - Auto-snapshots with version history
   - EPUB export for ebooks
   - Manual versions with notes
   - Global entity search

3. **Medium-term** (Higher effort)
   - Sync infrastructure (ElectricSQL or Supabase)
   - Project sharing (read-only links)
   - Relationship maps
   - Timeline builder

4. **Long-term** (Complex)
   - Full real-time collaboration
   - AI integration (local + cloud options)
   - Direct publishing integrations
   - Mobile app companion

---

## Part 4: Sync Architecture Recommendation

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Lily App                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Lexical    │  │  Worldbuild  │  │     Moodboard       │   │
│  │   Editor     │  │    Canvas    │  │      (Canvas)       │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                     │               │
│         └────────────┬────┴─────────────────────┘               │
│                      │                                          │
│              ┌───────┴───────┐                                  │
│              │    Dexie DB   │                                  │
│              │  (Local-First)│                                  │
│              └───────┬───────┘                                  │
│                      │                                          │
│         ┌────────────┼────────────┐                            │
│         │            │            │                            │
│    ┌────┴────┐ ┌────┴────┐ ┌────┴────┐                        │
│    │ Electric│ │ Liveblocks│ │ Export │                        │
│    │   SQL   │ │  (optional) │ │ Backup │                        │
│    └────┬────┘ └────┬────┘ └─────────┘                        │
│         │            │                                          │
│    ┌────┴────┐ ┌────┴────┐                                     │
│    │ Cloud   │ │ Auth &  │                                     │
│    │ Postgres│ │ Presence│                                     │
│    └─────────┘ └─────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Local writes** → Dexie (immediate, offline)
2. **Sync trigger** → ElectricSQL (background, automatic)
3. **Conflict resolution** → CRDT automatic merge
4. **Cloud backup** → Postgres (authoritative source)
5. **Optional collaboration** → Liveblocks (presence, real-time cursors)

### Migration Path

1. Keep Dexie as primary local storage
2. Add ElectricSQL sync layer on top
3. Existing Dexie data remains accessible
4. New writes sync automatically
5. Future: Migrate Dexie → PGlite for tighter integration

---

## Part 5: Minimal Addition Strategy

### "Feature-Packed Yet Minimal" Philosophy

The key is **modular optionality** - features exist but don't burden users who don't need them.

#### Implementation Principles

1. **Feature Flags**
   - All new features behind feature flags
   - Disabled by default for minimal experience
   - Users opt-in to what they need

2. **Lazy Loading**
   - Continue existing pattern of lazy imports
   - AI features only load when requested
   - Worldbuilding features load per-project

3. **Progressive Disclosure**
   - Simple view by default
   - Advanced options hidden behind "More" or settings
   - Expert mode for power users

4. **Offline Defaults**
   - All features work offline first
   - Sync is enhancement, not requirement
   - No mandatory account for basic use

#### Recommended Minimal Feature Set

**Core (Always present, lightweight)**:
- Writing goals (simple counter, no gamification clutter)
- Session notes (single sidebar panel)
- Auto-snapshots (background, no UI until needed)
- EPUB export (single format)

**Optional (Enable via settings)**:
- Relationship maps
- Timeline builder
- AI suggestions (local LLM if available)
- Sync across devices

**Advanced (Explicit opt-in)**:
- Real-time collaboration
- Direct publishing integrations
- Custom shortcuts
- Export formats beyond EPUB

---

## Part 6: Implementation Considerations

### Database Schema Changes for Sync

```typescript
// New types needed for sync features

export interface SyncMetadata {
  lastSyncedAt: ISODate
  syncVersion: number
  deviceId: string
}

export interface ProjectShare {
  id: ID
  projectId: ID
  shareToken: string
  permissions: 'read' | 'comment' | 'edit'
  expiresAt?: ISODate
  password?: string
  viewCount: number
  createdAt: ISODate
}

export interface WritingSession {
  id: ID
  projectId: ID
  startTime: ISODate
  endTime?: ISODate
  wordCountStart: number
  wordCountEnd?: number
  wordCountGoal?: number
  sessionType: 'sprint' | 'free' | 'pomodoro'
}

export interface VersionSnapshot {
  id: ID
  projectId: ID
  entityType: 'project' | 'chapter' | 'worldbuilding'
  entityId: ID
  snapshotData: string // compressed JSON
  note?: string
  createdAt: ISODate
  autoGenerated: boolean
}
```

### API Endpoints (for sync)

```
GET  /api/sync/status          - Check sync health
POST /api/sync/push            - Push local changes
GET  /api/sync/pull            - Pull remote changes
POST /api/sync/resolve         - Manual conflict resolution

POST /api/share/create         - Create share link
GET  /api/share/:token         - Access shared project
DELETE /api/share/:id          - Revoke share

POST /api/backup/export        - Full project export
POST /api/backup/import        - Import with merge options

GET  /api/versions/:projectId  - List snapshots
POST /api/versions/:projectId  - Create snapshot
POST /api/versions/restore    - Restore to snapshot
```

---

## Summary & Next Steps

### Sync Solution Decision Tree

```
Need real-time collaboration?
├─ YES → Use Liveblocks (fastest) or ElectricSQL + custom WS
└─ NO → Continue with offline-first
   └─ Want true offline sync?
       ├─ YES → ElectricSQL (best fit for local-first)
       ├─ NO → Supabase (easier, more managed)
       └─ Maybe later → Keep Dexie, add sync layer later
```

### Recommended Immediate Actions

1. **Add writing goals & session notes** (low effort, high value)
2. **Implement auto-snapshots** (protect user data)
3. **Add EPUB export** (key publishing feature)
4. **Evaluate ElectricSQL** for sync prototype
5. **Create feature flag system** for new additions

### Long-Term Vision

Lily becomes a **personal writing assistant** that:
- Works fully offline
- Syncs seamlessly across devices when online
- Provides optional AI assistance (local-first, privacy-respecting)
- Enables sharing and collaboration without requiring accounts
- Maintains minimalist, focused writing experience

---

*Document generated: 2026-02-04*
*Project: Lily - Lightweight Story-Writing Platform*
