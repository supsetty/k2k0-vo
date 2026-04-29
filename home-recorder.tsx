'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { RecordingEntry } from '@/lib/types'
import { AlarmConfig } from './alarm-config'
import { GoogleCalendarConnect } from './google-calendar-connect'

interface HomeRecorderProps {
  onRecordingComplete: (entry: RecordingEntry) => void
  onSetAlarm: (config: { id: string; time: number; transcript: string; audioUrl: string | null }) => void
}

// Extend Window interface for webkitSpeechRecognition
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
}

export function HomeRecorder({ onRecordingComplete, onSetAlarm }: HomeRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [lastRecording, setLastRecording] = useState<RecordingEntry | null>(null)
  const [showAlarmConfig, setShowAlarmConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt' | 'unavailable'>('unknown')
  
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isRecordingRef = useRef(false)
  const transcriptRef = useRef('')
  const interimTranscriptRef = useRef('')
  
  // Check microphone permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionStatus('unavailable')
          setError('Microphone API not available. Try opening in a new tab or deploying the app.')
          return
        }
        
        // Try to query permission status
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
            setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
            
            result.onchange = () => {
              setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
            }
          } catch {
            // Permission query not supported, status remains unknown
            setPermissionStatus('unknown')
          }
        }
      } catch (err) {
        console.error('[v0] Permission check error:', err)
        setPermissionStatus('unknown')
      }
    }
    
    checkPermission()
  }, [])
  
  const requestMicrophonePermission = async () => {
    setError(null)
    
    // Check if mediaDevices API exists
    if (!navigator.mediaDevices) {
      setError('DEBUG: navigator.mediaDevices is undefined. This browser/context does not support media devices.')
      setPermissionStatus('unavailable')
      return
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      setError('DEBUG: navigator.mediaDevices.getUserMedia is undefined.')
      setPermissionStatus('unavailable')
      return
    }
    
    try {
      setError('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Permission granted, stop the stream immediately
      stream.getTracks().forEach(track => track.stop())
      setPermissionStatus('granted')
      setError(null)
    } catch (err) {
      // Show full error details for debugging
      const errorDetails = err instanceof Error 
        ? `Name: ${err.name} | Message: ${err.message}` 
        : String(err)
      setError(`DEBUG: ${errorDetails}`)
      
      if (err instanceof Error) {
        if (err.name === 'NotFoundError') {
          setPermissionStatus('unavailable')
        } else if (err.name === 'NotAllowedError') {
          setPermissionStatus('denied')
        }
      }
    }
  }

  function createSpeechRecognition() {
    const SpeechRecognition = (window as typeof window & { 
      SpeechRecognition?: new () => SpeechRecognition
      webkitSpeechRecognition?: new () => SpeechRecognition 
    }).SpeechRecognition || (window as typeof window & { 
      SpeechRecognition?: new () => SpeechRecognition
      webkitSpeechRecognition?: new () => SpeechRecognition 
    }).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      return null
    }
    
    return new SpeechRecognition()
  }

  const stopRecording = useCallback(() => {
    console.log('[v0] stopRecording called')
    isRecordingRef.current = false
    setIsRecording(false)
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = async () => {
    console.log('[v0] startRecording called')
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    transcriptRef.current = ''
    interimTranscriptRef.current = ''
    audioChunksRef.current = []
    
    // First, request microphone permission
    let stream: MediaStream
    try {
      console.log('[v0] Requesting microphone permission...')
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('[v0] Microphone permission granted')
    } catch (err) {
      console.error('[v0] Microphone access error:', err)
      setError('Microphone access denied. Please allow microphone access in your browser settings.')
      return
    }
    
    // Initialize Speech Recognition
    const recognition = createSpeechRecognition()
    
    if (!recognition) {
      setError('Speech recognition not supported in this browser. Try Chrome or Edge.')
      stream.getTracks().forEach(track => track.stop())
      return
    }
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      
      if (final) {
        transcriptRef.current += final
        setTranscript(transcriptRef.current)
      }
      interimTranscriptRef.current = interim
      setInterimTranscript(interim)
    }
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[v0] Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied for speech recognition.')
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Recognition error: ${event.error}`)
      }
    }
    
    recognition.onend = () => {
      console.log('[v0] Speech recognition ended, isRecordingRef:', isRecordingRef.current)
      if (isRecordingRef.current) {
        // Restart if still recording (browser may auto-stop after silence)
        try {
          recognition.start()
          console.log('[v0] Speech recognition restarted')
        } catch (e) {
          console.log('[v0] Could not restart recognition:', e)
        }
      }
    }
    
    recognitionRef.current = recognition
    
    // Initialize MediaRecorder for audio capture
    const mediaRecorder = new MediaRecorder(stream)
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      console.log('[v0] MediaRecorder stopped')
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop())
      
      // Create recording entry using refs for current values
      const finalTranscript = transcriptRef.current || interimTranscriptRef.current || '[No speech detected]'
      
      const entry: RecordingEntry = {
        id: Date.now().toString(),
        transcript: finalTranscript,
        audioUrl,
        timestamp: Date.now(),
        alarmTime: null,
        alarmTriggered: false
      }
      
      console.log('[v0] Recording entry created:', entry)
      setLastRecording(entry)
      onRecordingComplete(entry)
      setShowAlarmConfig(true)
    }
    
    mediaRecorderRef.current = mediaRecorder
    
    // Start both
    try {
      recognition.start()
      console.log('[v0] Speech recognition started')
    } catch (e) {
      console.error('[v0] Failed to start speech recognition:', e)
      setError('Failed to start speech recognition. Please try again.')
      stream.getTracks().forEach(track => track.stop())
      return
    }
    
    mediaRecorder.start()
    console.log('[v0] MediaRecorder started')
    isRecordingRef.current = true
    setIsRecording(true)
  }

  const handleAlarmSet = (time: number) => {
    if (lastRecording) {
      onSetAlarm({
        id: lastRecording.id,
        time,
        transcript: lastRecording.transcript,
        audioUrl: lastRecording.audioUrl
      })
    }
    setShowAlarmConfig(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="grid grid-rows-[1fr_auto_1fr] min-h-[calc(100vh-57px)]">
      {/* Top Grid Cell - Google Calendar */}
      <div className="grid-border-b p-4 flex items-center justify-center">
        <GoogleCalendarConnect />
      </div>
      
      {/* Center Grid Cell - Record Button */}
      <div className="grid-border-b p-8 flex flex-col items-center justify-center gap-4">
        {/* Permission Status Indicator */}
        <div className="text-xs uppercase tracking-widest">
          {permissionStatus === 'unknown' && '[MIC: CHECKING...]'}
          {permissionStatus === 'granted' && '[MIC: READY]'}
          {permissionStatus === 'denied' && '[MIC: BLOCKED]'}
          {permissionStatus === 'prompt' && '[MIC: NEEDS PERMISSION]'}
          {permissionStatus === 'unavailable' && '[MIC: UNAVAILABLE]'}
        </div>
        
        {/* Show permission request button if not granted */}
        {(permissionStatus === 'prompt' || permissionStatus === 'unknown' || permissionStatus === 'denied' || permissionStatus === 'unavailable') && !isRecording && (
          <button
            onClick={requestMicrophonePermission}
            className="px-4 py-2 grid-border text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
          >
            [GRANT MIC ACCESS]
          </button>
        )}
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={permissionStatus === 'unavailable'}
          className={`w-48 h-48 grid-border text-lg uppercase tracking-widest transition-all ${
            isRecording 
              ? 'bg-foreground text-background animate-pulse-record' 
              : permissionStatus === 'unavailable'
                ? 'bg-background text-foreground opacity-50 cursor-not-allowed'
                : 'bg-background text-foreground hover:bg-foreground hover:text-background'
          }`}
        >
          {isRecording ? '[STOP]' : '[REC]'}
        </button>
        
        {permissionStatus === 'unavailable' && (
          <div className="text-xs uppercase tracking-widest text-center max-w-xs opacity-70">
            Open this app in a new browser tab to use the microphone
          </div>
        )}
      </div>
      
      {/* Bottom Grid Cell - Transcription Output */}
      <div className="p-4 overflow-auto">
        <div className="grid-border p-4 min-h-[200px]">
          <div className="text-xs uppercase tracking-widest mb-2 opacity-50">
            [TRANSCRIPTION OUTPUT]
          </div>
          
          {error && (
            <div className="text-sm mb-2 p-2 grid-border bg-foreground text-background">
              ERROR: {error}
            </div>
          )}
          
          <div className="text-sm leading-relaxed">
            {transcript}
            <span className="opacity-50">{interimTranscript}</span>
            {!transcript && !interimTranscript && !isRecording && (
              <span className="opacity-30">Waiting for input...</span>
            )}
            {isRecording && !transcript && !interimTranscript && (
              <span className="opacity-50">Listening...</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Alarm Configuration Overlay */}
      {showAlarmConfig && lastRecording && (
        <AlarmConfig
          transcript={lastRecording.transcript}
          onSetAlarm={handleAlarmSet}
          onCancel={() => setShowAlarmConfig(false)}
        />
      )}
    </div>
  )
}
