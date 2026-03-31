import { NextResponse } from 'next/server';
import { sql, initializeSchema } from '@/lib/db';

export async function GET() {
  try {
    await initializeSchema();

    const votersResult = await sql`
      SELECT name, voted_at FROM voters ORDER BY voted_at DESC
    `;
    const voters = votersResult.rows as { name: string; voted_at: string }[];

    const voteRowsResult = await sql`
      SELECT category, nominee, COUNT(*)::int AS count
      FROM votes
      GROUP BY category, nominee
      ORDER BY category, count DESC
    `;

    const votesByCategory: Record<string, Record<string, number>> = {};
    for (const row of voteRowsResult.rows as { category: string; nominee: string; count: number }[]) {
      if (!votesByCategory[row.category]) votesByCategory[row.category] = {};
      votesByCategory[row.category][row.nominee] = row.count;
    }

    const totalRowsResult = await sql`
      SELECT nominee, COUNT(*)::int AS count
      FROM votes
      GROUP BY nominee
      ORDER BY count DESC
    `;

    const totalByNominee: Record<string, number> = {};
    for (const row of totalRowsResult.rows as { nominee: string; count: number }[]) {
      totalByNominee[row.nominee] = row.count;
    }

    const interactionsResult = await sql`
      SELECT voter_name, about_person, description, created_at
      FROM interactions
      ORDER BY created_at DESC
    `;
    const interactions = interactionsResult.rows as {
      voter_name: string; about_person: string; description: string; created_at: string;
    }[];

    const countResult = await sql`SELECT COUNT(*)::int AS count FROM votes`;
    const totalVotesCount = (countResult.rows[0] as { count: number }).count;

    return NextResponse.json({ voters, votesByCategory, totalByNominee, interactions, totalVotesCount });
  } catch (error) {
    console.error('Admin error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
