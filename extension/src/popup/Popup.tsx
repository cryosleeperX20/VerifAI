import { useEffect, useState, useRef } from 'react'
import { VerificationResponse } from '../types'

interface PopupState {
  isLoading: boolean
  result: VerificationResponse | null
  error: string | null
}

function VerdictBadge({ valid }: { valid: boolean }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 4,
        background: valid ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${valid ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
        color: valid ? '#22c55e' : '#ef4444',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'monospace',
        letterSpacing: '0.07em',
      }}
    >
      <span style={{ fontSize: 8 }}>●</span>
      {valid ? 'VERIFIED' : 'MISINFORMATION'}
    </div>
  )
}

function ResultCard({ result }: { result: VerificationResponse }) {
  const [showAnalysis, setShowAnalysis] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={styles.section}>
        <div style={styles.sectionLabel}>CLAIM DETECTED</div>
        <p style={{ margin: 0, fontSize: 13, color: '#e5e7eb', lineHeight: 1.5 }}>
          {result.claim}
        </p>
      </div>

      <VerdictBadge valid={result.validity} />

      <div style={styles.section}>
        <div style={styles.sectionLabel}>SUMMARY</div>
        <p style={{ margin: 0, fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>
          {result.summary}
        </p>
      </div>

      <button onClick={() => setShowAnalysis((p) => !p)} style={styles.toggleBtn}>
        {showAnalysis ? '▲' : '▼'} DETAILED ANALYSIS
      </button>
      {showAnalysis && (
        <div style={{ ...styles.section, background: '#0f172a' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {result.analysis}
          </p>
        </div>
      )}
    </div>
  )
}

function LoadingSpinner({ elapsed, onCancel }: { elapsed: number; onCancel: () => void }) {
  const messages = [
    'Capturing page...',
    'Extracting claim...',
    'Searching the web...',
    'Verifying sources...',
    'Almost there...',
  ]
  const msgIndex = Math.min(Math.floor(elapsed / 6), messages.length - 1)

  return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div style={styles.spinner} />
      <p style={{ margin: '12px 0 4px', fontSize: 11, color: '#6b7280', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
        {messages[msgIndex]}
      </p>
      <p style={{ margin: '0 0 16px', fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>
        {elapsed}s
      </p>
      <button onClick={onCancel} style={styles.cancelBtn}>
        ✕ CANCEL
      </button>
    </div>
  )
}

export default function Popup() {
  const [state, setState] = useState<PopupState>({
    isLoading: false,
    result: null,
    error: null,
  })
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setElapsed(0)
  }

  const stopPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  useEffect(() => {
    const load = async () => {
      const data = await chrome.storage.local.get(['popupState'])
      if (data.popupState) {
        const s = data.popupState as PopupState
        setState(s)
        if (!s.isLoading) stopTimer()
      }
    }

    load()
    pollRef.current = setInterval(load, 800)
    return () => stopPoll()
  }, [])

  const handleVerify = async () => {
    const next: PopupState = { isLoading: true, result: null, error: null }
    setState(next)
    setElapsed(0)
    await chrome.storage.local.set({ popupState: next })

    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)

    try {
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' })

      if (response?.error) {
        const error = response.error as string
        const errState: PopupState = { isLoading: false, result: null, error }
        setState(errState)
        await chrome.storage.local.set({ popupState: errState })
        stopTimer()
        return
      }

      if (response?.imageData) {
        chrome.runtime.sendMessage({ type: 'CAPTURE_COMPLETE', imageData: response.imageData })
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to capture screenshot'
      const errState: PopupState = { isLoading: false, result: null, error }
      setState(errState)
      stopTimer()
    }
  }

  const handleCancel = async () => {
    stopTimer()
    stopPoll()
    const cancelled: PopupState = { isLoading: false, result: null, error: null }
    setState(cancelled)
    await chrome.storage.local.set({ popupState: cancelled })
    // Restart polling
    pollRef.current = setInterval(async () => {
      const data = await chrome.storage.local.get(['popupState'])
      if (data.popupState) setState(data.popupState as PopupState)
    }, 800)
  }

  const handleReset = async () => {
    const reset: PopupState = { isLoading: false, result: null, error: null }
    setState(reset)
    await chrome.storage.local.set({ popupState: reset })
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          {(state.result || state.error) && (
            <button onClick={handleReset} style={styles.backBtn} title="Back">
              ←
            </button>
          )}
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>VerifAI</span>
        </div>
        <div style={styles.headerLine} />
      </div>

      {/* Content */}
      <div style={styles.content}>
        {!state.isLoading && !state.result && !state.error && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>◈</div>
            <p style={styles.emptyText}>
              Capture the visible tab to fact-check any claim, headline, or social post.
            </p>
          </div>
        )}

        {state.isLoading && (
          <LoadingSpinner elapsed={elapsed} onCancel={handleCancel} />
        )}

        {state.error && !state.isLoading && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#ef4444' }}>✕ ERROR</span>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>
              {state.error}
            </p>
          </div>
        )}

        {state.result && !state.isLoading && <ResultCard result={state.result} />}
      </div>

      {/* Footer */}
      {!state.isLoading && (
        <div style={styles.footer}>
          <button
            onClick={handleVerify}
            style={{ ...styles.verifyBtn, cursor: 'pointer' }}
          >
            {state.result || state.error ? '↺  VERIFY AGAIN' : '◉  VERIFY THIS PAGE'}
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    background: '#0a0f1a',
    color: '#e5e7eb',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '14px 16px 0',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: 16,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  logoIcon: {
    fontSize: 18,
    color: '#3b82f6',
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f9fafb',
    letterSpacing: '0.1em',
    fontFamily: 'monospace',
  },
  headerLine: {
    height: 1,
    background: 'linear-gradient(to right, #1e3a5f, transparent)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #1e293b',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '28px 16px',
  },
  emptyIcon: {
    fontSize: 30,
    color: '#1e3a5f',
    marginBottom: 12,
  },
  emptyText: {
    margin: 0,
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 1.6,
  },
  verifyBtn: {
    width: '100%',
    padding: '11px',
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'monospace',
    letterSpacing: '0.08em',
    transition: 'background 0.15s',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid #374151',
    borderRadius: 4,
    color: '#6b7280',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: '0.08em',
    padding: '6px 16px',
    cursor: 'pointer',
  },
  section: {
    background: '#111827',
    borderRadius: 6,
    padding: '10px 12px',
    border: '1px solid #1e293b',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#4b5563',
    letterSpacing: '0.1em',
    marginBottom: 6,
  },
  toggleBtn: {
    background: 'none',
    border: '1px solid #1e293b',
    borderRadius: 4,
    color: '#4b5563',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: '0.08em',
    padding: '6px 10px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 6,
    padding: '10px 12px',
  },
  spinner: {
    width: 26,
    height: 26,
    border: '2px solid #1e293b',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
}