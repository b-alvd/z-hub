import { getSession } from "@/lib/auth";
import LandingClient from "./landing-client";

export default async function LandingPage() {
  const user = await getSession();
  return <LandingClient user={user ? { username: user.username } : null} />;
}
