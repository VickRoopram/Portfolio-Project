/**
 * Shared helpers for the content admin (CMS): storage, login tokens and HTML cleaning.
 *
 * Storage (Netlify Blobs, site-wide stores, shared by every deploy context on purpose):
 *   store "cms"   → "draft"  : what the version-01 preview shows (written by "Update preview")
 *                   "live"   : what the live site shows (written by "Publish")
 *                   "history/<iso>" : every live version that got replaced, for rollback
 *   store "media" → "img/<id>.<ext>" : uploaded images, served at /media/img/<id>.<ext>
 */
import { getStore } from "@netlify/blobs"
import { createHmac, createHash, timingSafeEqual, randomBytes, scryptSync } from "node:crypto"

export const cms = () => getStore({ name: "cms", consistency: "strong" })
export const media = () => getStore({ name: "media" })

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  })
export { json }

/* ── password + login tokens ──
   The password is checked against ADMIN_PASSWORD (env var, used for local dev) or, when that isn't set,
   a salted scrypt hash stored at cms/"auth" (set with scripts/set-admin-password.mjs or "Change password" in /admin).
   Tokens are "<expiry ms>.<hmac>", signed with a key derived from that secret, valid 12 h. Changing the password signs everyone out. */
const TTL = 12 * 60 * 60 * 1000
type Auth = { kind: "env"; value: string } | { kind: "hash"; salt: string; hash: string }
async function loadAuth(): Promise<Auth | null> {
  const env = Netlify.env.get("ADMIN_PASSWORD")
  if (env) return { kind: "env", value: env }
  const a: any = await cms().get("auth", { type: "json" })
  return a?.salt && a?.hash ? { kind: "hash", salt: a.salt, hash: a.hash } : null
}
export const hashPassword = (pw: string, salt = randomBytes(16).toString("base64url")) => ({ salt, hash: scryptSync(pw, salt, 32).toString("base64url") })
const keyOf = (a: Auth) => "vdc-cms:" + (a.kind === "env" ? a.value : a.hash)
const sign = (a: Auth, exp: string) => createHmac("sha256", keyOf(a)).update(exp).digest("base64url")
const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest())
export async function authReady() { return !!(await loadAuth()) }
export async function checkPassword(pw: unknown) {
  const a = await loadAuth()
  if (!a || typeof pw !== "string" || !pw) return false
  return a.kind === "env" ? same(pw, a.value) : same(hashPassword(pw, a.salt).hash, a.hash)
}
export async function issueToken() {
  const a = (await loadAuth())!, exp = String(Date.now() + TTL)
  return { token: `${exp}.${sign(a, exp)}`, expires: Number(exp) }
}
export async function authorised(req: Request) {
  const h = req.headers.get("authorization") || ""
  const t = h.startsWith("Bearer ") ? h.slice(7) : ""
  const [exp, sig] = t.split(".")
  if (!exp || !sig || Number(exp) < Date.now()) return false
  const a = await loadAuth()
  if (!a) return false
  try { return same(sig, sign(a, exp)) } catch { return false }
}
export const passwordFromEnv = () => !!Netlify.env.get("ADMIN_PASSWORD")
export const deny = () => json({ error: "Not signed in, or your session expired. Sign in again." }, 401)

