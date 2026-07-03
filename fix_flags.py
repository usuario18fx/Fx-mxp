import re
src='index.html'
html=open(src,encoding='utf-8').read()
html=re.sub(r'const FLAG_ORDER\s*=\s*\[.*?\];','',html,flags=re.DOTALL)
html=re.sub(r'FLAG_ORDER\s*=\s*\[.*?\];','',html,flags=re.DOTALL)
idx=html.rfind("dealer:")
end=html.find(';',html.find('}',idx))+1
html=html[:end]+"\n\nconst FLAG_ORDER = ['save','party','favorite','risk','caution'];\n"+html[end:]
for old,new in [("'#6b7280'","'#4a7fa5'"),("'#d6336c'","'#e0304a'"),("'#22a559'","'#d4a017'"),("'#f97316'","'#e06820'"),("'#8b5cf6'","'#7040c8'")]:
    html=html.replace(old,new,1)
c=html.count('const FLAG_ORDER')
print('FLAG_ORDER count:',c)
open(src,'w',encoding='utf-8').write(html)
