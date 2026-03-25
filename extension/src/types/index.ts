export interface Source {
  index: number
  title: string
  url: string
  snippet: string
}

export interface VerificationResponse {
  question: string
  claim: string
  validity: boolean
  confidence: number
  summary: string
  analysis: string
  sources: Source[]
}

export interface CaptureMessage {
  type: 'START_CAPTURE' | 'CAPTURE_COMPLETE' | 'CAPTURE_ERROR' | 'CAPTURE_SCREENSHOT'
  imageData?: string
  error?: string
}

export interface VerificationState {
  isLoading: boolean
  result: VerificationResponse | null
  error: string | null
}

export interface HistoryEntry {
  id: string
  timestamp: number
  claim: string
  validity: boolean
  confidence: number
  summary: string
  analysis: string
  sources: Source[]
}