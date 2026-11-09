# Vick Does Creative: Project Handoff (v1 → v2)

> **For the next Claude session.** This file is the full context for the "VR-17 portfolio synth" project built for **Vickhal (Vick) Roopram**. Read it fully before touching anything. It records what exists, where it lives, how the code works, which connectors worked or failed (and why), the decisions Vick made through feedback, and a concrete plan for v2.
>
> Last updated: 8 November 2026 · v1 status: **live on Netlify** (manual deploys) · Owner: Vick (vickhal@floodlightstudios.co.za)

---

## 0. Workflow (from 1 Nov 2026)

- **`main` is the live site.** Netlify is linked to `VickRoopram/Portfolio-Project` and publishes every push to `main` to https://vick-does-creative.netlify.app. No manual deploys.
- **`version-01` is where refined design, UX and development work happens.** Netlify branch deploys are on for it only, so every push updates https://version-01--vick-does-creative.netlify.app without touching the live site.
- **Release:** when Vick approves what's on the preview, merge `version-01` into `main`. Netlify then publishes it. Don't push unapproved work to `main`.
- **Pushing from Claude:** since 8 Nov 2026 the cloud session can push directly (`add_repo` with push access, then clone `https://github.com/VickRoopram/portfolio-project`). Work goes on a feature branch off `version-01` (e.g. `fix/menu-navigation`) for Vick to preview locally, then merges into `version-01` once he approves. Fallback if access breaks: push from Vick's Mac clone at `~/Projects/vick-does-creative/repo` through Desktop Commander.
- Pull requests into `main` also get a Netlify deploy preview.
- **Content admin (`/admin`)**: Vick edits projects, images and copy there. *Update preview* writes the Blobs `cms/draft` (shown on `version-01`, deploy previews, localhost and any `?draft` URL); *Publish to live* copies it to `cms/live` and keeps the old live in `cms/history/*`. The live site falls back to `src/content.js` until the first publish. **Content edits now live in Blobs, not git**: before changing `src/content.js` by hand, check whether a published version exists, or the code edit won't show. Password: salted scrypt hash in Blobs `cms/auth` (the Netlify API refuses env-var writes from this account's CLI/MCP token, so it isn't an env var); `ADMIN_PASSWORD` env var overrides it and is what local `netlify dev` uses via `.env`.

---

## 1. What this project is

A personal portfolio presented as a **playable 3D synthesizer**. The synth *is* the navigation: each physical part of the instrument holds a side of Vick's work. People hover to read labels, click a part to fly the camera in, press keys to open project cards, and can make music the whole time.

The idea behind it, in Vick's own framing: he is "a creative software clients use to express ideas they didn't know they had yet", an instrument that adapts to whatever the project needs. The portfolio name is **Vick Does Creative** and his tagline is **"I am creative."**

