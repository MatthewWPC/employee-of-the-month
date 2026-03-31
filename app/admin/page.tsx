'use client';

import { useEffect, useState } from 'react';
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
  interactions: { voter_name: string; about_person: string; description: string; created_at: string }[];
  totalVotesCount: number;
};

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
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'interactions' | 'voters'>('overview');

  useEffect(() => {
    fetch('/api/admin')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const leaderboardData = data
    ? Object.entries(data.totalByNominee).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    : [];

  const TABS = [
    { id: 'overview',      label: 'Overview' },
    { id: 'categories',    label: 'By Category' },
    { id: 'interactions',  label: 'Interactions' },
    { id: 'voters',        label: 'Voters' },
  ] as const;

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
        <button
          onClick={() => router.push('/')}
          className="text-sm transition-colors flex items-center gap-1"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          ← Back to Home
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
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
              <div className="animate-fade-in space-y-4">
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
            )}

            {/* VOTERS TAB */}
            {activeTab === 'voters' && (
              <div className="animate-fade-in">
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
                      {data.voters.map((voter, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: '#FD6F2F' }}
                            >
                              {voter.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-white">{voter.name}</span>
                          </div>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {new Date(voter.voted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
