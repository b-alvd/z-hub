import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS game_rooms (
      code TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      num_ai INTEGER NOT NULL DEFAULT 0,
      game_state TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS room_players (
      room_code TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      player_index INTEGER NOT NULL,
      PRIMARY KEY (room_code, user_id)
    );
    CREATE TABLE IF NOT EXISTS game_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      game TEXT NOT NULL,
      won INTEGER NOT NULL DEFAULT 0,
      elapsed INTEGER NOT NULL DEFAULT 0,
      moves INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_game_stats_user ON game_stats(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_stats_game ON game_stats(game);
  `);
  // Migrate existing tables — ignore errors if columns already exist
  for (const col of ["elapsed INTEGER NOT NULL DEFAULT 0", "moves INTEGER NOT NULL DEFAULT 0"]) {
    await db.execute(`ALTER TABLE game_stats ADD COLUMN ${col}`).catch(() => {});
  }
}
