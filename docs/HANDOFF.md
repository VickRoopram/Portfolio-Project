# Vick Does Creative: Project Handoff (v1 → v2)

> **For the next Claude session.** This file is the full context for the "VR-17 portfolio synth" project built for **Vickhal (Vick) Roopram**. Read it fully before touching anything. It records what exists, where it lives, how the code works, which connectors worked or failed (and why), the decisions Vick made through feedback, and a concrete plan for v2.
>
> Last updated: 29 October 2026 · v1 status: **live on Netlify** (manual deploys) · Owner: Vick (vickhal@floodlightstudios.co.za)

---

## 1. What this project is

A personal portfolio presented as a **playable 3D synthesizer**. The synth *is* the navigation: each physical part of the instrument holds a side of Vick's work. People hover to read labels, click a part to fly the camera in, press keys to open project cards, and can make music the whole time.

The idea behind it, in Vick's own framing: he is "a creative software clients use to express ideas they didn't know they had yet", an instrument that adapts to whatever the project needs. The portfolio name is **Vick Does Creative** and his tagline is **"I am creative."**

| | |
|---|---|
| **Live site (production)** | https://vick-does-creative-ztpv.netlify.app |
| **Claude artifact (single-file original)** | https://claude.ai/artifact/6QxmesfccrDMV55jaknhdK (shared "anyone with the link") |
| **GitHub repo (empty, not yet pushed)** | https://github.com/VickRoopram/Portfolio-Project |
| **Figma synth design (visual source)** | https://www.figma.com/design/gXh33LpoadWI0B76ofjD56/Synth?node-id=1-2 |
| **Netlify project** | `vick-does-creative-ztpv` · site ID `6b83ad40-bd2a-4ad8-b794-27ec134997ef` · team "Floodlight Studios" (slug `vickroopram`, Free plan, Vick is Owner) |

---

## 2. Source material and content rules

### Inputs Vick supplied
- `1-Vickhal-Portfolio.pdf`: 61-page graphic design portfolio (DUT 2020) with 12 projects. Page images were exported to `assets/img/g<page>.jpg` at 68 dpi.
- `Living_Creative.pdf`: a 23-slide faith/creativity talk. **Vick later asked for it to be dropped from the synth.** Its slide images were removed from the repo.
- `CV.pdf` (2 pages): exported as `assets/img/cv1.jpg` and `cv2.jpg`, with the PDF itself at `assets/cv/vickhal-roopram-cv.pdf`.
- A context document (Google Doc, also attached as markdown) covering bio, career, tools, goals, social links and "creative profile" text.
- A portrait photo, now `assets/img/vick.jpg`.

### Privacy decisions (keep these)
- **Left out on purpose:** salary and salary goals, debt, weight, shoe size, and money support to parents.
- **Included:** age (27), height (198 cm), heritage (Indian South African), faith (non-denominational Christian, theology degree), partner Lindy, family (parents and three brothers), Jiu-Jitsu, D&D, hiking, dogs and drawing.
- **Contact:** personal email `vickhal10@gmail.com` and cell `+27 73 482 7221` (from his CV, which he asked to be viewable).
- **Copyright:** all content is © Vickhal Roopram. The README says "All rights reserved". Do not add an open-source licence covering the content.

### Brand
- Logo: a Unicode-emote inspired `[:]` mark.
- Colours: red `#d71920` and blue `#009fda`.
- Fonts: **Bungee** (display) and **Noto Sans** (body). The site adds **IBM Plex Mono** for labels.
- Synth look (from Figma): light-grey OP-1-style body, black control strip with three pixel figures (green, blue and pink), a side remote with an orange knob, and black and orange cables.

---

## 3. Where everything lives

| Location | What | Status |
|---|---|---|
| `~/Projects/vick-does-creative/site/` on **Vick's Mac** | Deployable copy of the repo. **Not a git repo** (copied from a zip without `.git`). Has the base-reset fix. | Used for the Netlify CLI deploys |
| Claude cloud container `/home/claude/vick-does-creative/` | The git repo (2 commits on `main`) | **Ephemeral**: lost when the session ends. Re-create from the Mac copy or the zip. |
| Claude cloud container `/home/claude/w/site/index.html` | Single-file artifact source (everything inline) | Ephemeral. Get it back with the Artifact tool's `read` action on the artifact URL. |
| `vick-does-creative.zip` (sent in chat) | Repo snapshot before the base-reset fix | Superseded by the Mac copy |
| `portfolio-setup-plan.xlsx` (sent in chat) | Netlify setup plan with a status tracker | Reference |
| This file | `docs/HANDOFF.md` in the repo and on the Mac | Source of truth for the next session |

