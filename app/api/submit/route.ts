import { NextRequest, NextResponse } from 'next/server';
import { sql, initializeSchema } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voterName, votes, interaction } = body;

    if (!voterName || typeof voterName !== 'string') {
      return NextResponse.json({ error: 'Invalid voter name' }, { status: 400 });
    }

    await initializeSchema();

    const name = voterName.trim();
    const { rows: existing } = await sql`SELECT id FROM voters WHERE LOWER(name) = LOWER(${name})`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'already_voted' }, { status: 409 });
    }

    await sql`INSERT INTO voters (name) VALUES (${name})`;

    const voteEntries = Object.entries(votes as Record<string, string[]>);
    for (const [category, nominees] of voteEntries) {
      if (!Array.isArray(nominees)) continue;
      for (const nominee of nominees) {
        if (typeof nominee === 'string' && nominee.trim()) {
          await sql`INSERT INTO votes (voter_name, category, nominee) VALUES (${name}, ${category}, ${nominee.trim()})`;
        }
      }
    }

    if (interaction?.aboutPerson && interaction?.description) {
      await sql`
        INSERT INTO interactions (voter_name, about_person, description)
        VALUES (${name}, ${interaction.aboutPerson.trim()}, ${interaction.description.trim().slice(0, 300)})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
