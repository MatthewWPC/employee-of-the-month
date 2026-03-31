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

    const existing = await sql`
      SELECT id FROM voters WHERE LOWER(name) = LOWER(${voterName.trim()})
    `;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'already_voted' }, { status: 409 });
    }

    await sql`INSERT INTO voters (name) VALUES (${voterName.trim()})`;

    for (const [category, nominees] of Object.entries(votes as Record<string, string[]>)) {
      if (Array.isArray(nominees)) {
        for (const nominee of nominees) {
          if (typeof nominee === 'string' && nominee.trim()) {
            await sql`
              INSERT INTO votes (voter_name, category, nominee)
              VALUES (${voterName.trim()}, ${category}, ${nominee.trim()})
            `;
          }
        }
      }
    }

    if (interaction?.aboutPerson && interaction?.description) {
      await sql`
        INSERT INTO interactions (voter_name, about_person, description)
        VALUES (
          ${voterName.trim()},
          ${interaction.aboutPerson.trim()},
          ${interaction.description.trim().slice(0, 300)}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
