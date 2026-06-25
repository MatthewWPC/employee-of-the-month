import { sql } from '@vercel/postgres';

export { sql };

export async function initializeSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS voters (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      voter_name TEXT NOT NULL,
      category TEXT NOT NULL,
      nominee TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS interactions (
      id SERIAL PRIMARY KEY,
      voter_name TEXT NOT NULL,
      about_person TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── Archive tables — mirror live tables plus archive_label / archived_at ──
  await sql`
    CREATE TABLE IF NOT EXISTS votes_archive (
      id INTEGER NOT NULL,
      voter_name TEXT NOT NULL,
      category TEXT NOT NULL,
      nominee TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      archive_label TEXT NOT NULL,
      archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS voters_archive (
      id INTEGER NOT NULL,
      name TEXT NOT NULL,
      voted_at TIMESTAMPTZ NOT NULL,
      archive_label TEXT NOT NULL,
      archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS interactions_archive (
      id INTEGER NOT NULL,
      voter_name TEXT NOT NULL,
      about_person TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      archive_label TEXT NOT NULL,
      archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
