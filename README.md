# VerifAI — AI-Powered Fact-Checking Chrome Extension

> **Instantly verify claims on any webpage using AI + live web search.**

![VerifAI Banner](extension/public/img1.png)

---

## What is VerifAI?

VerifAI is a Chrome extension that lets you fact-check any claim or headline on the web in real time. Click the extension icon, hit **Verify This Page**, and within seconds you get a verdict backed by live sources — powered by Google Gemini and Tavily Search.

No more manually Googling headlines. No more falling for misinformation. VerifAI does the work for you.

---

## Features

- 🔍 **One-click fact-checking** — verify any page instantly from the popup
- 🤖 **AI-powered analysis** — uses Google Gemini 2.5 Flash to reason over claims
- 🌐 **Live web search** — Tavily Search finds real-time sources to back the verdict
- ✅ **Clear verdicts** — TRUE / FALSE / MISLEADING / UNVERIFIED with explanations
- 📰 **Source links** — see exactly which sources were used
- ⏱️ **Progress indicators** — live timer and status messages so it never feels frozen
- ❌ **Cancel anytime** — cancel mid-analysis or go back with one click

---

## Screenshots

<p align="center">
  <img src="extension/public/img1.png" width="280" alt="VerifAI Popup"/>
  &nbsp;&nbsp;
  <img src="extension/public/img2.png" width="280" alt="VerifAI Analyzing"/>
  &nbsp;&nbsp;
  <img src="extension/public/img3.png" width="280" alt="VerifAI Result"/>
</p>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension | React + TypeScript + Vite |
| Backend | Cloudflare Workers |
| AI Model | Google Gemini 2.5 Flash |
| Web Search | Tavily Search API |
| Styling | CSS Modules |
| Package Manager | pnpm |

---

## Project Structure

```
VerifAI/
├── extension/               # Chrome extension (React + Vite)
│   ├── src/
│   │   ├── popup/           # Main popup UI
│   │   └── background/      # Service worker
│   ├── manifest.json
│   └── vite.config.ts
│
└── backend/                 # Cloudflare Workers API
    ├── src/
    │   └── index.ts         # Main worker — Gemini + Tavily logic
    └── wrangler.toml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Cloudflare account
- Google Gemini API key
- Tavily API key

### 1. Clone the repo

```bash
git clone https://github.com/cryosleeperX20/VerifAI.git
cd VerifAI
```

### 2. Set up the backend

```bash
cd backend
pnpm install
```

Create a `.dev.vars` file in the `backend/` folder:

```
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

Start the local backend:

```bash
pnpm dev
```

You should see: `Ready on http://127.0.0.1:8787`

### 3. Build the extension

```bash
cd ../extension
pnpm install
pnpm build
```

### 4. Load in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/dist` folder

---

## Usage

1. Navigate to any webpage with a news article or claim
2. Click the **VerifAI** icon in your Chrome toolbar
3. Hit **VERIFY THIS PAGE**
4. Wait 20–35 seconds while VerifAI searches and analyzes
5. Read the verdict and check the sources

---

## Deployment

To deploy the backend to Cloudflare Workers:

```bash
cd backend
wrangler secret put GEMINI_API_KEY
wrangler secret put TAVILY_API_KEY
wrangler deploy
```

Then update the API endpoint in the extension to point to your deployed worker URL.

---

## API Keys

| Service | Free Tier | Get Key |
|---|---|---|
| Google Gemini | ✅ Yes | [aistudio.google.com](https://aistudio.google.com) |
| Tavily Search | ✅ Yes | [tavily.com](https://tavily.com) |
| Cloudflare Workers | ✅ Yes | [cloudflare.com](https://cloudflare.com) |

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

---

<p align="center">Built with ❤️ to fight misinformation</p>
