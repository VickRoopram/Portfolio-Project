/**
 * /api/publish (signed in)
 *   POST            → copy the draft to live ("Publish"); the replaced live version is kept in history
 *   GET             → list saved live versions (newest first)
 *   PUT { key }     → restore one of those versions as the draft (review it on the preview, then Publish)
 */
import type { Config } from "@netlify/functions"
import { authorised, cms, deny, json } from "../lib/cms.mts"

export default async (req: Request) => {
  if (!(await authorised(req))) return deny()
  const store = cms()
  if (req.method === "POST") {
    const draft: any = await store.get("draft", { type: "json" })
    if (!draft) return json({ error: "There's no draft to publish. Press Update preview first." }, 400)
    const old: any = await store.get("live", { type: "json" })
    if (old) await store.setJSON(`history/${old.updated || new Date().toISOString()}`, old)
    const published = new Date().toISOString()
    const live = { ...draft, published }
    await store.setJSON("live", live)
    await store.setJSON("draft", live)
    return json({ ok: true, published })
  }
  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "history/" })
    return json({ versions: blobs.map(b => b.key).sort().reverse().slice(0, 30) })
  }
  if (req.method === "PUT") {
    let body: any = {}
    try { body = await req.json() } catch {}
    if (typeof body.key !== "string" || !body.key.startsWith("history/")) return json({ error: "Pick a saved version" }, 400)
    const doc: any = await store.get(body.key, { type: "json" })
    if (!doc) return json({ error: "That version no longer exists" }, 404)
    await store.setJSON("draft", { ...doc, updated: new Date().toISOString(), restoredFrom: body.key })
    return json({ ok: true })
  }
  return json({ error: "Method not allowed" }, 405)
}

export const config: Config = { path: "/api/publish", method: ["GET", "POST", "PUT"] }
