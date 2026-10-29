# Vick Does Creative

The portfolio of **Vickhal Roopram**, a UX/UI, graphic and motion designer from South Africa, built as a 3D synthesizer you can play.

The synth is the interface. Each part of the instrument holds a different side of Vick's work. Hover to read titles, click to zoom in, and press keys to open projects.

![Three.js](https://img.shields.io/badge/three.js-r160-black) ![No build step](https://img.shields.io/badge/build-none-lightgrey)

## How it plays

| Synth part | What it holds |
| --- | --- |
| **Filter buttons**: Design · UI/UX · Motion · Tools · Experimental | Choose what the keyboard shows. The active button glows and the keys light up in its colour. |
| **Keyboard** (14 keys) | One project, tool or experiment per key. Click a key to open its card. |
| **Four big knobs**: Designer · Strategist · Artist · Teacher | Role filters for the keyboard. |
| **Black life strip** (pixel screen + 8 pads) | Family Man · The Fighter · The Explorer. Its cable plugs into the main synth when you select it. |
| **CV remote** (left) | Full CV (PDF), contact details and social links. Also plugs in when selected. |
| **Music side** (right): drum pads, Tone, Wave, BEATS, STOP, MUTE | Pure play. BEATS cycles five original tracks; STOP and BEATS glow while music runs. |

**Keyboard shortcuts:** `A`–`;` play notes, `W E T Y U O P` play sharps, `Z`–`.` play drums, `1`–`6` jump to modes, `←`/`→` page through open cards, `0` or `Esc` go home.

On phones the synth is locked to a top-down view, and cards open as a bottom sheet.

## Project structure

```
.
├── index.html              # Page shell: HUD, detail card, lightbox, import map
├── src/
│   ├── content.js          # All portfolio content (edit this to update the site)
│   ├── main.js             # 3D scene, audio engine, modes, camera, input
│   └── styles.css          # Design tokens and UI styles
├── docs/HANDOFF.md        # Full project context for the next iteration
├── assets/
│   ├── img/                # Project images (g* = portfolio PDF page no., cv* = CV pages)
│   └── cv/                 # Downloadable CV
└── .github/workflows/
    └── pages.yml           # Deploys to GitHub Pages on push to main
```

## Run locally

There's no build step. The page uses native ES modules, so serve the folder over HTTP rather than opening the file directly:

```bash
python3 -m http.server 8080
# or: npx serve .
```

Then open <http://localhost:8080>. Three.js loads from jsDelivr, pinned to `three@0.160.0`.

## Editing content

All text, links and images live in **`src/content.js`**. Each channel looks like this:

```js
gd: { name: 'DESIGN', col: '#1fa957', items: [
  { t: 'Project title', k: 'Kicker line', d: '<p>Description</p>',
    img: [im('g5', 'Alt text')], tags: ['Figma'], links: [['Label', 'https://…']] },
]}
```

- **Add a project:** append an item to a channel. The next free key picks it up automatically, up to 14 per filter.
- **Add an image:** drop a `.jpg` into `assets/img/` and reference it with `im('file-name', 'alt text')`.
- **Fill an "Open slot":** replace that item in `ds`, `st`, `ar`, `te` (roles) or `xp` (experimental).

## Tech

- **Three.js r160** for the scene, with `RoundedBoxGeometry` and `OrbitControls` (desktop only)
- **Web Audio API** for a two-oscillator synth with sub-oscillator, low-pass filter, echo, synthesized drums and a 16-step sequencer for BEATS
- **Canvas textures** for the live screens: oscilloscope, persona pixel art and the remote display
- Fonts: Bungee, IBM Plex Mono and Noto Sans (Google Fonts)

## Deploy

Push to `main`. The included workflow publishes the site to GitHub Pages. Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Credits

- Design and content: Vickhal Roopram, [Behance](https://www.behance.net/vickhalroopram) · [Instagram](https://www.instagram.com/vicsdoesmotion/) · [LinkedIn](https://www.linkedin.com/in/vickhal-roopram/)
- Synth form based on Vick's Figma synth design

© Vickhal Roopram. All rights reserved. Portfolio images, CV and written content may not be reused without permission.
