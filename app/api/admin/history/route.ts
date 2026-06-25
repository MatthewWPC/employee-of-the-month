import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql } from '@/lib/db';
import { isAuthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  noStore();
  try {
    const { searchParams } = new URL(request.url);
    const label = searchParams.get('label');

    if (label) {
      // ── Detail: full data for one archived quarter ──────────────────────────
      const { rows: voters } = await sql`
        SELECT id, name, voted_at
        FROM   voters_archive
        WHERE  archive_label = ${label}
        ORDER  BY voted_at DESC
      `;
      const { rows: rawVotes } = await sql`
        SELECT voter_name, category, nominee
        FROM   votes_archive
        WHERE  archive_label = ${label}
        ORDER  BY voter_name, category, nominee
      `;

      // Build aggregates in one pass — same logic as /api/admin
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

      const { rows: interactions } = await sql`
        SELECT voter_name, about_person, description, created_at
        FROM   interactions_archive
        WHERE  archive_label = ${label}
        ORDER  BY created_at DESC
      `;

      return NextResponse.json(
        { voters, votesByCategory, totalByNominee, voterBreakdown, voteCountPerVoter, interactions, totalVotesCount: rawVotes.length },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    // ── List: one row per archived quarter, newest first ─────────────────────
    const { rows } = await sql`
      SELECT
        archive_label,
        MIN(archived_at) AS archived_at,
        COUNT(*)         AS vote_count
      FROM   votes_archive
      GROUP  BY archive_label
      ORDER  BY MIN(archived_at) DESC
    `;

    const quarters = rows.map(r => ({
      archive_label: r.archive_label as string,
      archived_at:   r.archived_at as string,
      vote_count:    Number(r.vote_count),
    }));

    return NextResponse.json(
      { quarters },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
