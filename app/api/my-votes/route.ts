import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql, initializeSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Returns the current submission for the vote editor so the vote form can be
// pre-filled for editing. Only the editor's own data is ever returned.
export async function GET(request: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(request.url);
    const name = (searchParams.get('name') ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'missing name' }, { status: 400 });
    }

    await initializeSchema();

    const { rows: voteRows } = await sql`
      SELECT category, nominee FROM votes WHERE LOWER(voter_name) = LOWER(${name})
    `;
    const votes: Record<string, string[]> = {};
    for (const { category, nominee } of voteRows as { category: string; nominee: string }[]) {
      if (!votes[category]) votes[category] = [];
      votes[category].push(nominee);
    }

    const { rows: interactionRows } = await sql`
      SELECT about_person, description FROM interactions
      WHERE LOWER(voter_name) = LOWER(${name})
      ORDER BY created_at DESC LIMIT 1
    `;
    const interaction = interactionRows[0]
      ? { aboutPerson: interactionRows[0].about_person as string, description: interactionRows[0].description as string }
      : null;

    const { rows: geesRows } = await sql`
      SELECT fined_person, content, image FROM gees
      WHERE LOWER(voter_name) = LOWER(${name})
      ORDER BY created_at DESC LIMIT 1
    `;
    const gee = geesRows[0] ?? null;

    return NextResponse.json(
      {
        votes,
        interaction,
        gees: (gee?.content as string) ?? '',
        geesFined: (gee?.fined_person as string) ?? '',
        geesImage: (gee?.image as string) ?? null,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('My-votes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
