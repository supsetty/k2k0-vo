'use client'

import { useState, useRef, useEffect } from 'react'
import { RecordingEntry } from '@/lib/types'

interface HistoryProps {
  entries: RecordingEntry[]
  onDelete: (id: string) => void
}

function HistoryItem({ entry, onDelete }: { entry: RecordingEntry; onDelete: (id: string) => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const togglePlayback = () => {
    if (!entry.audioUrl) return
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(entry.audioUrl)
        audioRef.current.onended = () => setIsPlaying(false)
      }
      audioRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAlarmTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="grid-border">
      <div className="grid grid-cols-[1fr_auto_auto] gap-0">
        {/* Transcript */}
        <div className="p-4 grid-border-r">
          <div className="text-xs uppercase tracking-widest opacity-50 mb-1">
            {formatDate(entry.timestamp)}
          </div>
          <div className="text-sm leading-relaxed">
            {entry.transcript}
          </div>
          {entry.alarmTime && (
            <div className="text-xs mt-2 uppercase tracking-widest">
              <span className="opacity-50">ALARM: </span>
              {formatAlarmTime(entry.alarmTime)}
              {entry.alarmTriggered && <span className="ml-2">[DONE]</span>}
            </div>
          )}
        </div>
        
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayback}
          disabled={!entry.audioUrl}
          className="w-16 grid-border-r flex items-center justify-center text-sm uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPlaying ? '||' : '▶'}
        </button>
        
        {/* Delete Button */}
        <button
          onClick={() => onDelete(entry.id)}
          className="w-16 flex items-center justify-center text-sm uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function History({ entries, onDelete }: HistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="grid-border p-8 text-center">
          <div className="text-sm uppercase tracking-widest opacity-50">
            [NO RECORDINGS]
          </div>
          <div className="text-xs mt-2 opacity-30">
            Record something to see it here
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="text-xs uppercase tracking-widest mb-4 opacity-50">
        [HISTORY] — {entries.length} RECORDING{entries.length !== 1 ? 'S' : ''}
      </div>
      <div className="space-y-4">
        {entries.map(entry => (
          <HistoryItem 
            key={entry.id} 
            entry={entry} 
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
