import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql } from '@/lib/db';
import { isAuthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  noStore();
  try {
    const { voterName } = await request.json();
    if (!voterName || typeof voterName !== 'string') {
      return NextResponse.json({ error: 'Invalid voter name' }, { status: 400 });
    }
    const name = voterName.trim();
    await sql`DELETE FROM interactions WHERE voter_name = ${name}`;
    await sql`DELETE FROM votes WHERE voter_name = ${name}`;
    await sql`DELETE FROM voters WHERE name = ${name}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete voter error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