| | |
|---|---|
| **Live site (production)** | https://vick-does-creative.netlify.app (auto-deploys from `main`) |
| **Preview site (`version-01`)** | https://version-01--vick-does-creative.netlify.app (auto-deploys from `version-01`) |
| **Claude artifact (single-file original)** | https://claude.ai/artifact/6QxmesfccrDMV55jaknhdK (shared "anyone with the link") |
| **GitHub repo** | https://github.com/VickRoopram/Portfolio-Project (`main` = live, `version-01` = work in progress). The older repo `VickRoopram/vick-does-creative` is no longer connected. |
| **Figma synth design (visual source)** | https://www.figma.com/design/gXh33LpoadWI0B76ofjD56/Synth?node-id=1-2 |
| **Netlify project** | `vick-does-creative` (renamed from `vick-does-creative-ztpv`; the old URL now 404s) · site ID `6b83ad40-bd2a-4ad8-b794-27ec134997ef` · team "Floodlight Studios" (slug `vickroopram`, Free plan, Vick is Owner) |

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
| **Built-in browser (Claude app pane on the Mac)** | ✅ Works | Used to test the artifact and the Netlify site; `request_access` per site | It renders WebGL at a **very low frame rate**, so animations lag in screenshots. Wait 3–8 s after an action before you screenshot. Approved sites: claude.ai, the artifact frame host, unicorn.studio (one-off), vick-does-creative.netlify.app, app.netlify.com, pin.it, za.pinterest.com. |
| **Desktop Commander (Mac shell)** | ✅ Works | `start_process` and `read_process_output` | The Mac has Homebrew, Node v25.2.1, npx, git and curl. Home is `/Users/vick`. |
| **remote-devices file bridge** | ✅ Works | `device_request_folder_access` granted `/Users/vick/Projects/vick-does-creative`; `device_commit_files` copies container files to the Mac | Only stages from `/mnt/user-data/outputs/`. |
| **Local render test (container)** | ✅ Works | Sparse-clone three.js r160 from GitHub (`git clone --depth 1 --branch r160 --filter=blob:none --sparse`), then Playwright routes `cdn.jsdelivr.net/npm/three@0.160.0/*` to it. SwiftShader runs ~1 fps, so use `page.clock.install()` + `pauseAt()` + `runFor()` to step animations. | npm and jsDelivr stay blocked. |
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
index.html            Page shell: header (logo, theme, sound, menu #menu), section titles (#groups), hover label (#lbl),
                      detail card (#card), lightbox (#lb), import map, <script type=module src=src/main.js>
src/content.js        All portfolio data (exports CH, LINKS, im). ~96 lines.
src/main.js           Page: imports the layers, wires `act` (zoomTo, zoomOut, openCard, closeCard), runs the loop
src/core/             state.js (S, V, hits, anim, CTRL, ROWBTN, act) · data.js (awaits /admin content, MODES, ORDER)
                      audio.js (P, synth voice, drums, 5 beat tracks, scope) · scene.js (renderer, camera, lights, controls)
src/atoms/            geometry (rbox, cyl, flat, rrPath) · textures (canvasTex, radialTex, TEX, SPUN, halo, underlight)
                      materials (palette C, M, themed, decal, STEEL, KNURL, RUBBER) · labels (printed, printedIcon, engraved)
                      icons (coolicons paths, icon(), socialIcon(), drawIcon(); hydrates <i data-icon> in index.html)
src/molecules/        fx (gap halo + comet stroke) · controls (pressable, itemCtrl, knob, cap, screw) · cable
src/organisms/        synth · remote · desk (plant, lamp) · underlights · screens · card · menu · zoom (guide) · intro
src/page/             camera (frameFor, flyTo, zoomTo) · theme (LOOK, setTheme) · input (pick, drags, hover tip, keys)
src/styles.css        @imports styles/tokens → atoms → molecules → organisms ([hidden]{display:none!important} is REQUIRED)
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

### Key runtime concepts
- **`MODES[key]`** (core/data.js): `{part, n, glow, box}`. `box` names the camera framing: `all | kb | cv`. Modes: gd, ux, mo, tl, xp, ab (keyboard) and cv (remote). `onKeys(ch)` says whether a mode lives on the keys.
- **State** (core/state.js): `S = {mode, card, kb, hover, hoverUntil, grp, menu}`; `V = {themeK, themeT, fly, drag, side, zoom}`. `S.card = {ch, i, from}` (`from: 'menu'` shows the card footer). Lower layers call app actions through `act` instead of importing upward.
- **`itemCtrl(mesh, ch, i, sound)`**: a control that holds content. `ch` is `'kb'` (follows `S.kb`) or `'cv'`. **The item opens on `pointerdown`**: the up/click path was unreliable in the Claude browser pane.
- **`pressable(mesh, onPress, tip)`**: a plain button with a press animation.
- **`userData.proxy`**: an invisible-to-logic hit target that forwards to another mesh (key tiles, knob rings and indicators).
- **Camera:** `frameFor(boxKey)` fits a `Box3` to the view. `flyTo()` tweens over 1.5 s with an ease-in-out. `camera.setViewOffset()` shifts the view **only while a side panel (card or menu) is open** (left on desktop by half the panel width, up on mobile), so the synth stays centred otherwise. With a panel open (or about to open, `V.side`), `frameFor()` fits the part into the width beside it; if a panel opens or closes while zoomed in and the visitor hasn't orbited since the last flight, the camera glides to the new framing (800 ms).
- **Mobile (≤760 px):** a top-down camera (`pol = 0.001`), rotation and zoom disabled, and the card becomes a bottom sheet.
- **Glow:** `refreshGlow(t)` runs every frame and sets `emissiveIntensity` on keys, pads, filter buttons, role knobs, STOP and BEATS.
- **Cables:** `cable(loose, plug, colour, radius, isOn)` interpolates 6 control points with a lift arc and rebuilds `TubeGeometry` while moving. The jack LED lights at t > 0.97.
- **Audio:** two detuned oscillators plus a sine sub → low-pass → master. An echo send (delay with feedback) runs alongside. Drums are synthesised (noise buffer and oscillators). `TRACKS[]` holds 5 entries: `{n, bpm, wave, base, prog, lead, bass, k, s, h, c?}` as 16-step strings.
- **Keyboard shortcuts:** `A–;` notes, `W E T Y U O P` sharps, `Z–.` drums, `1–7` modes, `←/→` card paging, `0`/`Esc` home.

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
11. Materials moved to Teenage-Engineering-style finishes: brushed/anodised aluminium, satin keys, knurled knobs, screws.
12. **Nov 2026: press FX + light/dark mode** (refs: Pinterest industrial-design reels, a glowing pill toggle, a rim-lit dark device, a KO II and a gunmetal knob panel).
    - **Gap glow:** every control has a blurred rounded-rect "halo" plane on the deck under its cap (`fxOf()`), so light leaks from the gap. Item controls mirror their emissive state into the halo, so active-mode keys glow in the mode colour.
    - **Stroke:** on press, a ribbon shader (`strokeFor()`) traces the cap outline: two heads race from the front-centre round both sides to the back, then the full outline fades. `pulse(mesh, delayMs, amp)` fires both; `press()` calls it.
    - **Mode wave:** `modeWave()` strokes the owning filter/knob and ripples pulses across the mode's item keys (45 ms stagger).
    - **Theme:** `PRESET` entries carry a `dark` colour (+ `denv` env strength); `themed()` tags any material; `applyTheme(k)` lerps materials, lights, floor pool and exposure. Toggle `#thm`; saved in `localStorage['vdc-theme']`, else `prefers-color-scheme`. Inline script in `index.html` sets `data-theme` before paint. FX blend normally in light mode and additively in dark mode. In dark mode cap faces glow less (`face` factor) so the light comes from the gaps.
    - Drum pads are now **graphite caps with light print** (KO II); knob bands use a **diamond knurl**.
    - **Camera controls (`#nav`, section `NAV` in main.js):** joystick = rate control (stick sets target orbit speed; `vAz`/`vPol` ease toward it with τ≈0.22 s, so the camera accelerates and glides), knob is a damped spring (k 260, c 20) so it overshoots back to centre; tap (<6 px, <400 ms) = `resetView()` → `flyTo(current box)`. Zoom slider = position control on a log scale between `controls.minDistance`/`maxDistance`; radius follows a slightly under-damped spring (k 34, ζ 0.8). Any input cancels a running `fly`. Sits bottom right at every size (desktop card ends 140 px above the bottom to clear it; on phones it hides while a card sheet is open). Vick: users must still be able to use mouse, trackpad or touch instead, so OrbitControls rotate/zoom are now on for phones too (one-finger orbit, pinch zoom; they start top-down and the joystick tap resets).
    - HUD: CSS tokens for both themes; `.btn`/card nav get a `zap` glow + conic-gradient stroke (`@property --sw`) on press; the card traces its outline in the project colour on open. `--glow` follows the active mode.

13. **Nov 2026: Figma header, section titles and underlights** (Figma file *Other Designs* → page *Portfolio-Project*: Empty State, 1) Home-Hover, 2) About Me-Hover, 3) Contact-Hover).
    - **Header:** solid bar (`--hdr`, 170 px at 4K), logo + sun/moon + sound + hamburger SVGs from Figma in `assets/ui/` (`*-on-dark` / `*-on-light`, swapped by CSS per theme). Menu `#menu` (Home, About Me, My Projects, Contact, Download CV); burger bars morph to a cross. Sizes scale with `--px` = 100vw/3840 (clamped).
    - **Section titles** `.grp` (About Me = life strip, Contact = remote, My Projects = main synth) are projected each frame from the top-back edge of each device's box in `updateGroups()`; they grow Medium 28.7 → Ultra 90 (`.on`). Font stack `--ui`: Gotham, then Montserrat (Gotham is licensed, not loaded).
    - **Underlights:** one white soft-edged plane per device under it on the floor, tinted through `material.color`; fades in on hover in the overview. Vick asked for it subtle, *"almost like a bottom light under the synths"*, then a smaller area with the brightest part right on the device edge and the colour falling off immediately (`underlightTexture()`: exp falloff, λ = 0.09 world units, 56 px per unit; opacity .48 dark / .3 light), traced around each device's casing only (`foot` box: body mesh, plus the lip on the main synth) so knobs, the strip's cable dock and cables don't widen it. Titles anchor to the casing's top-back edge, baseline ~0.08em above it. The My Projects light follows `MODES[S.kb].glow` and stays on (.75) while a keyboard mode or card is open.
    - Clicking a title or a device body (not a control) zooms into that part.

