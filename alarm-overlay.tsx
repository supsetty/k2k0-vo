'use client'

import { useEffect, useRef } from 'react'

interface AlarmOverlayProps {
  transcript: string
  audioUrl: string | null
  onSnooze: () => void
  onDone: () => void
}

export function AlarmOverlay({ transcript, audioUrl, onSnooze, onDone }: AlarmOverlayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.loop = true
      audio.play().catch(console.error)
      audioRef.current = audio
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioUrl])

  const handleSnooze = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    onSnooze()
  }

  const handleDone = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 z-[100] animate-alarm-flash flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="text-6xl md:text-8xl font-bold mb-4">
          [ALARM]
        </div>
        <div className="text-xl md:text-2xl max-w-2xl mx-auto p-4 border-2 border-current">
          {transcript}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        <button
          onClick={handleSnooze}
          className="p-6 md:p-8 text-xl md:text-2xl uppercase tracking-widest border-2 border-current transition-all hover:scale-105"
        >
          [SNOOZE]
          <div className="text-sm mt-2 opacity-70">+9 MIN</div>
        </button>
        <button
          onClick={handleDone}
          className="p-6 md:p-8 text-xl md:text-2xl uppercase tracking-widest border-2 border-current transition-all hover:scale-105"
        >
          [DONE]
          <div className="text-sm mt-2 opacity-70">STOP</div>
        </button>
      </div>
    </div>
  )
}
