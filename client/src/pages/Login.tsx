import { Chessboard } from "react-chessboard";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// Italian Game after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6
const PREVIEW_FEN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 5";

function Login() {
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
      <main className="flex-grow flex items-center px-6 py-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: text + CTAs */}
          <div className="flex flex-col">
            <div className="mb-6 w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                chess
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-headline text-on-surface mb-4 leading-none">
              CAIC
            </h1>
            <p className="text-lg text-on-surface-variant mb-3 font-body">
              Chess · AI Commentary · Real-time Analysis
            </p>
            <p className="text-sm text-outline mb-10 max-w-md leading-relaxed">
              Play unrated games against friends or Stockfish, with live evaluation and AI-powered commentary on every move.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
              <a
                href={`${SERVER_URL}/auth/google`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-container/20"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Sign in with Google
              </a>
              <a
                href="/game"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined text-base">person</span>
                Play as Guest
              </a>
            </div>

            {/* Feature pills */}
            <div className="mt-10 flex flex-wrap gap-2">
              {[
                { icon: "psychology", label: "Gemini AI Commentary" },
                { icon: "memory", label: "Stockfish Engine" },
                { icon: "timer", label: "Blitz & Rapid" },
                { icon: "group", label: "Play Friends" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-full text-xs text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: "14px" }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: chess board */}
          <div className="hidden lg:block w-full max-w-md mx-auto rounded-xl overflow-hidden border border-outline-variant shadow-2xl shadow-black/60">
            <Chessboard
              options={{
                position: PREVIEW_FEN,
                allowDragging: false,
                showNotation: false,
                darkSquareStyle: { backgroundColor: "#2e4d41" },
                lightSquareStyle: { backgroundColor: "#bec9c2" },
                boardStyle: { borderRadius: "0.75rem" },
              }}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-neutral-500">Chess AI Commentary</span>
          <div className="flex gap-6 text-sm text-neutral-500">
            <a href="#" className="hover:text-neutral-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;
