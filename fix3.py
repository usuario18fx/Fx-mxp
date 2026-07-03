lines=open('index.html',encoding='utf-8').read().split('\n')
lines[887]=lines[887].strip()
if lines[887] in ['u{448}','?',''] or len(lines[887])<3:
    lines[887]=''
open('index.html','w',encoding='utf-8').write('\n'.join(lines))
print('line 888:',repr(lines[887]))
