import os
import re

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            try:
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'RETAKE ASSESSMENT' in content or '重新開始測驗' in content:
                        print(f'Found in {os.path.join(root, file)}')
            except Exception as e:
                pass
