'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUARTERS, type Quarter } from '@/lib/winners';

function WinnerCard({ quarter }: { quarter: Quarter }) {
  const hasWinner = quarter.winnerName !== null;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center text-center transition-all"
      style={{
        background: hasWinner ? '#122E4C' : 'rgba(18,46,76,0.45)',
        border: hasWinner
          ? '1px solid rgba(253,111,47,0.22)'
          : '1px solid rgba(204,204,204,0.06)',
        boxShadow: hasWinner ? '0 8px 32px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      {/* Portrait area */}
      <div className="mb-3 mt-1">
        {hasWinner ? (
          quarter.photo ? (
            <img
              src={quarter.photo}
              alt={quarter.winnerName!}
              className="w-16 h-16 rounded-full object-cover"
              style={{
                border: '2px solid rgba(253,111,47,0.5)',
                boxShadow: '0 4px 16px rgba(253,111,47,0.25)',
              }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{
                background: '#FD6F2F',
                boxShadow: '0 4px 16px rgba(253,111,47,0.3)',
              }}
            >
              {quarter.winnerName!.charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          /* Empty portrait for future quarters */
          <div
            className="w-16 h-16 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          />
        )}
      </div>

      {/* Quarter label */}
      <div
        className="text-xs font-bold uppercase tracking-widest mb-0.5"
        style={{ color: hasWinner ? '#FD6F2F' : 'rgba(253,111,47,0.45)' }}
      >
        {quarter.label}
      </div>

      {/* Date range */}
      <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {quarter.dateRange}
      </div>

      {/* Winner name — only shown when a winner exists */}
      {hasWinner && (
        <div className="text-sm font-semibold text-white">{quarter.winnerName}</div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [admired, setAdmired] = useState(false);
  const router = useRouter();

  const nameInputRef  = useRef<HTMLInputElement>(null);
  const wallSectionRef = useRef<HTMLElement>(null);

  // Auto-admire once the Wall of Fame section has scrolled into view (≥50% visible)
  useEffect(() => {
    const section = wallSectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAdmired(true); },
      { threshold: 0.5 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleBeginVoting = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your full name to continue.');
      return;
    }

    if (trimmedName.toLowerCase() === 'admin') {
      router.push('/admin');
      return;
    }

    if (!admired) {
      setError('Please admire the Wall of Fame below before you can vote.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/check-voter?name=${encodeURIComponent(trimmedName)}`);
      const data = await res.json();

      if (data.hasVoted) {
        setError("It looks like you've already cast your votes. Each person can only vote once — thank you for participating!");
        setLoading(false);
        return;
      }

      sessionStorage.setItem('voterName', trimmedName);
      // Matthew Norris is allowed back in to edit; flag it so the vote form pre-fills.
      if (data.isEditor) {
        sessionStorage.setItem('editMode', '1');
      } else {
        sessionStorage.removeItem('editMode');
      }
      router.push('/vote');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Called by the explicit admire button at the bottom of the wall
  const handleAdmire = () => {
    setAdmired(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus the name input once the scroll has settled
    setTimeout(() => nameInputRef.current?.focus(), 600);
  };

  // Shared disabled / muted state for the Begin Voting button
  const btnDisabled = loading || !admired;

  return (
    <>
      {/* ── Hero / entry section ─────────────────────────────────────────── */}
      <main
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
        style={{ background: 'linear-gradient(160deg, #0F2540 0%, #0A1928 60%, #0F2540 100%)' }}
      >
        {/* Orange radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(253,111,47,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">

          {/* Logo */}
          <div className="mb-10 text-center animate-fade-in-up" style={{ animationDelay: '0s' }}>
            <img
              src="/logo-transparent.png"
              alt="WealthPoint Capital"
              style={{ height: '72px', width: 'auto', maxWidth: '280px', display: 'block', margin: '0 auto', filter: 'brightness(1.15)' }}
            />
          </div>

          {/* Hero text */}
          <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h1 className="font-bold text-white leading-[1.1] mb-5" style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}>
              Dare to be{' '}
              <span
                className="italic"
                style={{ color: '#FD6F2F', fontFamily: 'Georgia, serif' }}
              >
                great.
              </span>
            </h1>
            <p className="text-sm tracking-widest uppercase font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Employee of the Quarter Awards
            </p>
          </div>

          {/* Card */}
          <div
            className="w-full animate-fade-in-up"
            style={{
              animationDelay: '0.3s',
              background: '#122E4C',
              border: '1px solid rgba(204,204,204,0.15)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <label className="block text-sm font-medium mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Your Full Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => {
                // Enter is not a valid way in for voters. They must admire the Wall of Fame first.
                // Kept only as a quick path to the admin dashboard.
                if (e.key === 'Enter' && name.trim().toLowerCase() === 'admin') handleBeginVoting();
              }}
              placeholder="e.g. Jane Doe"
              className="w-full text-white rounded-xl px-4 py-3.5 text-base focus:outline-none transition-all mb-5"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(204,204,204,0.2)',
                color: 'white',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(253,111,47,0.6)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(204,204,204,0.2)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }}
            />

            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-xl text-sm leading-relaxed"
                style={{
                  background: 'rgba(253,111,47,0.1)',
                  border: '1px solid rgba(253,111,47,0.35)',
                  color: '#FD6F2F',
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleBeginVoting}
              disabled={btnDisabled}
              className="w-full font-bold py-4 rounded-xl transition-all duration-200 text-base tracking-wide text-white"
              style={{
                background: btnDisabled ? 'rgba(253,111,47,0.4)' : '#FD6F2F',
                boxShadow: btnDisabled ? 'none' : '0 8px 28px rgba(253,111,47,0.35)',
              }}
              onMouseEnter={(e) => {
                if (!btnDisabled) {
                  e.currentTarget.style.background = '#ff8c52';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(253,111,47,0.45)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = btnDisabled ? 'rgba(253,111,47,0.4)' : '#FD6F2F';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = btnDisabled ? 'none' : '0 8px 28px rgba(253,111,47,0.35)';
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            >
              {loading ? 'Checking…' : 'Begin Voting →'}
            </button>

            {/* Gate helper line */}
            {admired ? (
              <p
                className="mt-3 text-center text-xs"
                style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.03em' }}
              >
                Thank you for admiring. You may now vote.
              </p>
            ) : (
              <div
                className="mt-4 px-4 py-3 rounded-xl text-center text-sm font-bold tracking-wide flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(253,111,47,0.12)',
                  border: '1px solid rgba(253,111,47,0.5)',
                  color: '#FD6F2F',
                }}
              >
                SCROLL DOWN AND ADMIRE THE WALL OF FAME FIRST
                <span className="animate-bounce-down" aria-hidden="true">↓</span>
              </div>
            )}
          </div>

          <p
            className="mt-8 text-center text-xs animate-fade-in-up"
            style={{ color: 'rgba(255,255,255,0.2)', animationDelay: '0.45s', letterSpacing: '0.05em' }}
          >
            Your votes are confidential and contribute to our quarterly recognition.
          </p>
        </div>
      </main>

      {/* ── Wall of Fame ─────────────────────────────────────────────────── */}
      <section
        ref={wallSectionRef}
        className="py-16 px-4"
        style={{
          background: '#0A1928',
          borderTop: '1px solid rgba(204,204,204,0.08)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Wall of Fame</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Employee of the Quarter — all-time winners
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {QUARTERS.map(q => (
              <WinnerCard key={q.id} quarter={q} />
            ))}
          </div>

          {/* Admire button */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleAdmire}
              className="font-bold py-4 px-8 rounded-xl transition-all duration-200 text-base tracking-wide text-white"
              style={{
                background: '#FD6F2F',
                boxShadow: '0 8px 28px rgba(253,111,47,0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ff8c52';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 36px rgba(253,111,47,0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FD6F2F';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(253,111,47,0.35)';
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            >
              I have admired the Wall of Fame, let me vote
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
