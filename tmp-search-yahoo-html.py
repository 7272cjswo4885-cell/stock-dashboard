import re
for fname in ['yahoo-rut.html','yahoo-ixic.html']:
    with open(fname, 'r', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    found = bool(re.search(r'root\.App\.main\s*=\s*\{', data))
    print(fname, 'found' if found else 'not found')
