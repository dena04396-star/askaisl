import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vinterview – AI Consumer Research Interviews · Sri Lanka",
  description:
    "Meet Mrs Dissanayake — your AI market research interviewer for Sri Lankan FMCG insights. Structured interviews, instant summaries, trilingual support.",
};

/* ─── Static data ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "🎙️",
    title: "Adaptive Interviewing",
    desc: "Mrs Dissanayake follows a structured discussion guide and probes deeper based on every response — just like a real moderator.",
  },
  {
    icon: "🔊",
    title: "Voice In & Out",
    desc: "Push-to-talk voice input + ElevenLabs text-to-speech. Respondents speak naturally; the AI listens and responds in kind.",
  },
  {
    icon: "📋",
    title: "Auto Research Reports",
    desc: "Every session ends with an AI-generated report: key themes, pain points, behavioural patterns, and verbatim quotes.",
  },
  {
    icon: "🌐",
    title: "Trilingual Support",
    desc: "Conducts interviews in English, Sinhala (සිංහල), and Tamil (தமிழ்) — meeting respondents in their natural language.",
  },
  {
    icon: "📊",
    title: "Dashboard & History",
    desc: "Every transcript is saved. Browse past sessions, review full conversations, and track themes across multiple respondents.",
  },
  {
    icon: "⬇️",
    title: "Export Ready",
    desc: "Download transcripts as CSV — opens directly in Excel. Copy summaries to paste into reports in seconds.",
  },
];

const STUDY_TYPES = [
  { icon: "🔄", label: "Behavioral Insights",  desc: "Habits, usage occasions & daily routines" },
  { icon: "🧭", label: "Decision Journey",      desc: "Why they choose one brand over another" },
  { icon: "⚡", label: "Pain Points",            desc: "Frustrations, workarounds & unmet needs" },
  { icon: "🎯", label: "Perception Tracking",   desc: "Brand image, trust & quality associations" },
  { icon: "💡", label: "Concept Testing",        desc: "Authentic reactions to new product ideas" },
];

const STEPS = [
  {
    num: "01",
    title: "Configure your study",
    body: "Choose product category, study type, and language. Add optional respondent details — name, age, gender, district.",
  },
  {
    num: "02",
    title: "AI runs the interview",
    body: "Mrs Dissanayake introduces herself, builds rapport, and follows the discussion guide — one probing question at a time.",
  },
  {
    num: "03",
    title: "Receive research-grade insights",
    body: "A structured report is generated automatically: behavioural patterns, brand perceptions, pain points, and key quotes.",
  },
];

const STATS = [
  { value: "5",  unit: "Study types",       sub: "Behavioral to concept testing" },
  { value: "3",  unit: "Languages",          sub: "English · Sinhala · Tamil" },
  { value: "∞",  unit: "Sessions",           sub: "All saved, exportable" },
  { value: "1",  unit: "Click to export",    sub: "CSV straight into Excel" },
];

const FAQS = [
  {
    q: "Do respondents need to download anything?",
    a: "No. Vinterview runs entirely in the browser. Respondents just visit the link — no app, no signup required.",
  },
  {
    q: "How does voice input work?",
    a: "Push-to-talk via the microphone button. The browser's speech recognition transcribes the answer. Mrs Dissanayake then responds via ElevenLabs text-to-speech.",
  },
  {
    q: "Can I use my own discussion guide?",
    a: "Yes — you select the product category and study type at the start of each session. Mrs Dissanayake adapts her entire interview approach accordingly.",
  },
  {
    q: "What languages are supported?",
    a: "English, Sinhala (සිංහල), and Tamil (தமிழ்). Language is selected per session so you can run multilingual fieldwork from the same platform.",
  },
  {
    q: "How do I get the data out?",
    a: "Every interview generates a full transcript and a summary report. Use the 'Export CSV' button on the summary screen to download a transcript that opens directly in Excel.",
  },
  {
    q: "Is my data secure?",
    a: "Transcripts are stored in your Supabase database. Nothing is shared with third parties. You own your data.",
  },
];

/* ─── Page ───────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-linear-to-br from-teal-950 via-teal-900 to-slate-900 px-6 pb-28 pt-24 text-center sm:pb-36 sm:pt-32">
        {/* dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: "radial-gradient(circle, #5eead4 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        {/* glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-112 w-md -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-800/50 px-4 py-1.5 text-sm text-teal-200 ring-1 ring-teal-700/50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
            AI-Powered · Sri Lankan FMCG Research
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Consumer Insights
            <br />
            <span className="text-teal-300">at Research Scale</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-teal-100/75">
            Meet{" "}
            <span className="font-semibold text-teal-200">Mrs Dissanayake</span> — your
            AI market research interviewer. She conducts structured, adaptive interviews
            with Sri Lankan consumers, capturing behavioural insights, brand perceptions,
            and pain points automatically.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/chat"
              className="rounded-full bg-teal-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/40 transition-all hover:bg-teal-400 hover:shadow-xl"
            >
              Begin Research Session →
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-teal-700 px-8 py-3.5 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-800/30"
            >
              View Past Insights
            </Link>
          </div>

          {/* Persona card */}
          <div className="mx-auto mt-14 max-w-sm rounded-2xl bg-white/5 p-5 text-left ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white shadow">
                D
              </div>
              <div>
                <p className="font-semibold text-white">Mrs Dissanayake</p>
                <p className="text-xs text-teal-300">Market Research Interviewer · AI</p>
              </div>
              <span className="ml-auto rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-medium text-teal-300 ring-1 ring-teal-500/30">
                ● Live
              </span>
            </div>
            <p className="mt-3 text-sm italic leading-relaxed text-teal-100/80">
              "Can you walk me through the last time you bought this product — from the
              moment you decided to buy, all the way to using it?"
            </p>
            <div className="mt-3 flex items-end gap-1 h-5">
              <span className="wave-bar-1 inline-block w-1 rounded-full bg-teal-400" style={{ height: 6 }} />
              <span className="wave-bar-2 inline-block w-1 rounded-full bg-teal-400" style={{ height: 10 }} />
              <span className="wave-bar-3 inline-block w-1 rounded-full bg-teal-400" style={{ height: 4 }} />
              <span className="wave-bar-4 inline-block w-1 rounded-full bg-teal-400" style={{ height: 10 }} />
              <span className="wave-bar-5 inline-block w-1 rounded-full bg-teal-400" style={{ height: 6 }} />
              <span className="ml-2 text-xs text-teal-400/70">Speaking…</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════ */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-4 sm:divide-y-0">
          {STATS.map((s) => (
            <div key={s.unit} className="flex flex-col items-center py-8 text-center">
              <span className="text-4xl font-bold text-teal-600 dark:text-teal-400">{s.value}</span>
              <span className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{s.unit}</span>
              <span className="mt-0.5 text-xs text-slate-400">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CORE FEATURES
      ══════════════════════════════════════════════════ */}
      <section className="bg-slate-50 px-6 py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Platform capabilities
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Everything a field moderator can do — automated
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
              Mrs Dissanayake runs the entire interview: introduction, rapport building,
              probing, closing — all without a human moderator in the room.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="bg-white px-6 py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              From brief to report in minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-start">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-8 top-8 hidden h-0.5 w-full bg-slate-200 dark:bg-slate-700 sm:block" />
                )}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-xl font-bold text-white shadow-lg">
                  {step.num}
                </div>
                <h3 className="mt-5 font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STUDY TYPES
      ══════════════════════════════════════════════════ */}
      <section className="bg-slate-50 px-6 py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Research formats
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Five lenses of consumer understanding
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
              Mrs Dissanayake adapts the entire interview flow, probe style, and
              follow-up logic to match your study objective.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STUDY_TYPES.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="text-3xl">{s.icon}</span>
                <p className="font-semibold text-slate-900 dark:text-white">{s.label}</p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LANGUAGE SUPPORT
      ══════════════════════════════════════════════════ */}
      <section className="bg-white px-6 py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Multilingual
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Speaks your consumers' language
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-500 dark:text-slate-400">
            Language is chosen per session — run English interviews for urban professionals,
            Sinhala for suburban households, Tamil for Northern Province respondents, all
            from the same platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {[
              { lang: "English",  flag: "🇬🇧", note: "Global market standard" },
              { lang: "සිංහල",   flag: "🇱🇰", note: "Sinhala — majority population" },
              { lang: "தமிழ்",  flag: "🇱🇰", note: "Tamil — Northern & Eastern" },
            ].map(({ lang, flag, note }) => (
              <div
                key={lang}
                className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 dark:border-teal-800 dark:bg-teal-950"
              >
                <span>{flag}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">{lang}</p>
                  <p className="text-xs text-teal-600/70 dark:text-teal-400/70">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHAT YOU GET (transcript + report preview)
      ══════════════════════════════════════════════════ */}
      <section className="bg-slate-50 px-6 py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Outputs
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              What you walk away with
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: "💬",
                title: "Full Transcript",
                bullets: [
                  "Every turn, verbatim",
                  "Interviewer + respondent labelled",
                  "Export as CSV for Excel",
                ],
              },
              {
                icon: "📄",
                title: "Research Report",
                bullets: [
                  "Key behavioural themes",
                  "Decision drivers & pain points",
                  "Direct quotes highlighted",
                ],
              },
              {
                icon: "🗂️",
                title: "Session History",
                bullets: [
                  "All past sessions saved",
                  "Browse by date or study type",
                  "Re-read any transcript",
                ],
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="text-4xl">{card.icon}</span>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{card.title}</h3>
                <ul className="mt-3 space-y-2">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                        ✓
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════ */}
      <section className="bg-white px-6 py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              FAQ
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Common questions
            </h2>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {FAQS.map((item) => (
              <div key={item.q} className="py-6">
                <p className="font-semibold text-slate-900 dark:text-white">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="bg-linear-to-br from-teal-900 to-slate-900 px-6 py-28 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to start your first session?
          </h2>
          <p className="mt-4 text-teal-200/70">
            Configure your study in under a minute. Mrs Dissanayake handles the rest.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/chat"
              className="rounded-full bg-teal-500 px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-teal-400"
            >
              Begin Research Session →
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-teal-700 px-8 py-3.5 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-800/30"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
