import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { sql, initializeSchema } from '@/lib/db';

export async function GET(request: NextRequest) {
  noStore();
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ hasVoted: false });

    await initializeSchema();
    const { rows } = await sql`SELECT id FROM voters WHERE LOWER(name) = LOWER(${name.trim()})`;
    return NextResponse.json({ hasVoted: rows.length > 0 });
  } catch (error) {
    console.error('Check voter error:', error);
    return NextResponse.json({ hasVoted: false });
  }
}