/* ── HTML cleaning for descriptions: keep formatting, drop anything that can run code ── */
const ALLOWED = new Set(["p", "br", "b", "strong", "i", "em", "u", "a", "ul", "ol", "li", "h3", "h4", "div", "span", "small", "blockquote", "hr"])
export function cleanHTML(html: unknown): string {
  if (typeof html !== "string") return ""
  let s = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|math|template|noscript|form|textarea|select|button|input|link|meta|base)[\s\S]*?(<\/\1\s*>|$)/gi, "")
  s = s.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (tag, name: string, attrs: string) => {
    const n = name.toLowerCase()
    if (!ALLOWED.has(n)) return ""
    if (tag.startsWith("</")) return `</${n}>`
    const keep: string[] = []
    attrs.replace(/([a-zA-Z-:]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g, (_m, an: string, _v, d, q, u) => {
      const a = an.toLowerCase(), v = String(d ?? q ?? u ?? "")
      if (a === "class" && /^[\w\s-]*$/.test(v)) keep.push(`class="${v}"`)
      else if (a === "style" && !/url\s*\(|expression|javascript:|@import|behavior/i.test(v)) keep.push(`style="${v.replace(/"/g, "&quot;")}"`)
      else if (n === "a" && a === "href" && /^(https?:|mailto:|tel:|\/|#|assets\/)/i.test(v.trim())) keep.push(`href="${v.replace(/"/g, "&quot;")}"`)
      return ""
    })
    if (n === "a") keep.push('target="_blank"', 'rel="noopener"')
    return `<${n}${keep.length ? " " + keep.join(" ") : ""}>`
  })
  return s.trim()
}

const text = (v: unknown, max = 400) => (typeof v === "string" ? v.replace(/[<>]/g, "").slice(0, max) : "")
// web addresses, email/phone links, and files on the site itself ("/…" or "assets/…", e.g. the CV PDF)
const url = (v: unknown) => (typeof v === "string" && /^(https?:|mailto:|tel:|\/|assets\/)/i.test(v.trim()) && !/[<>"']/.test(v) ? v.trim().slice(0, 1000) : "")
const img = (v: unknown) => (typeof v === "string" && /^(assets\/|\/assets\/|\/media\/|https:\/\/)/.test(v) && !/[<>"']/.test(v) ? v.slice(0, 500) : "")
const colour = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined)

/* validate + clean a whole content document before it is stored */
export function cleanContent(doc: any) {
  if (!doc || typeof doc !== "object" || !doc.ch || typeof doc.ch !== "object") throw new Error("Content is missing its groups")
  const ch: Record<string, unknown> = {}
  for (const [key, g] of Object.entries<any>(doc.ch)) {
    if (!/^[a-z]{2,8}$/.test(key) || !g || !Array.isArray(g.items)) continue
    ch[key] = {
      name: text(g.name, 60) || key.toUpperCase(),
      col: colour(g.col) || "#d71920",
      ...(colour(g.glow) ? { glow: g.glow } : {}),
      ...(colour(g.knob) ? { knob: g.knob } : {}),
      items: g.items.slice(0, 60).map((it: any) => {
        const o: Record<string, unknown> = { t: text(it?.t, 160), k: text(it?.k, 240) }
        if (it?.d) o.d = cleanHTML(it.d)
        if (Array.isArray(it?.img)) o.img = it.img.map((m: any) => ({ s: img(m?.s), a: text(m?.a, 300) })).filter((m: any) => m.s).slice(0, 24)
        if (Array.isArray(it?.tags)) o.tags = it.tags.map((t: unknown) => text(t, 60)).filter(Boolean).slice(0, 24)
        if (Array.isArray(it?.links)) o.links = it.links.map((l: any) => [text(l?.[0], 80), url(l?.[1])]).filter((l: string[]) => l[0] && l[1]).slice(0, 12)
        if (Array.isArray(it?.bars)) o.bars = it.bars.map((b: any) => [text(b?.[0], 120), text(b?.[1], 40), Math.max(0, Math.min(1, Number(b?.[2]) || 0))]).slice(0, 12)
        for (const f of ["hero", "contact", "life"]) if (it?.[f]) o[f] = 1
        return o
      }),
    }
  }
  const links = Array.isArray(doc.links) ? doc.links.map((l: any) => [text(l?.[0], 80), url(l?.[1])]).filter((l: string[]) => l[0] && l[1]).slice(0, 12) : []
  return { v: 1, updated: new Date().toISOString(), ch, links }
}

export const newId = () => randomBytes(9).toString("base64url")
