import { NextResponse } from 'next/server';
import { sql, initializeSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initializeSchema();

    const voters = await sql`SELECT name, voted_at FROM voters ORDER BY voted_at DESC` as { name: string; voted_at: string }[];

    // Single query to get all vote rows — we'll compute everything in JS
    const rawVotes = await sql`SELECT voter_name, category, nominee FROM votes ORDER BY voter_name, category, nominee` as { voter_name: string; category: string; nominee: string }[];

    // Build all aggregates from rawVotes in one pass
    const votesByCategory: Record<string, Record<string, number>> = {};
    const totalByNominee: Record<string, number> = {};
    const voterBreakdown: Record<string, Record<string, string[]>> = {};
    const voteCountPerVoter: Record<string, number> = {};

    for (const { voter_name, category, nominee } of rawVotes) {
      // votesByCategory
      if (!votesByCategory[category]) votesByCategory[category] = {};
      votesByCategory[category][nominee] = (votesByCategory[category][nominee] ?? 0) + 1;

      // totalByNominee
      totalByNominee[nominee] = (totalByNominee[nominee] ?? 0) + 1;

      // voterBreakdown
      if (!voterBreakdown[voter_name]) voterBreakdown[voter_name] = {};
      if (!voterBreakdown[voter_name][category]) voterBreakdown[voter_name][category] = [];
      voterBreakdown[voter_name][category].push(nominee);

      // voteCountPerVoter
      voteCountPerVoter[voter_name] = (voteCountPerVoter[voter_name] ?? 0) + 1;
    }

    const interactions = await sql`SELECT voter_name, about_person, description, created_at FROM interactions ORDER BY created_at DESC` as { voter_name: string; about_person: string; description: string; created_at: string }[];

    return NextResponse.json(
      { voters, votesByCategory, totalByNominee, voterBreakdown, voteCountPerVoter, interactions, totalVotesCount: rawVotes.length },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Admin error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
