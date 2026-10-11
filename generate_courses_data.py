import re
import glob
import json

def parse_md_to_json():
    courses = []
    
    file_map = {
        'pu_courses_CS_v5.md': '資工系',
        'pu_courses_IM_v5.md': '資管系',
        'pu_courses_AI_v5.md': '人工智慧系'
    }
    
    for filename, dept_name in file_map.items():
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        blocks = re.split(r'\n## \d+\.\s+', content)[1:]
        
        for block in blocks:
            lines = block.strip().split('\n')
            course_name = lines[0].strip()
            
            # Extract attributes
            req_type = "選修"
            if re.search(r'-\s*\*\*修別\*\*[：:]\s*必修', block):
                req_type = "必修"
                
            credits = "0"
            credit_match = re.search(r'-\s*\*\*學分.*?\*\*[：:]\s*(\d+)', block)
            if credit_match:
                credits = credit_match.group(1)
                
            teacher = ""
            teacher_match = re.search(r'-\s*\*\*授課教師\*\*[：:]\s*(.*?)(?=\n|$)', block)
            if teacher_match:
                teacher = teacher_match.group(1).strip()
                # Remove markdown links if present
                teacher = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', teacher)
                
            classes = ""
            class_match = re.search(r'-\s*\*\*上課班級\*\*[：:]\s*(.*?)(?=\n|$)', block)
            if class_match:
                classes = class_match.group(1).strip()
                
            # Time and Location
            time_loc = ""
            time_loc_match = re.search(r'-\s*\*\*時間地點\*\*[：:]\s*(.*?)(?=\n|$)', block)
            if time_loc_match:
                time_loc = time_loc_match.group(1).strip()

            # Deduce grade from classes
            grade = "其他"
            if "一" in classes and "碩" not in classes: grade = "大一"
            elif "二" in classes and "碩" not in classes: grade = "大二"
            elif "三" in classes and "碩" not in classes: grade = "大三"
            elif "四" in classes and "碩" not in classes: grade = "大四"
            elif "碩" in classes: grade = "碩士"
            if grade == "未知":
                if "(一)" in course_name: grade = "大一"
                elif "(二)" in course_name: grade = "大二"

            # Extract syllabus body
            syllabus_md = ""
            syllabus_match = re.search(r'(###\s+核心能力.*)', block, flags=re.DOTALL)
            if syllabus_match:
                syllabus_md = syllabus_match.group(1).strip()
            else:
                # If "核心能力" is not found, try to capture everything after the metadata list
                meta_end_match = re.search(r'-\s*\*\*[^\*]+\*\*[：:].*?(?=\n\n|\n###)', block, flags=re.DOTALL)
                if meta_end_match:
                    meta_end_idx = meta_end_match.end()
                    syllabus_md = block[meta_end_idx:].strip()

            courses.append({
                "id": f"{dept_name}_{course_name}_{classes}",
                "title": course_name,
                "department": dept_name,
                "type": req_type,
                "credits": int(credits) if credits.isdigit() else 0,
                "grade": grade,
                "teacher": teacher,
                "classes": classes,
                "time_loc": time_loc,
                "syllabus": syllabus_md
            })
            
    # Write to a JS file
    js_content = "window.COURSES_DATA = " + json.dumps(courses, ensure_ascii=False, indent=4) + ";"
    with open('static/courses_data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)

parse_md_to_json()
print("Generated static/courses_data.js with syllabus")