14. **Nov 2026: office set-up** (ref: pradiplabs.dev; Vick: only a desktop based on his laptop, a plant and a lamp).
    - **Desk:** oak top whose top surface is y = 0 (so the synths kept their positions), grey metal legs; the shadow floor and light pool moved down to the room floor (y −30.9).
    - **Monitor `MON`** behind the strip (silver back, black glass bezel, 16:9 screen, 15 units wide). Every synth has a permanent cable into its stand (`staticCable()`); the old synth-to-synth plug cables still animate.
    - **Desktop screen** = `drawDesk()` on a 1920×1080 canvas, redrawn only when its key changes. Menu-bar tabs and the dock switch `S.kb`; the window shows `CH[S.kb]` as up to 18 tiles (first image, or a coloured placeholder); right-hand icons open About, Contact, CV, Life. Clickable regions live in `REG` and are hit-tested from the ray's UV (`regAt`). Mode `desk` (`MODES.desk`, box `screen`, polar 1.5, `maxPolarAngle` lifted to 1.56 while there). Click the screen to fly in; clicks then act on regions. Hovering a synth key highlights its tile.
    - **Lamp** (coral mushroom, PointLight + emissive shade + warm pool on the desk; click toggles) and **snake plant** (gentle leaf sway). Menu has a Desktop entry.