**First job for the next session:** turn the Mac copy into the canonical git repo and push it to GitHub (see §9, Phase 0).

---

## 4. Connectors and tools: status and lessons

| Connector / tool | Status | What worked | What failed, and the fix |
|---|---|---|---|
| **Figma MCP (cloud)** | ✅ Connected | `create_session` → `get_screenshot` with `enableBase64Response: true` | Asset URLs (`figma.com/api/mcp/asset/...`) are **blocked by the container proxy (403)**. Always use base64 responses, or run Figma calls through the Mac. |
| **Figma (desktop, via the Mac)** | ⚠️ Comes and goes | `mcp__remote-devices__Figma__*` (get_design_context, get_variable_defs, etc.) appears while the Figma desktop app is open | It disconnected mid-session. Ask Vick to open Figma desktop if you need it. |
| **Netlify MCP** | ✅ Connected | `get-teams`, `create-new-project`, `manage-env-vars`, `update-forms`, `get-netlify-coding-context` | `deploy-site` gives an `npx @netlify/mcp …` command. In the container npm is unreachable; on the Mac it **returned HTTP 500 twice**. **Fix used:** `npx netlify-cli deploy --prod` on the Mac (CLI already logged in; see §10). |
| **Netlify CLI on the Mac** | ✅ Logged in | `netlify-cli deploy --prod --dir . --site <id>` | Needs Desktop Commander (`start_process`). Login was done once with a browser "Authorize" click by Vick. |
| **GitHub** | ❌ Blocked | `list_repos` shows Vick's other repos | **Portfolio-Project is not visible to the Claude GitHub App**: it was installed with "selected repositories". Vick must add the repo under GitHub → Settings → Applications → Claude → Configure. `gh` in the container also has no valid token. |
| **Framer MCP** | ✅ Available, unused | `list_projects`, `open_project`, `exec`, `create_upload_url` | Nothing built yet. Planned for v2 (§9, Phase 3). |
| **Blender MCP (via the Mac)** | ✅ Available, unused | `mcp__remote-devices__Blender__execute_blender_code`, `render_viewport_to_path`, `get_objects_summary`, etc. | Needs Blender running on the Mac with its MCP add-on. Planned for v2 (§9, Phase 4). |
| **Spline MCP (via the Mac)** | ✅ Newly available | `3d_create_file`, `3d_run_code`, `3d_generate_3d_model`, `3d_publish_export`, `3d_take_screenshot` | Unused. A faster alternative to Blender for web-ready 3D (§9, Phase 4b). |
| **Unicorn Studio MCP** | ⚠️ Not connected | `list_designs` works | The editor tab never connected: the browser pane showed a login page. Vick must open a design link in a browser where he's signed in and turn on **Allow agents**. Newer tools (`create_design`, `upload_media`, `export_project_json`) now exist. |
| **Built-in browser (Claude app pane on the Mac)** | ✅ Works | Used to test the artifact and the Netlify site; `request_access` per site | It renders WebGL at a **very low frame rate**, so animations lag in screenshots. Wait 3–8 s after an action before you screenshot. Approved sites: claude.ai, the artifact frame host, unicorn.studio (one-off), vick-does-creative-ztpv.netlify.app. |
| **Desktop Commander (Mac shell)** | ✅ Works | `start_process` and `read_process_output` | The Mac has Homebrew, Node v25.2.1, npx, git and curl. Home is `/Users/vick`. |
| **remote-devices file bridge** | ✅ Works | `device_request_folder_access` granted `/Users/vick/Projects/vick-does-creative`; `device_commit_files` copies container files to the Mac | Only stages from `/mnt/user-data/outputs/`. |
| **Container network** | ⚠️ Restricted | pypi | **Blocked:** npm registry, jsDelivr, api.netlify.com, figma asset host, netlify-mcp.netlify.app. So you **can't run the site in a headless browser in the container**: three.js can't load. Test through the built-in browser instead. |

---

## 5. Architecture (v1)

