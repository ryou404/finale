/**
 * CareerDNA CV Template System
 * 3 Professional CV Templates with HTML/CSS for PDF Export
 * 
 * Each template function accepts a cvData object and returns HTML string.
 * cvData schema:
 * {
 *   name, email, phone, school, department, deptFullName, grade, studentId,
 *   github, linkedin, summary, skills[], experiences[], courses[],
 *   projects[], hollandTrait, targetRole
 * }
 */

(function(root) {
  'use strict';

  /**
   * Helper: Get department full name
   */
  function getDeptFullName(dept) {
    const map = {
      'CS': '資訊工程學系',
      'IM': '資訊管理學系',
      'AI': '人工智慧學系'
    };
    return map[dept] || dept || '資訊學院';
  }

  /**
   * Helper: Group skills by level
   */
  function groupSkillsByLevel(skills) {
    const groups = { '精通': [], '熟練': [], '基礎': [] };
    (skills || []).forEach(s => {
      const name = typeof s === 'string' ? s : s.name;
      const level = (typeof s === 'object' && s.level) ? s.level : '熟練';
      if (!groups[level]) groups[level] = [];
      groups[level].push(name);
    });
    return groups;
  }

  /**
   * Helper: Parse AI resumeMarkdown into structured sections
   */
  function parseResumeMarkdown(md) {
    if (!md) return {};
    const sections = {};
    let currentSection = 'intro';
    const lines = md.split('\n');
    
    lines.forEach(line => {
      const h2Match = line.match(/^##\s+(.+)/);
      const h3Match = line.match(/^###\s+(.+)/);
      if (h2Match) {
        currentSection = h2Match[1].trim();
        sections[currentSection] = sections[currentSection] || '';
      } else if (h3Match) {
        sections[currentSection] = (sections[currentSection] || '') + '\n### ' + h3Match[1];
      } else {
        sections[currentSection] = (sections[currentSection] || '') + '\n' + line;
      }
    });
    return sections;
  }

  /**
   * Helper: Safely extract text content from markdown/html
   */
  function cleanText(text) {
    if (!text) return '';
    return text
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/>\s*💡.*/g, '')
      .replace(/>\s*/g, '')
      .replace(/^-\s*/gm, '')
      .replace(/\[([^\]]*)\]/g, '$1')
      .trim();
  }

  // ====================================================================
  // TEMPLATE 1: Classic Professional (傳統專業風格)
  // Single column, traditional, clean lines
  // ====================================================================
  function templateClassic(cvData) {
    const d = cvData || {};
    const skillGroups = groupSkillsByLevel(d.skills);
    const contactParts = [];
    if (d.phone) contactParts.push(`📞 ${d.phone}`);
    if (d.email) contactParts.push(`✉ ${d.email}`);
    if (d.github) contactParts.push(`GitHub: ${d.github}`);
    if (d.linkedin) contactParts.push(`LinkedIn: ${d.linkedin}`);

    return `
<div style="font-family: 'Noto Sans TC', 'Inter', 'Georgia', serif; color: #1a1a2e; max-width: 210mm; margin: 0 auto; padding: 40px 45px; background: #fff; line-height: 1.6; font-size: 13px;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 8px;">
    <h1 style="font-size: 28px; font-weight: 800; letter-spacing: 3px; margin: 0; color: #1a1a2e;">
      ${d.name || '您的姓名'}
    </h1>
  </div>
  
  <!-- Contact Info Bar -->
  <div style="text-align: center; font-size: 11px; color: #555; margin-bottom: 6px; word-spacing: 2px;">
    ${contactParts.join(' &nbsp;|&nbsp; ') || '請在個人檔案填寫聯絡資訊'}
  </div>
  
  <!-- School Info -->
  <div style="text-align: center; font-size: 11.5px; color: #666; margin-bottom: 20px;">
    ${d.school || '靜宜大學'} ${getDeptFullName(d.department)} ${d.grade || ''}
  </div>
  
  <hr style="border: none; border-top: 2px solid #1a1a2e; margin: 0 0 18px 0;">
  
  <!-- Summary / About Me -->
  ${d.summary ? `
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 0 0 8px 0;">
      個人簡介 ABOUT ME
    </h2>
    <p style="font-size: 12.5px; color: #333; margin: 0; line-height: 1.7;">
      ${cleanText(d.summary)}
    </p>
  </div>
  ` : ''}
  
  <!-- Technical Skills -->
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 0 0 8px 0;">
      專業技能 TECHNICAL SKILLS
    </h2>
    <div style="font-size: 12px; color: #333;">
      ${skillGroups['精通'].length > 0 ? `<div style="margin-bottom: 4px;"><strong>精通：</strong>${skillGroups['精通'].join('、')}</div>` : ''}
      ${skillGroups['熟練'].length > 0 ? `<div style="margin-bottom: 4px;"><strong>熟練：</strong>${skillGroups['熟練'].join('、')}</div>` : ''}
      ${skillGroups['基礎'].length > 0 ? `<div style="margin-bottom: 4px;"><strong>基礎：</strong>${skillGroups['基礎'].join('、')}</div>` : ''}
      ${(!d.skills || d.skills.length === 0) ? '<div style="color: #999; font-style: italic;">尚未新增技能標籤，請前往個人檔案設定</div>' : ''}
    </div>
  </div>
  
  <!-- Experience & Projects (AI Generated) -->
  ${d.experienceHtml ? `
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 0 0 8px 0;">
      專案與實務經歷 EXPERIENCE & PROJECTS
    </h2>
    <div style="font-size: 12px; color: #333; line-height: 1.7;">
      ${d.experienceHtml}
    </div>
  </div>
  ` : ''}
  
  <!-- Education -->
  <div style="margin-bottom: 18px;">
    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 0 0 8px 0;">
      學歷 EDUCATION
    </h2>
    <div style="font-size: 12.5px; color: #333;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <strong>${d.school || '靜宜大學'} — ${getDeptFullName(d.department)}</strong>
        <span style="color: #666; font-size: 11px;">${d.grade || '在學中'}</span>
      </div>
      ${d.courses && d.courses.length > 0 ? `
      <div style="font-size: 11.5px; color: #555; margin-top: 4px;">
        <strong>修習課程：</strong>${d.courses.join('、')}
      </div>
      ` : ''}
    </div>
  </div>
  
  <!-- Holland Trait -->
  ${d.hollandTrait ? `
  <div style="margin-bottom: 0;">
    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 0 0 8px 0;">
      個人特質 PERSONAL TRAITS
    </h2>
    <p style="font-size: 12px; color: #444; margin: 0; line-height: 1.7;">
      ${d.hollandTrait}
    </p>
  </div>
  ` : ''}
  
</div>`;
  }

  // ====================================================================
  // TEMPLATE 2: Modern Sidebar (現代雙欄風格)
  // Two-column layout with colored sidebar
  // ====================================================================
  function templateModernSidebar(cvData) {
    const d = cvData || {};
    const skillGroups = groupSkillsByLevel(d.skills);

    return `
<div style="font-family: 'Noto Sans TC', 'Inter', sans-serif; max-width: 210mm; margin: 0 auto; background: #fff; display: flex; min-height: 297mm; font-size: 12.5px; line-height: 1.6; color: #2d2d2d;">
  
  <!-- LEFT SIDEBAR -->
  <div style="width: 35%; background: linear-gradient(180deg, #002fa7 0%, #001a5e 100%); color: #fff; padding: 35px 24px; flex-shrink: 0;">
    
    <!-- Name -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 3px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 32px; font-weight: 800;">
        ${(d.name || 'U').charAt(0)}
      </div>
      <h1 style="font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 2px;">
        ${d.name || '您的姓名'}
      </h1>
      <div style="font-size: 11px; opacity: 0.8; margin-top: 4px; letter-spacing: 1px;">
        ${d.targetRole || getDeptFullName(d.department) + ' 畢業生'}
      </div>
    </div>
    
    <!-- Contact -->
    <div style="margin-bottom: 22px;">
      <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin: 0 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;">
        聯絡資訊
      </h3>
      <div style="font-size: 11.5px; line-height: 2;">
        ${d.email ? `<div>✉ ${d.email}</div>` : ''}
        ${d.phone ? `<div>📞 ${d.phone}</div>` : ''}
        ${d.github ? `<div>⌨ ${d.github}</div>` : ''}
        ${d.linkedin ? `<div>🔗 ${d.linkedin}</div>` : ''}
      </div>
    </div>
    
    <!-- Skills -->
    <div style="margin-bottom: 22px;">
      <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin: 0 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;">
        技能
      </h3>
      ${skillGroups['精通'].length > 0 ? `
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">精通</div>
        ${skillGroups['精通'].map(s => `<span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 2px 8px; margin: 2px 3px 2px 0; font-size: 11px; border-radius: 2px;">${s}</span>`).join('')}
      </div>` : ''}
      ${skillGroups['熟練'].length > 0 ? `
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">熟練</div>
        ${skillGroups['熟練'].map(s => `<span style="display: inline-block; background: rgba(255,255,255,0.12); padding: 2px 8px; margin: 2px 3px 2px 0; font-size: 11px; border-radius: 2px;">${s}</span>`).join('')}
      </div>` : ''}
      ${skillGroups['基礎'].length > 0 ? `
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">基礎</div>
        ${skillGroups['基礎'].map(s => `<span style="display: inline-block; background: rgba(255,255,255,0.08); padding: 2px 8px; margin: 2px 3px 2px 0; font-size: 11px; border-radius: 2px;">${s}</span>`).join('')}
      </div>` : ''}
    </div>

    <!-- Education in Sidebar -->
    <div style="margin-bottom: 22px;">
      <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin: 0 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;">
        學歷
      </h3>
      <div style="font-size: 12px;">
        <div style="font-weight: 700;">${d.school || '靜宜大學'}</div>
        <div style="opacity: 0.85; font-size: 11.5px;">${getDeptFullName(d.department)}</div>
        <div style="opacity: 0.6; font-size: 11px; margin-top: 2px;">${d.grade || '在學中'}</div>
      </div>
    </div>
    
    <!-- Language -->
    <div>
      <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin: 0 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;">
        語言能力
      </h3>
      <div style="font-size: 11.5px; line-height: 1.8;">
        <div>中文（母語）</div>
        <div>英文（基礎 ~ 進階）</div>
      </div>
    </div>
  </div>
  
  <!-- RIGHT MAIN BODY -->
  <div style="flex: 1; padding: 35px 30px;">
    
    <!-- Summary -->
    ${d.summary ? `
    <div style="margin-bottom: 22px;">
      <h2 style="font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #002fa7; margin: 0 0 8px 0; border-bottom: 2px solid #002fa7; padding-bottom: 5px;">
        個人簡介
      </h2>
      <p style="font-size: 12.5px; color: #444; margin: 0; line-height: 1.75;">
        ${cleanText(d.summary)}
      </p>
    </div>
    ` : ''}
    
    <!-- Experience & Projects -->
    ${d.experienceHtml ? `
    <div style="margin-bottom: 22px;">
      <h2 style="font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #002fa7; margin: 0 0 10px 0; border-bottom: 2px solid #002fa7; padding-bottom: 5px;">
        專案與經歷
      </h2>
      <div style="font-size: 12.5px; color: #333; line-height: 1.75;">
        ${d.experienceHtml}
      </div>
    </div>
    ` : ''}
    
    <!-- Courses -->
    ${d.courses && d.courses.length > 0 ? `
    <div style="margin-bottom: 22px;">
      <h2 style="font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #002fa7; margin: 0 0 8px 0; border-bottom: 2px solid #002fa7; padding-bottom: 5px;">
        專業修課
      </h2>
      <div style="font-size: 12px; color: #555; display: flex; flex-wrap: wrap; gap: 5px;">
        ${d.courses.map(c => `<span style="background: #f0f4ff; border: 1px solid #d0daf7; padding: 2px 10px; font-size: 11px;">${c}</span>`).join('')}
      </div>
    </div>
    ` : ''}
    
    <!-- Holland Trait -->
    ${d.hollandTrait ? `
    <div>
      <h2 style="font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #002fa7; margin: 0 0 8px 0; border-bottom: 2px solid #002fa7; padding-bottom: 5px;">
        個人特質
      </h2>
      <p style="font-size: 12px; color: #555; margin: 0; line-height: 1.7;">
        ${d.hollandTrait}
      </p>
    </div>
    ` : ''}
  </div>
  
</div>`;
  }

  // ====================================================================
  // TEMPLATE 3: Minimal Tech (極簡科技風格)
  // Clean, modern, icon-based for IT/Tech roles
  // ====================================================================
  function templateMinimalTech(cvData) {
    const d = cvData || {};
    const allSkills = (d.skills || []).map(s => typeof s === 'string' ? s : s.name);

    return `
<div style="font-family: 'Inter', 'Noto Sans TC', sans-serif; max-width: 210mm; margin: 0 auto; padding: 36px 42px; background: #fff; color: #1e1e1e; font-size: 12.5px; line-height: 1.65;">
  
  <!-- Header: Name + Title -->
  <div style="margin-bottom: 6px;">
    <h1 style="font-size: 30px; font-weight: 900; margin: 0; color: #111; letter-spacing: 1px;">
      ${d.name || '您的姓名'}
    </h1>
    <div style="font-size: 13px; color: #666; margin-top: 4px; font-weight: 500;">
      ${d.targetRole || getDeptFullName(d.department) + ' 畢業生'} · ${d.school || '靜宜大學'}
    </div>
  </div>
  
  <!-- Contact Row -->
  <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 11.5px; color: #555; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
    ${d.email ? `<span>✉ ${d.email}</span>` : ''}
    ${d.phone ? `<span>📞 ${d.phone}</span>` : ''}
    ${d.github ? `<span>⌨ ${d.github}</span>` : ''}
    ${d.linkedin ? `<span>🔗 ${d.linkedin}</span>` : ''}
  </div>
  
  <!-- Summary -->
  ${d.summary ? `
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: #888; margin: 0 0 8px 0;">
      SUMMARY
    </h2>
    <p style="font-size: 12.5px; color: #333; margin: 0; line-height: 1.75;">
      ${cleanText(d.summary)}
    </p>
  </div>
  ` : ''}
  
  <!-- Tech Stack -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: #888; margin: 0 0 8px 0;">
      TECH STACK
    </h2>
    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
      ${allSkills.length > 0 ? allSkills.map(s => `<span style="display: inline-block; background: #111; color: #fff; padding: 3px 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;">${s}</span>`).join('') : '<span style="color: #aaa; font-style: italic;">尚未新增技能</span>'}
    </div>
  </div>
  
  <!-- Experience -->
  ${d.experienceHtml ? `
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: #888; margin: 0 0 10px 0;">
      EXPERIENCE & PROJECTS
    </h2>
    <div style="font-size: 12.5px; color: #333; line-height: 1.75;">
      ${d.experienceHtml}
    </div>
  </div>
  ` : ''}
  
  <!-- Education -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: #888; margin: 0 0 8px 0;">
      EDUCATION
    </h2>
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <div>
        <strong style="font-size: 13px;">${d.school || '靜宜大學'}</strong>
        <span style="color: #666; font-size: 12px;"> — ${getDeptFullName(d.department)}</span>
      </div>
      <span style="font-size: 11px; color: #888;">${d.grade || '在學中'}</span>
    </div>
    ${d.courses && d.courses.length > 0 ? `
    <div style="font-size: 11px; color: #777; margin-top: 6px;">
      修習課程：${d.courses.join(' · ')}
    </div>
    ` : ''}
  </div>
  
  <!-- Personal Traits -->
  ${d.hollandTrait ? `
  <div>
    <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: #888; margin: 0 0 8px 0;">
      PERSONAL TRAITS
    </h2>
    <p style="font-size: 12px; color: #555; margin: 0; line-height: 1.7;">
      ${d.hollandTrait}
    </p>
  </div>
  ` : ''}
  
</div>`;
  }

  // ====================================================================
  // Template Registry & Helper API
  // ====================================================================
  const CV_TEMPLATES = {
    classic: {
      id: 'classic',
      name: '經典專業 Classic',
      description: '傳統單欄排版，適合正式求職',
      icon: 'fa-solid fa-file-lines',
      color: '#1a1a2e',
      render: templateClassic
    },
    modern: {
      id: 'modern',
      name: '現代雙欄 Modern',
      description: '側邊欄 + 主內容，視覺豐富',
      icon: 'fa-solid fa-columns',
      color: '#002fa7',
      render: templateModernSidebar
    },
    minimal: {
      id: 'minimal',
      name: '極簡科技 Minimal',
      description: '簡潔俐落，適合IT/Tech',
      icon: 'fa-solid fa-code',
      color: '#111111',
      render: templateMinimalTech
    }
  };

  /**
   * Collect current user data from all available sources
   * Merges: currentUser (login), localStorage, DOM state
   */
  function collectUserData() {
    const user = (window.CareerDNA_DB && window.CareerDNA_DB.getCurrentUser()) || {};
    const localUser = (() => {
      try { return JSON.parse(localStorage.getItem('careerDNA_user') || '{}'); } catch(e) { return {}; }
    })();

    return {
      name: user.name || user.displayName || localUser.name || localUser.displayName || '',
      email: user.email || localUser.email || '',
      phone: user.phone || localUser.phone || '',
      school: user.school || localUser.school || localStorage.getItem('cdna_school') || '靜宜大學',
      department: user.department || user.dept || localUser.department || localUser.dept || localStorage.getItem('cdna_department') || '',
      grade: user.grade || localUser.grade || localStorage.getItem('cdna_grade') || '',
      studentId: user.studentId || localUser.studentId || '',
      github: user.github || localUser.github || '',
      linkedin: user.linkedin || localUser.linkedin || '',
      photoURL: user.photoURL || localUser.photoURL || '',
      uid: user.uid || user._id || localUser.uid || localUser._id || ''
    };
  }

  /**
   * Helper: Enhanced parser for AI generated resume markdown
   * Supports all formats: 【個人簡介】, 1. 個人簡介, ## 專案與實務經歷, ### titles, etc.
   */
  function parseResumeSections(rawMd) {
    if (!rawMd) return { summary: '', experienceHtml: '', rawSections: {} };

    const cleanMd = rawMd.replace(/\r\n/g, '\n');
    const lines = cleanMd.split('\n');
    
    // Flexible section header matchers
    const isSummaryHeader = (line) => /^(?:#{1,4}\s*|\*{2}\s*|\d+[\.、]\s*)(?:【|\(|\[)?\s*(?:個人簡介|關於我|自我介紹|求職目標|專業自述|簡介|About\s*Me|Summary|SUMMARY|Profile|About|Objective)/i.test(line);
    const isExpHeader = (line) => /^(?:#{1,4}\s*|\*{2}\s*|\d+[\.、]\s*)(?:【|\(|\[)?\s*(?:專案|經歷|實務|工作|專案經歷|工作經歷|實務經歷|實務專案|專案與經歷|專案與實務經歷|Experience|Projects|EXPERIENCE|Work\s*Experience|Projects\s*&\s*Experience)/i.test(line);
    const isSkillsHeader = (line) => /^(?:#{1,4}\s*|\*{2}\s*|\d+[\.、]\s*)(?:【|\(|\[)?\s*(?:專業技能|技術棧|專屬武器庫|核心技能|專業技術|Skills|Technical\s*Skills|SKILLS|Tech\s*Stack)/i.test(line);
    const isEduHeader = (line) => /^(?:#{1,4}\s*|\*{2}\s*|\d+[\.、]\s*)(?:【|\(|\[)?\s*(?:學歷|教育背景|修課|學校|Education|EDUCATION)/i.test(line);
    const isAnySectionHeader = (line) => isSummaryHeader(line) || isExpHeader(line) || isSkillsHeader(line) || isEduHeader(line) || /^#{1,2}\s+/.test(line);

    let currentSection = 'intro';
    const sectionTexts = { intro: '', summary: '', experience: '', skills: '', education: '', other: '' };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (isSummaryHeader(line)) {
        currentSection = 'summary';
      } else if (isExpHeader(line)) {
        currentSection = 'experience';
      } else if (isSkillsHeader(line)) {
        currentSection = 'skills';
      } else if (isEduHeader(line)) {
        currentSection = 'education';
      } else if (isAnySectionHeader(line)) {
        currentSection = 'other';
      } else {
        if (currentSection) {
          sectionTexts[currentSection] = (sectionTexts[currentSection] ? sectionTexts[currentSection] + '\n' : '') + lines[i];
        }
      }
    }

    // Summary extraction
    let summaryText = cleanText(sectionTexts.summary);
    if (!summaryText && sectionTexts.intro) {
      // Look for candidate description in intro lines
      const introClean = cleanText(sectionTexts.intro);
      if (introClean.length > 20) {
        summaryText = introClean;
      }
    }

    // Experience markdown to HTML converter
    let experienceHtml = '';
    const expMd = sectionTexts.experience;
    if (expMd && expMd.trim()) {
      experienceHtml = expMd
        .replace(/^###{1,3}\s+(.+)/gm, '<div style="font-weight: 700; font-size: 13.5px; margin: 12px 0 4px 0; color: #002fa7;">$1</div>')
        .replace(/^##\s+(.+)/gm, '<div style="font-weight: 700; font-size: 13.5px; margin: 12px 0 4px 0; color: #002fa7;">$1</div>')
        .replace(/^\*\*\[(.+?)\]\*\*[:：]?\s*(.*)/gm, '<div style="margin: 4px 0 2px 8px;"><strong style="color: #002fa7;">[$1]</strong> $2</div>')
        .replace(/^[-*•]\s+\*\*(.+?)\*\*[:：]?\s*(.*)/gm, '<div style="margin: 3px 0 3px 12px;"><strong>$1：</strong>$2</div>')
        .replace(/^[-*•]\s+(.*)/gm, '<div style="margin: 3px 0 3px 14px; line-height: 1.65;">• $1</div>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n{2,}/g, '<div style="height: 6px;"></div>');
    }

    return {
      summary: summaryText,
      experienceHtml: experienceHtml,
      skillsText: sectionTexts.skills,
      educationText: sectionTexts.education
    };
  }

  /**
   * Build cvData object combining user info + AI result + page state
   */
  function buildCvData(aiResult, appState) {
    const userData = collectUserData();
    const state = appState || {};
    
    // Parse AI resumeMarkdown to extract experience/project sections
    const resumeMd = aiResult?.resumeMarkdown || aiResult?.resume_markdown || aiResult?.formattedResumeMarkdown || '';
    const parsed = parseResumeSections(resumeMd);

    let summaryText = parsed.summary || cleanText(aiResult?.analysis || '');
    let experienceHtml = parsed.experienceHtml;

    // Fallback: If experienceHtml is still empty but user selected experiences in state
    if (!experienceHtml && state.selectedExps) {
      const expArray = Array.isArray(state.selectedExps) ? state.selectedExps : Array.from(state.selectedExps || []);
      if (expArray.length > 0) {
        experienceHtml = expArray.map(e => `<div style="margin: 6px 0;"><strong>• ${typeof e === 'string' ? e : e.name || e.id}</strong></div>`).join('');
      }
    }

    // Holland trait
    const hollandCode = localStorage.getItem('cdna_primary_holland') || '';
    let hollandTrait = '';
    switch(hollandCode.charAt(0).toUpperCase()) {
      case 'R': hollandTrait = '具備強烈的實務執行力與解決問題的能力，擅長透過動手操作與工具應用來達成目標。'; break;
      case 'I': hollandTrait = '具備出色的分析與邏輯思考能力，擅長研究複雜問題、挖掘數據背後的洞察。'; break;
      case 'A': hollandTrait = '擁有豐富的創造力與獨特的視角，擅長將創新思維融入專案設計中。'; break;
      case 'S': hollandTrait = '具備高度的同理心與溝通協調能力，擅長團隊合作、跨部門溝通。'; break;
      case 'E': hollandTrait = '具備卓越的領導力與商業敏銳度，擅長發起專案、說服他人。'; break;
      case 'C': hollandTrait = '具備極高的細心度與組織規劃能力，擅長流程優化、資料管理。'; break;
      default: hollandTrait = '';
    }

    return {
      // User Personal Info
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      school: userData.school,
      department: userData.department,
      grade: userData.grade,
      studentId: userData.studentId,
      github: userData.github,
      linkedin: userData.linkedin,
      
      // AI Generated Content
      summary: summaryText,
      experienceHtml: experienceHtml,
      targetRole: state.targetRole || '',
      
      // Skills & Courses from page state
      skills: (state.skills && state.skills.length > 0) ? state.skills : userData.skills || [],
      courses: state.selectedCourses ? (Array.isArray(state.selectedCourses) ? state.selectedCourses : Array.from(state.selectedCourses)) : [],
      
      // Holland Trait
      hollandTrait: hollandTrait
    };
  }

  // Export to global
  root.CVTemplates = {
    templates: CV_TEMPLATES,
    collectUserData: collectUserData,
    buildCvData: buildCvData,
    getDeptFullName: getDeptFullName,
    render: function(templateId, cvData) {
      const tpl = CV_TEMPLATES[templateId];
      if (!tpl) return '<div style="padding: 20px; color: red;">Template not found: ' + templateId + '</div>';
      return tpl.render(cvData);
    },
    getTemplateList: function() {
      return Object.values(CV_TEMPLATES);
    }
  };

})(typeof window !== 'undefined' ? window : this);
