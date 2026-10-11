with open('brand_test.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
match = re.search(r'<button id="btn-mode-manual"[^>]*>(.*?)</button>', text)
if match:
    print(match.group(1))
