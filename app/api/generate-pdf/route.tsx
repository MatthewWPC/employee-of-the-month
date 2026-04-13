/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import {
  Document, Page, View, Text, Image, StyleSheet, renderToBuffer,
} from '@react-pdf/renderer';
import { sql, initializeSchema } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Utilities ────────────────────────────────────────────────────────────────

function loadImg(rel: string): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', rel));
    const ext = path.extname(rel).slice(1).toLowerCase();
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

function initials(name: string): string {
  return name.split(' ').map((w: string) => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function getQuarter(): { q: number; year: number } {
  return { q: 1, year: 2026 };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PHOTOS: Record<string, string> = {
  'Steve Staplyton Smith': 'team/steve.png',
  'Adam Turk':             'team/adam.png',
  'Jan Faure':             'team/jan.png',
  'Matthew Norris':        'team/matthew.png',
  'James Booth':           'team/james-booth.png',
  'James Poole':           'team/james-poole.png',
  'Kira Williams':         'team/kira.png',
  'Candice Boshoff':       'team/candice.png',
};

const CATEGORY_ORDER = [
  'cornerstone', 'pilot', 'craftsman', 'energy_giver', 'night_watchman',
  'connector', 'clear_head', 'client_champion', 'culture_keeper', 'dark_horse',
];

const CATEGORY_META: Record<string, { name: string; desc: string }> = {
  cornerstone:     { name: 'THE CORNERSTONE',     desc: 'The foundation others build on. Consistent, dependable, and unshakeable — the person the whole team quietly relies on to deliver, without fail, every single time.' },
  pilot:           { name: 'THE PILOT',           desc: "Committed to growth — theirs and others'. They invest in becoming sharper, more skilled, and more effective every quarter. Always learning, always improving." },
  craftsman:       { name: 'THE CRAFTSMAN',       desc: 'Takes genuine pride in doing their work exceptionally well. Accuracy, quality, and attention to detail are non-negotiable standards — not a checklist.' },
  energy_giver:    { name: 'THE ENERGY GIVER',    desc: 'Walks into a room and raises the temperature. Their attitude is contagious, their encouragement is real, and they make everyone around them better just by being present.' },
  night_watchman:  { name: 'THE NIGHT WATCHMAN',  desc: 'When the moment demanded more than the job description, they delivered — quietly, without fanfare, after hours if needed. Whatever it took. No questions asked.' },
  connector:       { name: 'THE CONNECTOR',       desc: 'Bridges people, ideas, and teams. Builds relationships internally and externally that move the business forward.' },
  clear_head:      { name: 'THE CLEAR HEAD',      desc: 'Brought calm, clarity, and good judgment in a moment of pressure, complexity, or ambiguity.' },
  client_champion: { name: 'THE CLIENT CHAMPION', desc: 'Went above and beyond to deliver an exceptional client or stakeholder experience. They made people feel heard, valued, and genuinely well looked after.' },
  culture_keeper:  { name: 'THE CULTURE KEEPER',  desc: 'Actively protects and enriches what makes Wealthpoint special. Lives the values. Sets the tone. Leads by example.' },
  dark_horse:      { name: 'THE DARK HORSE',      desc: "The unsung hero. Quietly exceptional, never seeking the spotlight — yet their contribution, dedication and impact are felt by everyone. This one's for the person who deserves far more recognition than they ever ask for." },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: { backgroundColor: '#0F2540', fontFamily: 'Helvetica', color: '#FFFFFF' },

  // Cover
  coverWrap: { flex: 1, backgroundColor: '#0A1928', alignItems: 'center', justifyContent: 'center', padding: 60 },
  coverLogo: { width: 200, marginBottom: 48 },
  coverAccent: { width: 50, height: 4, backgroundColor: '#FD6F2F', marginBottom: 28 },
  coverTitle: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 6, letterSpacing: 3 },
  coverSubtitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#FD6F2F', textAlign: 'center', letterSpacing: 8, marginBottom: 36 },
  coverDivider: { width: 220, height: 1, backgroundColor: '#1A3C5E', marginBottom: 24 },
  coverQuarter: { fontSize: 13, color: '#CCD6E0', textAlign: 'center', marginBottom: 10 },
  coverTagline: { fontSize: 12, fontFamily: 'Helvetica-Oblique', color: '#7A9CB8', textAlign: 'center' },

  // Content page wrapper — tighter padding
  contentWrap: { flex: 1, padding: 32 },

  // Page header — compact
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1A3C5E',
  },
  pageHeaderLogo: { width: 68, height: 20 },
  pageHeaderText: { fontSize: 7, color: '#7A9CB8', letterSpacing: 1 },

  // Badge
  badge: { backgroundColor: '#FD6F2F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, alignSelf: 'flex-start', marginBottom: 10 },
  badgeText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', letterSpacing: 2 },

  // Typography
  h1: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 4 },
  h2: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 3 },
  body: { fontSize: 9.5, color: '#CCD6E0', lineHeight: 1.5 },
  italic: { fontSize: 9.5, fontFamily: 'Helvetica-Oblique', color: '#CCD6E0', lineHeight: 1.5 },
  small: { fontSize: 8, color: '#7A9CB8' },

  // Boxes
  box: { backgroundColor: '#122E4C', borderRadius: 8, padding: 12, marginBottom: 8 },

  // Overall winner — big spotlight
  bigWinner: { alignItems: 'center', marginBottom: 20, marginTop: 6 },
  bigPhoto: { width: 110, height: 110, borderRadius: 55, marginBottom: 14 },
  bigPhotoPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FD6F2F', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bigInit: { fontSize: 40, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  bigName: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 5 },
  bigVotes: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#FD6F2F', textAlign: 'center', marginBottom: 3 },
  bigSub: { fontSize: 9, color: '#7A9CB8', textAlign: 'center' },

  // Quote block (used on overall winner page)
  quote: { backgroundColor: '#0A1928', borderLeftWidth: 3, borderLeftColor: '#FD6F2F', paddingLeft: 12, paddingVertical: 8, paddingRight: 10, marginTop: 8, borderRadius: 2 },
  quoteText: { fontSize: 9, fontFamily: 'Helvetica-Oblique', color: '#CCD6E0', lineHeight: 1.5 },
  quoteAttrib: { fontSize: 8, color: '#7A9CB8', marginTop: 4 },

  // ── Category page — winner spotlight layout ──────────────────────────────
  catName: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 6 },
  catDivider: { width: 36, height: 3, backgroundColor: '#FD6F2F', marginBottom: 12 },
  catDesc: { fontSize: 10, fontFamily: 'Helvetica-Oblique', color: '#CCD6E0', lineHeight: 1.5, marginBottom: 20 },

  winnerSpotlight: { backgroundColor: '#122E4C', borderRadius: 10, padding: 28, alignItems: 'center', marginTop: 4 },
  winnerLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FD6F2F', letterSpacing: 3, marginBottom: 18, textAlign: 'center' },
  catPhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 14 },
  catPhotoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FD6F2F', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  catPhotoInit: { fontSize: 36, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  winnerName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 6 },
  winnerQuarter: { fontSize: 9, color: '#7A9CB8', textAlign: 'center' },
  noVotes: { fontSize: 9, color: '#7A9CB8', textAlign: 'center', marginTop: 40 },

  // Runner-up row (below winner spotlight, single-winner only)
  runnerUpBox: { backgroundColor: '#0A1928', borderRadius: 8, padding: 14, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  runnerUpLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#7A9CB8', letterSpacing: 2, width: 72 },
  runnerUpPhoto: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  runnerUpPhotoPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3C5E', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  runnerUpInit: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#CCD6E0' },
  runnerUpName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#CCD6E0' },

  // Tied winners layout (stacked inside spotlight)
  tiedWinnerRow: { alignItems: 'center', marginBottom: 14 },
  tiedPhoto: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  tiedPhotoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FD6F2F', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tiedPhotoInit: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  tiedName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'center' },
  tiedDivider: { width: 30, height: 1, backgroundColor: '#1A3C5E', marginVertical: 10 },

  // ── Memorable Moments section ────────────────────────────────────────────
  momentCard: {
    backgroundColor: '#122E4C', borderRadius: 6, padding: 12, marginBottom: 7,
  },
  momentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  momentAboutPill: { backgroundColor: '#1A3C5E', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 },
  momentAboutText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FD6F2F' },
  momentBy: { fontSize: 8, color: '#7A9CB8' },
  momentDesc: { fontSize: 9.5, fontFamily: 'Helvetica-Oblique', color: '#CCD6E0', lineHeight: 1.4 },

  // Stats
  statRow: { flexDirection: 'row', marginBottom: 10 },
  statBox: { flex: 1, backgroundColor: '#122E4C', borderRadius: 8, padding: 12, marginRight: 8 },
  statBoxLast: { flex: 1, backgroundColor: '#122E4C', borderRadius: 8, padding: 12 },
  statValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FD6F2F', marginBottom: 3 },
  statLabel: { fontSize: 7.5, color: '#7A9CB8', letterSpacing: 1 },

  // Honourable mentions
  mentionRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1A3C5E' },
  mentionNum: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FD6F2F', width: 26 },
  mentionName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 2 },
  mentionCats: { fontSize: 8, color: '#7A9CB8', lineHeight: 1.4 },
});

