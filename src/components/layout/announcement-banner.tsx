'use client'

import { useSyncExternalStore, useCallback } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'announcement_dismissed'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

function getServerSnapshot(): boolean {
  return true
}

export function AnnouncementBanner() {
  const isDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    // Dispatch a storage event so useSyncExternalStore re-reads
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
  }, [])

  if (isDismissed) return null

  return (
    <div className="relative h-9 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center px-10">
      <p className="text-sm font-medium text-center">
        Board Exams 2026! Get all notes at 50% off
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
