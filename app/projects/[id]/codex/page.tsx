"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useProjectContext } from '@/features/projects/context/ProjectContext'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useCodex } from '@/features/projects/hooks/useCodex'
import type { WorldbuildingEntity } from '@/lib/types'
import { Wand2, BookOpen, Link2, RefreshCw, Trash2, Plus } from 'lucide-react'

interface CodexPageProps {
  params: { id: string }
}

export default function CodexPage({ params }: CodexPageProps) {
  const router = useRouter()
  const { projects } = useProjects()
  const { setCurrentProject } = useProjectContext()
  const project = useMemo(() => projects.find(p => p.id === params.id) || null, [projects, params.id])
  const { entities, mentions, loading, error, scanMentions, updateEntityMeta, getMentionCountByEntity, importEntitiesFromMindMap, createEntity, deleteEntity } = useCodex(project?.id || null)

  useEffect(() => {
    if (project) setCurrentProject(project)
  }, [project, setCurrentProject])

  const [aliasEdits, setAliasEdits] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<WorldbuildingEntity['type']>('character')
  const [newColor, setNewColor] = useState('#FFD54F')
  const [newAliases, setNewAliases] = useState('')
  const allTypes: Array<WorldbuildingEntity['type']> = ['character','location','faction','item','custom']
  const [selectedTypes, setSelectedTypes] = useState<Set<WorldbuildingEntity['type']>>(new Set(allTypes))

  const handleAliasBlur = async (entity: WorldbuildingEntity) => {
    const raw = aliasEdits[entity.id]
    if (raw == null) return
    const arr = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    await updateEntityMeta(entity.id, { aliases: arr })
  }

  const handleCreate = async () => {
    const aliases = newAliases
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const created = await createEntity({ name: newName, type: newType, highlightColor: newColor, aliases })
    if (created) {
      setNewName('')
      setNewAliases('')
    }
  }

  const sorted = useMemo(() => {
    return [...entities].sort((a, b) => (a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
  }, [entities])

  const filtered = useMemo(() => {
    return sorted.filter(e => selectedTypes.has(e.type))
  }, [sorted, selectedTypes])

  const [importMsg, setImportMsg] = useState<string | null>(null)
  const handleImport = async () => {
    setImportMsg(null)
    const res = await importEntitiesFromMindMap()
    setImportMsg(`Imported ${res.created} new entr${res.created === 1 ? 'y' : 'ies'} from Mind Map (${res.skipped} skipped).`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Codex</h1>
              <p className="text-muted-foreground">Entities, aliases, colors, and manuscript mentions</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleImport} title="Import entities from Mind Map nodes">Import from Mind Map</Button>
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={() => scanMentions()} className="gap-2" disabled={loading || !project} title="Parse all chapters for entity mentions">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Scan Mentions
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="p-6">
          {error && (
            <div className="text-destructive mb-4">{error}</div>
          )}
          {loading && (
            <div className="text-muted-foreground mb-4">Scanning or loading…</div>
          )}

          {importMsg && (
            <div className="mb-4 text-sm text-foreground bg-muted/40 rounded px-3 py-2">{importMsg}</div>
          )}
          {/* Filters */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1">Filter:</span>
            {allTypes.map((t) => {
              const selected = selectedTypes.has(t)
              return (
                <Button
                  key={t}
                  variant={selected ? 'default' : 'outline'}
                  className={`h-8 px-2 text-xs capitalize ${selected ? '' : 'bg-transparent'}`}
                  onClick={() => {
                    setSelectedTypes(prev => {
                      const next = new Set(prev)
                      if (next.has(t)) next.delete(t); else next.add(t)
                      if (next.size === 0) { // never allow empty: keep at least one
                        next.add(t)
                      }
                      return next
                    })
                  }}
                  title={`Toggle ${t}`}
                >
                  {t.replace('-', ' ')}
                </Button>
              )
            })}
            <div className="mx-1 h-4 w-px bg-border" />
            <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => setSelectedTypes(new Set(allTypes))}>All</Button>
          </div>
          {/* Create New Entity */}
          <div className="mb-6 grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Entity name" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                className="w-full h-10 px-2 border border-border rounded bg-background text-foreground"
                value={newType}
                onChange={(e) => setNewType(e.target.value as WorldbuildingEntity['type'])}
              >
                <option value="character">Character</option>
                <option value="location">Location</option>
                <option value="faction">Faction</option>
                <option value="item">Item</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className="text-xs font-medium text-muted-foreground">Aliases (comma-separated)</label>
              <Input value={newAliases} onChange={(e) => setNewAliases(e.target.value)} placeholder="Jon, Lord Snow" />
            </div>
            <div className="col-span-2">
              <ColorPicker value={newColor} onChange={setNewColor} label="Highlight" />
            </div>
            <div className="col-span-2">
              <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Entity
              </Button>
            </div>
          </div>
          {sorted.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No entities yet</h3>
              <p className="text-muted-foreground mb-4">Create entities in the Worldbuilding section, or import them from your Mind Map.</p>
              <div className="flex justify-center">
                <Button onClick={handleImport}>Import from Mind Map</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground">
                <div className="col-span-3">Entity</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Aliases (comma-separated)</div>
                <div className="col-span-2">Highlight</div>
                <div className="col-span-2">Mentions</div>
              </div>
              {filtered.map((e) => (
                <div key={e.id} className="grid grid-cols-12 gap-3 items-center border-b border-border/60 py-2">
                  <div className="col-span-3 truncate font-medium">{e.name}</div>
                  <div className="col-span-2 text-sm text-muted-foreground capitalize">{e.type.replace('-', ' ')}</div>
                  <div className="col-span-3">
                    <Input
                      value={aliasEdits[e.id] ?? (e.aliases?.join(', ') || '')}
                      onChange={(ev) => setAliasEdits(prev => ({ ...prev, [e.id]: ev.target.value }))}
                      onBlur={() => handleAliasBlur(e)}
                      placeholder="e.g., Jon, Lord Snow"
                    />
                  </div>
                  <div className="col-span-2">
                    <ColorPicker
                      value={e.highlightColor || e.fallbackColor || '#FFD54F'}
                      onChange={(val) => updateEntityMeta(e.id, { highlightColor: val })}
                    />
                  </div>
                  <div className="col-span-2 text-sm flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="font-semibold">{getMentionCountByEntity(e.id)}</span>
                      <span className="text-muted-foreground">matches</span>
                    </span>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={`Delete ${e.name}`}
                      title="Delete entity"
                      onClick={() => deleteEntity(e.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
