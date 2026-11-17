"""Render the phone shelf's synths from the real desktop models (render.html), trim them and save a sprite of N drawings.
Needs a local copy of three.js r160 (the CDN may be blocked): python3 render.py /path/to/three [elev] [fov]"""
import asyncio, base64, io, sys, subprocess, pathlib
from playwright.async_api import async_playwright
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]; THREE = pathlib.Path(sys.argv[1])
elev = sys.argv[2] if len(sys.argv) > 2 else '52'; fov = sys.argv[3] if len(sys.argv) > 3 else '16'
async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8799'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            pg = await b.new_page(viewport={'width': 800, 'height': 600})
            pg.on('pageerror', lambda e: print('ERR', e)); pg.on('console', lambda m: print('LOG', m.text) if m.type in ('error','warning') else None)
            async def three(route):
                rel = route.request.url.split('three@0.160.0/')[1]
                await route.fulfill(path=str(THREE / rel), content_type='application/javascript')
            await pg.route('**/cdn.jsdelivr.net/npm/three@0.160.0/**', three)
            await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
            await pg.goto(f'http://localhost:8799/tools/phone-synth/render.html?w=1200&h=520&n=3&elev={elev}&fov={fov}')
            await pg.wait_for_function('window.DONE === true', timeout=600000)
            frames = [Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGBA') for u in await pg.evaluate('window.FRAMES')]
            await b.close()
    finally: srv.terminate()
    bbox = None
    for f in frames:
        bb = f.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        bbox = bb if bbox is None else (min(bbox[0], bb[0]), min(bbox[1], bb[1]), max(bbox[2], bb[2]), max(bbox[3], bb[3]))
    pad = 4; bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), bbox[2] + pad, bbox[3] + pad)
    frames = [f.crop(bbox) for f in frames]; w, h = frames[0].size
    tw = 720; th = round(h * tw / w)
    sheet = Image.new('RGBA', (tw, th * len(frames)))
    for i, f in enumerate(frames): sheet.paste(f.resize((tw, th), Image.LANCZOS), (0, i * th))
    out = ROOT / 'assets/ui/phone-synths.webp'; sheet.save(out, 'WEBP', quality=86, method=6)
    frames[0].save('/tmp/phone-synths-full.png')
    print(out, sheet.size, 'frame', (tw, th), 'crop', bbox, )
asyncio.run(main())
