import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { encodeBase64 } from 'hono/utils/encode'
import { GoogleGenAI } from '@google/genai'
import { tavily } from '@tavily/core'

const app = new Hono<{
  Bindings: {
    GOOGLE_API_KEY: string
    TAVILY_API_KEY: string
  }
}>()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/', (c) => c.text('VerifAI API'))

app.post('/verify-new', async (c) => {
  const genai = new GoogleGenAI({ apiKey: c.env.GOOGLE_API_KEY })
  const tavilyClient = tavily({ apiKey: c.env.TAVILY_API_KEY })

  const formData = await c.req.formData()
  const file = formData.get('image')

  if (!file) return c.json({ error: 'No image uploaded' }, 400)

  const base64Image = encodeBase64(await file.arrayBuffer())

  // Step 1: Extract the core claim from the screenshot
  const extractionRes = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      {
        text: `You are an information extraction assistant.

Given an image (such as a social media post or screenshot), do the following:
1. Identify the main claim or statement being made. Ignore metadata like usernames, dates, likes, retweets, and engagement metrics.
2. Extract ONLY the core factual claim or assertion.
3. Rephrase that claim into a clear, neutral factual question suitable for a web search.
4. Return ONLY this JSON (no markdown):

{
  "extracted_claim": "<core claim text only>",
  "question": "<rephrased factual question, self-contained with no references to 'this post' or 'the image'>"
}`,
      },
    ],
  })

  const extractionText = (extractionRes.text ?? '').replace(/```json\n?|```\n?/g, '').trim()
  const { extracted_claim: claim, question } = JSON.parse(extractionText)

  // Step 2: Search the web for evidence
  const searchResults = await tavilyClient.search(question, {
    includeAnswers: true,
    maxResults: 6,
  })

  const sources = searchResults.results.map((r, i) => ({
    index: i + 1,
    title: r.title,
    url: r.url,
    snippet: r.content,
  }))

  const evidence = sources
    .map((s) => `[${s.index}] ${s.title}\n${s.snippet}\nSource: ${s.url}`)
    .join('\n\n')

  // Step 3: Verify the claim against the evidence
  const verificationRes = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        text: `You are a professional fact-checking assistant. Verify the following claim against the provided evidence.

CLAIM:
${claim}

EVIDENCE:
${evidence}

TAVILY SUMMARY:
${searchResults.answer ?? 'No summary available'}

INSTRUCTIONS:
- Carefully analyze the claim against the evidence.
- Determine if the claim is factually correct or misinformation.
- Assign a confidence score from 0 to 100 (100 = completely verified, 0 = completely false, 50 = uncertain/mixed).
- Write a short summary (1-2 sentences max) of your verdict.
- Write a detailed analysis explaining your reasoning, citing sources by their index numbers like [1], [2], etc.
- Return ONLY this JSON (no markdown):

{
  "validity": true or false,
  "confidence": <number 0-100>,
  "summary": "<1-2 sentence verdict summary>",
  "analysis": "<detailed explanation with source citations like [1], [2]>"
}`,
      },
    ],
  })

  const verificationText = (verificationRes.text ?? '').replace(/```json\n?|```\n?/g, '').trim()
  const { validity, confidence, summary, analysis } = JSON.parse(verificationText)

  return c.json({
    question,
    claim,
    validity,
    confidence,
    summary,
    analysis,
    sources,
  })
})

export default app