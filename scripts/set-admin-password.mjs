/**
 * Prints the stored form (salted scrypt hash) of a new admin password, ready for Netlify Blobs.
 * Usage:  node scripts/set-admin-password.mjs > /tmp/auth.json
 *         npx netlify-cli blobs:set cms auth --input /tmp/auth.json && rm /tmp/auth.json
 * The password is read from the ADMIN_PASSWORD_NEW environment variable, so it never lands in shell history or a file.
 */
import { randomBytes, scryptSync } from "node:crypto"
const pw = process.env.ADMIN_PASSWORD_NEW
if (!pw || pw.length < 10) { console.error("Set ADMIN_PASSWORD_NEW (10+ characters)."); process.exit(1) }
const salt = randomBytes(16).toString("base64url")
process.stdout.write(JSON.stringify({ salt, hash: scryptSync(pw, salt, 32).toString("base64url"), changed: new Date().toISOString() }))
