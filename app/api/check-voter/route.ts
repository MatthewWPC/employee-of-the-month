import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql, initializeSchema } from '@/lib/db';
import { isVoteEditor } from '@/lib/auth';

export async function GET(request: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ hasVoted: false });

    await initializeSchema();
    const { rows } = await sql`SELECT id FROM voters WHERE LOWER(name) = LOWER(${name.trim()})`;
    // The vote editor is never locked out; they can re-enter to edit their submission.
    if (isVoteEditor(name)) {
      return NextResponse.json({ hasVoted: false, isEditor: true });
    }
    return NextResponse.json({ hasVoted: rows.length > 0, isEditor: false });
  } catch (error) {
    console.error('Check voter error:', error);
    return NextResponse.json({ hasVoted: false });
  }
}
