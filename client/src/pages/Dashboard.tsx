import { useEffect, useState } from "react";
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

function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<"all" | "win" | "loss" | "draw">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    Promise.all([
      fetch(`${serverUrl}/api/games`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch games");
        return r.json();
      }),
      fetch(`${serverUrl}/api/games/stats`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch stats");
        return r.json();
      }),
    ])
      .then(([games, stats]) => {
        setHistory(games);
        setStats(stats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "all" ? history : history.filter((g) => g.result === filter);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.displayName}</p>

      {/* Analytics */}
      {stats && stats.total > 0 && (
        <div>
          <h2>Analytics</h2>
          <p>Total games: {stats.total}</p>

          {stats.asWhite && (
            <p>
              As White: {stats.asWhite.wins}W / {stats.asWhite.draws}D / {stats.asWhite.losses}L
              ({winPct(stats.asWhite.wins, stats.asWhite.played)} win rate)
            </p>
          )}
          {stats.asBlack && (
            <p>
              As Black: {stats.asBlack.wins}W / {stats.asBlack.draws}D / {stats.asBlack.losses}L
              ({winPct(stats.asBlack.wins, stats.asBlack.played)} win rate)
            </p>
          )}

          <h3>By Time Control</h3>
          {Object.entries(stats.byTimeControl).map(([key, s]) => (
            <p key={key}>
              {key}: {s.wins}W / {s.draws}D / {s.losses}L ({winPct(s.wins, s.played)} win rate)
            </p>
          ))}
        </div>
      )}

      {/* Match History */}
      <h2>Match History</h2>
      <div>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("win")}>Wins</button>
        <button onClick={() => setFilter("loss")}>Losses</button>
        <button onClick={() => setFilter("draw")}>Draws</button>
      </div>

      {filtered.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Time Control</th>
              <th>Color</th>
              <th>Result</th>
              <th>End Reason</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.gameId}>
                <td>{new Date(g.date).toLocaleDateString()}</td>
                <td>{g.opponent}</td>
                <td>{g.timeControl.minutes}+{g.timeControl.increment}</td>
                <td>{g.color}</td>
                <td>{g.result}</td>
                <td>{g.endReason?.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;