import { NextRequest, NextResponse } from 'next/server';
import { sql, initializeSchema } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await initializeSchema();

    const result = await sql`
      SELECT id FROM voters WHERE LOWER(name) = LOWER(${name.trim()})
    `;

    return NextResponse.json({ hasVoted: result.rows.length > 0 });
  } catch (error) {
    console.error('Check voter error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
