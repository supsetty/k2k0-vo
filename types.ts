export interface RecordingEntry {
  id: string
  transcript: string
  audioUrl: string | null
  timestamp: number
  alarmTime: number | null
  alarmTriggered: boolean
}

export interface AlarmConfig {
  recordingId: string
  time: number
  transcript: string
  audioUrl: string | null
}

export type ActiveSection = 'home' | 'history'
