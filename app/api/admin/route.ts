import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql, initializeSchema } from '@/lib/db';
import { isAuthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  noStore(); // Opt out of Next.js data cache — ensures SQL queries hit the live DB every time
  try {
    await initializeSchema();

    const { rows: voters } = await sql`SELECT name, voted_at FROM voters ORDER BY voted_at DESC`;
    const { rows: rawVotes } = await sql`SELECT voter_name, category, nominee FROM votes ORDER BY voter_name, category, nominee`;

    // Build all aggregates from rawVotes in one pass
    const votesByCategory: Record<string, Record<string, number>> = {};
    const totalByNominee: Record<string, number> = {};
    const voterBreakdown: Record<string, Record<string, string[]>> = {};
    const voteCountPerVoter: Record<string, number> = {};

    for (const { voter_name, category, nominee } of rawVotes as { voter_name: string; category: string; nominee: string }[]) {
      if (!votesByCategory[category]) votesByCategory[category] = {};
      votesByCategory[category][nominee] = (votesByCategory[category][nominee] ?? 0) + 1;

      totalByNominee[nominee] = (totalByNominee[nominee] ?? 0) + 1;

      if (!voterBreakdown[voter_name]) voterBreakdown[voter_name] = {};
      if (!voterBreakdown[voter_name][category]) voterBreakdown[voter_name][category] = [];
      voterBreakdown[voter_name][category].push(nominee);

      voteCountPerVoter[voter_name] = (voteCountPerVoter[voter_name] ?? 0) + 1;
    }

    const { rows: interactions } = await sql`SELECT voter_name, about_person, description, created_at FROM interactions ORDER BY created_at DESC`;
    const { rows: gees } = await sql`SELECT voter_name, fined_person, content, image, created_at FROM gees ORDER BY created_at DESC`;

    return NextResponse.json(
      { voters, votesByCategory, totalByNominee, voterBreakdown, voteCountPerVoter, interactions, gees, totalVotesCount: rawVotes.length },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Admin error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
