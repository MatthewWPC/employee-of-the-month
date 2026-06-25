import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql } from '@/lib/db';
import { isAuthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function currentQuarterLabel(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

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

    const label: string =
      typeof body.label === 'string' && body.label.trim()
        ? body.label.trim()
        : currentQuarterLabel();

    // Capture current counts before archiving
    const { rows: [votesRow] }        = await sql`SELECT COUNT(*) AS count FROM votes`;
    const { rows: [votersRow] }       = await sql`SELECT COUNT(*) AS count FROM voters`;
    const { rows: [interactionsRow] } = await sql`SELECT COUNT(*) AS count FROM interactions`;

    // Archive rows — explicit column lists matching the live table schema.
    // If any INSERT fails, the catch block returns a 500 and the TRUNCATE never runs.
    await sql`
      INSERT INTO votes_archive (id, voter_name, category, nominee, created_at, archive_label)
      SELECT id, voter_name, category, nominee, created_at, ${label} FROM votes
    `;
    await sql`
      INSERT INTO voters_archive (id, name, voted_at, archive_label)
      SELECT id, name, voted_at, ${label} FROM voters
    `;
    await sql`
      INSERT INTO interactions_archive (id, voter_name, about_person, description, created_at, archive_label)
      SELECT id, voter_name, about_person, description, created_at, ${label} FROM interactions
    `;

    // All archives succeeded — safe to clear the live tables
    await sql`TRUNCATE votes, voters, interactions RESTART IDENTITY`;

    return NextResponse.json({
      success: true,
      archivedAs: label,
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
