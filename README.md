# Vinterview – AI-Powered Mock Interviewer

A production-ready AI interview practice app built with Next.js 16, featuring:

- 🤖 **DeepSeek AI** via OpenRouter – intelligent interview questions & follow-ups
- 🎙️ **ElevenLabs TTS** – realistic female voice (Rachel) reads interviewer responses aloud
- 🗣️ **Browser SpeechRecognition** – speak your answers hands-free
- 🧊 **3D Avatar** – animated interviewer (three.js / React Three Fiber) synced to audio
- 🌐 **Multilingual** – English, Sinhala, Tamil
- 🗄️ **Supabase** – full transcript & summary persistence

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd vinterview
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your app URL (default: `http://localhost:3000`) |
| `OPENROUTER_API_KEY` | Get one at [openrouter.ai/keys](https://openrouter.ai/keys) |
| `NEXT_PUBLIC_SUPABASE_URL` | From your Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (never expose to browser) |
| `ELEVENLABS_API_KEY` | Get one at [elevenlabs.io](https://elevenlabs.io/app/settings/api-keys) |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID (default: Rachel) |

### 3. Set up the Supabase database

1. Open your Supabase project → SQL Editor
2. Paste the contents of `public/schema.sql` and run it

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Start Interview**.

---

## How to Change the Voice

The default voice is **Rachel** (voice ID: `21m00Tcm4TlvDq8ikWAM`), a calm, professional female voice provided by ElevenLabs.

To change the voice:

1. Browse voices at [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library) or in the ElevenLabs dashboard
2. Copy the **Voice ID** of your chosen voice
3. Set it in `.env.local`:

```bash
ELEVENLABS_VOICE_ID=<your-voice-id>
```

You can also adjust voice characteristics in `src/lib/speech/elevenlabs.ts`:

```ts
voice_settings: {
  stability: 0.5,         // 0–1: lower = more expressive, higher = more consistent
  similarity_boost: 0.75, // 0–1: how closely to match the original voice
  style: 0.0,             // 0–1: speaking style intensity (ElevenLabs v2)
  use_speaker_boost: true,
}
```

---

## How to Update the Avatar

The app includes a procedurally-generated 3D head as a fallback. To use a custom GLB avatar:

1. Create a free avatar at [readyplayer.me](https://readyplayer.me)
2. Export as `.glb`
3. Place the file at `public/avatar.glb`

The avatar will automatically load. If the file is missing, the built-in head renders instead.

To adjust the avatar camera / position, edit `src/components/avatar/Avatar3D.tsx`.

---

## Architecture

```
src/
├── app/                  # Next.js App Router
│   ├── (marketing)/      # Landing page
│   ├── (app)/chat/       # Interview UI
│   └── api/
│       ├── chat/         # AI chat endpoint (OpenRouter → DeepSeek)
│       ├── tts/          # ElevenLabs TTS proxy
│       ├── summary/      # Post-interview AI summary
│       └── transcript/   # Transcript CRUD
├── components/
│   ├── avatar/           # 3D avatar (three.js)
│   ├── chat/             # Chat UI + message bubbles
│   └── layout/           # Navbar, Footer
├── features/
│   ├── interview/        # State (useInterviewStore), service, types
│   ├── summary/          # Summary generation service
│   └── transcript/       # Transcript persistence (Supabase)
├── lib/
│   ├── ai/               # OpenRouter/OpenAI client + prompts
│   ├── db/               # Supabase client
│   ├── speech/           # ElevenLabs TTS + speechToText utils
│   ├── i18n/             # Locale config + detection
│   └── utils/            # Helpers
├── messages/             # i18n strings (en, si, ta)
└── types/                # Shared TypeScript types
```

---

## Production Deployment

```bash
npm run build
npm start
```

Or deploy to [Vercel](https://vercel.com) – set the same environment variables in your project settings.

