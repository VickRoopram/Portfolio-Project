/**
 * Images for the content admin.
 *   POST /api/media   (signed in; body = the image file, content-type = its type) → { url }
 *   GET  /media/img/<id>.<ext>  → the image, cached for a year (ids never change)
 */
import type { Config, Context } from "@netlify/functions"
import { authorised, deny, json, media, newId } from "../lib/cms.mts"

const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/avif": "avif" }
const MAX = 4 * 1024 * 1024

export default async (req: Request, context: Context) => {
  const store = media()
  const path = new URL(req.url).pathname
  if (req.method === "GET" && path.startsWith("/media/")) {
    const key = decodeURIComponent(path.slice("/media/".length))
    if (!/^img\/[\w-]+\.(webp|jpg|png|gif|avif)$/.test(key)) return new Response("Not found", { status: 404 })
    const entry = await store.getWithMetadata(key, { type: "arrayBuffer" })
    if (!entry) return new Response("Not found", { status: 404 })
    return new Response(entry.data, {
      headers: { "content-type": String(entry.metadata?.type || "application/octet-stream"), "cache-control": "public, max-age=31536000, immutable" },
    })
  }
  if (req.method === "POST" && path === "/api/media") {
    if (!(await authorised(req))) return deny()
    const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    const ext = TYPES[type]
    if (!ext) return json({ error: "Use a WebP, JPEG, PNG, GIF or AVIF image." }, 415)
    const buf = await req.arrayBuffer()
    if (!buf.byteLength) return json({ error: "That file is empty." }, 400)
    if (buf.byteLength > MAX) return json({ error: "That image is over 4 MB. The admin shrinks images before upload, so try a smaller original." }, 413)
    const key = `img/${newId()}.${ext}`
    await store.set(key, buf, { metadata: { type, name: (req.headers.get("x-file-name") || "").slice(0, 120), at: new Date().toISOString() } })
    return json({ url: `/media/${key}` })
  }
  return json({ error: "Not found" }, 404)
}

export const config: Config = { path: ["/api/media", "/media/*"], method: ["GET", "POST"] }
