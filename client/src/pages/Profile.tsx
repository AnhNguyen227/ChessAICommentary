import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [chessComInput, setChessComInput] = useState("");
  const [chessComStatus, setChessComStatus] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

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

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold tracking-tighter text-primary font-headline">CAIC</a>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="flex items-center gap-1.5 text-sm text-on-surface-variant font-semibold hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Dashboard
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

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Profile hero */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex items-center gap-5">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full border-2 border-outline-variant flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-2xl font-bold text-on-primary-container flex-shrink-0">
              {user.displayName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-headline text-on-surface tracking-tight truncate">{user.displayName}</h1>
            <p className="text-sm text-on-surface-variant mt-0.5 truncate">{user.email}</p>
            <p className="text-xs text-outline mt-1">Member since {joinDate}</p>
          </div>
        </div>

        {/* Chess.com */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">link</span>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest">Chess.com</h2>
          </div>

          {user.chessComUsername ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full border border-primary/20">
                {user.chessComUsername}
              </span>
              {user.chessComElo?.rapid && (
                <span className="text-sm text-outline">Rapid <span className="font-semibold text-on-surface">{user.chessComElo.rapid}</span></span>
              )}
              {user.chessComElo?.blitz && (
                <span className="text-sm text-outline">Blitz <span className="font-semibold text-on-surface">{user.chessComElo.blitz}</span></span>
              )}
            </div>
          ) : (
            <p className="text-sm text-outline">No Chess.com account linked.</p>
          )}

          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder={user.chessComUsername ? "Update username..." : "Link username..."}
              value={chessComInput}
              onChange={(e) => setChessComInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLinkChessCom()}
              className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleLinkChessCom}
              disabled={linking || !chessComInput.trim()}
              className="px-4 py-2 bg-primary-container text-on-primary-container text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {linking ? "..." : user.chessComUsername ? "Update" : "Link"}
            </button>
          </div>
          {chessComStatus && <p className="text-sm text-primary">{chessComStatus}</p>}
        </div>

        {/* Account actions */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">manage_accounts</span>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest">Account</h2>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2 border border-error/40 text-error text-sm font-semibold rounded-lg hover:bg-error/10 disabled:opacity-40 transition-all"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default Profile;
