export default function Layout({ title, children, right }) {
  return (
    <div className="min-h-screen bg-slate-900 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800/60">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="font-extrabold tracking-tight">
            Depression <span className="text-blue-400">Predictor</span>
          </h1>
          <div className="flex items-center gap-3">{right}</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
