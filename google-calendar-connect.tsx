'use client'

import { useState } from 'react'

// Mock function for Google Calendar sync (placeholder)
export function syncToGoogleCalendar(transcript: string, alarmTime: number) {
  console.log('[v0] syncToGoogleCalendar called:', { transcript, alarmTime })
  console.log('[v0] Would create calendar event:', {
    title: transcript.substring(0, 50) + (transcript.length > 50 ? '...' : ''),
    start: new Date(alarmTime).toISOString(),
    end: new Date(alarmTime + 30 * 60 * 1000).toISOString(), // 30 min duration
    description: transcript
  })
  return Promise.resolve({ success: true, eventId: 'mock-event-' + Date.now() })
}

export function GoogleCalendarConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    
    // Simulate OAuth flow delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsConnected(true)
    setIsConnecting(false)
    
    console.log('[v0] Google Calendar connected (simulated)')
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    console.log('[v0] Google Calendar disconnected (simulated)')
  }

  return (
    <div className="grid-border p-4 w-full max-w-md">
      <div className="text-xs uppercase tracking-widest mb-3 opacity-50">
        [GOOGLE CALENDAR]
      </div>
      
      {isConnected ? (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="opacity-50">STATUS: </span>
            <span className="text-foreground">CONNECTED</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="grid-border px-3 py-1 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            [DISCONNECT]
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full grid-border p-3 text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
        >
          {isConnecting ? '[CONNECTING...]' : '[CONNECT MY UK GOOGLE CALENDAR]'}
        </button>
      )}
    </div>
  )
}
