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
  gees: { voter_name: string; fined_person?: string | null; content: string; image?: string | null; created_at: string }[];
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
  const [generating, setGenerating]         = useState(false);
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

  // ── PPTX export ──────────────────────────────────────────────────────────
  const handleDownloadPptx = async () => {
    if (!data) return;
    setGenerating(true);
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();

      const NAVY  = '0F2540';
      const CARD  = '122E4C';
      const ORANGE = 'FD6F2F';
      const WHITE  = 'FFFFFF';
      const DIM    = 'A0B4C8';
      const STEEL  = '2E86AB';
      const DARK_BLUE = '1A3A5C';
      const W = 13.33;
      const H = 7.5;

      type Slide = ReturnType<typeof pptx.addSlide>;

      const toBase64 = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror   = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch { return null; }
      };

      const memberPhoto: Record<string, string> = {
        'Steve Staplyton Smith': '/team/steve.png',
        'Adam Turk':             '/team/adam.png',
        'Jan Faure':             '/team/jan.png',
        'Matthew Norris':        '/team/matthew.png',
        'James Booth':           '/team/james-booth.png',
        'James Poole':           '/team/james-poole.png',
        'Kira Williams':         '/team/kira.png',
        'Candice Boshoff':       '/team/candice.png',
      };

      const logoB64 = await toBase64('/logo-transparent.png');
      const photoCache: Record<string, string | null> = {};
      for (const [name, path] of Object.entries(memberPhoto)) {
        photoCache[name] = await toBase64(path);
      }
      const geeImgCache: (string | null)[] = [];
      for (const g of data.gees) {
        geeImgCache.push(g.image ? await toBase64(g.image) : null);
      }

      const now2 = new Date();
      const q2   = Math.ceil((now2.getMonth() + 1) / 3);
      const ql   = currentQuarterLabel();
      const fileName = `WPC-EOTQ-Q${q2}-${now2.getFullYear()}.pptx`;

      pptx.layout  = 'LAYOUT_WIDE';
      pptx.author  = 'WealthPoint Capital';
      pptx.title   = `Employee of the Quarter - ${ql}`;

      const CAT_DESC: Record<string, string> = {
        cornerstone:     'The foundation others build on. Consistent, dependable, and unshakeable - the person the whole team quietly relies on to deliver, without fail, every single time.',
        pilot:           "Committed to growth - theirs and others'. They invest in becoming sharper, more skilled, and more effective every quarter. Always learning, always improving.",
        craftsman:       'Takes genuine pride in doing their work exceptionally well. Accuracy, quality, and attention to detail are non-negotiable standards - not a checklist.',
        energy_giver:    'Walks into a room and raises the temperature. Their attitude is contagious, their encouragement is real, and they make everyone around them better just by being present.',
        night_watchman:  'When the moment demanded more than the job description, they delivered - quietly, without fanfare, after hours if needed. Whatever it took. No questions asked.',
        connector:       'Bridges people, ideas, and teams. Builds relationships internally and externally that move the business forward.',
        clear_head:      'Brought calm, clarity, and good judgment in a moment of pressure, complexity, or ambiguity.',
        client_champion: 'Went above and beyond to deliver an exceptional client or stakeholder experience. They made people feel heard, valued, and genuinely well looked after.',
        culture_keeper:  'Actively protects and enriches what makes Wealthpoint special. Lives the values. Sets the tone. Leads by example.',
        dark_horse:      "The unsung hero. Quietly exceptional, never seeking the spotlight - yet their contribution, dedication and impact are felt by everyone. This one's for the person who deserves far more recognition than they ever ask for.",
      };

      const addBg = (s: Slide) => {
        s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: NAVY }, line: { color: NAVY } });
      };

      const addHeader = (s: Slide) => {
        if (logoB64) {
          s.addImage({ data: logoB64, x: 0.5, y: 0.32, w: 1.6, h: 0.52 });
        } else {
          s.addText('WC', { x: 0.5, y: 0.32, w: 1.6, h: 0.52, fontSize: 14, bold: true, color: WHITE, fontFace: 'Calibri' });
        }
        s.addText(`${ql} AWARDS`, { x: W - 3.6, y: 0.32, w: 3.1, h: 0.52, fontSize: 12, color: DIM, align: 'right', fontFace: 'Calibri' });
        s.addShape('rect', { x: 0, y: 1.0, w: W, h: 0.04, fill: { color: DARK_BLUE }, line: { color: DARK_BLUE } });
      };

      const addPill = (s: Slide, x: number, y: number, label: string) => {
        const pillW = Math.max(label.length * 0.1 + 0.35, 1.5);
        s.addShape('roundRect', { x, y, w: pillW, h: 0.3, fill: { color: ORANGE }, line: { color: ORANGE }, rectRadius: 0.08 });
        s.addText(label, { x, y, w: pillW, h: 0.3, fontSize: 9, bold: true, color: WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
      };

      const addPhotoOrInitial = (s: Slide, name: string, x: number, y: number, d: number) => {
        const photo = photoCache[name];
        if (photo) {
          s.addImage({ data: photo, x, y, w: d, h: d, rounding: true });
        } else {
          s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: ORANGE }, line: { color: ORANGE } });
          s.addText(name.charAt(0).toUpperCase(), { x, y, w: d, h: d, fontSize: Math.round(d * 14), bold: true, color: WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
        }
      };

      // ── Slide 1: Title ────────────────────────────────────────────────────────
      {
        const s = pptx.addSlide();
        addBg(s);
        const bandY = 2.8, bandH = 2.8;
        s.addShape('rect', { x: 0, y: bandY,          w: W, h: bandH,  fill: { color: CARD },   line: { color: CARD } });
        s.addShape('rect', { x: 0, y: bandY,          w: W, h: 0.06,   fill: { color: ORANGE }, line: { color: ORANGE } });
        s.addShape('rect', { x: 0, y: bandY + bandH,  w: W, h: 0.06,   fill: { color: ORANGE }, line: { color: ORANGE } });
        if (logoB64) {
          s.addImage({ data: logoB64, x: (W - 3.4) / 2, y: 0.8, w: 3.4, h: 1.35 });
        } else {
          s.addText('WealthPoint Capital', { x: 1, y: 0.8, w: W - 2, h: 1.35, fontSize: 22, bold: true, color: WHITE, align: 'center', fontFace: 'Calibri' });
        }
        s.addText('EMPLOYEE OF THE QUARTER', { x: 1, y: 2.95, w: W - 2, h: 1.15, fontSize: 52, bold: true, color: WHITE, align: 'center', fontFace: 'Calibri' });
        s.addText('AWARDS', { x: 1, y: 4.15, w: W - 2, h: 0.75, fontSize: 34, color: ORANGE, align: 'center', charSpacing: 8, fontFace: 'Calibri' });
        s.addText(`${ql}  ·  Wealthpoint Capital`, { x: 1, y: 5.0, w: W - 2, h: 0.45, fontSize: 14, color: DIM, align: 'center', fontFace: 'Calibri' });
        s.addText('Dare to be great.', { x: 1, y: 5.52, w: W - 2, h: 0.42, fontSize: 13, italic: true, color: DIM, align: 'center', fontFace: 'Calibri' });
      }

      // ── Slides 2-11: One per category ─────────────────────────────────────────
      for (const cat of CATEGORIES_ORDER) {
        const s = pptx.addSlide();
        addBg(s);
        addHeader(s);

        const catVotes   = data.votesByCategory[cat] ?? {};
        const sortedCat  = Object.entries(catVotes).sort((a, b) => b[1] - a[1]);
        const topCount   = sortedCat[0]?.[1] ?? 0;
        const catWinners = topCount > 0 ? sortedCat.filter(([, c]) => c === topCount).map(([n]) => n) : [];
        const runnerUp   = sortedCat.find(([n, c]) => !catWinners.includes(n) && c > 0);
        const isCatTie   = catWinners.length > 1;
        const desc       = CAT_DESC[cat] ?? '';

        addPill(s, 0.6, 1.2, 'AWARD CATEGORY');
        s.addText(CATEGORY_DISPLAY[cat], { x: 0.6, y: 1.62, w: W - 1.2, h: 0.82, fontSize: 34, bold: true, color: WHITE, fontFace: 'Calibri' });
        s.addShape('rect', { x: 0.6, y: 2.48, w: 0.9, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });
        s.addText(desc, { x: 0.6, y: 2.62, w: W - 1.2, h: 0.46, fontSize: 11, italic: true, color: DIM, fontFace: 'Calibri' });

        const cardX = 0.6, cardY = 3.18, cardW = W - 1.2, cardH = 3.55;
        s.addShape('rect', { x: cardX, y: cardY, w: cardW, h: cardH, fill: { color: DARK_BLUE }, line: { color: DARK_BLUE } });

        if (catWinners.length === 0) {
          s.addText('No votes recorded', { x: cardX, y: cardY + cardH / 2 - 0.3, w: cardW, h: 0.6, fontSize: 18, color: DIM, align: 'center', fontFace: 'Calibri' });
        } else if (!isCatTie) {
          const winner = catWinners[0];
          const d = 1.85;
          const photoX = cardX + (cardW - d) / 2;
          const photoY = cardY + 0.6;
          s.addText('WINNER', { x: cardX, y: cardY + 0.12, w: cardW, h: 0.38, fontSize: 13, bold: true, color: ORANGE, align: 'center', fontFace: 'Calibri' });
          addPhotoOrInitial(s, winner, photoX, photoY, d);
          s.addText(winner, { x: cardX, y: photoY + d + 0.16, w: cardW, h: 0.62, fontSize: 24, bold: true, color: WHITE, align: 'center', fontFace: 'Calibri' });
          s.addText(`${ql} Award Recipient`, { x: cardX, y: photoY + d + 0.82, w: cardW, h: 0.32, fontSize: 11, color: DIM, align: 'center', fontFace: 'Calibri' });

          if (runnerUp) {
            const ruY = cardY + cardH + 0.14;
            s.addShape('rect', { x: cardX, y: ruY, w: cardW, h: 0.56, fill: { color: CARD }, line: { color: CARD } });
            s.addText('RUNNER-UP', { x: cardX + 0.2, y: ruY, w: 1.3, h: 0.56, fontSize: 9, color: DIM, valign: 'middle', fontFace: 'Calibri' });
            addPhotoOrInitial(s, runnerUp[0], cardX + 1.65, ruY + 0.03, 0.5);
            s.addText(runnerUp[0], { x: cardX + 2.3, y: ruY, w: cardW - 2.5, h: 0.56, fontSize: 15, bold: true, color: WHITE, valign: 'middle', fontFace: 'Calibri' });
          }
        } else {
          const d = Math.min(1.55, (cardW - 0.4) / catWinners.length - 0.5);
          const totalTieW = catWinners.length * (d + 0.45) - 0.45;
          const tieStartX = cardX + (cardW - totalTieW) / 2;
          s.addText('WINNERS', { x: cardX, y: cardY + 0.12, w: cardW, h: 0.38, fontSize: 13, bold: true, color: ORANGE, align: 'center', fontFace: 'Calibri' });
          catWinners.forEach((wname, i) => {
            const wx = tieStartX + i * (d + 0.45);
            const wy = cardY + 0.65;
            addPhotoOrInitial(s, wname, wx, wy, d);
            s.addText(wname, { x: wx - 0.1, y: wy + d + 0.1, w: d + 0.2, h: 0.46, fontSize: 12, bold: true, color: WHITE, align: 'center', fontFace: 'Calibri' });
          });
          s.addText(`${ql} Award Recipients`, { x: cardX, y: cardY + cardH - 0.42, w: cardW, h: 0.34, fontSize: 11, color: DIM, align: 'center', fontFace: 'Calibri' });
        }
      }

      // ── Slide 12: Honourable Mentions ──────────────────────────────────────────
      {
        const mentions = Object.keys(memberPhoto).map(name => {
          const cats = CATEGORIES_ORDER.filter(c => (data.votesByCategory[c]?.[name] ?? 0) > 0);
          return { name, cats };
        }).filter(m => m.cats.length > 0).sort((a, b) => b.cats.length - a.cats.length);

        const rowsPerSlide = 6;
        const totalMentionSlides = Math.ceil(mentions.length / rowsPerSlide) || 1;
        for (let pg = 0; pg < totalMentionSlides; pg++) {
          const chunk = mentions.slice(pg * rowsPerSlide, (pg + 1) * rowsPerSlide);
          const s = pptx.addSlide();
          addBg(s);
          addHeader(s);
          addPill(s, 0.6, 1.2, 'HONOURABLE MENTIONS');
          s.addText('Across Multiple Categories', { x: 0.6, y: 1.62, w: W - 1.2, h: 0.82, fontSize: 34, bold: true, color: WHITE, fontFace: 'Calibri' });
          s.addShape('rect', { x: 0.6, y: 2.48, w: 0.9, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });
          s.addText('These team members received nominations in multiple award categories this quarter.', { x: 0.6, y: 2.62, w: W - 1.2, h: 0.45, fontSize: 11, italic: true, color: DIM, fontFace: 'Calibri' });
          chunk.forEach((m, i) => {
            const ry = 3.25 + i * 0.68;
            const pillW = Math.max((`${m.cats.length} CATEGORIES`).length * 0.1 + 0.35, 1.5);
            s.addShape('roundRect', { x: W - 0.6 - pillW, y: ry + 0.08, w: pillW, h: 0.3, fill: { color: ORANGE }, line: { color: ORANGE }, rectRadius: 0.08 });
            s.addText(`${m.cats.length} CATEGORIES`, { x: W - 0.6 - pillW, y: ry + 0.08, w: pillW, h: 0.3, fontSize: 9, bold: true, color: WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
            s.addText(`${i + 1 + pg * rowsPerSlide}.`, { x: 0.6, y: ry, w: 0.55, h: 0.55, fontSize: 14, bold: true, color: ORANGE, valign: 'middle', fontFace: 'Calibri' });
            s.addText(m.name, { x: 1.2, y: ry, w: 3.5, h: 0.55, fontSize: 14, bold: true, color: WHITE, valign: 'middle', fontFace: 'Calibri' });
            const catNames = m.cats.map(c => CATEGORY_DISPLAY[c]).join(' · ');
            s.addText(catNames, { x: 4.8, y: ry, w: W - 4.8 - pillW - 0.8, h: 0.55, fontSize: 10, color: DIM, valign: 'middle', fontFace: 'Calibri' });
          });
        }
      }

      // ── Slide 13: Memorable Moments ────────────────────────────────────────────
      if (data.interactions.length > 0) {
        const perMoment = 3;
        const totalMomentPages = Math.ceil(data.interactions.length / perMoment);
        for (let pg = 0; pg < totalMomentPages; pg++) {
          const chunk = data.interactions.slice(pg * perMoment, (pg + 1) * perMoment);
          const s = pptx.addSlide();
          addBg(s);
          addHeader(s);
          addPill(s, 0.6, 1.2, 'MEMORABLE MOMENTS');
          s.addText('Highlights of the Quarter', { x: 0.6, y: 1.62, w: W - 1.2, h: 0.82, fontSize: 34, bold: true, color: WHITE, fontFace: 'Calibri' });
          s.addShape('rect', { x: 0.6, y: 2.48, w: 0.9, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });
          s.addText('A highlights reel of standout moments, as shared by the team.', { x: 0.6, y: 2.62, w: W - 1.2, h: 0.45, fontSize: 11, italic: true, color: DIM, fontFace: 'Calibri' });
          chunk.forEach((item, i) => {
            const cy2 = 3.25 + i * 1.38;
            s.addShape('rect', { x: 0.6, y: cy2, w: W - 1.2, h: 1.25, fill: { color: CARD }, line: { color: CARD } });
            s.addText(`About: ${item.about_person}`, { x: 0.8, y: cy2 + 0.1, w: 5.5, h: 0.3, fontSize: 10, bold: true, color: ORANGE, fontFace: 'Calibri' });
            s.addText(`shared by ${item.voter_name}`, { x: W - 5.2, y: cy2 + 0.1, w: 4.4, h: 0.3, fontSize: 10, color: DIM, align: 'right', fontFace: 'Calibri' });
            s.addText(item.description.slice(0, 240), { x: 0.8, y: cy2 + 0.46, w: W - 1.6, h: 0.7, fontSize: 10.5, italic: true, color: WHITE, fontFace: 'Calibri' });
          });
        }
      }

      // ── Slide 14: Fines ────────────────────────────────────────────────────────
      if (data.gees.length > 0) {
        const geePairs = data.gees.map((g, i) => ({ g, img: geeImgCache[i] ?? null }));
        const textOnlyFines = geePairs.filter(p => !p.img);
        const imageFines    = geePairs.filter(p => !!p.img);

        // (a) Text-only fines - 3 per slide
        if (textOnlyFines.length > 0) {
          const perFine = 3;
          const totalFinePages = Math.ceil(textOnlyFines.length / perFine);
          for (let pg = 0; pg < totalFinePages; pg++) {
            const chunk = textOnlyFines.slice(pg * perFine, (pg + 1) * perFine);
            const s = pptx.addSlide();
            addBg(s);
            addHeader(s);
            addPill(s, 0.6, 1.2, 'FOR THE GEES');
            s.addText('The Fines', { x: 0.6, y: 1.62, w: W - 1.2, h: 0.82, fontSize: 34, bold: true, color: WHITE, fontFace: 'Calibri' });
            s.addShape('rect', { x: 0.6, y: 2.48, w: 0.9, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });
            s.addText('Because some moments deserve to be remembered forever.', { x: 0.6, y: 2.62, w: W - 1.2, h: 0.45, fontSize: 11, italic: true, color: DIM, fontFace: 'Calibri' });
            chunk.forEach(({ g }, i) => {
              const cy2 = 3.25 + i * 1.38;
              const cH2 = 1.25;
              s.addShape('rect', { x: 0.6, y: cy2, w: W - 1.2, h: cH2, fill: { color: CARD }, line: { color: CARD } });
              const headerText = g.fined_person ? `${g.voter_name} fined ${g.fined_person}` : g.voter_name;
              s.addText(headerText, { x: 0.8, y: cy2 + 0.1, w: W - 1.6, h: 0.3, fontSize: 11, bold: true, color: ORANGE, fontFace: 'Calibri' });
              s.addText(g.content.slice(0, 240), { x: 0.8, y: cy2 + 0.46, w: W - 1.6, h: 0.7, fontSize: 10.5, color: WHITE, fontFace: 'Calibri' });
            });
          }
        }

        // (b) Image fines - one dedicated slide each
        imageFines.forEach(({ g, img }) => {
          const s = pptx.addSlide();
          addBg(s);
          addHeader(s);
          addPill(s, 0.6, 1.12, 'FOR THE GEES');
          s.addText('The Fines', { x: 0.6, y: 1.46, w: W - 1.2, h: 0.44, fontSize: 26, bold: true, color: WHITE, fontFace: 'Calibri' });
          const headerText = g.fined_person ? `${g.voter_name} fined ${g.fined_person}` : g.voter_name;
          s.addText(headerText, { x: 0.6, y: 1.94, w: W - 1.2, h: 0.32, fontSize: 14, bold: true, color: ORANGE, fontFace: 'Calibri' });
          s.addText(g.content.slice(0, 160), { x: 0.6, y: 2.28, w: W - 1.2, h: 0.3, fontSize: 10, color: WHITE, fontFace: 'Calibri' });
          // Frame then image - contain sizing so the full picture is always visible
          const boxX = 1.0, boxY = 2.6, boxW = 11.33, boxH = 4.6;
          s.addShape('rect', { x: boxX - 0.1, y: boxY - 0.08, w: boxW + 0.2, h: boxH + 0.16, fill: { color: CARD }, line: { color: CARD } });
          s.addImage({ data: img!, x: boxX, y: boxY, w: boxW, h: boxH, sizing: { type: 'contain', w: boxW, h: boxH } });
        });
      }

      // ── Slide 15: By the Numbers ───────────────────────────────────────────────
      {
        const s = pptx.addSlide();
        addBg(s);
        addHeader(s);
        addPill(s, 0.6, 1.2, 'BY THE NUMBERS');
        s.addText('Voting Statistics', { x: 0.6, y: 1.62, w: W - 1.2, h: 0.82, fontSize: 34, bold: true, color: WHITE, fontFace: 'Calibri' });
        s.addShape('rect', { x: 0.6, y: 2.48, w: 0.9, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });
        s.addText(`A snapshot of participation and engagement for ${ql}.`, { x: 0.6, y: 2.62, w: W - 1.2, h: 0.45, fontSize: 11, italic: true, color: DIM, fontFace: 'Calibri' });

        const participationRate = Math.round((data.voters.length / Object.keys(memberPhoto).length) * 100) + '%';
        const stats4 = [
          { label: 'Voters Participated',  value: String(data.voters.length) },
          { label: 'Total Votes Cast',     value: String(data.totalVotesCount) },
          { label: 'Participation Rate',   value: participationRate },
          { label: 'Memorable Moments',    value: String(data.interactions.length) },
        ];
        const cw4 = 2.8, ch4 = 1.55, cy4 = 3.25, gap4 = 0.38;
        const startX4 = (W - (stats4.length * cw4 + (stats4.length - 1) * gap4)) / 2;
        stats4.forEach((st, i) => {
          const cx4 = startX4 + i * (cw4 + gap4);
          s.addShape('rect', { x: cx4, y: cy4, w: cw4, h: ch4, fill: { color: CARD }, line: { color: CARD } });
          s.addText(st.value, { x: cx4, y: cy4 + 0.16, w: cw4, h: 0.9, fontSize: 44, bold: true, color: ORANGE, align: 'center', fontFace: 'Calibri' });
          s.addText(st.label, { x: cx4, y: cy4 + 1.14, w: cw4, h: 0.32, fontSize: 11, color: DIM, align: 'center', fontFace: 'Calibri' });
        });

        let closestCat = '';
        let closestGap = Infinity;
        let closestMax = 0;
        CATEGORIES_ORDER.forEach(cat => {
          const counts = Object.values(data.votesByCategory[cat] ?? {}).sort((a, b) => b - a);
          if (counts.length === 0) return;
          const gap = counts[0] - (counts[1] ?? 0);
          const total = counts.reduce((acc, c) => acc + c, 0);
          if (gap < closestGap || (gap === closestGap && total > closestMax)) {
            closestGap = gap; closestCat = cat; closestMax = total;
          }
        });
        if (closestCat) {
          const crY = cy4 + ch4 + 0.32;
          s.addShape('rect', { x: 0.6, y: crY, w: W - 1.2, h: 0.8, fill: { color: CARD }, line: { color: CARD } });
          s.addText('CLOSEST RACE', { x: 0.8, y: crY + 0.1, w: 2.4, h: 0.28, fontSize: 10, bold: true, color: ORANGE, fontFace: 'Calibri' });
          s.addText(CATEGORY_DISPLAY[closestCat], { x: 0.8, y: crY + 0.4, w: 5.0, h: 0.3, fontSize: 14, bold: true, color: WHITE, fontFace: 'Calibri' });
          s.addText(`Top two nominees were separated by just ${closestGap} vote${closestGap === 1 ? '' : 's'}.`, { x: 6.2, y: crY + 0.1, w: W - 6.8, h: 0.6, fontSize: 11, italic: true, color: DIM, valign: 'middle', fontFace: 'Calibri' });
        }

        s.addText(`Thank you to everyone who participated in ${ql} Employee of the Quarter Awards.`, { x: 0.6, y: H - 0.88, w: W - 1.2, h: 0.3, fontSize: 10, color: DIM, align: 'center', fontFace: 'Calibri' });
        s.addText('Wealthpoint Capital  ·  Dare to be great.', { x: 0.6, y: H - 0.54, w: W - 1.2, h: 0.28, fontSize: 10, italic: true, color: DIM, align: 'center', fontFace: 'Calibri' });
      }

      // ── Slide 16: Suspense ─────────────────────────────────────────────────────
      {
        const s = pptx.addSlide();
        addBg(s);
        const bandY2 = H / 2 - 1.05, bandH2 = 2.1;
        s.addShape('rect', { x: 0, y: bandY2,           w: W, h: bandH2, fill: { color: CARD },   line: { color: CARD } });
        s.addShape('rect', { x: 0, y: bandY2,           w: W, h: 0.06,   fill: { color: ORANGE }, line: { color: ORANGE } });
        s.addShape('rect', { x: 0, y: bandY2 + bandH2,  w: W, h: 0.06,   fill: { color: ORANGE }, line: { color: ORANGE } });
        s.addText('AND THE EMPLOYEE OF THE QUARTER IS...', { x: 0.5, y: bandY2 + 0.1, w: W - 1, h: bandH2 - 0.2, fontSize: 40, bold: true, color: WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
        if (logoB64) {
          s.addImage({ data: logoB64, x: (W - 2.5) / 2, y: bandY2 + bandH2 + 0.55, w: 2.5, h: 1.0 });
        }
      }

      // ── Slide 17: Overall Winner Reveal ────────────────────────────────────────
      {
        const sortedAll   = Object.entries(data.totalByNominee).sort((a, b) => b[1] - a[1]);
        const topScore    = sortedAll[0]?.[1] ?? 0;
        const winnerNames = sortedAll.filter(([, c]) => c === topScore).map(([n]) => n);
        const isFinalTie  = winnerNames.length > 1;
        const s = pptx.addSlide();
        addBg(s);
        s.addShape('rect', { x: 0, y: 0,        w: W, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });
        s.addShape('rect', { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });

        if (!isFinalTie && winnerNames[0]) {
          const winner = winnerNames[0];
          addPill(s, 0.6, 0.28, 'OVERALL WINNER');
          const d = 2.4;
          addPhotoOrInitial(s, winner, (W - d) / 2, 0.85, d);
          s.addText(winner, { x: 1, y: 0.85 + d + 0.2, w: W - 2, h: 0.95, fontSize: 40, bold: true, color: WHITE, align: 'center', fontFace: 'Calibri' });
          s.addText(`${topScore} votes received`, { x: 1, y: 0.85 + d + 1.2, w: W - 2, h: 0.48, fontSize: 20, bold: true, color: ORANGE, align: 'center', fontFace: 'Calibri' });
          s.addText('Most votes across all 10 award categories', { x: 1, y: 0.85 + d + 1.72, w: W - 2, h: 0.38, fontSize: 13, color: DIM, align: 'center', fontFace: 'Calibri' });

          const quote = data.interactions.find(item => item.about_person === winner);
          if (quote) {
            const qY = 0.85 + d + 2.2;
            s.addText('WHAT COLLEAGUES SAY', { x: 1, y: qY, w: W - 2, h: 0.28, fontSize: 10, color: DIM, align: 'center', fontFace: 'Calibri' });
            s.addShape('rect', { x: 1, y: qY + 0.32, w: W - 2, h: 0.95, fill: { color: CARD }, line: { color: CARD } });
            s.addText(`"${quote.description.slice(0, 180)}"`, { x: 1.2, y: qY + 0.38, w: W - 2.4, h: 0.6, fontSize: 10.5, italic: true, color: WHITE, fontFace: 'Calibri' });
            s.addText(`-- ${quote.voter_name}`, { x: 1.2, y: qY + 1.0, w: W - 2.4, h: 0.22, fontSize: 9, color: DIM, align: 'right', fontFace: 'Calibri' });
          }
        } else {
          s.addText("IT'S A TIE!", { x: 1, y: 1.0, w: W - 2, h: 1.1, fontSize: 54, bold: true, color: ORANGE, align: 'center', fontFace: 'Calibri' });
          s.addText(`${ql} - Joint Winners`, { x: 1, y: 2.15, w: W - 2, h: 0.6, fontSize: 20, color: DIM, align: 'center', fontFace: 'Calibri' });
          const d2 = Math.min(2.0, (W - 1.6) / winnerNames.length - 0.4);
          const totalW2 = winnerNames.length * (d2 + 0.4) - 0.4;
          const startX3 = (W - totalW2) / 2;
          winnerNames.forEach((wn, i) => {
            const wx = startX3 + i * (d2 + 0.4);
            addPhotoOrInitial(s, wn, wx, 2.9, d2);
            s.addText(wn, { x: wx - 0.15, y: 2.9 + d2 + 0.12, w: d2 + 0.3, h: 0.46, fontSize: 13, bold: true, color: WHITE, align: 'center', fontFace: 'Calibri' });
          });
          s.addText(`${topScore} votes each`, { x: 1, y: H - 1.05, w: W - 2, h: 0.45, fontSize: 16, color: ORANGE, align: 'center', fontFace: 'Calibri' });
        }
      }

      await pptx.writeFile({ fileName });
    } finally {
      setGenerating(false);
    }
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
            onClick={handleDownloadPptx}
            disabled={!data || loading || generating}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{
              background: (!data || loading || generating) ? 'rgba(253,111,47,0.12)' : 'rgba(253,111,47,0.18)',
              color: (!data || loading || generating) ? 'rgba(253,111,47,0.45)' : '#FD6F2F',
              border: '1px solid rgba(253,111,47,0.35)',
              cursor: (!data || loading || generating) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!data || loading || generating) return;
              e.currentTarget.style.background = 'rgba(253,111,47,0.32)';
              e.currentTarget.style.borderColor = 'rgba(253,111,47,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(253,111,47,0.18)';
              e.currentTarget.style.borderColor = 'rgba(253,111,47,0.35)';
            }}
          >
            {generating ? 'Building...' : 'Download Deck'}
          </button>
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
                  <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>The Fines 🚨 (for the gees)</h2>
                  {data.gees.length === 0 ? (
                    <div className="rounded-2xl p-8 text-center" style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}>
                      <div className="text-3xl mb-2">🚨</div>
                      <p style={{ color: 'rgba(255,255,255,0.35)' }}>No fines handed out yet.</p>
                    </div>
                  ) : (
                    data.gees.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-2xl p-5"
                        style={{ background: '#122E4C', border: '1px solid rgba(204,204,204,0.1)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            {item.fined_person && (
                              <span
                                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-1"
                                style={{ background: 'rgba(253,111,47,0.15)', color: '#FD6F2F', border: '1px solid rgba(253,111,47,0.25)' }}
                              >
                                🚨 Fine: {item.fined_person}
                              </span>
                            )}
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Issued by {item.voter_name}</div>
                          </div>
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
                            alt={`Fine evidence from ${item.voter_name}`}
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