### Stack
- Static site with no build step. Native ES modules plus an import map.
- **three.js r160** from jsDelivr, using `OrbitControls` and `RoundedBoxGeometry`.
- **Web Audio API** synth and drums, generated in code with no audio files.
- Canvas textures for the three live screens.
- Google Fonts: Bungee, IBM Plex Mono and Noto Sans.

### Files
```
index.html            Page shell: top bar (brand, Home, Sound), hint line, hover label (#lbl),
                      detail card (#card), lightbox (#lb), import map, <script type=module src=src/main.js>
src/content.js        All portfolio data (exports CH, LINKS, im). ~96 lines.
src/main.js           Everything else. ~434 lines, sectioned with /* ─── NAME ─── */ banners:
                      MODES · CARD · AUDIO · 3D SCENE · CAMERA · SCREENS · BEATS · INPUT · LOOP
src/styles.css        Base reset ([hidden]{display:none!important} is REQUIRED), tokens, HUD, card, mobile sheet
assets/img/           g<page>.jpg portfolio pages, cv1/cv2.jpg, vick.jpg (~3.1 MB)
assets/cv/            vickhal-roopram-cv.pdf
netlify.toml          publish=".", cache headers for /assets/*
.github/workflows/pages.yml   GitHub Pages deploy (alternative host; optional)
README.md             User-facing docs (controls, structure, how to edit content)
```

> ⚠️ **There are two copies of the code.** The Claude artifact is one inline HTML file. The repo is the same code split into modules. Changes made since the split have been made in **both**. In v2, **retire the artifact** and treat the repo as the only source; the Netlify site is the share link.

### Data model (`src/content.js`)
```js
CH[channelKey] = { name, col /* accent */, knob? /* knob colour override */, items: [
  { t /*title*/, k /*kicker*/, d /*HTML body*/, img:[{s,a}], tags:[], links:[[label,url]],
    hero?:1 /*portrait block*/, bars?:[[label,level,0..1]], contact?:1, life?:1 }
]}
im('g5','alt') → { s:'assets/img/g5.jpg', a:'alt' }
```

**Channels:**

| Key | Name | Used by | Items |
|---|---|---|---|
| `gd` | DESIGN (graphic) | Filter button | 12 portfolio projects |
| `ux` | UX / UI DESIGN | Filter button | 7 (Floodlight, retail SaaS, Parliament systems, method, workflow, Geek Punch, training) |
| `mo` | MOTION & 3D | Filter button | 6 |
| `tl` | TOOLS | Filter button | 12 |
| `xp` | EXPERIMENTAL | Filter button | 2 real + 2 "Open slot" |
| `ds` / `st` / `ar` / `te` | Designer / Strategist / Artist / Teacher | Big knobs | Reuse items from `gd`/`ux`/`mo` plus "Open slot"s |
| `fm` / `fi` / `ex` | Family Man / The Fighter / The Explorer | Life strip pads | 3 / 1 / 4 |
| `cv` | CV & CONTACT | Remote | Full CV, Contact, Behance, Instagram, LinkedIn, More socials |
| `ab` | ABOUT | Synth screen click | 5 (hello hero, name, since age 12, background, forever student) |
| `sk` `aw` `wk` `sd` | Skills / Awards / Work / Study | **No longer on the synth** (removed by Vick) | Still in data. Can be resurfaced in v2 (e.g. on the CV remote). |
| `info`, `life` | Legacy | `info.items[0]` feeds `ab`; `life` feeds a combined card | Clean these up in v2 |

### Synth layout → interactions (v1 final)
Main synth grid is 17 columns × 6 rows, mapped to world coordinates by `GX(c) = -8 + c` and `GZ(r) = -2.5 + r`. The deck top sits at `TOP = 0.9`.

