import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
                V
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Vinterview</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              AI-powered consumer research interviews for Sri Lankan FMCG insights.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product
            </p>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/chat" className="hover:text-teal-600 transition-colors">Start Interview</Link></li>
              <li><Link href="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link></li>
              <li><Link href="/#features" className="hover:text-teal-600 transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-teal-600 transition-colors">How it Works</Link></li>
            </ul>
          </div>

          {/* Research */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Research Types
            </p>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>Behavioral Insights</li>
              <li>Decision Journey</li>
              <li>Pain Points</li>
              <li>Perception Tracking</li>
              <li>Concept Testing</li>
            </ul>
          </div>

          {/* Languages */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Languages
            </p>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>English</li>
              <li>සිංහල · Sinhala</li>
              <li>தமிழ் · Tamil</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 dark:border-slate-800 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Vinterview. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Built for Sri Lankan FMCG consumer research
          </p>
        </div>
      </div>
    </footer>
  );
}
