'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CATEGORIES_ORDER = [
  'cornerstone', 'pilot', 'craftsman', 'energy_giver', 'night_watchman',
  'connector', 'clear_head', 'client_champion', 'culture_keeper', 'dark_horse',
];

const CATEGORY_DISPLAY: Record<string, string> = {
  cornerstone:     'THE CORNERSTONE',
  pilot:           'THE PILOT',
  craftsman:       'THE CRAFTSMAN',
  energy_giver:    'THE ENERGY GIVER',
  night_watchman:  'THE NIGHT WATCHMAN',
  connector:       'THE CONNECTOR',
  clear_head:      'THE CLEAR HEAD',
  client_champion: 'THE CLIENT CHAMPION',
  culture_keeper:  'THE CULTURE KEEPER',
  dark_horse:      'THE DARK HORSE',
};

type AdminData = {
  voters: { name: string; voted_at: string }[];
  votesByCategory: Record<string, Record<string, number>>;
  totalByNominee: Record<string, number>;
  voterBreakdown: Record<string, Record<string, string[]>>;
  voteCountPerVoter: Record<string, number>;
  interactions: { voter_name: string; about_person: string; description: string; created_at: string }[];
  gees: { voter_name: string; content: string; image?: string | null; created_at: string }[];
  totalVotesCount: number;
};

type HistoryQuarter = {
  archive_label: string;
  archived_at: string;
  vote_count: number;
};

