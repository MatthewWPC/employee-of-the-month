'use client';

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
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

// Map each member to their photo file and initials fallback
const MEMBER_META: Record<string, { photo: string; initials: string; color: string }> = {
  'Steve Staplyton Smith': { photo: '/team/steve.png',      initials: 'SS', color: '#2E5B8A' },
  'Adam Turk':             { photo: '/team/adam.png',       initials: 'AT', color: '#1A5276' },
  'Jan Faure':             { photo: '/team/jan.png',        initials: 'JF', color: '#1F618D' },
  'Matthew Norris':        { photo: '/team/matthew.png',    initials: 'MN', color: '#154360' },
  'James Booth':           { photo: '/team/james-booth.png',initials: 'JB', color: '#1A3A5C' },
  'James Poole':           { photo: '/team/james-poole.png',initials: 'JP', color: '#215A8A' },
  'Kira Williams':         { photo: '/team/kira.png',       initials: 'KW', color: '#1E5799' },
  'Candice Boshoff':       { photo: '/team/candice.png',    initials: 'CB', color: '#1A4F72' },
};

// Read an image file, scale it down (max 1200px on the long edge), and return a
// JPEG data URL. Keeps the base64 payload small so it stores cleanly in Postgres.
async function fileToResizedDataUrl(file: File, maxDim = 1200, quality = 0.82): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('decode'));
    i.src = dataUrl;
  });
  let width = img.width;
  let height = img.height;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function MemberAvatar({ name, size = 48, selected }: { name: string; size?: number; selected: boolean }) {
  const meta = MEMBER_META[name];
  const [imgError, setImgError] = useState(false);
  if (!meta || imgError) {
    return (
      <div
        style={{
          width: size, height: size,
          borderRadius: '50%',
          background: meta?.color ?? '#1A3A5C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.32, fontWeight: 700, color: 'white',
          flexShrink: 0,
          border: selected ? '2.5px solid #FD6F2F' : '2px solid rgba(255,255,255,0.15)',
          transition: 'border-color 0.15s',
        }}
      >
        {meta?.initials ?? name.charAt(0)}
      </div>
    );
  }
  // Wrapper clips the slightly-zoomed image to a perfect circle,
  // hiding any orange border ring or background bleed from the source crop.
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        border: selected ? '2.5px solid #FD6F2F' : '2px solid rgba(255,255,255,0.15)',
        transition: 'border-color 0.15s',
        boxShadow: selected ? '0 0 0 3px rgba(253,111,47,0.2)' : 'none',
      }}
    >
      <img
        src={meta.photo}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
        }}
      />
    </div>
  );
}

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
  const [gees, setGees] = useState('');
  const [geesFined, setGeesFined] = useState('');
  const [geesImage, setGeesImage] = useState<string | null>(null);
  const [geesImageBusy, setGeesImageBusy] = useState(false);
  const [geesImageError, setGeesImageError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const name = sessionStorage.getItem('voterName');
    if (!name) { router.replace('/'); return; }
    setVoterName(name);

    // Edit mode: Matthew Norris re-entering. Pre-fill the form with his current submission.
    if (sessionStorage.getItem('editMode') === '1') {
      setEditing(true);
      fetch(`/api/my-votes?name=${encodeURIComponent(name)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data || data.error) return;
          if (data.votes && typeof data.votes === 'object') setVotes(data.votes);
          if (data.interaction) {
            setInteraction({
              aboutPerson: data.interaction.aboutPerson ?? '',
              description: data.interaction.description ?? '',
            });
          }
          if (typeof data.gees === 'string') setGees(data.gees);
          if (typeof data.geesFined === 'string') setGeesFined(data.geesFined);
          if (data.geesImage) setGeesImage(data.geesImage);
        })
        .catch(() => {});
    }
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

  const handleGeesImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setGeesImageError('Please choose an image file.'); return; }
    setGeesImageError('');
    setGeesImageBusy(true);
    try {
      const resized = await fileToResizedDataUrl(file);
      setGeesImage(resized);
    } catch {
      setGeesImageError('Could not read that image. Try a JPG or PNG.');
    } finally {
      setGeesImageBusy(false);
    }
  };

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
          gees: gees.trim() || undefined,
          geesImage: geesImage || undefined,
          geesFined: geesFined || undefined,
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
      sessionStorage.removeItem('editMode');
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
          <h1 className="text-4xl font-bold text-white mb-4">{editing ? 'Votes Updated!' : 'Votes Cast!'}</h1>
          <p className="text-lg mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Thank you, <strong className="text-white">{voterName}</strong>.
          </p>
          <p className="mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Your nominations have been recorded. Results will be announced at the end of the quarter.
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
            Employee of the Quarter
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {editing ? 'Edit your votes' : 'Cast your votes'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)' }}>
            {editing ? (
              <>Welcome back, <strong className="text-white">{voterName}</strong>. Your current picks are loaded below. Change anything and resubmit to update.</>
            ) : (
              <>Welcome, <strong className="text-white">{voterName}</strong>. Select up to 2 nominees per category.</>
            )}
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
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                            style={{
                              background: isSelected ? 'rgba(253,111,47,0.18)' : 'rgba(255,255,255,0.05)',
                              border: isSelected ? '1.5px solid rgba(253,111,47,0.7)' : '1.5px solid rgba(204,204,204,0.1)',
                              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                              boxShadow: isSelected ? '0 4px 16px rgba(253,111,47,0.2)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.border = '1.5px solid rgba(253,111,47,0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.border = '1.5px solid rgba(204,204,204,0.1)';
                              }
                            }}
                          >
                            <MemberAvatar name={member} size={40} selected={isSelected} />
                            <span
                              className="text-xs leading-snug"
                              style={{
                                color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.75)',
                                fontWeight: isSelected ? 700 : 500,
                              }}
                            >
                              {member}
                            </span>
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
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Share a specific moment that stood out to you this quarter.</p>

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

            {/* For the Gees */}
            <div
              className="rounded-2xl p-6 animate-fade-in-up"
              style={{
                background: '#122E4C',
                border: '1px solid rgba(204,204,204,0.1)',
                animationDelay: `${(CATEGORIES.length + 1) * 0.04}s`,
              }}
            >
              <h3 className="font-bold text-lg mb-1" style={{ color: '#FD6F2F' }}>The Fines 🚨</h3>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Just for the gees. Nominate someone on the team for a fine. You don&apos;t need to write a reason. None of this counts toward votes.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Who&apos;s getting fined?</label>
                  <select
                    value={geesFined}
                    onChange={(e) => setGeesFined(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(204,204,204,0.2)',
                      color: geesFined ? 'white' : 'rgba(255,255,255,0.35)',
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
                    <label className="block text-sm font-medium text-white">Reason (optional)</label>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{gees.length}/500</span>
                  </div>
                  <textarea
                    value={gees}
                    onChange={(e) => setGees(e.target.value.slice(0, 500))}
                    placeholder="What did they do? (optional, purely for the gees)"
                    rows={3}
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

                {/* Optional evidence image */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Evidence (optional)</label>
                  {!geesImage ? (
                    <label
                      className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm cursor-pointer transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(253,111,47,0.4)',
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      <span>📎</span>
                      <span>{geesImageBusy ? 'Processing…' : 'Choose an image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGeesImage}
                      />
                    </label>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={geesImage}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '0.75rem', border: '1px solid rgba(204,204,204,0.15)', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => setGeesImage(null)}
                        className="absolute top-2 right-2 rounded-full text-white text-xs font-bold flex items-center justify-center"
                        style={{ background: 'rgba(15,37,64,0.85)', border: '1px solid rgba(255,255,255,0.2)', width: '28px', height: '28px' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {geesImageError && (
                    <p className="text-xs mt-2" style={{ color: '#ff8c52' }}>{geesImageError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pb-10 animate-fade-in-up" style={{ animationDelay: `${(CATEGORIES.length + 2) * 0.04}s` }}>
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
                {submitting
                  ? (editing ? 'Updating your votes…' : 'Submitting your votes…')
                  : (editing ? '✦  Update My Votes  ✦' : '✦  Submit My Votes  ✦')}
              </button>
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {editing ? 'You can come back and edit your votes again anytime.' : 'Once submitted, your votes cannot be changed.'}
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
                          <div className="flex items-center gap-2 min-w-0">
                            <MemberAvatar name={member} size={28} selected={false} />
                            <span className="text-xs font-medium text-white truncate">{member}</span>
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
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
