'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const TEAM_MEMBERS = [
  'Steve Staplyton Smith',
  'Adam Turk',
  'Jan Faure',
  'Matthew Norris',
  'James Booth',
  'James Poole',
  'Kira Williams',
  'Candice Boshoff',
];

const CATEGORIES = [
  { id: 'cornerstone',    name: 'THE CORNERSTONE',    icon: '🏛️', description: 'The foundation others build on. Consistent, dependable, and unshakeable — the person the whole team quietly relies on to deliver, without fail, every single time.' },
  { id: 'pilot',          name: 'THE PILOT',           icon: '🧭', description: 'Committed to growth — theirs and others\'. They invest in becoming sharper, more skilled, and more effective every quarter. Always learning, always improving.' },
  { id: 'craftsman',      name: 'THE CRAFTSMAN',       icon: '⚒️', description: 'Takes genuine pride in doing their work exceptionally well. Accuracy, quality, and attention to detail are non-negotiable standards — not a checklist.' },
  { id: 'energy_giver',   name: 'THE ENERGY GIVER',   icon: '⚡', description: 'Walks into a room and raises the temperature. Their attitude is contagious, their encouragement is real, and they make everyone around them better just by being present.' },
  { id: 'night_watchman', name: 'THE NIGHT WATCHMAN', icon: '🌙', description: 'When the moment demanded more than the job description, they delivered — quietly, without fanfare, after hours if needed. Whatever it took. No questions asked.' },
  { id: 'connector',      name: 'THE CONNECTOR',      icon: '🔗', description: 'Bridges people, ideas, and teams. Builds relationships internally and externally that move the business forward.' },
  { id: 'clear_head',     name: 'THE CLEAR HEAD',     icon: '🔮', description: 'Brought calm, clarity, and good judgment in a moment of pressure, complexity, or ambiguity.' },
  { id: 'client_champion',name: 'THE CLIENT CHAMPION', icon: '🤝', description: 'Went above and beyond to deliver an exceptional client or stakeholder experience. They made people feel heard, valued, and genuinely well looked after.' },
  { id: 'culture_keeper', name: 'THE CULTURE KEEPER', icon: '🔥', description: 'Actively protects and enriches what makes WealthPoint special. Lives the values. Sets the tone. Leads by example.' },
  { id: 'dark_horse',     name: 'THE DARK HORSE',     icon: '🌑', description: 'The unsung hero. Quietly exceptional, never seeking the spotlight — yet their contribution, dedication and impact are felt by everyone. This one\'s for the person who deserves far more recognition than they ever ask for.' },
];

type VoteState = Record<string, string[]>;