function currentQuarterLabel(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: 'rgba(253,111,47,0.15)', border: '1px solid rgba(253,111,47,0.25)' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [password, setPassword]           = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError]         = useState('');
  const [authChecking, setAuthChecking]   = useState(false);
  // Ref keeps password accessible inside stable callbacks without stale closures
  const passwordRef = useRef<string | null>(null);
  passwordRef.current = password;

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const [data, setData]                     = useState<AdminData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState<'overview' | 'categories' | 'interactions' | 'voters' | 'history'>('overview');
  const [expandedVoter, setExpandedVoter]   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const [showReset, setShowReset]   = useState(false);
  const [resetLabel, setResetLabel] = useState(currentQuarterLabel);
  const [resetText, setResetText]   = useState('');
  const [resetting, setResetting]   = useState(false);

  // ── History ───────────────────────────────────────────────────────────────
  const [historyList, setHistoryList]                   = useState<HistoryQuarter[]>([]);
  const [historyLoading, setHistoryLoading]             = useState(false);
  const [selectedArchive, setSelectedArchive]           = useState<string | null>(null);
  const [archiveDetail, setArchiveDetail]               = useState<AdminData | null>(null);
  const [archiveDetailLoading, setArchiveDetailLoading] = useState(false);
  const [expandedArchiveVoter, setExpandedArchiveVoter] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchData = useCallback((isInitial = false) => {
    const token = passwordRef.current;
    if (!token) return;
    fetch('/api/admin', {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) { setPassword(null); if (isInitial) setLoading(false); return null; }
        return r.json();
      })
      .then(d => { if (d) { setData(d); if (isInitial) setLoading(false); } })
      .catch(() => { if (isInitial) setLoading(false); });
  }, []);

  useEffect(() => {
    if (!password) return;
    setLoading(true);
    fetchData(true);
    // Poll every 8 seconds so new votes from voters appear without a manual refresh
    const interval = setInterval(() => fetchData(false), 8000);
    return () => clearInterval(interval);
  }, [password, fetchData]);

  // Load history list whenever the history tab is opened
  useEffect(() => {
    if (activeTab !== 'history' || !password) return;
    setHistoryLoading(true);
    fetch('/api/admin/history', {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${passwordRef.current ?? ''}` },
    })
      .then(r => {
        if (r.status === 401) { setPassword(null); return null; }
        return r.json();
      })
      .then(d => { if (d) setHistoryList(d.quarters ?? []); setHistoryLoading(false); })
      .catch(() => setHistoryLoading(false));
  }, [activeTab, password]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pw = passwordInput.trim();
    if (!pw) return;
    setAuthChecking(true);
    setAuthError('');
    fetch('/api/admin', {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${pw}` },
    })
      .then(r => {
        setAuthChecking(false);
        if (r.ok) {
          setPassword(pw);
          setPasswordInput('');
        } else {
          setAuthError('Incorrect password. Please try again.');
        }
      })
      .catch(() => {
        setAuthChecking(false);
        setAuthError('Connection error. Please try again.');
      });
  };

  const handleDelete = (voterName: string) => {
    setConfirmDelete(null);
    if (expandedVoter === voterName) setExpandedVoter(null);

    // Optimistic update — remove the voter and all their data from local state immediately
    setData(prev => {
      if (!prev) return prev;

      const breakdown = prev.voterBreakdown[voterName] ?? {};
      const voterVoteCount = prev.voteCountPerVoter[voterName] ?? 0;

      // Deep-copy mutable structures
      const newVotesByCategory: typeof prev.votesByCategory = {};
      for (const [cat, nominees] of Object.entries(prev.votesByCategory)) {
        newVotesByCategory[cat] = { ...nominees };
      }
      const newTotalByNominee = { ...prev.totalByNominee };

      // Subtract this voter's votes from each category and from the overall tally
      for (const [cat, nominees] of Object.entries(breakdown)) {
        for (const nominee of nominees) {
          if (newVotesByCategory[cat]) {
            newVotesByCategory[cat][nominee] = (newVotesByCategory[cat][nominee] ?? 1) - 1;
            if (newVotesByCategory[cat][nominee] <= 0) delete newVotesByCategory[cat][nominee];
          }
          newTotalByNominee[nominee] = (newTotalByNominee[nominee] ?? 1) - 1;
          if (newTotalByNominee[nominee] <= 0) delete newTotalByNominee[nominee];
        }
      }

      const newVoterBreakdown = { ...prev.voterBreakdown };
      delete newVoterBreakdown[voterName];

      const newVoteCountPerVoter = { ...prev.voteCountPerVoter };
      delete newVoteCountPerVoter[voterName];

      return {
        ...prev,
        voters: prev.voters.filter(v => v.name !== voterName),
        votesByCategory: newVotesByCategory,
        totalByNominee: newTotalByNominee,
        voterBreakdown: newVoterBreakdown,
        voteCountPerVoter: newVoteCountPerVoter,
        interactions: prev.interactions.filter(i => i.voter_name !== voterName),
        totalVotesCount: prev.totalVotesCount - voterVoteCount,
      };
    });

    // Fire the actual delete in the background — no waiting, no spinner
    fetch('/api/admin/delete-voter', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${passwordRef.current ?? ''}`,
      },
      body: JSON.stringify({ voterName }),
    }).catch(() => {});
  };

  const handleReset = () => {
    setResetting(true);
    fetch('/api/admin/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${passwordRef.current ?? ''}`,
      },
      body: JSON.stringify({ confirm: 'RESET', label: resetLabel }),
    })
      .then(r => {
        if (r.status === 401) { setPassword(null); setResetting(false); return null; }
        return r.json();
      })
      .then(d => {
        setResetting(false);
        if (d?.success) {
          setShowReset(false);
          setResetText('');
          fetchData(true);
        } else {
          alert('Reset failed — nothing was changed.');
        }
      })
      .catch(() => {
        setResetting(false);
        alert('Reset failed — nothing was changed.');
      });
  };

  const loadArchiveDetail = (label: string) => {
    if (selectedArchive === label) {
      setSelectedArchive(null);
      setArchiveDetail(null);
      setExpandedArchiveVoter(null);
      return;
    }
    setSelectedArchive(label);
    setArchiveDetail(null);
    setExpandedArchiveVoter(null);
    setArchiveDetailLoading(true);
    fetch(`/api/admin/history?label=${encodeURIComponent(label)}`, {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${passwordRef.current ?? ''}` },
    })
      .then(r => {
        if (r.status === 401) { setPassword(null); return null; }
        return r.json();
      })
      .then(d => { if (d) setArchiveDetail(d); setArchiveDetailLoading(false); })
      .catch(() => setArchiveDetailLoading(false));
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const leaderboardData = data
    ? Object.entries(data.totalByNominee).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    : [];

  const archiveLeaderboard = archiveDetail
    ? Object.entries(archiveDetail.totalByNominee).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    : [];

  const TABS = [
    { id: 'overview',      label: 'Overview' },
    { id: 'categories',    label: 'By Category' },
    { id: 'interactions',  label: 'Interactions' },
    { id: 'voters',        label: 'Voters' },
    { id: 'history',       label: 'History' },
  ] as const;

  // ── Password prompt screen ────────────────────────────────────────────────
  if (!password) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0F2540' }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8"
          style={{
            background: '#122E4C',
            border: '1px solid rgba(204,204,204,0.1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex justify-center mb-6">
            <img
              src="/logo-transparent.png"
              alt="WealthPoint Capital"
              style={{ height: '40px', width: 'auto', filter: 'brightness(1.15)' }}
            />
          </div>
          <h1 className="text-xl font-bold text-white text-center mb-1">Admin Dashboard</h1>
          <p className="text-sm text-center mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Enter the admin password to continue.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setAuthError(''); }}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${authError ? 'rgba(220,50,50,0.5)' : 'rgba(255,255,255,0.12)'}`,
              }}
              autoFocus
            />
            {authError && (
              <p className="text-xs" style={{ color: '#FF6B6B' }}>{authError}</p>
            )}
            <button
              type="submit"
              disabled={authChecking || !passwordInput.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: authChecking ? 'rgba(253,111,47,0.5)' : '#FD6F2F',
                boxShadow: authChecking ? 'none' : '0 4px 16px rgba(253,111,47,0.3)',
              }}
            >
              {authChecking ? 'Checking…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0F2540' }}>
      {/* Header */}
      <header
        className="px-6 py-5 flex items-center justify-between"
        style={{
          background: '#0A1928',
          borderBottom: '1px solid rgba(204,204,204,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-4">
          <img
            src="/logo-transparent.png"
            alt="WealthPoint Capital"
            style={{ height: '36px', width: 'auto', maxWidth: '160px', display: 'block', filter: 'brightness(1.15)' }}
          />
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReset(true)}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{
              background: 'rgba(220,50,50,0.12)',
              color: '#FF6B6B',
              border: '1px solid rgba(220,50,50,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220,50,50,0.25)';
              e.currentTarget.style.borderColor = 'rgba(220,50,50,0.5)';
              e.currentTarget.style.color = '#FF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(220,50,50,0.12)';
              e.currentTarget.style.borderColor = 'rgba(220,50,50,0.25)';
              e.currentTarget.style.color = '#FF6B6B';
            }}
          >
            Reset Quarter
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-sm transition-colors flex items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Archive & Reset confirmation modal — shown on any tab */}
        {showReset && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          >
            <div
              className="rounded-2xl p-6 max-w-sm w-full animate-scale-in"
              style={{
                background: '#122E4C',
                border: '1px solid rgba(220,50,50,0.3)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              }}
            >
              <div className="text-2xl mb-3">⚠️</div>
              <h3 className="font-bold text-white text-base mb-2">Archive & reset this quarter?</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                All votes, voters, and interactions will be <strong className="text-white">saved to history</strong>, then cleared so the new quarter starts fresh. Nothing is permanently deleted.
              </p>

              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Archive this quarter as
              </label>
              <input
                type="text"
                value={resetLabel}
                onChange={e => setResetLabel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none mb-4"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />

              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Type <strong style={{ color: '#FF6B6B' }}>RESET</strong> below to confirm.
              </p>
              <input
                type="text"
                placeholder="RESET"
                value={resetText}
                onChange={e => setResetText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none mb-4"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(220,50,50,0.25)',
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReset(false); setResetText(''); }}
                  disabled={resetting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetText !== 'RESET' || resetting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                  style={{
                    background: resetText === 'RESET' && !resetting ? '#DC3232' : 'rgba(220,50,50,0.3)',
                    boxShadow: resetText === 'RESET' && !resetting ? '0 4px 16px rgba(220,50,50,0.35)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (resetText === 'RESET' && !resetting) e.currentTarget.style.background = '#C42B2B'; }}
                  onMouseLeave={(e) => { if (resetText === 'RESET' && !resetting) e.currentTarget.style.background = '#DC3232'; }}
                >
                  {resetting ? 'Archiving…' : 'Yes, Archive & Reset'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading results…</div>
        ) : !data ? (
          <div className="text-center py-24" style={{ color: '#FF9999' }}>Failed to load data.</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 animate-fade-in-up">
              <StatCard label="Total Votes Cast"       value={data.totalVotesCount}       icon="🗳️" />
              <StatCard label="People Who Voted"       value={data.voters.length}          icon="👥" />
              <StatCard label="Memorable Interactions" value={data.interactions.length}    icon="💬" />
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? '#FD6F2F' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                    boxShadow: activeTab === tab.id ? '0 2px 12px rgba(253,111,47,0.3)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                <div
                  className="rounded-2xl p-6"
                  style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                >
                  <h2 className="font-bold text-white text-lg mb-1">Overall Leaderboard</h2>
                  <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Total votes received across all categories</p>

                  {leaderboardData.length === 0 ? (
                    <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.35)' }}>No votes recorded yet.</div>
                  ) : (
                    <>
                      <div className="h-72 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={leaderboardData} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                            <XAxis type="number" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} width={145} axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: 'rgba(253,111,47,0.06)' }}
                              contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid rgba(253,111,47,0.3)',
                                background: '#122E4C',
                                color: 'white',
                                fontSize: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                              }}
                            />
                            <Bar dataKey="count" name="Votes" radius={[0, 8, 8, 0]}>
                              {leaderboardData.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={index === 0 ? '#FD6F2F' : index === 1 ? '#2E86AB' : 'rgba(255,255,255,0.15)'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2">
                        {leaderboardData.map((entry, i) => (
                          <div
                            key={entry.name}
                            className="flex items-center gap-3 py-2.5 px-4 rounded-xl"
                            style={{ background: i === 0 ? 'rgba(253,111,47,0.1)' : 'rgba(255,255,255,0.04)' }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: i === 0 ? '#FD6F2F' : i === 1 ? '#2E86AB' : 'rgba(255,255,255,0.1)',
                                color: i <= 1 ? 'white' : 'rgba(255,255,255,0.4)',
                              }}
                            >
                              {i + 1}
                            </div>
                            <span className="flex-1 text-sm font-medium text-white">{entry.name}</span>
                            <span
                              className="text-sm font-bold"
                              style={{ color: i === 0 ? '#FD6F2F' : i === 1 ? '#2E86AB' : 'rgba(255,255,255,0.4)' }}
                            >
                              {entry.count} {entry.count === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="animate-fade-in space-y-4">
                {CATEGORIES_ORDER.map(catId => {
                  const catVotes = data.votesByCategory[catId] || {};
                  const sorted = Object.entries(catVotes).sort((a, b) => b[1] - a[1]);
                  const total = sorted.reduce((s, [, c]) => s + c, 0);

                  return (
                    <div
                      key={catId}
                      className="rounded-2xl p-5"
                      style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm tracking-wider" style={{ color: '#FD6F2F' }}>
                          {CATEGORY_DISPLAY[catId]}
                        </h3>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {total} vote{total !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {sorted.length === 0 ? (
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No votes yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {sorted.map(([name, count], i) => {
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={name} className="flex items-center gap-3">
                                <span className="text-xs w-4 text-right flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                                <span className="text-xs font-medium text-white w-36 flex-shrink-0">{name}</span>
                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: i === 0 ? '#FD6F2F' : '#2E86AB' }}
                                  />
                                </div>
                                <span className="text-xs font-bold w-6 text-right flex-shrink-0" style={{ color: i === 0 ? '#FD6F2F' : '#2E86AB' }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* INTERACTIONS TAB */}
            {activeTab === 'interactions' && (
              <div className="animate-fade-in space-y-6">
                {/* Memorable Interactions */}
                <div className="space-y-4">
                  {data.interactions.length === 0 ? (
                    <div className="rounded-2xl p-8 text-center" style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}>
                      <div className="text-3xl mb-2">💬</div>
                      <p style={{ color: 'rgba(255,255,255,0.35)' }}>No memorable interactions submitted yet.</p>
                    </div>
                  ) : (
                    data.interactions.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-2xl p-5"
                        style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span
                              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-1"
                              style={{ background: 'rgba(253,111,47,0.15)', color: '#FD6F2F', border: '1px solid rgba(253,111,47,0.25)' }}
                            >
                              About: {item.about_person}
                            </span>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Submitted by {item.voter_name}</div>
                          </div>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.description}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* For the Gees */}
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>For the Gees 😎</h2>
                  {data.gees.length === 0 ? (
                    <div className="rounded-2xl p-8 text-center" style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}>
                      <div className="text-3xl mb-2">😎</div>
                      <p style={{ color: 'rgba(255,255,255,0.35)' }}>Nothing for the gees yet.</p>
                    </div>
                  ) : (
                    data.gees.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-2xl p-5"
                        style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Submitted by {item.voter_name}</div>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {item.content && (
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.content}</p>
                        )}
                        {item.image && (
                          <img
                            src={item.image}
                            alt={`For the gees from ${item.voter_name}`}
                            style={{
                              marginTop: item.content ? '0.75rem' : 0,
                              maxWidth: '100%',
                              maxHeight: '400px',
                              borderRadius: '0.75rem',
                              border: '1px solid rgba(204,204,204,0.1)',
                              display: 'block',
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VOTERS TAB */}
            {activeTab === 'voters' && (
              <div className="animate-fade-in">
                {/* Confirmation dialog overlay */}
                {confirmDelete && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                  >
                    <div
                      className="rounded-2xl p-6 max-w-sm w-full animate-scale-in"
                      style={{
                        background: '#122E4C',
                        border: '1px solid rgba(220,50,50,0.3)',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                      }}
                    >
                      <div className="text-2xl mb-3">⚠️</div>
                      <h3 className="font-bold text-white text-base mb-2">Delete this voter?</h3>
                      <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Are you sure you want to delete{' '}
                        <strong className="text-white">{confirmDelete}</strong> and all of their votes?
                      </p>
                      <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        This cannot be undone.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(confirmDelete)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                          style={{
                            background: '#DC3232',
                            boxShadow: '0 4px 16px rgba(220,50,50,0.35)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#C42B2B'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#DC3232'; }}
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className="rounded-2xl p-5"
                  style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                >
                  <h2 className="font-bold text-white mb-4">
                    {data.voters.length} {data.voters.length === 1 ? 'Person' : 'People'} Have Voted
                  </h2>
                  {data.voters.length === 0 ? (
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No votes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.voters.map((voter) => {
                        const isExpanded = expandedVoter === voter.name;
                        const voteCount = data.voteCountPerVoter[voter.name] ?? 0;
                        const breakdown = data.voterBreakdown[voter.name] ?? {};

                        return (
                          <div key={voter.name}>
                            <div
                              className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                              style={{
                                background: isExpanded ? 'rgba(253,111,47,0.08)' : 'rgba(255,255,255,0.04)',
                                border: isExpanded ? '1px solid rgba(253,111,47,0.2)' : '1px solid transparent',
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                  style={{ background: '#FD6F2F' }}
                                >
                                  {voter.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-white truncate">{voter.name}</span>
                                <span
                                  className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                                  style={{ background: 'rgba(253,111,47,0.15)', color: '#FD6F2F', border: '1px solid rgba(253,111,47,0.25)' }}
                                >
                                  {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                  {new Date(voter.voted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  onClick={() => setExpandedVoter(isExpanded ? null : voter.name)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                                  style={{
                                    background: isExpanded ? 'rgba(253,111,47,0.2)' : 'rgba(255,255,255,0.07)',
                                    color: isExpanded ? '#FD6F2F' : 'rgba(255,255,255,0.4)',
                                    border: isExpanded ? '1px solid rgba(253,111,47,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                  }}
                                  title={isExpanded ? 'Collapse ballot' : 'View ballot'}
                                >
                                  {isExpanded ? '▲' : '▼'}
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(voter.name)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                                  style={{
                                    background: 'rgba(220,50,50,0.12)',
                                    color: '#FF6B6B',
                                    border: '1px solid rgba(220,50,50,0.25)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(220,50,50,0.25)';
                                    e.currentTarget.style.borderColor = 'rgba(220,50,50,0.5)';
                                    e.currentTarget.style.color = '#FF4444';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(220,50,50,0.12)';
                                    e.currentTarget.style.borderColor = 'rgba(220,50,50,0.25)';
                                    e.currentTarget.style.color = '#FF6B6B';
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div
                                className="mt-1 mb-1 rounded-xl p-4"
                                style={{
                                  background: 'rgba(10,25,40,0.6)',
                                  border: '1px solid rgba(253,111,47,0.15)',
                                  marginLeft: '8px',
                                  marginRight: '8px',
                                }}
                              >
                                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                  Complete Ballot
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {CATEGORIES_ORDER.map(catId => {
                                    const nominees = breakdown[catId];
                                    const hasVotes = nominees && nominees.length > 0;
                                    return (
                                      <div
                                        key={catId}
                                        className="rounded-lg p-3"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                      >
                                        <div className="text-xs font-bold mb-1.5" style={{ color: '#FD6F2F' }}>
                                          {CATEGORY_DISPLAY[catId]}
                                        </div>
                                        <div className="text-xs" style={{ color: hasVotes ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                                          {hasVotes ? nominees.join(', ') : '—'}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="animate-fade-in">
                {historyLoading ? (
                  <div className="text-center py-24" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading history…</div>
                ) : historyList.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}>
                    <div className="text-3xl mb-3">📦</div>
                    <p className="font-medium text-white mb-1">No archived quarters yet</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      When you use Reset Quarter, the current data is saved here before clearing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyList.map(q => {
                      const isOpen = selectedArchive === q.archive_label;
                      return (
                        <div key={q.archive_label}>
                          {/* Quarter summary row */}
                          <button
                            onClick={() => loadArchiveDetail(q.archive_label)}
                            className="w-full text-left rounded-2xl p-5 transition-all"
                            style={{
                              background: isOpen ? 'rgba(253,111,47,0.08)' : '#122E4C',
                              border: isOpen ? '1px solid rgba(253,111,47,0.2)' : '1px solid rgba(204,204,204,0.1)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold text-white text-base">{q.archive_label}</div>
                                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                  Archived {new Date(q.archived_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-semibold"
                                  style={{ background: 'rgba(253,111,47,0.15)', color: '#FD6F2F', border: '1px solid rgba(253,111,47,0.25)' }}
                                >
                                  {q.vote_count} {q.vote_count === 1 ? 'vote' : 'votes'}
                                </span>
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                  {isOpen ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* Expanded archive detail */}
                          {isOpen && (
                            <div className="mt-2 space-y-4 pl-1">
                              {archiveDetailLoading ? (
                                <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
                              ) : archiveDetail ? (
                                <>
                                  {/* Archive stat cards */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <StatCard label="Total Votes"   value={archiveDetail.totalVotesCount}    icon="🗳️" />
                                    <StatCard label="People Voted"  value={archiveDetail.voters.length}       icon="👥" />
                                    <StatCard label="Interactions"  value={archiveDetail.interactions.length} icon="💬" />
                                  </div>

                                  {/* Archive leaderboard */}
                                  <div
                                    className="rounded-2xl p-6"
                                    style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                                  >
                                    <h3 className="font-bold text-white text-base mb-1">Overall Leaderboard</h3>
                                    <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Total votes received across all categories</p>
                                    {archiveLeaderboard.length === 0 ? (
                                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No votes recorded.</p>
                                    ) : (
                                      <>
                                        <div className="h-60 mb-5">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={archiveLeaderboard} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                                              <XAxis type="number" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                                              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} width={145} axisLine={false} tickLine={false} />
                                              <Tooltip
                                                cursor={{ fill: 'rgba(253,111,47,0.06)' }}
                                                contentStyle={{
                                                  borderRadius: '12px',
                                                  border: '1px solid rgba(253,111,47,0.3)',
                                                  background: '#122E4C',
                                                  color: 'white',
                                                  fontSize: '12px',
                                                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                                }}
                                              />
                                              <Bar dataKey="count" name="Votes" radius={[0, 8, 8, 0]}>
                                                {archiveLeaderboard.map((entry, index) => (
                                                  <Cell key={entry.name} fill={index === 0 ? '#FD6F2F' : index === 1 ? '#2E86AB' : 'rgba(255,255,255,0.15)'} />
                                                ))}
                                              </Bar>
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-2">
                                          {archiveLeaderboard.map((entry, i) => (
                                            <div
                                              key={entry.name}
                                              className="flex items-center gap-3 py-2.5 px-4 rounded-xl"
                                              style={{ background: i === 0 ? 'rgba(253,111,47,0.1)' : 'rgba(255,255,255,0.04)' }}
                                            >
                                              <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                style={{
                                                  background: i === 0 ? '#FD6F2F' : i === 1 ? '#2E86AB' : 'rgba(255,255,255,0.1)',
                                                  color: i <= 1 ? 'white' : 'rgba(255,255,255,0.4)',
                                                }}
                                              >
                                                {i + 1}
                                              </div>
                                              <span className="flex-1 text-sm font-medium text-white">{entry.name}</span>
                                              <span className="text-sm font-bold" style={{ color: i === 0 ? '#FD6F2F' : i === 1 ? '#2E86AB' : 'rgba(255,255,255,0.4)' }}>
                                                {entry.count} {entry.count === 1 ? 'vote' : 'votes'}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Archive categories */}
                                  <div className="space-y-3">
                                    {CATEGORIES_ORDER.map(catId => {
                                      const catVotes = archiveDetail.votesByCategory[catId] || {};
                                      const sorted = Object.entries(catVotes).sort((a, b) => b[1] - a[1]);
                                      const total = sorted.reduce((s, [, c]) => s + c, 0);
                                      return (
                                        <div
                                          key={catId}
                                          className="rounded-2xl p-5"
                                          style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-xs tracking-wider" style={{ color: '#FD6F2F' }}>
                                              {CATEGORY_DISPLAY[catId]}
                                            </h4>
                                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                              {total} vote{total !== 1 ? 's' : ''}
                                            </span>
                                          </div>
                                          {sorted.length === 0 ? (
                                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No votes.</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {sorted.map(([name, count], i) => {
                                                const pct = total > 0 ? (count / total) * 100 : 0;
                                                return (
                                                  <div key={name} className="flex items-center gap-3">
                                                    <span className="text-xs w-4 text-right flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                                                    <span className="text-xs font-medium text-white w-36 flex-shrink-0">{name}</span>
                                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: i === 0 ? '#FD6F2F' : '#2E86AB' }} />
                                                    </div>
                                                    <span className="text-xs font-bold w-6 text-right flex-shrink-0" style={{ color: i === 0 ? '#FD6F2F' : '#2E86AB' }}>{count}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Archive interactions */}
                                  {archiveDetail.interactions.length > 0 && (
                                    <div className="space-y-3">
                                      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Interactions</h3>
                                      {archiveDetail.interactions.map((item, i) => (
                                        <div
                                          key={i}
                                          className="rounded-2xl p-5"
                                          style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                                        >
                                          <div className="flex items-start justify-between mb-3">
                                            <div>
                                              <span
                                                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-1"
                                                style={{ background: 'rgba(253,111,47,0.15)', color: '#FD6F2F', border: '1px solid rgba(253,111,47,0.25)' }}
                                              >
                                                About: {item.about_person}
                                              </span>
                                              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Submitted by {item.voter_name}</div>
                                            </div>
                                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                              {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Archive voter list — read-only */}
                                  <div
                                    className="rounded-2xl p-5"
                                    style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                                  >
                                    <h3 className="font-bold text-white mb-4">
                                      {archiveDetail.voters.length} {archiveDetail.voters.length === 1 ? 'Person' : 'People'} Voted
                                    </h3>
                                    {archiveDetail.voters.length === 0 ? (
                                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No voters recorded.</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {archiveDetail.voters.map((voter) => {
                                          const isExp = expandedArchiveVoter === voter.name;
                                          const voteCount = archiveDetail.voteCountPerVoter[voter.name] ?? 0;
                                          const breakdown = archiveDetail.voterBreakdown[voter.name] ?? {};
                                          return (
                                            <div key={voter.name}>
                                              <div
                                                className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                                                style={{
                                                  background: isExp ? 'rgba(253,111,47,0.08)' : 'rgba(255,255,255,0.04)',
                                                  border: isExp ? '1px solid rgba(253,111,47,0.2)' : '1px solid transparent',
                                                }}
                                              >
                                                <div className="flex items-center gap-3 min-w-0">
                                                  <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                                    style={{ background: '#FD6F2F' }}
                                                  >
                                                    {voter.name.charAt(0).toUpperCase()}
                                                  </div>
                                                  <span className="text-sm font-medium text-white truncate">{voter.name}</span>
                                                  <span
                                                    className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{ background: 'rgba(253,111,47,0.15)', color: '#FD6F2F', border: '1px solid rgba(253,111,47,0.25)' }}
                                                  >
                                                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                                                  </span>
                                                </div>
                                                <button
                                                  onClick={() => setExpandedArchiveVoter(isExp ? null : voter.name)}
                                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all flex-shrink-0 ml-3"
                                                  style={{
                                                    background: isExp ? 'rgba(253,111,47,0.2)' : 'rgba(255,255,255,0.07)',
                                                    color: isExp ? '#FD6F2F' : 'rgba(255,255,255,0.4)',
                                                    border: isExp ? '1px solid rgba(253,111,47,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                                  }}
                                                  title={isExp ? 'Collapse ballot' : 'View ballot'}
                                                >
                                                  {isExp ? '▲' : '▼'}
                                                </button>
                                              </div>
                                              {isExp && (
                                                <div
                                                  className="mt-1 mb-1 rounded-xl p-4"
                                                  style={{
                                                    background: 'rgba(10,25,40,0.6)',
                                                    border: '1px solid rgba(253,111,47,0.15)',
                                                    marginLeft: '8px',
                                                    marginRight: '8px',
                                                  }}
                                                >
                                                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                                    Complete Ballot
                                                  </p>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {CATEGORIES_ORDER.map(catId => {
                                                      const nominees = breakdown[catId];
                                                      const hasVotes = nominees && nominees.length > 0;
                                                      return (
                                                        <div
                                                          key={catId}
                                                          className="rounded-lg p-3"
                                                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                                        >
                                                          <div className="text-xs font-bold mb-1.5" style={{ color: '#FD6F2F' }}>
                                                            {CATEGORY_DISPLAY[catId]}
                                                          </div>
                                                          <div className="text-xs" style={{ color: hasVotes ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                                                            {hasVotes ? nominees.join(', ') : '—'}
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