| Part | Position | Behaviour |
|---|---|---|
| Screen | cols 0–3, rows 0–1 | Live canvas: mode name, hovered title, oscilloscope. Clicking it opens About. |
| 4 big knobs (blue / green / white / orange) | cols 4–11 | **Role filters**: Designer, Strategist, Artist, Teacher. Clicking or dragging one zooms to the keys, lit in that knob's colour. |
| Speaker grille | cols 12–13 | Pulses with the audio level |
| Tone knob · WAVE · BEATS | cols 14–15 | Tone = filter cutoff (drag). WAVE cycles triangle/square/saw. **BEATS** cycles 5 sequenced tracks. |
| STOP · MUTE | col 16 | STOP stops the music (red square icon). STOP and BEATS **glow orange and pulse at the track's BPM** while music plays. |
| Filter row | row 2, 5 wide buttons | **DESIGN · UI/UX · MOTION · TOOLS · EXPERIMENTAL**. Each loads its channel onto the keys. The active button pulses, hovering one previews its colour on the keys, and opening a key presses its button. |
| 14 long keys (+ 10 black sharps) | cols 0–13, rows 3–5 | Key *i* = item *i* of the active keyboard channel (`S.kb`). Keys beyond the item count only play notes. The whole tile is clickable (proxy hit area). |
| 3×3 drum pads | cols 14–16, rows 3–5 | kick, snare, hat, clap, tom, rim, shaker, crash, blip |
| **Black life strip** (group `TU`, behind) | pixel screen + 8 pads + 4 sound knobs + shuffle dongle | Clicking a figure (screen thirds via `lastHit.uv.x`) selects Family Man / Fighter / Explorer. Pads hold that persona's items. Its cable **plugs into a jack on the main synth's back** when active. |
| **CV remote** (group `RM`, left) | screen, orange knob, CONTACT pill, 4 squares | Full CV, Contact, Behance, Instagram, LinkedIn, More socials. Its orange cable **plugs into a jack on the main synth's left side** when active (click sound and LED). |

**Layout rule from Vick:** content and CV controls on the **left**, music-only controls on the **right**.

### Key runtime concepts in `main.js`
- **`MODES[key]`**: `{part, n, glow, box}`. `box` names the camera framing: `all | kb | life | cv`.
- **Mode groups:** `KBM` lists keyboard channels (they set `S.kb`). `PADM` lists life-strip personas (they set `S.pad`). `ORDER` is used by the number keys and shuffle.
- **State `S`:** `{mode, card, kb, pad, hover, hoverUntil}`
- **`itemCtrl(mesh, ch, i, sound, {knob, pressy})`**: a control that holds content. `ch` can be `'kb'` or `'pad'`, resolved at runtime by `realCh()`. **The item opens on `pointerdown`**: the up/click path was unreliable in the Claude browser pane.
- **`pressable(mesh, act, tip)`**: a plain button with a press animation.
- **`userData.proxy`**: an invisible-to-logic hit target that forwards to another mesh (key tiles, knob rings and indicators).
- **Camera:** `frameFor(boxKey)` fits a `Box3` to the view. `flyTo()` tweens over 1.5 s with an ease-in-out. `camera.setViewOffset()` shifts the view **only while a card is open** (left on desktop, up on mobile), so the synth stays centred otherwise.
- **Mobile (≤760 px):** a top-down camera (`pol = 0.001`), rotation and zoom disabled, and the card becomes a bottom sheet.
- **Glow:** `refreshGlow(t)` runs every frame and sets `emissiveIntensity` on keys, pads, filter buttons, role knobs, STOP and BEATS.
- **Cables:** `cable(loose, plug, colour, radius, isOn)` interpolates 6 control points with a lift arc and rebuilds `TubeGeometry` while moving. The jack LED lights at t > 0.97.
- **Audio:** two detuned oscillators plus a sine sub → low-pass → master. An echo send (delay with feedback) runs alongside. Drums are synthesised (noise buffer and oscillators). `TRACKS[]` holds 5 entries: `{n, bpm, wave, base, prog, lead, bass, k, s, h, c?}` as 16-step strings.
- **Keyboard shortcuts:** `A–;` notes, `W E T Y U O P` sharps, `Z–.` drums, `1–6` modes, `←/→` card paging, `0`/`Esc` home.

---

## 6. Decision log (Vick's feedback, in order)

