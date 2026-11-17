import { DATES, ROLES } from "./config.mts";

// Minimal store shape, so the logic can be tested without Netlify.
export type Store = {
  get(key: string, opts?: { type: "json" }): Promise<any>;
  setJSON(key: string, value: unknown, opts?: { onlyIfNew?: boolean }): Promise<{ modified?: boolean } | void>;
  delete(key: string): Promise<void>;
  list(): Promise<{ blobs: { key: string }[] }>;
};
export type Env = { clubCode?: string; adminCode?: string; members?: string };

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function auth(req: Request, env: Env) {
  const url = new URL(req.url);
  const club = req.headers.get("x-club-code") ?? url.searchParams.get("code") ?? "";
  const adm = req.headers.get("x-admin-code") ?? url.searchParams.get("admin") ?? "";
  const isAdmin = !!env.adminCode && safeEq(adm, env.adminCode);
  const clubOk = !env.clubCode || isAdmin || safeEq(club, env.clubCode);
  return { isAdmin, clubOk, adminTried: adm !== "" };
}

function todayUB(): string {
  // Ulaanbaatar is UTC+8, no daylight saving.
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function cleanName(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function parseKey(key: unknown): { date: string; role: string } | null {
  if (typeof key !== "string") return null;
  const i = key.indexOf("_");
  if (i < 0) return null;
  const date = key.slice(0, i), role = key.slice(i + 1);
  if (!DATES.includes(date) || !ROLES.some((r) => r.id === role)) return null;
  return { date, role };
}

function parseMembers(raw?: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x) => typeof x === "string").map(cleanName).filter(Boolean).slice(0, 200);
  } catch { return []; }
}

export async function handleConfig(req: Request, env: Env): Promise<Response> {
  const a = auth(req, env);
  if (a.adminTried && !a.isAdmin) return json({ error: "bad_admin_code" }, 401);
  if (!a.clubOk) return json({ error: "code_required" }, 401);
  return json({ dates: DATES, roles: ROLES, members: parseMembers(env.members), admin: a.isAdmin, codeRequired: !!env.clubCode });
}

export async function handleSignups(req: Request, store: Store, env: Env): Promise<Response> {
  const a = auth(req, env);
  if (a.adminTried && !a.isAdmin) return json({ error: "bad_admin_code" }, 401);
  if (!a.clubOk) return json({ error: "code_required" }, 401);

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const entries = await Promise.all(
      blobs.map(async (b) => [b.key, await store.get(b.key, { type: "json" })] as const),
    );
    const claims: Record<string, { name: string; date: string; role: string; at: number }> = {};
    for (const [k, v] of entries) {
      if (v && typeof v.name === "string" && v.name && parseKey(k)) claims[k] = v;
    }
    const url = new URL(req.url);
    if (url.searchParams.get("format") === "text") {
      const lines = Object.keys(claims).sort().map((k) => `${k}\t${claims[k].name}`);
      return new Response(lines.join("\n") + (lines.length ? "\n" : "(no sign-ups)\n"), {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return json({ claims, admin: a.isAdmin });
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const parsed = parseKey(body?.key);
  const name = cleanName(body?.name);
  if (!parsed || !name) return json({ error: "bad_request" }, 400);
  const key = body.key as string;

  if (body.action === "claim") {
    if (parsed.date < todayUB() && !a.isAdmin) return json({ error: "past_date" }, 400);
    const res = await store.setJSON(key, { name, date: parsed.date, role: parsed.role, at: Date.now() }, { onlyIfNew: true });
    if (res && res.modified === false) {
      const cur = await store.get(key, { type: "json" });
      return json({ error: "taken", by: cur?.name ?? null }, 409);
    }
    return json({ ok: true });
  }

  if (body.action === "cancel") {
    const cur = await store.get(key, { type: "json" });
    if (!cur) return json({ ok: true });
    if (cur.name !== name && !a.isAdmin) return json({ error: "not_yours" }, 403);
    await store.delete(key);
    return json({ ok: true });
  }

  return json({ error: "bad_request" }, 400);
}
