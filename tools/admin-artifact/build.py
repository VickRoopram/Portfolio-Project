# Builds out/index.html for the Claude artifact admin from the shared admin (admin/app.js, admin/admin.css),
# the artifact store, the site's coolicons, the site's CSS (for the card preview) and the default menu.
# Publish out/index.html plus the site's assets/img (resized) as img/*.
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); P = ROOT + '/src/'
node = lambda js: subprocess.run(['node', '--input-type=module', '-e', js], capture_output=True, text=True, check=True, cwd=ROOT).stdout
icons = open(P + 'atoms/icons.js').read()
obj = icons[icons.index('export const PATHS = ') + len('export const PATHS = '):icons.index('};') + 1]
paths = subprocess.run(['node', '-e', 'process.stdout.write(JSON.stringify(' + obj + '))'], capture_output=True, text=True, check=True).stdout
menu = node("import { MENU } from './src/content.js'; process.stdout.write(JSON.stringify(MENU))")
site = ''.join(open(P + 'styles/' + f).read() for f in ['tokens.css', 'atoms.css', 'molecules.css', 'organisms.css'])
app = re.sub(r'^export (const|function) ', r'\1 ', open(ROOT + '/admin/app.js').read(), flags=re.M)
page = open(HERE + '/page.html').read()
for k, v in {'ADMIN_CSS': open(ROOT + '/admin/admin.css').read(), 'PATHS': paths, 'SITECSS': json.dumps(site), 'MENU': menu, 'APP': app, 'STORE': open(HERE + '/store-artifact.js').read()}.items():
    page = page.replace('{{' + k + '}}', v)
os.makedirs(HERE + '/out', exist_ok=True); open(HERE + '/out/index.html', 'w').write(page); print(len(page))