1. v1 had a side panel. Vick: *"the synth should be the main mode of navigating … zoom into modes … hover shows titles."* So the side panel was removed and replaced with camera zoom per part, floating cards, and labels both at the control and on the synth screen.
2. The remote became **CV & Contact**, with the full CV, contact details and social handles.
3. The big knobs went from Theology to **Designer / Strategist / Artist / Teacher**. *"Ignore the Living Creative PDF."*
4. The black strip became **personal life**: Family Man / Fighter / Explorer, reduced to touch pads.
5. Music controls moved to the **right**, CV and project details to the **left**.
6. Button row: first only "about me" items, then filters for the keys with linked glow, then **finally only Design, UI/UX, Motion, Tools, Experimental**.
7. The synth stays centred. Mobile is static top-down. A **Home** button sits in the top bar at every size. The bottom dock menu was removed.
8. The side units' **cables plug into the main board** when selected.
9. TOUR became **BEATS** (5 tracks, cycled per click). The old HOME key on the synth became **STOP**, and both glow while music plays.
10. The camera **pushes in** closer on selection (desktop margin 0.9, mobile 1.02, 1.5 s flight).

**Commenting tip:** artifact comments anchored to the 3D canvas **don't carry the click position or selection rectangle**. Ask Vick to name the control instead of guessing (this happened twice).

---

## 7. Known issues and tech debt

| # | Issue | Suggested fix |
|---|---|---|
| 1 | `main.js` is one large file with legacy leftovers (`MODES.*.dock`, `S.persona`, `CH.info.items.length=6`, `life` channel, `setSwitch()` no-op, `sk/aw/wk/sd` unreachable) | Split it into `scene/`, `audio/`, `ui/`, `modes/` modules and delete the dead code |
| 2 | Content is in JS. Not editable by non-developers. | Move it to `content/*.json`, or a CMS (Netlify Blobs/DB, or the Framer CMS) |
| 3 | Geometry is procedural boxes and cylinders, not a real modelled synth | Model it in Blender or Spline and load it as GLB (§8) |
| 4 | Images are JPEG page renders at 68 dpi, ~3.1 MB total, no `srcset` | Re-export the real project images as WebP/AVIF in two sizes; use the Netlify Image CDN |
| 5 | No SEO or crawler content (everything is in WebGL) | Add `<noscript>` and a hidden semantic HTML list of projects, Open Graph image, sitemap |
| 6 | Accessibility: content is only reachable through 3D clicks or number keys | Add a DOM "list view" toggle, focusable controls and `aria-live` on the card |
| 7 | `three` loads from a CDN at runtime, so there's no offline use and a version risk | Optional Vite build to bundle and minify |
| 8 | Netlify deploys are manual from the Mac | Connect Git continuous deployment (Phase 0) |
| 9 | The "Powered by Netlify" badge shows on the site | Free-plan behaviour (or a drawer badge): check the project settings |
| 10 | Untested on real phones and Safari iOS audio unlock | Test on an Honor 400 Pro and an iPad. The audio context starts on the first pointerdown. |
| 11 | No contact form, admin or analytics yet (planned in `portfolio-setup-plan.xlsx`) | Phase 1 |

---

## 8. 3D asset pipeline spec (for Blender or Spline → the web)

Use this contract so a modelled synth drops into the existing interaction code.

**Export:** glTF 2.0 binary (`.glb`), Y-up, metres (1 grid cell is about 1 unit as now), apply transforms, **Draco** or **Meshopt** compression, KTX2/Basis textures where possible. Target **under 4 MB** total.

**Materials:** PBR Metallic-Roughness. Bake AO and light into one 2K texture atlas for the body. Use separate small materials for anything that glows (keys, pads, buttons, knob caps, LEDs) so the code can drive `emissive` on each.

**Object naming (code maps these by name):**
```
synth_body, synth_deck
screen_main            (plane; UVs 0..1 for the canvas texture)
key_00 … key_13        sharp_00 … sharp_09
filter_design, filter_uiux, filter_motion, filter_tools, filter_experimental
knob_role_designer, knob_role_strategist, knob_role_artist, knob_role_teacher   (pivot at the knob centre, rotate on Y)
knob_tone, btn_wave, btn_beats, btn_stop, btn_mute, speaker_grille
pad_drum_0 … pad_drum_8
strip_body, strip_screen (plane), strip_pad_0 … strip_pad_7, strip_knob_0…3, strip_shuffle
remote_body, remote_screen (plane), remote_knob_cv, remote_btn_contact, remote_sq_0 … remote_sq_3
jack_remote, jack_strip   (empties marking the plug position and direction)
cable_remote_start, cable_strip_start (empties)
```

**Animations (optional, in the GLB):** `key_press`, `knob_turn`, and a camera rig as named actions. The code currently animates in JS, so baked actions are a bonus and not required. Cables should stay procedural (`TubeGeometry`) so they can plug in dynamically. Export only the start empties.

