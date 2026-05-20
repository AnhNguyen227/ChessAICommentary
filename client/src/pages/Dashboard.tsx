import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface MatchRecord {
  gameId: string;
  date: string;
  opponent: string;
  timeControl: { minutes: number; increment: number };
  color: "white" | "black";
  result: "win" | "loss" | "draw";
  endReason: string;
  pgn: string;
}

interface Stats {
  total: number;
  asWhite: { played: number; wins: number; draws: number; losses: number } | null;
  asBlack: { played: number; wins: number; draws: number; losses: number } | null;
  byTimeControl: Record<string, { played: number; wins: number; draws: number; losses: number }>;
}

function winPct(wins: number, played: number): string {
  if (played === 0) return "0%";
  return `${Math.round((wins / played) * 100)}%`;
}

const resultStyles = {
  win: "bg-primary/10 text-primary border border-primary/20",
  loss: "bg-error/10 text-error border border-error/20",
  draw: "bg-tertiary/10 text-tertiary border border-tertiary/20",
};

const filterKeys = ["all", "win", "loss", "draw"] as const;
type Filter = typeof filterKeys[number];

function WinBar({ wins, draws, played }: { wins: number; draws: number; losses: number; played: number }) {
  if (played === 0) return <div className="h-1.5 bg-surface-container-highest rounded-full" />;
  const wPct = (wins / played) * 100;
  const dPct = (draws / played) * 100;
  return (
    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${wPct}%` }} />
      <div className="h-full bg-tertiary transition-all duration-500" style={{ width: `${dPct}%` }} />
      <div className="h-full bg-error/60 transition-all duration-500 flex-1" />
    </div>
  );
}

function ColorCard({
  color,
  data,
}: {
  color: "white" | "black";
  data: { played: number; wins: number; draws: number; losses: number } | null;
}) {
  const isWhite = color === "white";
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg shadow-sm flex-shrink-0 ${isWhite ? "bg-[#bec9c2]" : "bg-[#2e4d41]"
              }`}
          />
          <span className="text-sm font-bold text-on-surface">
            Playing as {isWhite ? "White" : "Black"}
          </span>
        </div>
        <span className="text-2xl font-bold font-headline text-primary">
          {data ? winPct(data.wins, data.played) : "—"}
        </span>
      </div>

      {data ? (
        <>
          <WinBar {...data} />
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <span className="text-on-surface-variant">{data.wins} <span className="font-semibold text-on-surface">W</span></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary inline-block" />
              <span className="text-on-surface-variant">{data.draws} <span className="font-semibold text-on-surface">D</span></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error/60 inline-block" />
              <span className="text-on-surface-variant">{data.losses} <span className="font-semibold text-on-surface">L</span></span>
            </span>
            <span className="ml-auto text-outline">{data.played} games</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-outline italic">No games yet</p>
      )}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [chessComInput, setChessComInput] = useState("");
  const [chessComStatus, setChessComStatus] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const handleLinkChessCom = async () => {
    if (!chessComInput.trim()) return;
    setLinking(true);
    setChessComStatus(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/chess-com`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: chessComInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setChessComStatus(`Linked! Rapid: ${data.chessComElo?.rapid ?? "unrated"} · Blitz: ${data.chessComElo?.blitz ?? "unrated"}`);
      setChessComInput("");
    } catch (err: any) {
      setChessComStatus(err.message ?? "Failed to link account");
    } finally {
      setLinking(false);
    }
  };

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    Promise.all([
      fetch(`${serverUrl}/api/games`, { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch(`${serverUrl}/api/games/stats`, { credentials: "include" }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([games, stats]) => { setHistory(games); setStats(stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? history : history.filter((g) => g.result === filter);

  const mostPlayedTimeControl = stats
    ? Object.entries(stats.byTimeControl).sort((a, b) => b[1].played - a[1].played)[0]
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-outline">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold tracking-tighter text-primary font-headline">CAIC</a>
          <div className="flex items-center gap-3">
            <a href="/profile" className="flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} referrerPolicy="no-referrer" alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                  {user?.displayName?.[0] ?? "?"}
                </div>
              )}
              <span className="text-sm text-on-surface-variant font-medium">{user?.displayName}</span>
            </a>
            <a
              href="/game"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary-container text-sm font-bold rounded-lg hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Play
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline text-on-surface">
            Welcome back, {user?.displayName?.split(" ")[0]}
          </h1>
        </div>

        {/* Stat cards — asymmetric 3-col grid */}
        <div className="grid grid-cols-3 gap-4">

          {/* Total Games — tall, spans 2 rows */}
          <div className="row-span-2 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-xs text-outline uppercase tracking-widest font-semibold">Total Games</p>
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                sports_esports
              </span>
            </div>
            <div>
              <p className="text-7xl font-bold font-headline text-on-surface leading-none">{stats?.total ?? 0}</p>
              <p className="text-xs text-outline mt-3">games played</p>
            </div>
          </div>

          {/* Win Rate — wide, horizontal layout */}
          <div className="col-span-2 bg-surface-container border border-outline-variant rounded-xl p-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-xs text-outline uppercase tracking-widest font-semibold mb-2">Overall Win Rate</p>
              {stats && (stats.asWhite || stats.asBlack) ? (() => {
                const totalWins = (stats.asWhite?.wins ?? 0) + (stats.asBlack?.wins ?? 0);
                const totalDraws = (stats.asWhite?.draws ?? 0) + (stats.asBlack?.draws ?? 0);
                const totalLosses = (stats.asWhite?.losses ?? 0) + (stats.asBlack?.losses ?? 0);
                return (
                  <div className="flex items-baseline gap-3">
                    <p className="text-5xl font-bold font-headline text-on-surface leading-none">
                      {winPct(totalWins, stats.total)}
                    </p>
                    <div className="flex gap-3 text-sm">
                      <span className="text-primary font-semibold">{totalWins}W</span>
                      <span className="text-tertiary font-semibold">{totalDraws}D</span>
                      <span className="text-error/70 font-semibold">{totalLosses}L</span>
                    </div>
                  </div>
                );
              })() : (
                <p className="text-5xl font-bold font-headline text-on-surface leading-none">—</p>
              )}
            </div>
            <span className="material-symbols-outlined text-primary/20 text-7xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
          </div>

          {/* Favorite Time Control */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-outline uppercase tracking-widest font-semibold">Favorite TC</p>
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            </div>
            <p className="text-3xl font-bold font-headline text-on-surface leading-none">
              {mostPlayedTimeControl ? mostPlayedTimeControl[0] : "—"}
            </p>
            <p className="text-xs text-outline mt-0.5">
              {mostPlayedTimeControl ? `${mostPlayedTimeControl[1].played} games` : "no games yet"}
            </p>
          </div>

          {/* Chess.com — with inline link form */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-outline uppercase tracking-widest font-semibold">Chess.com</p>
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
            </div>
            {user?.chessComUsername && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                  {user.chessComUsername}
                </span>
                {user.chessComElo?.rapid && <span className="text-xs text-outline">Rapid <span className="font-semibold text-on-surface">{user.chessComElo.rapid}</span></span>}
                {user.chessComElo?.blitz && <span className="text-xs text-outline">Blitz <span className="font-semibold text-on-surface">{user.chessComElo.blitz}</span></span>}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={user?.chessComUsername ? "Update username..." : "Link username..."}
                value={chessComInput}
                onChange={(e) => setChessComInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLinkChessCom()}
                className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleLinkChessCom}
                disabled={linking || !chessComInput.trim()}
                className="px-3 py-1.5 bg-primary-container text-on-primary-container text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {linking ? "..." : user?.chessComUsername ? "Update" : "Link"}
              </button>
            </div>
            {chessComStatus && <p className="text-xs text-primary">{chessComStatus}</p>}
          </div>
        </div>

        {/* Color performance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorCard color="white" data={stats?.asWhite ?? null} />
          <ColorCard color="black" data={stats?.asBlack ?? null} />
        </div>

        {/* By time control */}
        {stats && stats.byTimeControl && Object.keys(stats.byTimeControl).length > 0 && (
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant">
              <h3 className="text-sm font-semibold text-on-surface">By Time Control</h3>
            </div>
            <div className="divide-y divide-outline-variant/30">
              {Object.entries(stats.byTimeControl).map(([key, s]) => (
                <div key={key} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-sm font-mono font-bold text-on-surface w-20 flex-shrink-0">{key}</span>
                  <div className="flex-1">
                    <WinBar {...s} />
                  </div>
                  <span className="text-xs text-outline w-16 text-right">{winPct(s.wins, s.played)} wins</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match history */}
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">Match History</h3>
            <div className="flex gap-1">
              {filterKeys.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f
                    ? "bg-primary-container text-on-primary-container"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-high"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-outline text-sm">No games found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-outline uppercase tracking-wider bg-surface-container-low/50">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Opponent</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">End Reason</th>
                    <th className="px-4 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filtered.map((g) => (
                    <tr key={g.gameId} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {new Date(g.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-on-surface">{g.opponent}</td>
                      <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">
                        {g.timeControl.minutes}+{g.timeControl.increment}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3 h-3 rounded-sm ${g.color === "white" ? "bg-white" : "bg-neutral-700 border border-white/10"}`} />
                          <span className="text-xs text-on-surface-variant capitalize">{g.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant capitalize">
                        {g.endReason?.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${resultStyles[g.result]}`}>
                          {g.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