15. **Nov 2026: playful stylised redesign** (ref: portfolio-zxc.com). The desktop monitor from step 14 was removed; desk, lamp and plant stayed.
    - **Look:** warm, matte, toy-like `PRESET` (cream / warm-grey keycaps, brass rings, coral accents); `LOOK` is cream paper by day and warm charcoal with amber rim and lamp light at night; CSS tokens to match. Fonts: Montserrat, Courier Prime (typewriter UI), Pinyon Script (the "vick's" accent on cards).
    - **Artisan keycaps:** `paintKeys()` prints each key's project image (or a numbered colour tile) on a sticker plane on the cap; redrawn when `S.kb` changes or an image loads.
    - **Camera:** overview polar .3 (nearly top-down), parts at 1.0–1.08 (low and close). `flyTo()` interpolates in spherical coordinates around the moving target with a small mid-flight lift and quartic easing (2.1 s; intro 2.6 s from high above). OrbitControls: left rotate, right pan (along the desk, target clamped to `PANBOX`), wheel zoom to cursor. The joystick and zoom slider were removed; a legend sits under the bottom hairline.
    - **Interactions counter** `#ix`: 12 discoveries (`FIND`), saved in `localStorage['vdc-found']`; `found(id, text)` updates the count and the last-interaction line.
    - **Menu:** full-screen grid-paper overlay with a right-aligned typewriter list. **Intro** `#intro`: ENTER / PORTFOLIO or "enter without sound"; skipped for the rest of the session once entered (`sessionStorage['vdc-in']`).

