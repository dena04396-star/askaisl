export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Vinterview. All rights reserved.
      </div>
    </footer>
  );
}
