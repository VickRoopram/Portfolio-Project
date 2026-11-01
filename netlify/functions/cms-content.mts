/**
 * /api/content
 *   GET  ?stage=live|draft → the stored content document (404 when nothing has been saved yet,
 *                            so the site falls back to the defaults in src/content.js)
 *   GET  ?stage=status     → timestamps of draft and live (signed in)
 *   PUT  { content }       → save the draft ("Update preview"; signed in)
 *   DELETE                 → discard the draft by copying live back over it (signed in)
 */
import type { Config } from "@netlify/functions"
import { authorised, cleanContent, cms, deny, json } from "../lib/cms.mts"

export default async (req: Request) => {
  const store = cms()
  if (req.method === "GET") {
    const stage = new URL(req.url).searchParams.get("stage") || "live"
    if (stage === "status") {
      if (!(await authorised(req))) return deny()
      const [d, l] = await Promise.all([store.get("draft", { type: "json" }), store.get("live", { type: "json" })])
      return json({ draft: d?.updated || null, live: l?.updated || null, draftPublished: d?.published || null })
    }
    if (stage !== "live" && stage !== "draft") return json({ error: "Unknown stage" }, 400)
    const doc = await store.get(stage, { type: "json" })
    if (!doc) return json({ error: "No saved content yet" }, 404)
    return json(doc)
  }
  if (!(await authorised(req))) return deny()
  if (req.method === "PUT") {
    let body: any
    try { body = await req.json() } catch { return json({ error: "That content couldn't be read." }, 400) }
    let doc
    try { doc = cleanContent(body?.content) } catch (e: any) { return json({ error: e.message }, 400) }
    await store.setJSON("draft", doc)
    return json({ ok: true, updated: doc.updated })
  }
  if (req.method === "DELETE") {
    const live = await store.get("live", { type: "json" })
    if (!live) { await store.delete("draft"); return json({ ok: true, reset: "defaults" }) }
    await store.setJSON("draft", live)
    return json({ ok: true, reset: "live", updated: live.updated })
  }
  return json({ error: "Method not allowed" }, 405)
}

export const config: Config = { path: "/api/content", method: ["GET", "PUT", "DELETE"] }
