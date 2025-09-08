"use client"

import { ThemeSelector } from '@/features/settings/components/ThemeSelector'
import { DataManagement } from '@/features/settings/components/DataManagement'
import { Card } from '@/components/ui/Card'
import { Settings, Palette, Database } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure Lily to your preferences</p>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Palette className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Appearance</h2>
            <p className="text-muted-foreground">Customize colors and themes</p>
          </div>
        </div>
        <ThemeSelector />
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Data Management</h2>
            <p className="text-muted-foreground">Backup and manage your data</p>
          </div>
        </div>
        <DataManagement />
      </Card>
      </div>
    </div>
  )
}
