'use client'

import { useState, useRef } from 'react'
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, Database, Shield } from 'lucide-react'
import { getDb } from '@/lib/firebase'
import type { Firestore } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { exportFirestoreData, downloadBackup, importFirestoreData, parseBackupFile } from '@repo/shared/backup'
import type { BackupData } from '@repo/shared/types'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  FadeStatus,
} from '@/components/motion/motion-components'

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    setStatus({ type: null, message: '' })
    try {
      const backup = await exportFirestoreData(getDb() as unknown as Firestore)
      downloadBackup(backup)
      setStatus({ type: 'success', message: `Exported ${backup.metadata.counts.prompts ?? 0} prompts, ${backup.metadata.counts.categories ?? 0} categories, and ${backup.metadata.counts.users ?? 0} users.` })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus({ type: 'error', message: `Export failed: ${message}` })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportProgress(0)
    setStatus({ type: null, message: '' })
    try {
      const backup = await parseBackupFile(file)
      await importFirestoreData(getDb(), backup, (current, total) => {
        setImportProgress(Math.round((current / total) * 100))
      })
      setStatus({ type: 'success', message: `Successfully imported ${backup.metadata.counts.prompts ?? 0} prompts from backup dated ${new Date(backup.metadata.timestamp).toLocaleDateString()}.` })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus({ type: 'error', message: `Import failed: ${message}` })
    } finally {
      setImporting(false)
      setImportProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      <FadeIn>
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Settings</h1>
          <p className="text-sm text-muted-foreground">Backup data, restore, and manage app configuration</p>
        </div>
      </FadeIn>

      <FadeStatus show={status.type !== null}>
        <div className={`flex items-center gap-2 rounded-xl p-4 text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      </FadeStatus>

      <StaggerContainer className="grid gap-4 md:grid-cols-2">
        <StaggerItem>
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Download size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">Export Backup</CardTitle>
                  <CardDescription>Download all Firestore data as a JSON file</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Exports all prompts, categories, and user data into a single JSON file.
                Use this before making bulk changes or as a regular backup.
              </p>
              <Button onClick={handleExport} disabled={exporting} className="w-full">
                {exporting ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="mr-2 size-4" /> Download Backup</>
                )}
              </Button>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                  <Upload size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">Restore Backup</CardTitle>
                  <CardDescription>Import data from a previously exported backup</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a backup JSON file to restore prompts, categories, and users.
                Existing documents with the same ID will be overwritten.
              </p>
              {importing && importProgress > 0 && (
                <div className="mb-4">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{importProgress}% complete</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full">
                {importing ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Restoring...</>
                ) : (
                  <><Upload className="mr-2 size-4" /> Restore from Backup</>
                )}
              </Button>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      <StaggerContainer className="grid gap-4 md:grid-cols-2">
        <StaggerItem>
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Database size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">Firebase Project</CardTitle>
                  <CardDescription>Current connection info</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Project ID</span>
                  <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Region</span>
                  <span>us-central1</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                  <Shield size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">Security Rules</CardTitle>
                  <CardDescription>Firebase rules status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Firestore Rules</span>
                  <Badge variant="secondary">firestore.rules</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Storage Rules</span>
                  <Badge variant="secondary">storage.rules</Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Indexes</span>
                  <Badge variant="secondary">firestore.indexes.json</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  )
}
