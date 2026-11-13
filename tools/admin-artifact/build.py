# Builds out/index.html from page.html: the site's tokens, card CSS and coolicons paths are inlined.
import json,subprocess
P='/home/claude/portfolio-project/src/'
icons=open(P+'atoms/icons.js').read()
obj=icons[icons.index('export const PATHS = ')+len('export const PATHS = '):icons.index('};')+1]
paths=subprocess.run(['node','-e','process.stdout.write(JSON.stringify('+obj+'))'],capture_output=True,text=True,check=True).stdout
tokens=open(P+'styles/tokens.css').read()
site=''.join(open(P+'styles/'+f).read() for f in ['tokens.css','atoms.css','molecules.css','organisms.css'])
page=open('page.html').read().replace('{{TOKENS}}',tokens).replace('{{PATHS}}',paths).replace('{{SITECSS}}',json.dumps(site))
assert '{{' not in page
import os; os.makedirs('out',exist_ok=True); open('out/index.html','w').write(page); print(len(page))