16. **Nov 2026: life strip removed.** Vick asked to remove the About Me synth with its hover glow and title. `TU` (strip, life screen, 8 pads, 4 knobs, shuffle dock), its cable and socket, `BOX.life`, the `about` group and the fm/fi/ex modes are gone; `PADM` is kept as an empty array so shared code paths stay simple. The Life content still lives in the About pages and CV. Menu "About" now opens the About pages on the keys. The desk is shallower and the plant moved in beside the lamp. The 12th interaction is now switching day/night.

17. **Nov 2026: section titles removed.** Vick asked to remove the Contact and My Projects text as well. `#groups` and the `.grp` titles are gone; `GROUPS` now only drives the hover underlights and the click-the-body-to-zoom behaviour.

18. **Nov 2026: polish pass** (Vick's checklist). Design-system tokens (`--s1..7` spacing, `--r1..3` radius, `--t-xs..2xl` type, `--accent-ui`); plain surfaces with no vignette, script accent, card frame or outline traces; AA-contrast `--mute`; tabular numbers. Cards lead with the project image (`.pic.lead`) under a tight title/kicker group; links are `.cta` buttons (first primary, rest ghost); Copy email confirms with a drawn tick and a `toast()`. Images shimmer until loaded. Intro is one headline + primary "Enter the portfolio" (spinner until the scene is ready) over the blurred live synth. Menu without numbers or footer; counter without its label; hover tips show only the name. Keys are plain again (no artisan images). Headlines in content.js name what's inside (e.g. "5 years designing at Floodlight Studios"). Overview frames the synths tighter.

19. **Nov 2026: interactions counter removed** (Vick asked). `#ix`, `FIND`/`found()` and `localStorage['vdc-found']` are gone.

20. **Nov 2026: knobs are sound controls.** The four big knobs no longer open the role channels (Designer, Strategist, Artist, Teacher); they set FILTER (`cutoff`), RESONANCE (`q`), DECAY and ECHO (`wet`). The small knob is DETUNE and the remote knob is master VOLUME. Every knob cap is one forged/spun steel material (`STEEL`, texture `SPUN`: lathe rings, radial forging grain, spindle mark, wear scratches and pits driving colour, roughness and bump) with a dark indicator. Hovering a knob shows its value on the synth screen. The role channels stay in the content but no longer have a control; the full CV is reached from the menu's Download CV.

21. **Nov 2026: mode buttons.** DESIGN · UI/UX · MOTION · TOOLS · EXPERIMENTAL are matte rubber caps (`RUBBER`) with white Montserrat 700 labels at one size. Their colour leaks only from the gap: `userData.edge` drives the gap halo independently of the cap face: 0 idle, ~.9 while its mode is active, 1 on hover or with one of its cards open; the face only gets .035 emissive when lit, plus a soft elliptical core light (`coreTex`, tinted per mode, opacity .32 dark / .22 light × edge, eased) just under the label to read as a thin translucent top layer. Labels are engraved (`engravedLabel()`: dark top wall, faint lower catch-light, off-white inlay). Press strokes and the theme transitions are unchanged.

22. **Nov 2026: atomic restructure + clipping pass.** `main.js` split into `core/ → atoms/ → molecules/ → organisms/ → page/` (each layer imports only the layers below; upward calls go through `act`), and `styles.css` into tokens/atoms/molecules/organisms. Removed dead code: the life strip (`PADM`, `S.pad`, `S.persona`), role modes (ds/st/ar/te, sk/aw/wk/sd), `DOCK`, `BIGCAPS`, `FIG/FCOL/FN`, `A()`, `BOX.th/info`, the HUD zap pulse, `#frame`, `#eb`, `.btn/#dock/#hint/.logo/.eyebrow/.links/.gal button` CSS and all override-on-override rules. Fixes: WAVE threw on `setSwitch()` (undefined), so it never played its note; long words (EXPERIMENTAL) ran off their label canvas (engraved labels now size the canvas to the plane); decals (labels, screens, halos, core glows, underlights, lamp pool) use polygon offset (`decal()`) so they no longer z-fight at a distance; the big-knob legends were half under the mode row (knobs set back .08); the hover tip wraps and stays inside the window instead of cutting text off; number keys 1–7 now include the remote; the remote screen's CV heading was cut off at the top edge. The /admin preview renders the same card markup as the site.

23. **Nov 2026: coolicons.** Every icon comes from the coolicons Figma library (file `TBfZkoz8tYOH4Pz3eAf2p1`, style *Line · Round*, 24 px, 2 px stroke), stored as path data in `src/atoms/icons.js` and drawn in `currentColor` so it follows the theme. Placed: header theme (sun/moon), sound (volume-high/volume-off), menu (the menu icon's lines fold into its close cross), card prev/next/close, CTAs (mail, copy, check when copied, external-link, download for PDFs), phone on the cell line, brand marks on the social links (Behance, Instagram, LinkedIn, Threads, X; globe fallback), menu CV link (download), intro Enter (arrow-right) and Enter without sound (volume-off), a lightbox close button, and the remote's social keys in 3D (behance, instagram, linkedin, more-horizontal via `printedIcon`). The old `assets/ui/sun|moon|sound-*.svg` files are gone; the logo stays. To add one: copy the path `d` from Figma (export SVG of the *Style=Line, Radius=Round* variant) into `PATHS`.

24. **8 Nov 2026: menu bug fix + menu navigation rebuild** (Vick: *"when using the menu to navigate the camera does not move or become accessible"*).
    - **Bug (root cause):** `#menu.out` reused the same `fade` keyframes, only reversed. The browser doesn't restart an animation whose name hasn't changed, so `animationend` never fired and `closeMenu()` never set `hidden`. The menu sat at opacity 0 over the whole screen (`inset:0`, z 6) and swallowed every click and drag on the synth, and clicking it again just re-ran the broken close. Reproduced headless (`elementFromPoint` on the canvas returned `#menu` after a menu click).
    - **Fix:** `closeMenu()` no longer waits on `animationend`. `.out` sets `pointer-events:none` at once, plays its own `panelOut` keyframes and a 240 ms timer hides the panel (a token cancels it if the menu reopens). `menuOpen()` ignores a closing panel. Tested: after every menu action the canvas is the top element again.
    - **Menu is now a side panel** (`#card,#menu` share one geometry: right on desktop, bottom sheet ≤760 px) instead of a full-screen overlay, so the camera moves in view and the synth stays usable. Rendered by `organisms/menu.js` from `CH`: root (Home, About, Projects ›, Contact, Download CV) → Projects (the five modes `PROJECT_MODES`: Graphic design, UI/UX design, Motion & 3D, Tools, Experimental, with colour dot and project count) → a mode (its projects: key number, thumbnail, title, kicker; "Open slot" placeholders hidden). A back button steps up; `Esc` steps up, then closes. Opening the menu closes an open card (same side).
    - **Navigation:** Home → `zoomOut()`. Choosing a mode → `zoomTo(mode)` (camera flies to the keys, they light in the mode colour) while the list opens. Choosing a project, About or Contact → `act.journey(ch, i)` in `page/camera.js`: pan out to the desk (950 ms, skipped if already in the overview), swoop into the device (1.5 s), push the key (`push()` in `molecules/controls.js`: sinks .13, nearly flush, holds 420 ms, plays the key's own sound, hover tip names the project), then `openCard(ch, i, {from:'menu', quiet:true})`. Any other navigation (a click on the canvas, a number key, Home, the menu, a mode) cancels the remaining steps (`cancelJourney()`). Reduced motion: no pan out, instant framing, short push. About = key 1 in About mode; Contact = the remote's CONTACT key.
    - **Card footer** `#cf` (shown only when `S.card.from === 'menu'`, kept while paging): **Back to menu** (`chevron-left`) → `openMenuFor(ch, i)`: back to that mode's list with the project marked (`aria-current`), or the root for About/Contact. **Cancel** (`close`) closes the card and stays on the synth. Both are secondary (`.cta.ghost.sm`) with coolicons from `atoms/icons.js`; the footer is pinned to the card's bottom (`.content{flex:1}`).
    - Files: `index.html` (menu shell `#m-head`/`#m-back`/`#m-body`, card footer), `organisms/menu.js` (rewritten), `organisms/card.js`, `page/camera.js`, `page/input.js`, `molecules/controls.js`, `core/state.js`, `main.js`, `styles/organisms.css`, `styles/atoms.css` (`.cta.sm`), README.

25. **8 Nov 2026: menu hover previews + zoom guide with locked zoom** (Vick's follow-up to 24).
    - **Menu:** no thumbnails in the rows and no project counts on the modes (mode rows are colour dot + name; project rows are key number + title + kicker). Instead, pointing at a project shows its lead image (`#m-peek`, 260×163, fixed to the page so the panel never clips it, z 8) hanging just under the row, over the names below, following the pointer sideways and flipping above the row near the bottom of the screen. Keyboard focus (`:focus-visible`) shows it too; no preview on touch or for items without images; hidden on scroll, leave, level change and close.
    - **Zoom lock:** `lockZoom()` in `page/camera.js` sets `V.zoom = {min, max}` and the OrbitControls distance limits: **min** = the closest device framing (`min(frameFor('kb').d, frameFor('cv').d) × .97`, one synth fills the view), **max** = `frameFor('desk').d × 1.02` (new `BOX.desk`, the whole table top). Flights open the limits (0…∞) so the intro and swoops can start outside them, and lock again on landing; resize re-locks. At 1440×900: min 9.4, overview 31.6, max 38.2.
    - **Zoom guide** `#zoom` (`organisms/zoom.js`, run from the loop as `updateZoom(now)`): a mouse/scroll-wheel icon (coolicons-style path drawn in the HTML so its wheel line can animate) sits bottom right at all times. Any change in camera-to-target distance outside a flight (wheel, pinch, the bar) wakes it: it slides to the bottom middle and opens to *Scroll to zoom* (*Pinch to zoom* on phones) + a **Table ↔ Synth** bar (`#zr`, a range input on a log scale between the limits, filled in `--accent-ui`); 2.2 s after the zooming stops it folds back to the icon. Dragging the bar or using arrow keys on it zooms along the current line of sight (and cancels a flight or menu journey). Clicking the icon shows the instructions for 4 s. The legend drops "Scroll to zoom" and fades while the guide is centred (`body[data-zoom="on"]`); on phones the guide hides while the card or menu sheet is open.
    - Also fixed in the README: the stale joystick/zoom-slider paragraph (removed in entry 15) is replaced by the zoom guide.
    - **Menu labels removed** (Vick, same night): no kicker line under project titles and no helper text under the Projects/mode headings. Rows are now just colour dot + mode name, or the project title.
    - **9 Nov 2026:** project rows lose their key numbers too, and project titles drop to weight 500 (mode and root rows stay bold) for better contrast.
    - Files: `index.html`, `organisms/menu.js`, `organisms/zoom.js` (new), `page/camera.js`, `core/state.js`, `main.js`, `styles/organisms.css`, README.

26. **9 Nov 2026: zoom bar becomes a plain meter; the icon reacts at the limits** (Vick).
    - The bar is no longer a slider (no thumb, no dragging): `#zr` is an empty track (`.z-track`, `role="meter"`, `aria-valuenow` 0–100) whose `.z-fill` grows as you zoom in: empty = the whole table, full = one synth. *Scroll to zoom* stays.
    - Same day, Vick: no labels on the bar, just a live **0–100%** readout after it (`#zpct`, tabular mono, red at 100%). The Table / Synth end labels are gone. The bar is now small (64×4 px, 56 px on phones) so it reads as a short, limited range; the zoom limits from entry 25 are unchanged and were re-checked on the preview (in stops at one synth, out stops at the table).
    - **Full (fully zoomed in):** `#zoom[data-edge="max"]`: the icon turns accent red and shakes (`.z-ico.shake`, 0.5 s), its wheel line spins fast, and the full bar glows softly. Scrolling in again at the limit replays the shake.
    - **Empty (fully zoomed out):** `data-edge="min"`: the icon settles (`.z-ico.settle`, a small lift and drop) then relaxes: wheel line still, icon scaled to .9 and softened. Scrolling out again at the limit replays the settle.
    - A capture-phase `wheel` listener on `#stage` opens the guide and replays the reactions, because scrolling against a limit doesn't change the camera distance. The edge state is held during flights. Reduced motion: no shake, settle, glow or transitions.
    - Files: `index.html`, `organisms/zoom.js`, `styles/organisms.css`, README.

27. **9 Nov 2026: 0% = the whole table; the camera always centres on the table and its synths** (Vick). Also a journey bug fix.
    - **0% zoom = the whole table:** `V.zoom.max` is now `tableFit()`: the exact distance at which all eight corners of `BOX.desk` are in view, looking straight on at the table's middle (`TABLE`), taken as the larger of the tilts .3 and `TILT_OUT` (.55). It's fixed per viewport (re-locked on resize and after flights), so the percentage doesn't drift while orbiting. 1440×900: 42.4.
    - **Rotation and tilt follow zoom:** each frame `centre()` sets `maxPolarAngle = tiltCap(k)` (.55 at 0% → 1.2 by 80%) and the azimuth range `±turnCap(k)` (0 at 0% → ±1.1 by 45%). Zoomed out you look down on the table straight on (so 0% always fits); the low, cinematic side angles open up as you zoom in. Flights lift the caps and lock again on landing.
    - **Always centred:** `zoomToCursor` is off (zoom goes to the middle of the view). The orbit centre is `home` (where the last flight looked: a device, or the synths in the overview), sliding towards the table's middle as you zoom out from there and reaching it at 0%. Panning can nudge the view up to `PAN_MAX` (2.5) while you drag; let go and it springs back (12% per frame). Orbiting turns around that centre.
    - **Bug fix (from entry 24):** a comment had swallowed `await wait(IN + 120); if (!live()) return;` in `journey()`, so the key push and card came ~0.5 s into the fly-in instead of after landing. Restored on its own line; re-tested (card opens after the camera lands).
    - Files: `page/camera.js`, `core/scene.js` (`zoomToCursor:false`, `maxPolarAngle` 1.2), README.

**Commenting tip:** artifact comments anchored to the 3D canvas **don't carry the click position or selection rectangle**. Ask Vick to name the control instead of guessing (this happened twice).

---

## 7. Known issues and tech debt

| # | Issue | Suggested fix |
|---|---|---|
| 1 | ~~`main.js` is one large file with legacy leftovers~~ Done in entry 22 (atomic modules, dead code removed). `CH.sk/aw/wk/sd/info` still exist in content.js but no control shows them | Split it into `scene/`, `audio/`, `ui/`, `modes/` modules and delete the dead code |
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

**Headless test in the container (works as of 8 Nov 2026):** `git clone --depth 1 --branch r160 --filter=blob:none --sparse https://github.com/mrdoob/three.js` and `git sparse-checkout set --no-cone` the four files the site imports (`build/three.module.js`, `examples/jsm/controls/OrbitControls.js`, `environments/RoomEnvironment.js`, `geometries/RoundedBoxGeometry.js`). Then Python Playwright with `/usr/bin/google-chrome` (`--use-angle=swiftshader --enable-unsafe-swiftshader`), routing `cdn.jsdelivr.net/npm/three@0.160.0/*` to that clone, a fake origin to the repo folder and `/api/*` to 404 (the defaults in `content.js` load). Set `sessionStorage['vdc-in']` in an init script to skip the intro. SwiftShader renders ~1 fps and a 1440×900 screenshot takes ~10 s, so check state with `page.evaluate` (e.g. `document.elementFromPoint` on the canvas) and record timings with a MutationObserver rather than timing screenshots. To photograph a short moment (the key push), run a throwaway copy with the hold stretched.

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
