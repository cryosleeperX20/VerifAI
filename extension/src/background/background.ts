import { HistoryEntry, VerificationResponse } from '../types'

const API_URL = 'http://localhost:8787/verify-new'
const TIMEOUT_MS = 60000

chrome.runtime.onInstalled.addListener(() => {})

function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

async function verifyImage(blob: Blob): Promise<VerificationResponse> {
  const form = new FormData()
  form.append('image', blob, 'screenshot.jpg')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`API error: ${res.statusText}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function setState(state: object) {
  await chrome.storage.local.set({ popupState: state })
}

async function saveToHistory(result: VerificationResponse) {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    claim: result.claim,
    validity: result.validity,
    confidence: result.confidence,
    summary: result.summary,
    analysis: result.analysis,
    sources: result.sources,
  }

  const data = await chrome.storage.local.get(['history'])
  const history: HistoryEntry[] = data.history ?? []

  const updated = [entry, ...history].slice(0, 50)
  await chrome.storage.local.set({ history: updated })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab({ format: 'jpeg', quality: 90 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message })
      } else {
        sendResponse({ imageData: dataUrl })
      }
    })
    return true
  }

  if (message.type === 'CAPTURE_COMPLETE' && message.imageData) {
    ;(async () => {
      await setState({ isLoading: true, result: null, error: null })

      try {
        const blob = dataURLtoBlob(message.imageData)
        const result = await verifyImage(blob)

        await saveToHistory(result)
        await setState({ isLoading: false, result, error: null })
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to verify image'
        await setState({ isLoading: false, result: null, error })
      }
    })()
  }

  if (message.type === 'CAPTURE_ERROR') {
    setState({
      isLoading: false,
      result: null,
      error: message.error ?? 'Failed to capture screenshot',
    })
  }
})