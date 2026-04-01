import { NextRequest, NextResponse } from 'next/server';
import { sql, initializeSchema } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ hasVoted: false });

    await initializeSchema();
    const { rows } = await sql`SELECT id FROM voters WHERE LOWER(name) = LOWER(${name.trim()})`;
    const dbHost = (process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? 'NONE').replace(/:[^@]*@/, ':***@').slice(0, 80);
    return NextResponse.json({ hasVoted: rows.length > 0, _dbHost: dbHost });
  } catch (error) {
    console.error('Check voter error:', error);
    return NextResponse.json({ hasVoted: false });
  }
}
