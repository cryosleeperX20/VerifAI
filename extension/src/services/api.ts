import { VerificationResponse } from '../types'

const API_BASE_URL = 'http://localhost:8787'

export async function verifyImage(imageBlob: Blob): Promise<VerificationResponse> {
  const formData = new FormData()
  formData.append('image', imageBlob, 'screenshot.jpg')

  const res = await fetch(`${API_BASE_URL}/verify-new`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error(`API request failed: ${res.statusText}`)

  return res.json() as Promise<VerificationResponse>
}

export function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new Blob([bytes], { type: mime })
}