import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { handleSignups } from "./lib/handler.mts";

// Strong consistency so a cancelled role shows as open straight away.
export default async (req: Request) =>
  handleSignups(req, getStore({ name: "signups", consistency: "strong" }), {
    clubCode: Netlify.env.get("CLUB_CODE") || undefined,
    adminCode: Netlify.env.get("ADMIN_CODE") || undefined,
    members: Netlify.env.get("MEMBERS") || undefined,
  });

export const config: Config = { path: "/api/signups", method: ["GET", "POST"] };
