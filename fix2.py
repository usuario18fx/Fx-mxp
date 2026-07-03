src='index.html'
html=open(src,encoding='utf-8').read()
# Insertar FLAG_ORDER al inicio del script, antes de CLASS_META
target='const CLASS_META'
insert='const FLAG_ORDER = [\'save\',\'party\',\'favorite\',\'risk\',\'caution\'];\n\n'
html=html.replace(target,insert+target,1)
# Eliminar duplicados que queden después
import re
parts=re.split(r'const FLAG_ORDER\s*=\s*\[.*?\];',html,flags=re.DOTALL)
if len(parts)>2:
    html=parts[0]+"const FLAG_ORDER = ['save','party','favorite','risk','caution'];"+(''.join(parts[2:]))
print('count:',html.count('const FLAG_ORDER'))
open(src,'w',encoding='utf-8').write(html)