export default function VotePage() {
  const router = useRouter();
  const [voterName, setVoterName] = useState('');
  const [votes, setVotes] = useState<VoteState>({});
  const [interaction, setInteraction] = useState({ aboutPerson: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const name = sessionStorage.getItem('voterName');
    if (!name) { router.replace('/'); return; }
    setVoterName(name);
  }, [router]);

  const toggleVote = useCallback((categoryId: string, nominee: string) => {
    setVotes(prev => {
      const current = prev[categoryId] || [];
      if (current.includes(nominee)) return { ...prev, [categoryId]: current.filter(n => n !== nominee) };
      if (current.length < 2) return { ...prev, [categoryId]: [...current, nominee] };
      return { ...prev, [categoryId]: [current[1], nominee] };
    });
  }, []);

  const progress = Math.round(
    (Object.values(votes).filter(v => v.length > 0).length / CATEGORIES.length) * 100
  );

  const nominationTally = TEAM_MEMBERS.reduce<Record<string, number>>((acc, member) => {
    const count = Object.values(votes).flat().filter(n => n === member).length;
    if (count > 0) acc[member] = count;
    return acc;
  }, {});

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterName,
          votes,
          interaction: interaction.aboutPerson && interaction.description ? interaction : undefined,
        }),
      });

      const data = await res.json();
      if (data.error === 'already_voted') { alert("You've already voted. Thank you!"); router.push('/'); return; }
      if (!res.ok) throw new Error('Submit failed');

      const confettiModule = await import('canvas-confetti');
      const confetti = confettiModule.default;
      const fire = (ratio: number, opts: Record<string, unknown>) =>
        confetti({ origin: { y: 0.6 }, particleCount: Math.floor(200 * ratio), ...opts });

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FD6F2F', '#ff8c52', '#FFF'] });
      setTimeout(() => fire(0.2,  { spread: 60,  colors: ['#FD6F2F', '#2E86AB', '#FFF'] }), 150);
      setTimeout(() => fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#FD6F2F', '#ff8c52'] }), 300);
      setTimeout(() => fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 }), 500);
      setTimeout(() => fire(0.1,  { spread: 120, startVelocity: 45, colors: ['#FD6F2F', '#0F2540'] }), 700);

      sessionStorage.removeItem('voterName');
      setSubmitted(true);
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0F2540' }}>
        <div className="text-center max-w-lg animate-scale-in">
          <img src="/logo-transparent.png" alt="WealthPoint Capital" style={{ height: '60px', width: 'auto', maxWidth: '220px', display: 'block', margin: '0 auto 2rem', filter: 'brightness(1.15)' }} />
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-4xl font-bold text-white mb-4">Votes Cast!</h1>
          <p className="text-lg mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Thank you, <strong className="text-white">{voterName}</strong>.
          </p>
          <p className="mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Your nominations have been recorded. Results will be announced at the end of the month.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: '#FD6F2F', boxShadow: '0 8px 24px rgba(253,111,47,0.35)' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F2540' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: '#0A1928',
          borderBottom: '1px solid rgba(204,204,204,0.1)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center gap-4">
          <img
            src="/logo-transparent.png"
            alt="WealthPoint Capital"
            style={{ height: '36px', width: 'auto', maxWidth: '160px', display: 'block', filter: 'brightness(1.15)' }}
          />
          <p className="font-semibold text-sm hidden sm:block" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Employee of the Month
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Progress</div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: '#FD6F2F' }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: '#FD6F2F' }}>{progress}%</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page heading */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Cast your votes</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)' }}>
            Welcome, <strong className="text-white">{voterName}</strong>. Select up to 2 nominees per category.
          </p>
        </div>

        <div className="flex gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {CATEGORIES.map((cat, idx) => {
              const catVotes = votes[cat.id] || [];
              const hasvotes = catVotes.length > 0;
              return (
                <div
                  key={cat.id}
                  className="rounded-2xl animate-fade-in-up"
                  style={{
                    background: '#122E4C',
                    border: hasvotes ? '1px solid rgba(253,111,47,0.35)' : '1px solid rgba(204,204,204,0.1)',
                    animationDelay: `${idx * 0.04}s`,
                    boxShadow: hasvotes ? '0 0 0 1px rgba(253,111,47,0.1)' : 'none',
                  }}
                >
                  <div className="p-5">
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-lg"
                          style={{ background: 'rgba(253,111,47,0.15)', border: '1px solid rgba(253,111,47,0.25)' }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm tracking-wider" style={{ color: '#FD6F2F' }}>{cat.name}</h3>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{cat.description}</p>
                        </div>
                      </div>
                      <div
                        className="ml-3 flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: catVotes.length === 2 ? '#FD6F2F' : catVotes.length === 1 ? 'rgba(253,111,47,0.2)' : 'rgba(255,255,255,0.06)',
                          color: catVotes.length >= 1 ? (catVotes.length === 2 ? 'white' : '#FD6F2F') : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {catVotes.length}/2
                      </div>
                    </div>

                    {/* Nominee grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TEAM_MEMBERS.map(member => {
                        const isSelected = catVotes.includes(member);
                        return (
                          <button
                            key={member}
                            onClick={() => toggleVote(cat.id, member)}
                            className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left"
                            style={{
                              background: isSelected ? '#FD6F2F' : 'rgba(255,255,255,0.06)',
                              color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                              border: isSelected ? '1.5px solid #FD6F2F' : '1.5px solid rgba(204,204,204,0.1)',
                              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                              boxShadow: isSelected ? '0 4px 14px rgba(253,111,47,0.3)' : 'none',
                              fontWeight: isSelected ? '700' : '500',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                e.currentTarget.style.border = '1.5px solid rgba(253,111,47,0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.border = '1.5px solid rgba(204,204,204,0.1)';
                              }
                            }}
                          >
                            {member}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Memorable Interaction */}
            <div
              className="rounded-2xl p-6 animate-fade-in-up"
              style={{
                background: '#122E4C',
                border: '1px solid rgba(204,204,204,0.1)',
                animationDelay: `${CATEGORIES.length * 0.04}s`,
              }}
            >
              <h3 className="font-bold text-lg mb-1" style={{ color: '#FD6F2F' }}>A Memorable Interaction</h3>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Share a specific moment that stood out to you this month.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Who is this about?</label>
                  <select
                    value={interaction.aboutPerson}
                    onChange={(e) => setInteraction(prev => ({ ...prev, aboutPerson: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(204,204,204,0.2)',
                      color: interaction.aboutPerson ? 'white' : 'rgba(255,255,255,0.35)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(253,111,47,0.5)'; }}
                    onBlur={(e)  => { e.currentTarget.style.border = '1px solid rgba(204,204,204,0.2)'; }}
                  >
                    <option value="" style={{ background: '#122E4C', color: 'rgba(255,255,255,0.5)' }}>Select a team member…</option>
                    {TEAM_MEMBERS.map(m => <option key={m} value={m} style={{ background: '#122E4C', color: 'white' }}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-white">What happened?</label>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{interaction.description.length}/300</span>
                  </div>
                  <textarea
                    value={interaction.description}
                    onChange={(e) => setInteraction(prev => ({ ...prev, description: e.target.value.slice(0, 300) }))}
                    placeholder="Describe what made this moment stand out…"
                    rows={4}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(204,204,204,0.2)',
                      color: 'white',
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(253,111,47,0.5)'; }}
                    onBlur={(e)  => { e.currentTarget.style.border = '1px solid rgba(204,204,204,0.2)'; }}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pb-10 animate-fade-in-up" style={{ animationDelay: `${(CATEGORIES.length + 1) * 0.04}s` }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-5 rounded-2xl font-bold text-lg tracking-wide text-white transition-all duration-200"
                style={{
                  background: submitting ? 'rgba(253,111,47,0.4)' : '#FD6F2F',
                  boxShadow: submitting ? 'none' : '0 12px 36px rgba(253,111,47,0.35)',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = '#ff8c52';
                    e.currentTarget.style.transform = 'scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 16px 44px rgba(253,111,47,0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = submitting ? 'rgba(253,111,47,0.4)' : '#FD6F2F';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = submitting ? 'none' : '0 12px 36px rgba(253,111,47,0.35)';
                }}
              >
                {submitting ? 'Submitting your votes…' : '✦  Submit My Votes  ✦'}
              </button>
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Once submitted, your votes cannot be changed.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: '#122E4C',
                  border: '1px solid rgba(204,204,204,0.1)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                <h3 className="font-bold text-sm tracking-wider uppercase mb-1" style={{ color: '#FD6F2F' }}>Your Nominations</h3>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Updates as you vote</p>

                {Object.keys(nominationTally).length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="text-3xl mb-2">🗳️</div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Start voting to see your nominations here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {TEAM_MEMBERS.filter(m => nominationTally[m] > 0)
                      .sort((a, b) => (nominationTally[b] || 0) - (nominationTally[a] || 0))
                      .map(member => (
                        <div
                          key={member}
                          className="flex items-center justify-between py-2 px-3 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <span className="text-xs font-medium text-white">{member}</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: nominationTally[member] || 0 }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full" style={{ background: '#FD6F2F' }} />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(204,204,204,0.1)' }}>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span>Categories voted</span>
                    <span className="font-semibold text-white">
                      {Object.values(votes).filter(v => v.length > 0).length}/{CATEGORIES.length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2E86AB, #FD6F2F)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
