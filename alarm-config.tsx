'use client'

import { useState } from 'react'

interface AlarmConfigProps {
  transcript: string
  onSetAlarm: (time: number) => void
  onCancel: () => void
}

export function AlarmConfig({ transcript, onSetAlarm, onCancel }: AlarmConfigProps) {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')

  const handleSetAlarm = () => {
    const now = new Date()
    const alarmDate = new Date()
    
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    
    alarmDate.setHours(h, m, 0, 0)
    
    // If the time has already passed today, set it for tomorrow
    if (alarmDate.getTime() <= now.getTime()) {
      alarmDate.setDate(alarmDate.getDate() + 1)
    }
    
    onSetAlarm(alarmDate.getTime())
  }

  const isValidTime = () => {
    const h = parseInt(hours)
    const m = parseInt(minutes)
    return !isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="grid-border p-6">
          <div className="text-xs uppercase tracking-widest mb-4 opacity-50">
            [SET ALARM]
          </div>
          
          <div className="text-sm mb-6 grid-border p-3 max-h-24 overflow-auto">
            <span className="opacity-50">TRANSCRIPT: </span>
            {transcript}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs uppercase tracking-widest block mb-2">
                [HOUR]
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="00"
                className="w-full grid-border p-3 text-2xl text-center bg-background text-foreground focus:bg-foreground focus:text-background outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-2">
                [MINUTE]
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="00"
                className="w-full grid-border p-3 text-2xl text-center bg-background text-foreground focus:bg-foreground focus:text-background outline-none"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onCancel}
              className="grid-border p-3 text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              [SKIP]
            </button>
            <button
              onClick={handleSetAlarm}
              disabled={!isValidTime()}
              className="grid-border p-3 text-sm uppercase tracking-widest bg-foreground text-background hover:bg-background hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              [SET]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
