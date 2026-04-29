'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navigation } from '@/components/navigation'
import { HomeRecorder } from '@/components/home-recorder'
import { History } from '@/components/history'
import { AlarmOverlay } from '@/components/alarm-overlay'
import { syncToGoogleCalendar } from '@/components/google-calendar-connect'
import { ActiveSection, RecordingEntry } from '@/lib/types'
import { getHistory, addToHistory, updateHistoryEntry, deleteFromHistory } from '@/lib/storage'

interface ActiveAlarm {
  id: string
  transcript: string
  audioUrl: string | null
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('home')
  const [history, setHistory] = useState<RecordingEntry[]>([])
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const workerRef = useRef<Worker | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(getHistory())
    setIsLoaded(true)
  }, [])

  // Handle alarm trigger from worker
  const handleWorkerMessage = useCallback((e: MessageEvent) => {
    const { type, payload } = e.data
    
    console.log('[v0] Worker message:', type, payload)
    
    if (type === 'ALARM_TRIGGERED') {
      setActiveAlarm({
        id: payload.id,
        transcript: payload.transcript,
        audioUrl: payload.audioUrl
      })
      
      // Mark alarm as triggered in history
      setHistory(updateHistoryEntry(payload.id, { alarmTriggered: true }))
    }
  }, [])

  // Initialize Web Worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const worker = new Worker('/alarm-worker.js')
      worker.onmessage = handleWorkerMessage
      workerRef.current = worker
      
      return () => {
        worker.terminate()
      }
    }
  }, [handleWorkerMessage])

  const handleRecordingComplete = (entry: RecordingEntry) => {
    setHistory(addToHistory(entry))
  }

  const handleSetAlarm = (config: { id: string; time: number; transcript: string; audioUrl: string | null }) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SET_ALARM',
        payload: config
      })
      
      // Update history with alarm time
      setHistory(updateHistoryEntry(config.id, { alarmTime: config.time }))
      
      // Sync to Google Calendar (mock)
      syncToGoogleCalendar(config.transcript, config.time)
    }
  }

  const handleSnooze = () => {
    if (activeAlarm && workerRef.current) {
      workerRef.current.postMessage({
        type: 'SNOOZE_ALARM',
        payload: {
          id: activeAlarm.id,
          transcript: activeAlarm.transcript,
          audioUrl: activeAlarm.audioUrl
        }
      })
      
      // Update alarm time in history (+9 minutes)
      const snoozeTime = Date.now() + (9 * 60 * 1000)
      setHistory(updateHistoryEntry(activeAlarm.id, { 
        alarmTime: snoozeTime,
        alarmTriggered: false 
      }))
    }
    setActiveAlarm(null)
  }

  const handleDone = () => {
    setActiveAlarm(null)
  }

  const handleDelete = (id: string) => {
    // Cancel any pending alarm
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'CANCEL_ALARM',
        payload: { id }
      })
    }
    setHistory(deleteFromHistory(id))
  }

  // Show loading state while hydrating
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background">
        <header className="grid-border-b p-4">
          <h1 className="text-xl uppercase tracking-widest text-center">k2k0</h1>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-57px)]">
          <div className="text-sm uppercase tracking-widest opacity-50">
            [LOADING...]
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="grid-border-b p-4">
        <h1 className="text-xl uppercase tracking-widest text-center">k2k0</h1>
      </header>
      
      {/* Navigation */}
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Content */}
      {activeSection === 'home' ? (
        <HomeRecorder 
          onRecordingComplete={handleRecordingComplete}
          onSetAlarm={handleSetAlarm}
        />
      ) : (
        <History 
          entries={history}
          onDelete={handleDelete}
        />
      )}
      
      {/* Alarm Overlay */}
      {activeAlarm && (
        <AlarmOverlay
          transcript={activeAlarm.transcript}
          audioUrl={activeAlarm.audioUrl}
          onSnooze={handleSnooze}
          onDone={handleDone}
        />
      )}
    </main>
  )
}
