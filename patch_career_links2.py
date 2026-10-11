import re
with open('career_fit.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_ucan = '建議參與跨系所專案或黑客松，強化協作與表達能力！`);'
new_ucan = '建議在下學期優先安排專案導向或實務課程來強化此能力。<a href="resource_library.html?search=${kw}" target="_blank" class="ml-1 inline-flex items-center gap-1 font-bold text-klein underline hover:text-blue-700">查閱推薦課程 <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>`);'
content = content.replace(old_ucan, new_ucan)

kw_insert = "const weakComp = Object.entries(ucan.commonComps).sort((a,b)=>a[1].pr - b[1].pr)[0]; // get weakest\n                    if (weakComp) {\n                        const kw = weakComp[0].includes('溝通') ? '軟體工程' : (weakComp[0].includes('創新') ? '創新' : '實務');"
content = re.sub(r'const weakComp = Object\.entries\(ucan\.commonComps\)\.sort\(\(a,b\)=>a\[1\]\.pr - b\[1\]\.pr\)\[0\]; // get weakest\s+if \(weakComp\) \{', kw_insert, content)

old_prog_bad = '取得學程證書！`);'
new_prog_bad = '取得學程證書！<a href="resource_library.html?search=學程" target="_blank" class="ml-1 inline-flex items-center gap-1 font-bold text-klein underline hover:text-blue-700">瀏覽學程課程 <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>`);'
content = content.replace(old_prog_bad, new_prog_bad)

old_prac_bad = '落實跨域專業應用！`);'
new_prac_bad = '落實跨域專業應用！<a href="resource_library.html?search=雲端" target="_blank" class="ml-1 inline-flex items-center gap-1 font-bold text-klein underline hover:text-blue-700">查閱推薦課程 <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>`);'
content = content.replace(old_prac_bad, new_prac_bad)

with open('career_fit.html', 'w', encoding='utf-8') as f:
    f.write(content)
