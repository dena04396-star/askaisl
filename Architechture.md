ai-interviewer/
│
├── public/                     # static assets
│
├── src/
│   ├── app/                   # App Router (UI + API)
│   │
│   │   ├── (marketing)/       # Landing pages
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │
│   │   ├── (app)/             # Authenticated app
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx   # Interview UI
│   │   │   │   ├── loading.tsx
│   │   │   │   └── error.tsx
│   │   │   │
│   │   │   ├── dashboard/     # Admin panel (later)
│   │   │   │   ├── page.tsx
│   │   │
│   │   ├── api/               # Backend routes
│   │   │   ├── chat/route.ts
│   │   │   ├── summary/route.ts
│   │   │   ├── transcript/route.ts
│   │   │   ├── auth/route.ts
│   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── providers.tsx      # global providers (theme, i18n, etc.)
│
│   ├── components/            # reusable UI components
│   │   ├── ui/                # buttons, inputs, cards
│   │   ├── chat/              # chat bubbles, input, mic btn
│   │   ├── layout/            # navbar, footer
│   │
│   ├── features/              # domain logic (VERY IMPORTANT)
│   │   ├── interview/
│   │   │   ├── interview.service.ts
│   │   │   ├── interview.types.ts
│   │   │   ├── interview.store.ts   # state logic
│   │   │
│   │   ├── transcript/
│   │   │   ├── transcript.service.ts
│   │   │
│   │   ├── summary/
│   │   │   ├── summary.service.ts
│   │
│   │   ├── user/
│   │       ├── user.service.ts
│
│   ├── lib/                   # core utilities
│   │   ├── ai/
│   │   │   ├── openai.ts
│   │   │   ├── prompts.ts
│   │   │   ├── interviewer.ts   # main AI logic
│   │   │
│   │   ├── db/
│   │   │   ├── client.ts        # db connection
│   │   │
│   │   ├── speech/
│   │   │   ├── speechToText.ts
│   │   │   ├── textToSpeech.ts
│   │   │
│   │   ├── i18n/
│   │   │   ├── config.ts
│   │   │   ├── getLocale.ts
│   │   │
│   │   ├── utils/
│   │       ├── helpers.ts
│
│   ├── messages/              # translations
│   │   ├── en.json
│   │   ├── si.json
│   │   ├── ta.json
│
│   ├── types/                 # global TS types
│   │   ├── index.ts
│
│   └── styles/
│       ├── globals.css
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
