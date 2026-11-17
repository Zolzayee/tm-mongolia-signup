import type { Config } from "@netlify/functions";
import { handleConfig } from "./lib/handler.mts";

export default async (req: Request) =>
  handleConfig(req, {
    clubCode: Netlify.env.get("CLUB_CODE") || undefined,
    adminCode: Netlify.env.get("ADMIN_CODE") || undefined,
    members: Netlify.env.get("MEMBERS") || undefined,
  });

export const config: Config = { path: "/api/config", method: "GET" };
