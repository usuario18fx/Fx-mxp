#!/usr/bin/env python3
import sys, re

src = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
with open(src, encoding='utf-8') as f:
    html = f.read()

# 1. Replace the wrong FLAG_ORDER (original has 'flag','dealer')
html = re.sub(
    r"const FLAG_ORDER\s*=\s*\['save',\s*'flag',\s*'dealer'\];",
    "const FLAG_ORDER = ['save','party','favorite','risk','caution'];",
    html
)

# 2. Remove ALL duplicate const FLAG_ORDER declarations 
#    (keep only the first one, convert rest to assignment)
lines = html.split('\n')
seen_flag_order = False
new_lines = []
for line in lines:
    if re.search(r"const FLAG_ORDER\s*=", line):
        if seen_flag_order:
            # Convert duplicate const to reassignment (won't cause redeclaration error)
            line = line.replace('const FLAG_ORDER', 'FLAG_ORDER', 1)
        else:
            seen_flag_order = True
    new_lines.append(line)
html = '\n'.join(new_lines)

# 3. Remove duplicate CLASS_META Object.assign if CLASS_META already declared
# (keep one definition, patch the c values)
# Fix CLASS_META colors in the original const definition
html = re.sub(
    r"(save\s*:\s*\{[^}]*c\s*:\s*)'#6b7280'",
    r"\g<1>'#4a7fa5'", html
)
html = re.sub(
    r"(party\s*:\s*\{[^}]*c\s*:\s*)'#d6336c'",
    r"\g<1>'#e0304a'", html
)
html = re.sub(
    r"(favorite\s*:\s*\{[^}]*c\s*:\s*)'#22a559'",
    r"\g<1>'#d4a017'", html
)
html = re.sub(
    r"(risk\s*:\s*\{[^}]*c\s*:\s*)'#f97316'",
    r"\g<1>'#e06820'", html
)
html = re.sub(
    r"(caution\s*:\s*\{[^}]*c\s*:\s*)'#8b5cf6'",
    r"\g<1>'#7040c8'", html
)

# 4. Also remove duplicate const CLASS_META
seen_class_meta = False
new_lines = []
for line in html.split('\n'):
    if re.search(r"const CLASS_META\s*=", line):
        if seen_class_meta:
            line = re.sub(r"const CLASS_META\s*=", 'CLASS_META =', line, 1)
        else:
            seen_class_meta = True
    new_lines.append(line)
html = '\n'.join(new_lines)

with open(src, 'w', encoding='utf-8') as f:
    f.write(html)

# Count FLAG_ORDER const declarations
count = len(re.findall(r"const FLAG_ORDER\s*=", html))
print(f"✓ const FLAG_ORDER declarations remaining: {count} (should be 1)")
count2 = len(re.findall(r"const CLASS_META\s*=", html))
print(f"✓ const CLASS_META declarations remaining: {count2} (should be 1)")
print(f"→ {src} ({len(html):,} chars)")