**Loading in the code (v2):**
```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
const gltf = await loader.loadAsync('assets/3d/vr17.glb');
const get = n => gltf.scene.getObjectByName(n);
// e.g. key i → itemCtrl(get(`key_${pad(i)}`), 'kb', i, () => playNote(wMidi(i)));
```
Keep a **procedural fallback** (the current code) if the GLB fails to load.

---

## 9. v2 roadmap: step by step

### Phase 0: foundations (do first, about 30 min)
1. **GitHub:** confirm Vick has added `Portfolio-Project` to the Claude GitHub App. Then call `mcp__claude-code-remote__add_repo` (owner `VickRoopram`, repo `Portfolio-Project`, access `push`).
2. Re-create the repo from the Mac copy (`~/Projects/vick-does-creative/site`). Run `git init` there through Desktop Commander, or stage the files to the container. Make sure `docs/HANDOFF.md`, `netlify.toml` and `.gitignore` (with `.netlify/`) are included. Commit and push `main`.
3. **Netlify Git CD:** Vick links the repo in the Netlify UI (Project → Site configuration → Build & deploy → Link repository; the publish dir is `.`). Then create a `staging` branch and enable branch deploys (`staging--vick-does-creative-ztpv.netlify.app`). Deploy previews per pull request come automatically.
4. Optional: rename the project or add a custom domain (Netlify MCP `update-project-name`; DNS is in Vick's hands).
5. Delete `.github/workflows/pages.yml` if Netlify is the only host. Running both hosts is confusing.

### Phase 1: Netlify features (data and backend)
Call `mcp__Netlify__get-netlify-coding-context` for `forms`, `functions`, `blobs` and `db` **before writing code**. That's required by the Netlify server instructions.
- **Contact form:** use Netlify Forms. Add a hidden static `<form name="contact" netlify netlify-honeypot="bot-field">` in `index.html` so the build bot detects it. Submit with `fetch('/', {method:'POST', body:new URLSearchParams(...)})` from the CV remote's Contact card. Enable forms with `update-forms`. Set up email notifications in the UI (Forms → Notifications).
- **Editable content:** add `/admin` (a static page) and `netlify/functions/content.mjs` (GET public, PUT behind a password). Store `content.json` overrides in **Netlify Blobs** (simplest, no schema needed) or **Netlify DB**/Postgres (if relational data is wanted). The site fetches `/api/content` and merges it over `content.js` defaults. Set the `ADMIN_PASSWORD` env var with `manage-env-vars` (secret, functions scope, production context).
- **Visitor stats:** add `netlify/functions/track.mjs` to increment counters in Blobs, keyed by `mode`, `channel:item` and day. Use no cookies and no IPs, which keeps it privacy-safe. Show a small table on `/admin`.
- **Environments:** set `[context.production]` and `[context.branch-deploy]` in `netlify.toml` with separate Blob store names (`content-prod` vs `content-staging`) so staging edits don't touch production.

### Phase 2: Figma as the design source of truth
- Use `create_session` (fileKey `gXh33LpoadWI0B76ofjD56`), then `get_variable_defs` and `get_design_context` on node `1:2`. Extract the exact colours, radii and proportions of the synth into `src/tokens.js` (or CSS variables) and use those instead of the hand-picked values.
- Ask Vick to add **frames in Figma** for the HUD (top bar, card, mobile sheet) so the UI chrome matches his design system. Consider the Design System artifact type for documenting tokens.
- Keep a frame showing the **control map** (which control = which content). It's the shared spec between Vick and Claude.
- Remember: use base64 screenshots, because the asset URLs are proxy-blocked in the container.

### Phase 3: Framer (marketing site and CMS)
Recommended split: **Framer = the 2D website** (landing page, about, case studies, SEO, CMS), and **the synth = the immersive experience**, embedded or linked.
- `open_project` (or `create_project`) → read the project instructions it returns (the Framer server says to follow them).
- Build the pages: Home (hero, "I am creative", a "Play the synth" CTA), Work (CMS collection mirroring `CH.gd/ux/mo/tl/xp`), CV and Contact.
- Embed the synth with a Framer **Embed/Code component** using an iframe of the Netlify URL, or link out to it.
- Optional later: the Framer CMS becomes the content source and the synth fetches a JSON export. Decide this against the Netlify Blobs admin in Phase 1. **Don't build both CMSs:** ask Vick which one he wants to edit in.

### Phase 4: real 3D model and texturing (Blender, or Spline)
**4a. Blender (most control, best texturing and animation):**
1. Check Blender is open with its MCP add-on (`get_objects_summary`). If not, ask Vick to open it.
2. Use `execute_blender_code` to build the synth from the Figma proportions, following the naming spec in §8. Bevelled body, inset deck, keys with rounded caps, knobs with knurling, the cables' start empties.
3. Materials: a soft-touch plastic body (roughness about 0.55), glossy knob caps in the four role colours, a matte black strip, and emissive-ready key materials. Bake AO and lighting to a 2K atlas.
4. Check the look with `render_viewport_to_path` and `render_thumbnail_to_path`, then stage the PNGs to the container and view them.
5. Export GLB with Draco to `~/Projects/vick-does-creative/site/assets/3d/vr17.glb` and commit it.
6. Swap the procedural meshes for GLB nodes in `main.js`, keeping the fallback.

**4b. Spline (faster, web-native):** `3d_create_file` → `3d_run_code` / `3d_generate_3d_model`, then `3d_take_screenshot` to review, and `3d_publish_export` for GLB or Spline runtime. Good for quick iteration or hover animations. Use Blender for hero-quality texturing.

**4c. Unicorn Studio (2D/WebGL hero effects):** once a tab connects (Allow agents on), create a design for a landing hero: Bungee "VICK DOES CREATIVE", grain and glow, and a portfolio image grid effect. Embed it in Framer. Upload images with `upload_media`.

### Phase 5: polish
- A11y list view, SEO fallback HTML, OG image (render from Blender), performance budget (LCP under 2.5 s on 4G, under 5 MB total), real-device testing, optional Vite build.

---

## 10. Runbooks

**Run locally (Mac):**
```bash
cd ~/Projects/vick-does-creative/site && python3 -m http.server 8080   # open http://localhost:8080
```

**Deploy to production from the Mac (until Git CD is linked):**
```bash
cd ~/Projects/vick-does-creative/site
npx -y netlify-cli@latest deploy --prod --dir . --site 6b83ad40-bd2a-4ad8-b794-27ec134997ef --message "<what changed>"
```
Run it through Desktop Commander `start_process` (timeout about 170 s). If it reports `Unauthorized`, run `npx -y netlify-cli@latest login` and ask Vick to click **Authorize** in the browser. Once Git CD is linked, **stop** manual `--prod` deploys: the next push overwrites them.

**Move a file from the container to the Mac:** write it to `/mnt/user-data/outputs/`, then `device_commit_files` to `/Users/vick/Projects/vick-does-creative/site/...` (that folder is granted; use `force:true` to overwrite).

**Test in the browser:** `Claude_Browser__request_access` for the site, `preview_start`, wait about 8 s, then `computer` screenshot. Expect low FPS, so let camera flights finish before clicking.

**Update the Claude artifact (only if still used):** edit `/home/claude/w/site/index.html` (or `read` the artifact URL to recover it) and publish with the same `file_path`. Keep in mind the artifact host injects `[hidden]{display:none!important}` and a body reset, which the repo now does itself.

---

## 11. Checklist for the next session

- [ ] Read this file. Ask Vick which phase to start with if he doesn't say.
- [ ] Phase 0: GitHub access → push the repo → Netlify Git CD → `staging` branch.
- [ ] Confirm with Vick: **one CMS** (Netlify admin *or* Framer CMS)?
- [ ] Confirm: is a custom domain wanted? Which one?
- [ ] Confirm: is Blender installed with its MCP add-on, or should we use Spline?
- [ ] Get real project images, Figma screens for the UX projects (there are no UX visuals yet), and Geek Punch details.
- [ ] Fill the "Open slot" items (Experimental, the roles, Teacher).
- [ ] After every change: deploy to staging, test in the browser pane, then promote to production.

### Open questions for Vick
1. Should Skills, Awards, Work and Study come back somewhere (e.g. on the CV remote) now that they're off the button row?
2. What goes in the Teacher role and the Experimental slots?
3. Should the Netlify team be renamed from "Floodlight Studios" (his employer's name) to keep the personal and work brands separate?
4. Is Geek Punch public yet, or should it stay "in development"?