// ─── Sub-components ──────────────────────────────────────────────────────────

function PageHeader({ logoSrc, label }: { logoSrc: string; label: string }) {
  return (
    <View style={S.pageHeader}>
      {logoSrc
        ? <Image src={logoSrc} style={S.pageHeaderLogo} />
        : <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FD6F2F' }}>Wealthpoint Capital</Text>
      }
      <Text style={S.pageHeaderText}>{label}</Text>
    </View>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View style={S.badge}><Text style={S.badgeText}>{text}</Text></View>
  );
}

// ─── Page Components ──────────────────────────────────────────────────────────

function CoverPage({ logoSrc, q, year }: { logoSrc: string; q: number; year: number }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.coverWrap}>
        {logoSrc ? <Image src={logoSrc} style={S.coverLogo} /> : null}
        <View style={S.coverAccent} />
        <Text style={S.coverTitle}>EMPLOYEE OF THE QUARTER</Text>
        <Text style={S.coverSubtitle}>AWARDS</Text>
        <View style={S.coverDivider} />
        <Text style={S.coverQuarter}>Q{q} {year}  ·  Wealthpoint Capital</Text>
        <Text style={S.coverTagline}>Dare to be great.</Text>
      </View>
    </Page>
  );
}

function OverallWinnerPage({
  winner, totalVotes, photoSrc, logoSrc, interactions, q, year,
}: {
  winner: string; totalVotes: number; photoSrc: string;
  logoSrc: string; interactions: Interaction[]; q: number; year: number;
}) {
  const about = interactions
    .filter(i => i.about_person.toLowerCase() === winner.toLowerCase())
    .slice(0, 2);

  return (
    <Page size="A4" style={S.page}>
      <View style={S.contentWrap}>
        <PageHeader logoSrc={logoSrc} label={`Q${q} ${year} AWARDS`} />
        <Badge text="OVERALL WINNER" />

        <View style={S.bigWinner}>
          {photoSrc
            ? <Image src={photoSrc} style={S.bigPhoto} />
            : <View style={S.bigPhotoPlaceholder}><Text style={S.bigInit}>{initials(winner)}</Text></View>}
          <Text style={S.bigName}>{winner}</Text>
          <Text style={S.bigVotes}>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} received</Text>
          <Text style={S.bigSub}>Most votes across all 10 award categories</Text>
        </View>

        {about.length > 0 && (
          <View>
            <Text style={[S.small, { letterSpacing: 1, marginBottom: 6 }]}>WHAT COLLEAGUES SAY</Text>
            {about.map((item, i) => (
              <View key={i} style={S.quote}>
                <Text style={S.quoteText}>{`\u201C${item.description}\u201D`}</Text>
                <Text style={S.quoteAttrib}>— {item.voter_name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  );
}

// Category page — winner spotlight only, no vote counts
function CategoryPage({
  catId, votesByCategory, photos, logoSrc, q, year,
}: {
  catId: string; votesByCategory: Record<string, Record<string, number>>;
  photos: Record<string, string>; logoSrc: string; q: number; year: number;
}) {
  const meta = CATEGORY_META[catId];
  const catVotes = votesByCategory[catId] ?? {};
  const sorted = Object.entries(catVotes).sort((a, b) => b[1] - a[1]);

  // Detect tie: all nominees sharing the highest vote count
  const maxVotes = sorted[0]?.[1] ?? 0;
  const tiedWinners = sorted.filter(([, count]) => count === maxVotes);
  const isTie = tiedWinners.length > 1;
  // Runner-up only exists when there is no tie
  const runnerUp = isTie ? null : sorted[1];

  return (
    <Page size="A4" style={S.page}>
      <View style={S.contentWrap}>
        <PageHeader logoSrc={logoSrc} label={`Q${q} ${year} AWARDS`} />
        <Badge text="AWARD CATEGORY" />
        <Text style={S.catName}>{meta.name}</Text>
        <View style={S.catDivider} />
        <Text style={S.catDesc}>{meta.desc}</Text>

        {sorted.length === 0 ? (
          <Text style={S.noVotes}>No votes recorded for this category.</Text>
        ) : isTie ? (
          /* ── Tie: show all tied winners, no runner-up ── */
          <View style={S.winnerSpotlight}>
            <Text style={S.winnerLabel}>WINNERS</Text>
            {tiedWinners.map(([name], i) => (
              <View key={name} style={S.tiedWinnerRow}>
                {i > 0 && <View style={S.tiedDivider} />}
                {photos[name]
                  ? <Image src={photos[name]} style={S.tiedPhoto} />
                  : <View style={S.tiedPhotoPlaceholder}><Text style={S.tiedPhotoInit}>{initials(name)}</Text></View>}
                <Text style={S.tiedName}>{name}</Text>
              </View>
            ))}
            <Text style={S.winnerQuarter}>Q{q} {year} Award Recipients</Text>
          </View>
        ) : (
          /* ── Single winner + optional runner-up ── */
          <>
            <View style={S.winnerSpotlight}>
              <Text style={S.winnerLabel}>WINNER</Text>
              {photos[tiedWinners[0][0]]
                ? <Image src={photos[tiedWinners[0][0]]} style={S.catPhoto} />
                : <View style={S.catPhotoPlaceholder}><Text style={S.catPhotoInit}>{initials(tiedWinners[0][0])}</Text></View>}
              <Text style={S.winnerName}>{tiedWinners[0][0]}</Text>
              <Text style={S.winnerQuarter}>Q{q} {year} Award Recipient</Text>
            </View>

            {runnerUp && (
              <View style={S.runnerUpBox}>
                <Text style={S.runnerUpLabel}>RUNNER-UP</Text>
                {photos[runnerUp[0]]
                  ? <Image src={photos[runnerUp[0]]} style={S.runnerUpPhoto} />
                  : <View style={S.runnerUpPhotoPlaceholder}><Text style={S.runnerUpInit}>{initials(runnerUp[0])}</Text></View>}
                <Text style={S.runnerUpName}>{runnerUp[0]}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </Page>
  );
}

function HonourableMentionsPage({
  mentions, logoSrc, q, year,
}: {
  mentions: { name: string; categories: string[] }[];
  logoSrc: string; q: number; year: number;
}) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.contentWrap}>
        <PageHeader logoSrc={logoSrc} label={`Q${q} ${year} AWARDS`} />
        <Badge text="HONOURABLE MENTIONS" />
        <Text style={S.h1}>Across Multiple Categories</Text>
        <Text style={[S.body, { marginBottom: 14 }]}>
          These team members received nominations in multiple award categories this quarter.
        </Text>

        {mentions.length === 0 ? (
          <Text style={S.small}>No team members were nominated in multiple categories.</Text>
        ) : (
          mentions.map((m, i) => (
            <View key={m.name} style={S.mentionRow}>
              <Text style={S.mentionNum}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={S.mentionName}>{m.name}</Text>
                <Text style={S.mentionCats}>
                  {m.categories.map(c => CATEGORY_META[c]?.name ?? c).join('  ·  ')}
                </Text>
              </View>
              <View style={[S.badge, { marginBottom: 0, marginLeft: 8 }]}>
                <Text style={S.badgeText}>{m.categories.length} CATEGORIES</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Page>
  );
}

// Memorable Moments — every interaction, flows across pages automatically
function MemorableMomentsPage({
  interactions, logoSrc, q, year,
}: {
  interactions: Interaction[]; logoSrc: string; q: number; year: number;
}) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.contentWrap}>
        <PageHeader logoSrc={logoSrc} label={`Q${q} ${year} AWARDS`} />
        <Badge text="MEMORABLE MOMENTS" />
        <Text style={S.h1}>Highlights of the Quarter</Text>
        <Text style={[S.body, { marginBottom: 14 }]}>
          A highlights reel of standout moments, as shared by the team.
        </Text>

        {interactions.length === 0 ? (
          <Text style={S.small}>No memorable interactions were submitted this quarter.</Text>
        ) : (
          interactions.map((item, i) => (
            <View key={i} wrap={false} style={S.momentCard}>
              <View style={S.momentHeader}>
                <View style={S.momentAboutPill}>
                  <Text style={S.momentAboutText}>About: {item.about_person}</Text>
                </View>
                <Text style={S.momentBy}>shared by {item.voter_name}</Text>
              </View>
              <Text style={S.momentDesc}>{`\u201C${item.description}\u201D`}</Text>
            </View>
          ))
        )}
      </View>
    </Page>
  );
}

function StatsPage({
  votersCount, totalVotes, interactionsCount, closestRace, overallWinner, totalByNominee, logoSrc, q, year,
}: {
  votersCount: number; totalVotes: number; interactionsCount: number;
  closestRace: { category: string; gap: number } | null;
  overallWinner: string; totalByNominee: Record<string, number>;
  logoSrc: string; q: number; year: number;
}) {
  const participationPct = Math.round((votersCount / 160) * 100);
  const closestMeta = closestRace ? CATEGORY_META[closestRace.category] : null;

  return (
    <Page size="A4" style={S.page}>
      <View style={S.contentWrap}>
        <PageHeader logoSrc={logoSrc} label={`Q${q} ${year} AWARDS`} />
        <Badge text="BY THE NUMBERS" />
        <Text style={S.h1}>Voting Statistics</Text>
        <Text style={[S.body, { marginBottom: 14 }]}>
          A snapshot of participation and engagement for Q{q} {year}.
        </Text>

        <View style={S.statRow}>
          <View style={S.statBox}>
            <Text style={S.statValue}>{votersCount}</Text>
            <Text style={S.statLabel}>VOTERS PARTICIPATED</Text>
          </View>
          <View style={S.statBoxLast}>
            <Text style={S.statValue}>{totalVotes}</Text>
            <Text style={S.statLabel}>TOTAL VOTES CAST</Text>
          </View>
        </View>

        <View style={S.statRow}>
          <View style={S.statBox}>
            <Text style={S.statValue}>{participationPct}%</Text>
            <Text style={S.statLabel}>PARTICIPATION RATE</Text>
          </View>
          <View style={S.statBoxLast}>
            <Text style={S.statValue}>{interactionsCount}</Text>
            <Text style={S.statLabel}>MEMORABLE MOMENTS</Text>
          </View>
        </View>

        {overallWinner && (
          <View style={[S.box, { marginTop: 4 }]}>
            <Text style={[S.small, { letterSpacing: 1, marginBottom: 5 }]}>MOST VOTED FOR</Text>
            <Text style={S.h2}>{overallWinner}</Text>
            <Text style={S.body}>
              Received {totalByNominee[overallWinner] ?? 0} votes across all categories
            </Text>
          </View>
        )}

        {closestMeta && closestRace && (
          <View style={S.box}>
            <Text style={[S.small, { letterSpacing: 1, marginBottom: 5 }]}>CLOSEST RACE</Text>
            <Text style={S.h2}>{closestMeta.name}</Text>
            <Text style={S.body}>
              Top two nominees were separated by just {closestRace.gap} {closestRace.gap === 1 ? 'vote' : 'votes'}
            </Text>
          </View>
        )}

        <View style={{ marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1A3C5E', alignItems: 'center' }}>
          <Text style={[S.italic, { textAlign: 'center', color: '#7A9CB8' }]}>
            Thank you to everyone who participated in Q{q} {year} Employee of the Quarter Awards.
          </Text>
          <Text style={[S.small, { marginTop: 5, textAlign: 'center' }]}>
            Wealthpoint Capital  ·  Dare to be great.
          </Text>
        </View>
      </View>
    </Page>
  );
}

// ─── Root Document ────────────────────────────────────────────────────────────

type Interaction = { voter_name: string; about_person: string; description: string };

type PDFProps = {
  voters: { name: string }[];
  votesByCategory: Record<string, Record<string, number>>;
  totalByNominee: Record<string, number>;
  interactions: Interaction[];
  q: number; year: number;
  logoSrc: string;
  photos: Record<string, string>;
};

function AwardsPDF({ voters, votesByCategory, totalByNominee, interactions, q, year, logoSrc, photos }: PDFProps) {
  const sorted = Object.entries(totalByNominee).sort((a, b) => b[1] - a[1]);
  const overallWinner = sorted[0]?.[0] ?? '';
  const overallWinnerVotes = sorted[0]?.[1] ?? 0;

  // Honourable mentions: nominated in 2+ categories
  const nomineeCategories: Record<string, Set<string>> = {};
  for (const [cat, nominees] of Object.entries(votesByCategory)) {
    for (const nominee of Object.keys(nominees)) {
      if (!nomineeCategories[nominee]) nomineeCategories[nominee] = new Set();
      nomineeCategories[nominee].add(cat);
    }
  }
  const honMentions = Object.entries(nomineeCategories)
    .filter(([, cats]) => cats.size >= 2)
    .map(([name, cats]) => ({ name, categories: Array.from(cats) }))
    .sort((a, b) => b.categories.length - a.categories.length);

  // Closest race
  let closestRace: { category: string; gap: number } | null = null;
  for (const [cat, nominees] of Object.entries(votesByCategory)) {
    const counts = Object.values(nominees).sort((a, b) => b - a);
    if (counts.length >= 2) {
      const gap = counts[0] - counts[1];
      if (!closestRace || gap < closestRace.gap) closestRace = { category: cat, gap };
    }
  }

  const totalVotes = Object.values(totalByNominee).reduce((s, c) => s + c, 0);

  return (
    <Document title={`Wealthpoint Capital Q${q} ${year} Employee of the Quarter Awards`}>
      <CoverPage logoSrc={logoSrc} q={q} year={year} />

      {overallWinner ? (
        <OverallWinnerPage
          winner={overallWinner}
          totalVotes={overallWinnerVotes}
          photoSrc={photos[overallWinner] ?? ''}
          logoSrc={logoSrc}
          interactions={interactions}
          q={q}
          year={year}
        />
      ) : null}

      {CATEGORY_ORDER.map(catId => (
        <CategoryPage
          key={catId}
          catId={catId}
          votesByCategory={votesByCategory}
          photos={photos}
          logoSrc={logoSrc}
          q={q}
          year={year}
        />
      ))}

      <HonourableMentionsPage mentions={honMentions} logoSrc={logoSrc} q={q} year={year} />

      <MemorableMomentsPage interactions={interactions} logoSrc={logoSrc} q={q} year={year} />

      <StatsPage
        votersCount={voters.length}
        totalVotes={totalVotes}
        interactionsCount={interactions.length}
        closestRace={closestRace}
        overallWinner={overallWinner}
        totalByNominee={totalByNominee}
        logoSrc={logoSrc}
        q={q}
        year={year}
      />
    </Document>
  );
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  noStore();
  try {
    await initializeSchema();

    const { rows: voters }       = await sql`SELECT name FROM voters`;
    const { rows: rawVotes }     = await sql`SELECT voter_name, category, nominee FROM votes`;
    const { rows: interactions } = await sql`SELECT voter_name, about_person, description FROM interactions ORDER BY created_at DESC`;

    const votesByCategory: Record<string, Record<string, number>> = {};
    const totalByNominee: Record<string, number> = {};

    for (const { category, nominee } of rawVotes as { voter_name: string; category: string; nominee: string }[]) {
      if (!votesByCategory[category]) votesByCategory[category] = {};
      votesByCategory[category][nominee] = (votesByCategory[category][nominee] ?? 0) + 1;
      totalByNominee[nominee] = (totalByNominee[nominee] ?? 0) + 1;
    }

    const logoSrc = loadImg('logo-transparent.png');
    const photos: Record<string, string> = {};
    for (const [name, rel] of Object.entries(PHOTOS)) {
      photos[name] = loadImg(rel);
    }

    const { q, year } = getQuarter();

    const buffer = await renderToBuffer(
      <AwardsPDF
        voters={voters as { name: string }[]}
        votesByCategory={votesByCategory}
        totalByNominee={totalByNominee}
        interactions={interactions as Interaction[]}
        q={q}
        year={year}
        logoSrc={logoSrc}
        photos={photos}
      />
    );

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Wealthpoint-Q${q}-${year}-Awards.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
