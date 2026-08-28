import { getSession } from "@/lib/auth";
import ProfileClient from "./profile-client";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <ProfileClient
      username={user.username}
      email={user.email}
      isDiscord={user.id.startsWith("discord:")}
    />
  );
}
