import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql } from '@/lib/db';
import { isAuthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  noStore();
  try {
    const body = await request.json();
    if (body.confirm !== 'RESET') {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    // Capture current counts before wiping
    const { rows: [votesRow] }        = await sql`SELECT COUNT(*) AS count FROM votes`;
    const { rows: [votersRow] }       = await sql`SELECT COUNT(*) AS count FROM voters`;
    const { rows: [interactionsRow] } = await sql`SELECT COUNT(*) AS count FROM interactions`;

    // Remove "interactions" from this TRUNCATE to preserve the interaction log across quarters
    await sql`TRUNCATE votes, voters, interactions RESTART IDENTITY`;

    return NextResponse.json({
      success: true,
      cleared: {
        votes:        Number(votesRow.count),
        voters:       Number(votersRow.count),
        interactions: Number(interactionsRow.count),
      },
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
