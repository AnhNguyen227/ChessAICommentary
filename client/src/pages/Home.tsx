const SERVER_URL = import.meta.env.VITE_SERVER_URL;

function Home() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-2xl font-bold tracking-tighter text-primary font-headline">CAIC</span>
          <a
            href={`${SERVER_URL}/auth/google`}
            className="px-5 py-2 bg-primary-container text-on-primary-container font-semibold rounded-lg hover:opacity-90 transition-all text-sm"
          >
            Sign In
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
          {/* Logo mark */}
          <div className="mb-6 w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              chess
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter font-headline text-on-surface mb-4">
            CAIC
          </h1>
          <p className="text-lg text-on-surface-variant mb-2 font-body">
            Chess · AI Commentary · Real-time Analysis
          </p>
          <p className="text-sm text-outline mb-10 max-w-md">
            Play unrated games against friends or Stockfish, with live evaluation and AI-powered commentary on every move.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <a
              href={`${SERVER_URL}/auth/google`}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-container/20"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Sign in with Google
            </a>
            <a
              href="/game"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-base">person</span>
              Play as Guest
            </a>
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 mt-20 flex flex-wrap gap-3 justify-center max-w-lg">
          {[
            { icon: "psychology", label: "Gemini AI Commentary" },
            { icon: "memory", label: "Stockfish Engine" },
            { icon: "timer", label: "Blitz & Rapid" },
            { icon: "group", label: "Play Friends" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant rounded-full text-sm text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-primary text-base">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-neutral-500">© 2024 CAIC. All rights reserved.</span>
          <div className="flex gap-6 text-sm text-neutral-500">
            <a href="#" className="hover:text-neutral-300 transition-colors">GitHub</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;