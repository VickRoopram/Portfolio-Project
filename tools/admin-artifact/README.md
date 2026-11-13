# Content admin artifact

Source for the Claude artifact "Vick Does Creative · Content admin"
(https://claude.ai/artifact/5kXk2f12cLbE6fE8U6BYtE). It edits the synth's content (Design, UI/UX, Motion,
Tools, Experimental, About, the remote and the social links) in the artifact's own database. Artifacts can't
reach this site directly, so Claude carries the changes to /api/content through the browser and Vick's /admin sign-in.

- `page.html`: the page (tokens, card CSS and icon paths are filled in by the build)
- `build.py`: writes `out/index.html`; publish it with the site's `assets/img` (resized) as `img/*`

How a sync works step by step is in docs/HANDOFF.md, entry 24.
