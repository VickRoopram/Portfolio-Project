# Phone shelf synths

The phone office (`src/organisms/pocket.js`) shows the desktop's own 3D synth and Contact synth on its shelf, as a picture:
`assets/ui/phone-synths.webp`. It holds three drawings stacked top to bottom, each with the ink outlines boiled differently;
the page swaps them 12 times a second (on twos).

Re-render it after the desktop synths change:

```
python3 tools/phone-synth/render.py /path/to/three.js-r160 [tilt in degrees, default 52] [field of view, default 16]
```

The shelf uses a 34° tilt and a 16° field of view. The script serves the repo, loads `render.html` (the real synth modules,
everything else in the scene hidden, no cables) in headless Chromium, trims the drawings and saves the sheet at 720 px wide.
three.js comes from a local copy because the CDN can be blocked; a sparse clone of the `r160` tag (`build` and `examples/jsm`) is enough.
