"use server";

import { redirect } from "next/navigation";
import { db } from "./db";
import { createSession, setSessionCookie, deleteSession, getSession } from "./auth";

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function deleteAccount() {
  const user = await getSession();
  if (!user) redirect("/login");

  await db.execute({ sql: "DELETE FROM sessions WHERE user_id = ?", args: [user.id] });
  await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [user.id] });
  await deleteSession();
  redirect("/");
}
