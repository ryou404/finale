import re

with open('career_fit.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Hide AI 履歷三大維度檢核 & 求職目標與自述草稿
text = text.replace('<div class="border border-klein/10 bg-white p-6 md:p-8 crosshair-corner mb-8">', '<div class="hidden border border-klein/10 bg-white p-6 md:p-8 crosshair-corner mb-8">', 1)
text = text.replace('<div class="border border-klein/10 bg-white p-6 md:p-8 crosshair-corner">', '<div class="hidden border border-klein/10 bg-white p-6 md:p-8 crosshair-corner">', 1)

# 2. PDF Fix
text = text.replace("printContainer.style.left = '-9999px';", "printContainer.style.left = '0';\n                printContainer.style.zIndex = '-9999';")

# 3. Tab renaming
text = text.replace('實務課群雷達', '實務課群選課表')
text = text.replace('專業學群', '專業學程選課表')
text = text.replace('專業學程', '專業學程選課表')

# 4. changeDept / resetDept fix (do not reset to program tab)
text = re.sub(
    r'(this\.showToast\([^)]+\);\s*)this\.setupTrackUI\([^)]+\);',
    r'\1this.switchTrackDirect(this.state.track || "core");',
    text
)
text = re.sub(
    r'(setDoc\([^)]+\)\.catch\(console\.error\);\s*\}\s*)this\.setupTrackUI\([^)]+\);',
    r'\1this.switchTrackDirect(this.state.track || "core");',
    text
)

# 5. renderPrograms green border
text = text.replace(
    'border border-klein/20 text-klein/80 peer-checked:bg-klein peer-checked:text-white peer-checked:border-klein hover:border-klein transition-all flex items-center flex-wrap',
    ' text-klein/80 peer-checked:bg-klein peer-checked:text-white peer-checked:border-klein transition-all flex items-center flex-wrap'
)
text = text.replace(
    'const badges = this.getCourseBadges(course);',
    'const badges = this.getCourseBadges(course);\n                                const isRecommended = badges !== "";'
)

# 6. switchTrackDirect dept dropdown support for 'core'
text = text.replace("if (trackKey === 'program') {", "if (trackKey === 'program' || trackKey === 'core') {")

with open('career_fit.html', 'w', encoding='utf-8') as f:
    f.write(text)
