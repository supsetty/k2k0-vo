// Web Worker for alarm monitoring
let alarms = []
let checkInterval = null

function checkAlarms() {
  const now = Date.now()
  
  alarms.forEach(alarm => {
    if (!alarm.triggered && alarm.time <= now) {
      alarm.triggered = true
      self.postMessage({
        type: 'ALARM_TRIGGERED',
        payload: {
          id: alarm.id,
          transcript: alarm.transcript,
          audioUrl: alarm.audioUrl
        }
      })
    }
  })
  
  // Remove triggered alarms
  alarms = alarms.filter(alarm => !alarm.triggered)
  
  // Stop checking if no alarms left
  if (alarms.length === 0 && checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

self.onmessage = function(e) {
  const { type, payload } = e.data
  
  switch (type) {
    case 'SET_ALARM':
      alarms.push({
        id: payload.id,
        time: payload.time,
        transcript: payload.transcript,
        audioUrl: payload.audioUrl,
        triggered: false
      })
      
      // Start checking if not already
      if (!checkInterval) {
        checkInterval = setInterval(checkAlarms, 1000)
      }
      
      self.postMessage({
        type: 'ALARM_SET',
        payload: { id: payload.id, time: payload.time }
      })
      break
      
    case 'SNOOZE_ALARM':
      // Add 9 minutes to the alarm
      const snoozeTime = Date.now() + (9 * 60 * 1000)
      alarms.push({
        id: payload.id,
        time: snoozeTime,
        transcript: payload.transcript,
        audioUrl: payload.audioUrl,
        triggered: false
      })
      
      if (!checkInterval) {
        checkInterval = setInterval(checkAlarms, 1000)
      }
      
      self.postMessage({
        type: 'ALARM_SNOOZED',
        payload: { id: payload.id, time: snoozeTime }
      })
      break
      
    case 'CANCEL_ALARM':
      alarms = alarms.filter(alarm => alarm.id !== payload.id)
      self.postMessage({
        type: 'ALARM_CANCELLED',
        payload: { id: payload.id }
      })
      break
      
    case 'GET_ALARMS':
      self.postMessage({
        type: 'ALARMS_LIST',
        payload: alarms
      })
      break
  }
}
