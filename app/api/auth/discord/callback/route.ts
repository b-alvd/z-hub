import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=discord", req.url));

  // Échange le code contre un token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(new URL("/login?error=discord", req.url));
  const { access_token } = await tokenRes.json();

  // Récupère le profil Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return NextResponse.redirect(new URL("/login?error=discord", req.url));
  const discordUser = await userRes.json();

  await initDb();

  // Cherche l'utilisateur par discord_id ou email
  const discordId = `discord:${discordUser.id}`;
  let row = await db.execute({
    sql: "SELECT id FROM users WHERE id = ?",
    args: [discordId],
  });

  if (!row.rows.length) {
    // Nouveau compte via Discord
    const username = discordUser.username.slice(0, 24);
    const email = discordUser.email ?? `${discordUser.id}@discord.local`;
    // S'assure que le pseudo est unique
    const taken = await db.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [username],
    });
    const finalUsername = taken.rows.length ? `${username}_${discordUser.id.slice(-4)}` : username;

    await db.execute({
      sql: "INSERT INTO users (id, username, email, created_at) VALUES (?, ?, ?, ?)",
      args: [discordId, finalUsername, email, Date.now()],
    });
  }

  const token = await createSession(discordId);
  await setSessionCookie(token);
  return NextResponse.redirect(new URL("/hub", req.url));
}
