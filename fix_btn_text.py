import re

with open('brand_test.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    r'(<button id="btn-mode-manual"[^>]*>).*?(</button>)',
    r'\1手動輸入資料\2',
    text
)

with open('brand_test.html', 'w', encoding='utf-8') as f:
    f.write(text)
