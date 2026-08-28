import { getSession } from "@/lib/auth";
import HubClient from "./hub-client";

export default async function HubPage() {
  const user = await getSession();
  return <HubClient username={user?.username ?? ""} />;
}
