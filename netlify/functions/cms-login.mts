/**
 * /api/login (rate-limited per IP)
 *   POST { password }              → { token, expires }
 *   PUT  { current, next }         → change the password (signed in; signs every session out)
 */
import type { Config } from "@netlify/functions"
import { authReady, authorised, checkPassword, cms, deny, hashPassword, issueToken, json, passwordFromEnv } from "../lib/cms.mts"

export default async (req: Request) => {
  let body: any = {}
  try { body = await req.json() } catch {}
  if (!(await authReady())) return json({ error: "The admin password hasn't been set up yet." }, 500)
  if (req.method === "PUT") {
    if (!(await authorised(req))) return deny()
    if (passwordFromEnv()) return json({ error: "This password comes from the ADMIN_PASSWORD setting on Netlify; change it there." }, 400)
    if (!(await checkPassword(body.current))) return json({ error: "Your current password isn't right." }, 401)
    if (typeof body.next !== "string" || body.next.length < 10) return json({ error: "Use at least 10 characters for the new password." }, 400)
    await cms().setJSON("auth", { ...hashPassword(body.next), changed: new Date().toISOString() })
    return json({ ok: true, ...(await issueToken()) })
  }
  if (!(await checkPassword(body.password))) {
    await new Promise(r => setTimeout(r, 600)) // slow down guessing
    return json({ error: "That password isn't right." }, 401)
  }
  return json(await issueToken())
}

export const config: Config = {
  path: "/api/login",
  method: ["POST", "PUT"],
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
}
