import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql, initializeSchema } from '@/lib/db';
import { isVoteEditor } from '@/lib/auth';

export async function POST(request: NextRequest) {
  noStore();
  try {
    const body = await request.json();
    const { voterName, votes, interaction, gees, geesImage, geesFined } = body;

    if (!voterName || typeof voterName !== 'string') {
      return NextResponse.json({ error: 'Invalid voter name' }, { status: 400 });
    }

    await initializeSchema();

    const name = voterName.trim();
    const { rows: existing } = await sql`SELECT id FROM voters WHERE LOWER(name) = LOWER(${name})`;
    if (existing.length > 0) {
      if (!isVoteEditor(name)) {
        return NextResponse.json({ error: 'already_voted' }, { status: 409 });
      }
      // Vote editor is re-submitting: clear the previous submission so this one replaces it.
      await sql`DELETE FROM votes        WHERE LOWER(voter_name) = LOWER(${name})`;
      await sql`DELETE FROM interactions WHERE LOWER(voter_name) = LOWER(${name})`;
      await sql`DELETE FROM gees         WHERE LOWER(voter_name) = LOWER(${name})`;
      await sql`DELETE FROM voters       WHERE LOWER(name)       = LOWER(${name})`;
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

    const finedPerson = typeof geesFined === 'string' ? geesFined.trim().slice(0, 120) : '';
    const geesText = typeof gees === 'string' ? gees.trim().slice(0, 500) : '';
    const geesImg =
      typeof geesImage === 'string' &&
      geesImage.startsWith('data:image/') &&
      geesImage.length < 5_000_000
        ? geesImage
        : null;
    // A fine only counts if someone was nominated. Reason and evidence are optional.
    if (finedPerson) {
      await sql`INSERT INTO gees (voter_name, fined_person, content, image) VALUES (${name}, ${finedPerson}, ${geesText}, ${geesImg})`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
